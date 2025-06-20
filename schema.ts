import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  decimal,
  boolean,
  serial,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("user").notNull(), // 'user' or 'admin'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Stocks table
export const stocks = pgTable("stocks", {
  id: serial("id").primaryKey(),
  symbol: varchar("symbol").notNull().unique(),
  company: varchar("company").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  change: decimal("change", { precision: 10, scale: 2 }).notNull(),
  changePercent: decimal("change_percent", { precision: 5, scale: 2 }).notNull(),
  volume: varchar("volume").notNull(),
  marketCap: varchar("market_cap"),
  peRatio: decimal("pe_ratio", { precision: 8, scale: 2 }),
  high52: decimal("high_52", { precision: 10, scale: 2 }),
  low52: decimal("low_52", { precision: 10, scale: 2 }),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Currency pairs table
export const currencyPairs = pgTable("currency_pairs", {
  id: serial("id").primaryKey(),
  symbol: varchar("symbol").notNull().unique(), // e.g., "EUR/USD"
  base: varchar("base").notNull(), // e.g., "EUR"
  quote: varchar("quote").notNull(), // e.g., "USD"
  rate: decimal("rate", { precision: 10, scale: 6 }).notNull(),
  change: decimal("change", { precision: 8, scale: 6 }).notNull(),
  changePercent: decimal("change_percent", { precision: 5, scale: 2 }).notNull(),
  margin: decimal("margin", { precision: 5, scale: 2 }).default("0.25").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// News articles table
export const newsArticles = pgTable("news_articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  content: text("content"),
  source: varchar("source").notNull(),
  imageUrl: varchar("image_url"),
  publishedAt: timestamp("published_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// User favorites table
export const userFavorites = pgTable("user_favorites", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  itemType: varchar("item_type").notNull(), // 'stock', 'currency', 'news'
  itemId: varchar("item_id").notNull(), // references the actual item
  createdAt: timestamp("created_at").defaultNow(),
});

// Market indices table
export const marketIndices = pgTable("market_indices", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(), // e.g., "S&P 500"
  symbol: varchar("symbol").notNull().unique(), // e.g., "SPX"
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  change: decimal("change", { precision: 10, scale: 2 }).notNull(),
  changePercent: decimal("change_percent", { precision: 5, scale: 2 }).notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  role: true,
});

export const insertStockSchema = createInsertSchema(stocks);
export const insertCurrencyPairSchema = createInsertSchema(currencyPairs);
export const insertNewsArticleSchema = createInsertSchema(newsArticles);
export const insertUserFavoriteSchema = createInsertSchema(userFavorites);
export const insertMarketIndexSchema = createInsertSchema(marketIndices);

export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Stock = typeof stocks.$inferSelect;
export type InsertStock = z.infer<typeof insertStockSchema>;
export type CurrencyPair = typeof currencyPairs.$inferSelect;
export type InsertCurrencyPair = z.infer<typeof insertCurrencyPairSchema>;
export type NewsArticle = typeof newsArticles.$inferSelect;
export type InsertNewsArticle = z.infer<typeof insertNewsArticleSchema>;
export type UserFavorite = typeof userFavorites.$inferSelect;
export type InsertUserFavorite = z.infer<typeof insertUserFavoriteSchema>;
export type MarketIndex = typeof marketIndices.$inferSelect;
export type InsertMarketIndex = z.infer<typeof insertMarketIndexSchema>;
