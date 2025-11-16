// src/db/database.ts
import type { SQLiteDatabase } from "expo-sqlite";

/**
 * Ця функція викликається ОДИН раз при старті додатку
 * через SQLiteProvider.onInit і створює всі таблиці.
 */
export async function initDb(db: SQLiteDatabase) {
  // Увімкнемо WAL для кращої продуктивності
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS equipment (
      id INTEGER PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      category TEXT,
      inventoryNumber TEXT,
      location TEXT,
      status TEXT,
      notes TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS maintenance_logs (
      id INTEGER PRIMARY KEY NOT NULL,
      equipmentId INTEGER NOT NULL,
      date TEXT NOT NULL,
      action TEXT NOT NULL,
      notes TEXT,
      FOREIGN KEY (equipmentId) REFERENCES equipment(id) ON DELETE CASCADE
    );
  `);
}
