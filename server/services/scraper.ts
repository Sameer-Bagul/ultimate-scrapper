import { storage } from "../storage";
import type { IStorage } from "../storage";
import * as cheerio from "cheerio";

interface ExtractedData {
  title?: string;
  description?: string;
  email?: string;
  phone?: string;
  name?: string;
  company?: string;
  address?: string;
  website?: string;
  price?: string;
  category?: string;
  [key: string]: any;
}

export class ScrapingService {
  private activeJobs = new Map<string, boolean>();
  private pausedJobs = new Set<string>();

  constructor(private storage: IStorage) {}

  async startScrapingJob(jobId: string): Promise<void> {
    try {
      const job = await this.storage.getScrapingJob(jobId);
      if (!job) {
        throw new Error("Job not found");
      }

      this.activeJobs.set(jobId, true);
      await this.storage.updateScrapingJobStatus(jobId, "running", 0);
      await this.storage.addJobLog(jobId, "info", "Job started");

      let processedPages = 0;
      const totalUrls = job.urls.length;

      for (const url of job.urls) {
        // Check if job is paused or cancelled
        if (this.pausedJobs.has(jobId) || !this.activeJobs.get(jobId)) {
          break;
        }

        try {
          await this.scrapeUrl(jobId, url, job.adapterType, job.config);
          processedPages++;
          
          // Update progress
          const progress = Math.round((processedPages / totalUrls) * 100);
          await this.storage.updateScrapingJobStatus(jobId, "running", progress);
          
          // Rate limiting
          const rateLimit = job.config?.rateLimit || 1;
          const delay = 1000 / rateLimit;
          await new Promise(resolve => setTimeout(resolve, delay));
          
        } catch (error) {
          await this.storage.addJobLog(jobId, "error", `Failed to scrape ${url}: ${error}`);
        }
      }

      // Complete the job
      this.activeJobs.delete(jobId);
      this.pausedJobs.delete(jobId);
      
      if (processedPages === totalUrls) {
        await this.storage.updateScrapingJobStatus(jobId, "completed", 100);
        await this.storage.updateScrapingJobMetrics(jobId, { 
          totalPages: processedPages,
          completedAt: new Date()
        });
        await this.storage.addJobLog(jobId, "info", "Job completed successfully");
      } else {
        await this.storage.updateScrapingJobStatus(jobId, "paused", Math.round((processedPages / totalUrls) * 100));
        await this.storage.addJobLog(jobId, "warning", "Job paused or cancelled");
      }

    } catch (error) {
      this.activeJobs.delete(jobId);
      this.pausedJobs.delete(jobId);
      await this.storage.updateScrapingJobStatus(jobId, "failed");
      await this.storage.addJobLog(jobId, "error", `Job failed: ${error}`);
    }
  }

  private async scrapeUrl(jobId: string, url: string, adapterType: string, config: any): Promise<void> {
    try {
      // Simple HTTP fetch (in production, you'd use proper scraping libraries)
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        signal: AbortSignal.timeout(config?.timeout || 30000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Extract data based on adapter type
      const extractedData = this.extractData($, adapterType, config);

      if (Object.keys(extractedData).length > 0) {
        await this.storage.addScrapedData({
          jobId,
          sourceUrl: url,
          dataType: adapterType,
          extractedData,
          rawHtml: config?.saveRawHtml ? html : undefined,
        });

        // Update record count
        const currentJob = await this.storage.getScrapingJob(jobId);
        if (currentJob) {
          await this.storage.updateScrapingJobMetrics(jobId, {
            recordsFound: (currentJob.recordsFound || 0) + 1
          });
        }
      }

    } catch (error) {
      throw new Error(`Failed to scrape ${url}: ${error}`);
    }
  }

  private extractData($: cheerio.CheerioAPI, adapterType: string, config: any): ExtractedData {
    const data: ExtractedData = {};

    // Basic contact extraction patterns
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const phonePattern = /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g;

    const fullText = $.text();

    // Extract emails
    const emails = fullText.match(emailPattern);
    if (emails && emails.length > 0) {
      data.email = emails[0];
    }

    // Extract phone numbers
    const phones = fullText.match(phonePattern);
    if (phones && phones.length > 0) {
      data.phone = phones[0];
    }

    // Extract based on adapter type
    switch (adapterType) {
      case 'ecommerce':
        data.title = $('h1, .product-title, [data-testid*="title"]').first().text().trim();
        data.price = $('.price, .product-price, [data-testid*="price"]').first().text().trim();
        data.description = $('.description, .product-description').first().text().trim();
        break;

      case 'directory':
        data.name = $('h1, .business-name, .company-name').first().text().trim();
        data.company = $('.company, .business-name').first().text().trim();
        data.address = $('.address, .location').first().text().trim();
        break;

      case 'news':
        data.title = $('h1, .article-title, .headline').first().text().trim();
        data.description = $('.article-summary, .excerpt, .description').first().text().trim();
        break;

      case 'social':
        data.name = $('.profile-name, .user-name, h1').first().text().trim();
        data.description = $('.bio, .description, .profile-description').first().text().trim();
        break;

      default:
        // Generic extraction
        data.title = $('h1').first().text().trim();
        data.description = $('meta[name="description"]').attr('content') || '';
    }

    // Clean up empty values
    Object.keys(data).forEach(key => {
      if (!data[key] || data[key].length === 0) {
        delete data[key];
      }
    });

    return data;
  }

  pauseJob(jobId: string): void {
    this.pausedJobs.add(jobId);
  }

  resumeJob(jobId: string): void {
    this.pausedJobs.delete(jobId);
    // Restart the job if it was paused
    this.startScrapingJob(jobId).catch(error => {
      console.error(`Error resuming job ${jobId}:`, error);
    });
  }

  stopJob(jobId: string): void {
    this.activeJobs.set(jobId, false);
    this.pausedJobs.delete(jobId);
  }
}
