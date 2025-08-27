import {
  users,
  scrapingJobs,
  scrapedData,
  domainAdapters,
  jobLogs,
  type User,
  type UpsertUser,
  type InsertScrapingJob,
  type ScrapingJob,
  type InsertScrapedData,
  type ScrapedData,
  type InsertDomainAdapter,
  type DomainAdapter,
  type JobLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, like, count } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Scraping job operations
  createScrapingJob(userId: string, job: InsertScrapingJob): Promise<ScrapingJob>;
  getScrapingJob(id: string): Promise<ScrapingJob | undefined>;
  getUserScrapingJobs(userId: string, limit?: number): Promise<ScrapingJob[]>;
  updateScrapingJobStatus(id: string, status: string, progress?: number): Promise<void>;
  updateScrapingJobMetrics(id: string, data: { recordsFound?: number; totalPages?: number; completedAt?: Date }): Promise<void>;

  // Scraped data operations
  addScrapedData(data: InsertScrapedData): Promise<ScrapedData>;
  getJobScrapedData(jobId: string, limit?: number, offset?: number): Promise<ScrapedData[]>;
  getUserScrapedData(userId: string, limit?: number, offset?: number): Promise<ScrapedData[]>;
  searchScrapedData(userId: string, query: string, limit?: number): Promise<ScrapedData[]>;
  getScrapedDataCount(userId: string): Promise<number>;

  // Domain adapter operations
  createDomainAdapter(userId: string, adapter: InsertDomainAdapter): Promise<DomainAdapter>;
  getUserDomainAdapters(userId: string): Promise<DomainAdapter[]>;
  getPublicDomainAdapters(): Promise<DomainAdapter[]>;
  getDomainAdapterByDomain(domain: string): Promise<DomainAdapter | undefined>;

  // Job log operations
  addJobLog(jobId: string, level: string, message: string, metadata?: any): Promise<void>;
  getJobLogs(jobId: string): Promise<JobLog[]>;

  // Dashboard stats
  getUserStats(userId: string): Promise<{
    activeJobs: number;
    totalRecords: number;
    successRate: number;
    creditsUsed: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Scraping job operations
  async createScrapingJob(userId: string, job: InsertScrapingJob): Promise<ScrapingJob> {
    const [createdJob] = await db
      .insert(scrapingJobs)
      .values({
        userId,
        name: job.name,
        urls: job.urls,
        adapterType: job.adapterType,
        config: job.config || {},
      } as any)
      .returning();
    return createdJob;
  }

  async getScrapingJob(id: string): Promise<ScrapingJob | undefined> {
    const [job] = await db.select().from(scrapingJobs).where(eq(scrapingJobs.id, id));
    return job;
  }

  async getUserScrapingJobs(userId: string, limit = 50): Promise<ScrapingJob[]> {
    return await db
      .select()
      .from(scrapingJobs)
      .where(eq(scrapingJobs.userId, userId))
      .orderBy(desc(scrapingJobs.createdAt))
      .limit(limit);
  }

  async updateScrapingJobStatus(id: string, status: string, progress?: number): Promise<void> {
    const updateData: any = { status, updatedAt: new Date() };
    if (progress !== undefined) updateData.progress = progress;
    if (status === 'running' && !await this.getScrapingJob(id).then(job => job?.startedAt)) {
      updateData.startedAt = new Date();
    }
    if (status === 'completed' || status === 'failed') {
      updateData.completedAt = new Date();
    }

    await db
      .update(scrapingJobs)
      .set(updateData)
      .where(eq(scrapingJobs.id, id));
  }

  async updateScrapingJobMetrics(id: string, data: { recordsFound?: number; totalPages?: number; completedAt?: Date }): Promise<void> {
    await db
      .update(scrapingJobs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(scrapingJobs.id, id));
  }

  // Scraped data operations
  async addScrapedData(data: InsertScrapedData): Promise<ScrapedData> {
    const [result] = await db.insert(scrapedData).values(data as any).returning();
    return result;
  }

  async getJobScrapedData(jobId: string, limit = 100, offset = 0): Promise<ScrapedData[]> {
    return await db
      .select()
      .from(scrapedData)
      .where(eq(scrapedData.jobId, jobId))
      .orderBy(desc(scrapedData.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getUserScrapedData(userId: string, limit = 100, offset = 0): Promise<ScrapedData[]> {
    return await db
      .select({
        id: scrapedData.id,
        jobId: scrapedData.jobId,
        sourceUrl: scrapedData.sourceUrl,
        dataType: scrapedData.dataType,
        extractedData: scrapedData.extractedData,
        rawHtml: scrapedData.rawHtml,
        createdAt: scrapedData.createdAt,
      })
      .from(scrapedData)
      .innerJoin(scrapingJobs, eq(scrapedData.jobId, scrapingJobs.id))
      .where(eq(scrapingJobs.userId, userId))
      .orderBy(desc(scrapedData.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async searchScrapedData(userId: string, query: string, limit = 100): Promise<ScrapedData[]> {
    return await db
      .select({
        id: scrapedData.id,
        jobId: scrapedData.jobId,
        sourceUrl: scrapedData.sourceUrl,
        dataType: scrapedData.dataType,
        extractedData: scrapedData.extractedData,
        rawHtml: scrapedData.rawHtml,
        createdAt: scrapedData.createdAt,
      })
      .from(scrapedData)
      .innerJoin(scrapingJobs, eq(scrapedData.jobId, scrapingJobs.id))
      .where(
        and(
          eq(scrapingJobs.userId, userId),
          like(scrapedData.sourceUrl, `%${query}%`)
        )
      )
      .orderBy(desc(scrapedData.createdAt))
      .limit(limit);
  }

  async getScrapedDataCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(scrapedData)
      .innerJoin(scrapingJobs, eq(scrapedData.jobId, scrapingJobs.id))
      .where(eq(scrapingJobs.userId, userId));
    return result.count;
  }

  // Domain adapter operations
  async createDomainAdapter(userId: string, adapter: InsertDomainAdapter): Promise<DomainAdapter> {
    const [result] = await db
      .insert(domainAdapters)
      .values({ ...adapter, userId })
      .returning();
    return result;
  }

  async getUserDomainAdapters(userId: string): Promise<DomainAdapter[]> {
    return await db
      .select()
      .from(domainAdapters)
      .where(eq(domainAdapters.userId, userId))
      .orderBy(desc(domainAdapters.createdAt));
  }

  async getPublicDomainAdapters(): Promise<DomainAdapter[]> {
    return await db
      .select()
      .from(domainAdapters)
      .where(eq(domainAdapters.isPublic, true))
      .orderBy(desc(domainAdapters.createdAt));
  }

  async getDomainAdapterByDomain(domain: string): Promise<DomainAdapter | undefined> {
    const [adapter] = await db
      .select()
      .from(domainAdapters)
      .where(eq(domainAdapters.domain, domain))
      .orderBy(desc(domainAdapters.createdAt))
      .limit(1);
    return adapter;
  }

  // Job log operations
  async addJobLog(jobId: string, level: string, message: string, metadata?: any): Promise<void> {
    await db.insert(jobLogs).values({
      jobId,
      level,
      message,
      metadata,
    });
  }

  async getJobLogs(jobId: string): Promise<JobLog[]> {
    return await db
      .select()
      .from(jobLogs)
      .where(eq(jobLogs.jobId, jobId))
      .orderBy(desc(jobLogs.createdAt));
  }

  // Dashboard stats
  async getUserStats(userId: string): Promise<{
    activeJobs: number;
    totalRecords: number;
    successRate: number;
    creditsUsed: number;
  }> {
    // Get active jobs count
    const [activeJobsResult] = await db
      .select({ count: count() })
      .from(scrapingJobs)
      .where(
        and(
          eq(scrapingJobs.userId, userId),
          eq(scrapingJobs.status, 'running')
        )
      );

    // Get total records count
    const [totalRecordsResult] = await db
      .select({ count: count() })
      .from(scrapedData)
      .innerJoin(scrapingJobs, eq(scrapedData.jobId, scrapingJobs.id))
      .where(eq(scrapingJobs.userId, userId));

    // Get success rate (completed vs total jobs)
    const [totalJobsResult] = await db
      .select({ count: count() })
      .from(scrapingJobs)
      .where(eq(scrapingJobs.userId, userId));

    const [completedJobsResult] = await db
      .select({ count: count() })
      .from(scrapingJobs)
      .where(
        and(
          eq(scrapingJobs.userId, userId),
          eq(scrapingJobs.status, 'completed')
        )
      );

    const successRate = totalJobsResult.count > 0 
      ? (completedJobsResult.count / totalJobsResult.count) * 100 
      : 0;

    return {
      activeJobs: activeJobsResult.count,
      totalRecords: totalRecordsResult.count,
      successRate: Math.round(successRate * 10) / 10,
      creditsUsed: totalRecordsResult.count, // Simple credit calculation
    };
  }
}

export const storage = new DatabaseStorage();
