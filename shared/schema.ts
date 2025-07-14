import { pgTable, text, serial, integer, boolean, timestamp, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  clearanceLevel: integer("clearance_level").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

// Threats table
export const threats = pgTable("threats", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  score: real("score").notNull(),
  severity: text("severity").notNull(), // 'low', 'medium', 'high', 'critical'
  status: text("status").notNull().default('active'), // 'active', 'resolved', 'archived'
  sourceId: integer("source_id").references(() => dataSources.id),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Data sources table
export const dataSources = pgTable("data_sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'stix', 'json', 'unstructured'
  url: text("url"),
  status: text("status").notNull().default('active'), // 'active', 'inactive', 'error'
  lastIngested: timestamp("last_ingested"),
  throughput: real("throughput"), // KB/s
  createdAt: timestamp("created_at").defaultNow(),
});

// Scenarios table
export const scenarios = pgTable("scenarios", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  conditions: jsonb("conditions").notNull(),
  actions: jsonb("actions").notNull(),
  status: text("status").notNull().default('inactive'), // 'active', 'partial', 'inactive'
  priority: integer("priority").default(1),
  validityWindow: text("validity_window"), // ISO 8601 duration
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Threat scores history (time-series data)
export const threatScores = pgTable("threat_scores", {
  id: serial("id").primaryKey(),
  threatId: integer("threat_id").references(() => threats.id),
  score: real("score").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  metadata: jsonb("metadata"),
});

// Actions table
export const actions = pgTable("actions", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'sigint', 'humint', 'collection', 'alert'
  description: text("description").notNull(),
  priority: text("priority").notNull(), // 'P1', 'P2', 'P3'
  status: text("status").notNull().default('pending'), // 'pending', 'in_progress', 'completed'
  relatedThreatId: integer("related_threat_id").references(() => threats.id),
  relatedScenarioId: integer("related_scenario_id").references(() => scenarios.id),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Alerts table
export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'threat', 'system', 'data'
  severity: text("severity").notNull(), // 'info', 'warning', 'error', 'critical'
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  relatedThreatId: integer("related_threat_id").references(() => threats.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertThreatSchema = createInsertSchema(threats).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDataSourceSchema = createInsertSchema(dataSources).omit({
  id: true,
  createdAt: true,
});

export const insertScenarioSchema = createInsertSchema(scenarios).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertActionSchema = createInsertSchema(actions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Threat = typeof threats.$inferSelect;
export type InsertThreat = z.infer<typeof insertThreatSchema>;
export type DataSource = typeof dataSources.$inferSelect;
export type InsertDataSource = z.infer<typeof insertDataSourceSchema>;
export type Scenario = typeof scenarios.$inferSelect;
export type InsertScenario = z.infer<typeof insertScenarioSchema>;
export type Action = typeof actions.$inferSelect;
export type InsertAction = z.infer<typeof insertActionSchema>;
export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type ThreatScore = typeof threatScores.$inferSelect;
