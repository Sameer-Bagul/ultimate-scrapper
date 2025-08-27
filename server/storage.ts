import {
  User,
  ScrapingJob,
  ScrapedData,
  DomainAdapter,
  JobLog,
  type InsertUser,
  type UpsertUser,
  type InsertScrapingJob,
  type InsertScrapedData,
  type InsertDomainAdapter,
} from "@shared/schema";
import { connectToDatabase } from "./db";
import { nanoid } from "nanoid";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<any | undefined>;
  upsertUser(user: UpsertUser): Promise<any>;

  // Scraping job operations
  createScrapingJob(userId: string, job: InsertScrapingJob): Promise<any>;
  getScrapingJob(id: string): Promise<any | undefined>;
  getUserScrapingJobs(userId: string, limit?: number): Promise<any[]>;
  updateScrapingJobStatus(id: string, status: string, progress?: number): Promise<void>;
  updateScrapingJobMetrics(id: string, data: { recordsFound?: number; totalPages?: number; completedAt?: Date }): Promise<void>;

  // Scraped data operations
  addScrapedData(data: InsertScrapedData): Promise<any>;
  getJobScrapedData(jobId: string, limit?: number, offset?: number): Promise<any[]>;
  getUserScrapedData(userId: string, limit?: number, offset?: number): Promise<any[]>;
  searchScrapedData(userId: string, query: string, limit?: number): Promise<any[]>;
  getScrapedDataCount(userId: string): Promise<number>;

  // Domain adapter operations
  createDomainAdapter(userId: string, adapter: InsertDomainAdapter): Promise<any>;
  getUserDomainAdapters(userId: string): Promise<any[]>;
  getPublicDomainAdapters(): Promise<any[]>;
  getDomainAdapterByDomain(domain: string): Promise<any | undefined>;

  // Job log operations
  addJobLog(jobId: string, level: string, message: string, metadata?: any): Promise<void>;
  getJobLogs(jobId: string): Promise<any[]>;

  // Dashboard stats
  getUserStats(userId: string): Promise<{
    activeJobs: number;
    totalRecords: number;
    successRate: number;
    creditsUsed: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    connectToDatabase();
  }

  // User operations
  async getUser(id: string): Promise<any | undefined> {
    await connectToDatabase();
    const user = await User.findOne({ id }).lean();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<any> {
    await connectToDatabase();
    const user = await User.findOneAndUpdate(
      { id: userData.id },
      { ...userData, updatedAt: new Date() },
      { upsert: true, new: true }
    ).lean();
    return user;
  }

  // Scraping job operations
  async createScrapingJob(userId: string, job: InsertScrapingJob): Promise<any> {
    await connectToDatabase();
    const scrapingJob = new ScrapingJob({
      id: nanoid(),
      userId,
      name: job.name,
      urls: job.urls,
      adapterType: job.adapterType,
      config: job.config || {},
      status: 'queued',
      progress: 0,
      totalPages: 0,
      recordsFound: 0,
    });
    await scrapingJob.save();
    return scrapingJob.toObject();
  }

  async getScrapingJob(id: string): Promise<any | undefined> {
    await connectToDatabase();
    const job = await ScrapingJob.findOne({ id }).lean();
    return job;
  }

  async getUserScrapingJobs(userId: string, limit = 50): Promise<any[]> {
    await connectToDatabase();
    const jobs = await ScrapingJob.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return jobs;
  }

  async updateScrapingJobStatus(id: string, status: string, progress?: number): Promise<void> {
    await connectToDatabase();
    const updateData: any = { status, updatedAt: new Date() };
    if (progress !== undefined) updateData.progress = progress;
    
    const currentJob = await ScrapingJob.findOne({ id });
    if (status === 'running' && !currentJob?.startedAt) {
      updateData.startedAt = new Date();
    }
    if (status === 'completed' || status === 'failed') {
      updateData.completedAt = new Date();
    }

    await ScrapingJob.updateOne({ id }, updateData);
  }

  async updateScrapingJobMetrics(id: string, data: { recordsFound?: number; totalPages?: number; completedAt?: Date }): Promise<void> {
    await connectToDatabase();
    await ScrapingJob.updateOne({ id }, { ...data, updatedAt: new Date() });
  }

  // Scraped data operations
  async addScrapedData(data: InsertScrapedData): Promise<any> {
    await connectToDatabase();
    const scrapedData = new ScrapedData({
      id: nanoid(),
      ...data,
    });
    await scrapedData.save();
    return scrapedData.toObject();
  }

  async getJobScrapedData(jobId: string, limit = 100, offset = 0): Promise<any[]> {
    await connectToDatabase();
    const data = await ScrapedData.find({ jobId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean();
    return data;
  }

  async getUserScrapedData(userId: string, limit = 100, offset = 0): Promise<any[]> {
    await connectToDatabase();
    // First get user's job IDs
    const userJobs = await ScrapingJob.find({ userId }).select('id').lean();
    const jobIds = userJobs.map(job => job.id);
    
    const data = await ScrapedData.find({ jobId: { $in: jobIds } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean();
    return data;
  }

  async searchScrapedData(userId: string, query: string, limit = 100): Promise<any[]> {
    await connectToDatabase();
    // First get user's job IDs
    const userJobs = await ScrapingJob.find({ userId }).select('id').lean();
    const jobIds = userJobs.map(job => job.id);
    
    const data = await ScrapedData.find({ 
      jobId: { $in: jobIds },
      sourceUrl: { $regex: query, $options: 'i' }
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return data;
  }

  async getScrapedDataCount(userId: string): Promise<number> {
    await connectToDatabase();
    // First get user's job IDs
    const userJobs = await ScrapingJob.find({ userId }).select('id').lean();
    const jobIds = userJobs.map(job => job.id);
    
    const count = await ScrapedData.countDocuments({ jobId: { $in: jobIds } });
    return count;
  }

  // Domain adapter operations
  async createDomainAdapter(userId: string, adapter: InsertDomainAdapter): Promise<any> {
    await connectToDatabase();
    const domainAdapter = new DomainAdapter({
      id: nanoid(),
      ...adapter,
    });
    await domainAdapter.save();
    return domainAdapter.toObject();
  }

  async getUserDomainAdapters(userId: string): Promise<any[]> {
    await connectToDatabase();
    // For now, return empty array since we don't have userId in domain adapters
    return [];
  }

  async getPublicDomainAdapters(): Promise<any[]> {
    await connectToDatabase();
    const adapters = await DomainAdapter.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();
    return adapters;
  }

  async getDomainAdapterByDomain(domain: string): Promise<any | undefined> {
    await connectToDatabase();
    const adapter = await DomainAdapter.findOne({ domain })
      .sort({ createdAt: -1 })
      .lean();
    return adapter;
  }

  // Job log operations
  async addJobLog(jobId: string, level: string, message: string, metadata?: any): Promise<void> {
    await connectToDatabase();
    const jobLog = new JobLog({
      id: nanoid(),
      jobId,
      level,
      message,
      metadata,
    });
    await jobLog.save();
  }

  async getJobLogs(jobId: string): Promise<any[]> {
    await connectToDatabase();
    const logs = await JobLog.find({ jobId })
      .sort({ createdAt: -1 })
      .lean();
    return logs;
  }

  // Dashboard stats
  async getUserStats(userId: string): Promise<{
    activeJobs: number;
    totalRecords: number;
    successRate: number;
    creditsUsed: number;
  }> {
    await connectToDatabase();

    // Get active jobs count
    const activeJobs = await ScrapingJob.countDocuments({
      userId,
      status: 'running'
    });

    // Get user's job IDs
    const userJobs = await ScrapingJob.find({ userId }).select('id').lean();
    const jobIds = userJobs.map(job => job.id);

    // Get total records count
    const totalRecords = await ScrapedData.countDocuments({ jobId: { $in: jobIds } });

    // Get success rate (completed vs total jobs)
    const totalJobs = await ScrapingJob.countDocuments({ userId });
    const completedJobs = await ScrapingJob.countDocuments({
      userId,
      status: 'completed'
    });

    const successRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;

    return {
      activeJobs,
      totalRecords,
      successRate: Math.round(successRate * 10) / 10,
      creditsUsed: totalRecords, // Simple credit calculation
    };
  }
}

export const storage = new DatabaseStorage();