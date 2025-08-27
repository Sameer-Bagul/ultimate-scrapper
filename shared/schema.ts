import mongoose, { Schema, Document, Model } from 'mongoose';
import { z } from 'zod';

// User schema for MongoDB
export interface IUser extends Document {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  id: { type: String, required: true, unique: true },
  email: { type: String, unique: true, sparse: true },
  firstName: { type: String },
  lastName: { type: String },
  profileImageUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Scraping Job schema
export interface IScrapingJob extends Document {
  id: string;
  userId: string;
  name: string;
  urls: string[];
  adapterType: string;
  status: string;
  progress: number;
  totalPages: number;
  recordsFound: number;
  config: {
    rateLimit?: number;
    maxDepth?: number;
    timeout?: number;
    useProxy?: boolean;
    extractContacts?: boolean;
    followLinks?: boolean;
    useJavaScript?: boolean;
  };
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const scrapingJobSchema = new Schema<IScrapingJob>({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, ref: 'User' },
  name: { type: String, required: true },
  urls: [{ type: String, required: true }],
  adapterType: { type: String, required: true },
  status: { type: String, required: true, default: 'queued' },
  progress: { type: Number, default: 0 },
  totalPages: { type: Number, default: 0 },
  recordsFound: { type: Number, default: 0 },
  config: {
    rateLimit: { type: Number },
    maxDepth: { type: Number },
    timeout: { type: Number },
    useProxy: { type: Boolean },
    extractContacts: { type: Boolean },
    followLinks: { type: Boolean },
    useJavaScript: { type: Boolean }
  },
  startedAt: { type: Date },
  completedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Scraped Data schema
export interface IScrapedData extends Document {
  id: string;
  jobId: string;
  sourceUrl: string;
  dataType: string;
  extractedData: {
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
  };
  rawHtml?: string;
  createdAt: Date;
}

const scrapedDataSchema = new Schema<IScrapedData>({
  id: { type: String, required: true, unique: true },
  jobId: { type: String, required: true, ref: 'ScrapingJob' },
  sourceUrl: { type: String, required: true },
  dataType: { type: String, required: true },
  extractedData: { type: Schema.Types.Mixed, required: true },
  rawHtml: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Domain Adapter schema
export interface IDomainAdapter extends Document {
  id: string;
  domain: string;
  name: string;
  selectors: {
    container?: string;
    title?: string;
    description?: string;
    email?: string;
    phone?: string;
    name?: string;
    company?: string;
    address?: string;
    website?: string;
    nextPage?: string;
    [key: string]: string | undefined;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const domainAdapterSchema = new Schema<IDomainAdapter>({
  id: { type: String, required: true, unique: true },
  domain: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  selectors: { type: Schema.Types.Mixed, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Job Log schema
export interface IJobLog extends Document {
  id: string;
  jobId: string;
  level: string;
  message: string;
  metadata?: { [key: string]: any };
  createdAt: Date;
}

const jobLogSchema = new Schema<IJobLog>({
  id: { type: String, required: true, unique: true },
  jobId: { type: String, required: true, ref: 'ScrapingJob' },
  level: { type: String, required: true },
  message: { type: String, required: true },
  metadata: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});

// Export models
export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
export const ScrapingJob: Model<IScrapingJob> = mongoose.models.ScrapingJob || mongoose.model<IScrapingJob>('ScrapingJob', scrapingJobSchema);
export const ScrapedData: Model<IScrapedData> = mongoose.models.ScrapedData || mongoose.model<IScrapedData>('ScrapedData', scrapedDataSchema);
export const DomainAdapter: Model<IDomainAdapter> = mongoose.models.DomainAdapter || mongoose.model<IDomainAdapter>('DomainAdapter', domainAdapterSchema);
export const JobLog: Model<IJobLog> = mongoose.models.JobLog || mongoose.model<IJobLog>('JobLog', jobLogSchema);

// Zod validation schemas
export const insertUserSchema = z.object({
  id: z.string(),
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  profileImageUrl: z.string().optional(),
});

export const insertScrapingJobSchema = z.object({
  name: z.string().min(1),
  urls: z.array(z.string().url()),
  adapterType: z.string(),
  config: z.object({
    rateLimit: z.number().optional(),
    maxDepth: z.number().optional(),
    timeout: z.number().optional(),
    useProxy: z.boolean().optional(),
    extractContacts: z.boolean().optional(),
    followLinks: z.boolean().optional(),
    useJavaScript: z.boolean().optional(),
  }).optional(),
});

export const insertScrapedDataSchema = z.object({
  jobId: z.string(),
  sourceUrl: z.string().url(),
  dataType: z.string(),
  extractedData: z.record(z.any()),
  rawHtml: z.string().optional(),
});

export const insertDomainAdapterSchema = z.object({
  domain: z.string(),
  name: z.string(),
  selectors: z.record(z.string()),
  isActive: z.boolean().optional(),
});

export const insertJobLogSchema = z.object({
  jobId: z.string(),
  level: z.enum(['info', 'warn', 'error', 'debug']),
  message: z.string(),
  metadata: z.record(z.any()).optional(),
});

// Export types
export type User = IUser;
export type ScrapingJob = IScrapingJob;
export type ScrapedData = IScrapedData;
export type DomainAdapter = IDomainAdapter;
export type JobLog = IJobLog;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertScrapingJob = z.infer<typeof insertScrapingJobSchema>;
export type InsertScrapedData = z.infer<typeof insertScrapedDataSchema>;
export type InsertDomainAdapter = z.infer<typeof insertDomainAdapterSchema>;
export type InsertJobLog = z.infer<typeof insertJobLogSchema>;

// For compatibility with existing code
export type UpsertUser = InsertUser;