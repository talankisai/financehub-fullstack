import {
  users,
  stocks,
  currencyPairs,
  newsArticles,
  userFavorites,
  marketIndices,
  type User,
  type UpsertUser,
  type Stock,
  type InsertStock,
  type CurrencyPair,
  type InsertCurrencyPair,
  type NewsArticle,
  type InsertNewsArticle,
  type UserFavorite,
  type InsertUserFavorite,
  type MarketIndex,
  type InsertMarketIndex,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Stock operations
  getStocks(): Promise<Stock[]>;
  getStock(id: number): Promise<Stock | undefined>;
  getStockBySymbol(symbol: string): Promise<Stock | undefined>;
  upsertStock(stock: InsertStock): Promise<Stock>;
  
  // Currency operations
  getCurrencyPairs(): Promise<CurrencyPair[]>;
  getCurrencyPair(id: number): Promise<CurrencyPair | undefined>;
  getCurrencyPairBySymbol(symbol: string): Promise<CurrencyPair | undefined>;
  upsertCurrencyPair(pair: InsertCurrencyPair): Promise<CurrencyPair>;
  updateCurrencyMargin(symbol: string, margin: number): Promise<void>;
  
  // News operations
  getNewsArticles(limit?: number): Promise<NewsArticle[]>;
  getNewsArticle(id: number): Promise<NewsArticle | undefined>;
  upsertNewsArticle(article: InsertNewsArticle): Promise<NewsArticle>;
  
  // Favorites operations
  getUserFavorites(userId: string): Promise<UserFavorite[]>;
  addUserFavorite(favorite: InsertUserFavorite): Promise<UserFavorite>;
  removeUserFavorite(userId: string, itemType: string, itemId: string): Promise<void>;
  
  // Market indices operations
  getMarketIndices(): Promise<MarketIndex[]>;
  getMarketIndex(id: number): Promise<MarketIndex | undefined>;
  upsertMarketIndex(index: InsertMarketIndex): Promise<MarketIndex>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
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

  // Stock operations
  async getStocks(): Promise<Stock[]> {
    return await db.select().from(stocks).orderBy(desc(stocks.updatedAt));
  }

  async getStock(id: number): Promise<Stock | undefined> {
    const [stock] = await db.select().from(stocks).where(eq(stocks.id, id));
    return stock;
  }

  async getStockBySymbol(symbol: string): Promise<Stock | undefined> {
    const [stock] = await db.select().from(stocks).where(eq(stocks.symbol, symbol));
    return stock;
  }

  async upsertStock(stock: InsertStock): Promise<Stock> {
    const [result] = await db
      .insert(stocks)
      .values({ ...stock, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: stocks.symbol,
        set: {
          ...stock,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  // Currency operations
  async getCurrencyPairs(): Promise<CurrencyPair[]> {
    return await db.select().from(currencyPairs).orderBy(desc(currencyPairs.updatedAt));
  }

  async getCurrencyPair(id: number): Promise<CurrencyPair | undefined> {
    const [pair] = await db.select().from(currencyPairs).where(eq(currencyPairs.id, id));
    return pair;
  }

  async getCurrencyPairBySymbol(symbol: string): Promise<CurrencyPair | undefined> {
    const [pair] = await db.select().from(currencyPairs).where(eq(currencyPairs.symbol, symbol));
    return pair;
  }

  async upsertCurrencyPair(pair: InsertCurrencyPair): Promise<CurrencyPair> {
    const [result] = await db
      .insert(currencyPairs)
      .values({ ...pair, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: currencyPairs.symbol,
        set: {
          ...pair,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  async updateCurrencyMargin(symbol: string, margin: number): Promise<void> {
    await db
      .update(currencyPairs)
      .set({ margin: margin.toString(), updatedAt: new Date() })
      .where(eq(currencyPairs.symbol, symbol));
  }

  // News operations
  async getNewsArticles(limit: number = 20): Promise<NewsArticle[]> {
    return await db
      .select()
      .from(newsArticles)
      .orderBy(desc(newsArticles.publishedAt))
      .limit(limit);
  }

  async getNewsArticle(id: number): Promise<NewsArticle | undefined> {
    const [article] = await db.select().from(newsArticles).where(eq(newsArticles.id, id));
    return article;
  }

  async upsertNewsArticle(article: InsertNewsArticle): Promise<NewsArticle> {
    const [result] = await db
      .insert(newsArticles)
      .values({ ...article, createdAt: new Date() })
      .returning();
    return result;
  }

  // Favorites operations
  async getUserFavorites(userId: string): Promise<UserFavorite[]> {
    return await db
      .select()
      .from(userFavorites)
      .where(eq(userFavorites.userId, userId))
      .orderBy(desc(userFavorites.createdAt));
  }

  async addUserFavorite(favorite: InsertUserFavorite): Promise<UserFavorite> {
    const [result] = await db
      .insert(userFavorites)
      .values({ ...favorite, createdAt: new Date() })
      .returning();
    return result;
  }

  async removeUserFavorite(userId: string, itemType: string, itemId: string): Promise<void> {
    await db
      .delete(userFavorites)
      .where(
        sql`${userFavorites.userId} = ${userId} AND ${userFavorites.itemType} = ${itemType} AND ${userFavorites.itemId} = ${itemId}`
      );
  }

  // Market indices operations
  async getMarketIndices(): Promise<MarketIndex[]> {
    return await db.select().from(marketIndices).orderBy(desc(marketIndices.updatedAt));
  }

  async getMarketIndex(id: number): Promise<MarketIndex | undefined> {
    const [index] = await db.select().from(marketIndices).where(eq(marketIndices.id, id));
    return index;
  }

  async upsertMarketIndex(index: InsertMarketIndex): Promise<MarketIndex> {
    const [result] = await db
      .insert(marketIndices)
      .values({ ...index, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: marketIndices.symbol,
        set: {
          ...index,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }
}

export const storage = new DatabaseStorage();
