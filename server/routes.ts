import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertScrapingJobSchema, insertDomainAdapterSchema } from "@shared/schema";
import { ScrapingService } from "./services/scraper";
import { z } from "zod";

const scrapingService = new ScrapingService(storage);

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Scraping job routes
  app.post('/api/scraping-jobs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const jobData = insertScrapingJobSchema.parse(req.body);
      
      const job = await storage.createScrapingJob(userId, jobData);
      
      // Start scraping asynchronously
      scrapingService.startScrapingJob(job.id).catch(error => {
        console.error(`Error starting scraping job ${job.id}:`, error);
      });
      
      res.json(job);
    } catch (error) {
      console.error("Error creating scraping job:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid job data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create scraping job" });
      }
    }
  });

  app.get('/api/scraping-jobs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = req.query.limit ? parseInt(req.query.limit) : 50;
      const jobs = await storage.getUserScrapingJobs(userId, limit);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching scraping jobs:", error);
      res.status(500).json({ message: "Failed to fetch scraping jobs" });
    }
  });

  app.get('/api/scraping-jobs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const job = await storage.getScrapingJob(id);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      // Check if user owns this job
      const userId = req.user.claims.sub;
      if (job.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(job);
    } catch (error) {
      console.error("Error fetching scraping job:", error);
      res.status(500).json({ message: "Failed to fetch scraping job" });
    }
  });

  app.patch('/api/scraping-jobs/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const job = await storage.getScrapingJob(id);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      // Check if user owns this job
      const userId = req.user.claims.sub;
      if (job.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.updateScrapingJobStatus(id, status);
      
      if (status === 'paused') {
        scrapingService.pauseJob(id);
      } else if (status === 'running' && job.status === 'paused') {
        scrapingService.resumeJob(id);
      }
      
      res.json({ message: "Job status updated" });
    } catch (error) {
      console.error("Error updating job status:", error);
      res.status(500).json({ message: "Failed to update job status" });
    }
  });

  // Scraped data routes
  app.get('/api/scraped-data', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = req.query.limit ? parseInt(req.query.limit) : 100;
      const offset = req.query.offset ? parseInt(req.query.offset) : 0;
      const query = req.query.q as string;
      
      let data;
      if (query) {
        data = await storage.searchScrapedData(userId, query, limit);
      } else {
        data = await storage.getUserScrapedData(userId, limit, offset);
      }
      
      res.json(data);
    } catch (error) {
      console.error("Error fetching scraped data:", error);
      res.status(500).json({ message: "Failed to fetch scraped data" });
    }
  });

  app.get('/api/scraped-data/count', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const count = await storage.getScrapedDataCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching scraped data count:", error);
      res.status(500).json({ message: "Failed to fetch scraped data count" });
    }
  });

  app.get('/api/scraped-data/export', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const format = req.query.format || 'json';
      const jobId = req.query.jobId as string;
      
      let data;
      if (jobId) {
        // Verify user owns the job
        const job = await storage.getScrapingJob(jobId);
        if (!job || job.userId !== userId) {
          return res.status(403).json({ message: "Access denied" });
        }
        data = await storage.getJobScrapedData(jobId, 10000);
      } else {
        data = await storage.getUserScrapedData(userId, 10000);
      }
      
      if (format === 'csv') {
        // Simple CSV export
        const headers = ['Source URL', 'Type', 'Email', 'Phone', 'Name', 'Company', 'Scraped At'];
        const csvRows = [headers.join(',')];
        
        data.forEach(record => {
          const row = [
            record.sourceUrl,
            record.dataType,
            record.extractedData.email || '',
            record.extractedData.phone || '',
            record.extractedData.name || '',
            record.extractedData.company || '',
            record.createdAt?.toISOString() || ''
          ].map(field => `"${field}"`);
          csvRows.push(row.join(','));
        });
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="scraped-data-${Date.now()}.csv"`);
        res.send(csvRows.join('\n'));
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="scraped-data-${Date.now()}.json"`);
        res.json(data);
      }
    } catch (error) {
      console.error("Error exporting scraped data:", error);
      res.status(500).json({ message: "Failed to export scraped data" });
    }
  });

  // Domain adapter routes
  app.get('/api/domain-adapters', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userAdapters = await storage.getUserDomainAdapters(userId);
      const publicAdapters = await storage.getPublicDomainAdapters();
      
      res.json({
        userAdapters,
        publicAdapters
      });
    } catch (error) {
      console.error("Error fetching domain adapters:", error);
      res.status(500).json({ message: "Failed to fetch domain adapters" });
    }
  });

  app.post('/api/domain-adapters', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const adapterData = insertDomainAdapterSchema.parse(req.body);
      
      const adapter = await storage.createDomainAdapter(userId, adapterData);
      res.json(adapter);
    } catch (error) {
      console.error("Error creating domain adapter:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid adapter data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create domain adapter" });
      }
    }
  });

  // Job logs
  app.get('/api/scraping-jobs/:id/logs', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const job = await storage.getScrapingJob(id);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      // Check if user owns this job
      const userId = req.user.claims.sub;
      if (job.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const logs = await storage.getJobLogs(id);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching job logs:", error);
      res.status(500).json({ message: "Failed to fetch job logs" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
