// src/lib/server/database.js
import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

const dbDir = path.resolve('.db');
const dbPath = path.join(dbDir, 'pokedex.sqlite');

if (!fs.existsSync(dbDir)) {
	console.log(`Creating database directory: ${dbDir}`);
	fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath, {
	/* verbose: console.log */
});
console.log(`SQLite database initialized at: ${dbPath}`);

function initializeSchema() {
	console.log('Initializing database schema...');
	db.exec(`
        CREATE TABLE IF NOT EXISTS pokemon_cache (
            cache_key TEXT PRIMARY KEY,   -- Key like 'all_pokemon' or 'bulbasaur'
            data TEXT NOT NULL,
            timestamp INTEGER NOT NULL
        );
    `);
	console.log('Schema initialized (pokemon_cache table).');
}

initializeSchema();

// ---- Generalized Database Functions ----

/**
 * Gets a cached entry by key.
 * @param {string} key - The cache key (e.g., 'all_pokemon', 'pikachu').
 * @param {number} maxAgeMs - Maximum acceptable cache age in milliseconds.
 * @returns {object | null} The parsed data object or null if cache is invalid/missing.
 */
export function getCacheEntry(key, maxAgeMs) {
	console.log(`[db] Getting cache for key '${key}', maxAge=${maxAgeMs}ms`);
	try {
		const stmt = db.prepare('SELECT data, timestamp FROM pokemon_cache WHERE cache_key = ?');
		const row = stmt.get(key);

		if (!row) {
			console.log(`[db] Cache miss for key '${key}'.`);
			return null;
		}

		const cacheAge = Date.now() - row.timestamp;
		if (cacheAge > maxAgeMs) {
			console.log(
				`[db] Cache found for key '${key}' but expired (age: ${cacheAge}ms > maxAge: ${maxAgeMs}ms).`
			);
			clearCacheEntry(key); // Clean up expired entry
			return null;
		}

		console.log(`[db] Cache hit for key '${key}', age: ${cacheAge}ms. Parsing data...`);
		const parsedData = JSON.parse(row.data);
		// Basic validation could be added here depending on expected structure
		console.log('[db] Cache data parsed successfully.');
		return parsedData;
	} catch (error) {
		console.error(`[db] Error getting cache entry for key '${key}':`, error);
		if (error.message.includes('JSON.parse')) {
			// Clear potentially corrupted cache entry
			clearCacheEntry(key);
		}
		return null;
	}
}

/**
 * Saves data to the cache with a specific key.
 * @param {string} key - The cache key.
 * @param {object} data - The data object to cache.
 */
export function saveCacheEntry(key, data) {
	console.log(`[db] Saving data to cache key '${key}'...`);
	try {
		const dataString = JSON.stringify(data);
		const timestamp = Date.now();
		const stmt = db.prepare(`
            INSERT OR REPLACE INTO pokemon_cache (cache_key, data, timestamp)
            VALUES (?, ?, ?)
        `);
		const info = stmt.run(key, dataString, timestamp);
		console.log(`[db] Cache for key '${key}' saved successfully. Rows changed: ${info.changes}`);
	} catch (error) {
		console.error(`[db] Error saving cache for key '${key}':`, error);
	}
}

/**
 * Clears a specific cache entry.
 * @param {string} key - The cache key to clear.
 */
export function clearCacheEntry(key) {
	console.warn(`[db] Clearing pokemon cache entry '${key}'...`);
	try {
		const stmt = db.prepare('DELETE FROM pokemon_cache WHERE cache_key = ?');
		const info = stmt.run(key);
		console.log(`[db] Cache for key '${key}' cleared. Rows affected: ${info.changes}`);
	} catch (error) {
		console.error(`[db] Error clearing cache for key '${key}':`, error);
	}
}

// Optional: Graceful shutdown...
// Optional: Graceful shutdown - close DB connection when app exits
// This might be important in long-running server processes.
process.on('exit', () => db.close());
process.on('SIGHUP', () => process.exit(128 + 1));
process.on('SIGINT', () => process.exit(128 + 2));
process.on('SIGTERM', () => process.exit(128 + 15));
