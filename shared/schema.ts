import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  json
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Scraping jobs table
export const scrapingJobs = pgTable("scraping_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  urls: json("urls").$type<string[]>().notNull(),
  adapterType: varchar("adapter_type").notNull(),
  status: varchar("status").notNull().default("queued"), // queued, running, completed, failed, paused
  progress: integer("progress").default(0),
  totalPages: integer("total_pages").default(0),
  recordsFound: integer("records_found").default(0),
  config: json("config").$type<{
    rateLimit?: number;
    maxDepth?: number;
    timeout?: number;
    useProxy?: boolean;
    extractContacts?: boolean;
    followLinks?: boolean;
    useJavaScript?: boolean;
  }>().default({}),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Scraped data table
export const scrapedData = pgTable("scraped_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => scrapingJobs.id),
  sourceUrl: varchar("source_url").notNull(),
  dataType: varchar("data_type").notNull(), // contact, product, article, etc.
  extractedData: json("extracted_data").$type<{
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
  }>().notNull(),
  rawHtml: text("raw_html"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Domain adapters table
export const domainAdapters = pgTable("domain_adapters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  domain: varchar("domain").notNull(),
  type: varchar("type").notNull(), // ecommerce, directory, news, etc.
  selectors: json("selectors").$type<{
    [field: string]: string;
  }>().notNull(),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Job logs table
export const jobLogs = pgTable("job_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => scrapingJobs.id),
  level: varchar("level").notNull(), // info, warning, error
  message: text("message").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export const insertScrapingJobSchema = createInsertSchema(scrapingJobs).pick({
  name: true,
  urls: true,
  adapterType: true,
  config: true,
});

export const insertScrapedDataSchema = createInsertSchema(scrapedData).pick({
  jobId: true,
  sourceUrl: true,
  dataType: true,
  extractedData: true,
  rawHtml: true,
});

export const insertDomainAdapterSchema = createInsertSchema(domainAdapters).pick({
  name: true,
  domain: true,
  type: true,
  selectors: true,
  isPublic: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertScrapingJob = z.infer<typeof insertScrapingJobSchema>;
export type ScrapingJob = typeof scrapingJobs.$inferSelect;
export type InsertScrapedData = z.infer<typeof insertScrapedDataSchema>;
export type ScrapedData = typeof scrapedData.$inferSelect;
export type InsertDomainAdapter = z.infer<typeof insertDomainAdapterSchema>;
export type DomainAdapter = typeof domainAdapters.$inferSelect;
export type JobLog = typeof jobLogs.$inferSelect;
