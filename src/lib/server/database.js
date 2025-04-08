// src/lib/server/database.js (Note: in 'lib/server' to emphasize server-only use)
import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

// Define the path for the database file
// Using '.svelte-kit/generated' or a dedicated '.db' folder are options.
// Let's use a '.db' folder in the project root for clarity.
const dbDir = path.resolve('.db'); // Project root/.db
const dbPath = path.join(dbDir, 'pokedex.sqlite');

// Ensure the database directory exists
if (!fs.existsSync(dbDir)) {
	console.log(`Creating database directory: ${dbDir}`);
	fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize the database connection
// `verbose: console.log` is helpful for debugging SQL statements
const db = new Database(dbPath, {
	/* verbose: console.log */
});
console.log(`SQLite database initialized at: ${dbPath}`);

// ---- Schema Setup ----
// Function to initialize the database schema if it doesn't exist
function initializeSchema() {
	console.log('Initializing database schema...');
	// Cache table to store the entire fetched data blob and timestamp
	// Storing as a single JSON blob is simpler than normalizing all Pokemon data
	// for this specific caching use case.
	db.exec(`
        CREATE TABLE IF NOT EXISTS pokemon_cache (
            cache_key TEXT PRIMARY KEY DEFAULT 'all_pokemon',
            data TEXT NOT NULL,         -- Store the JSON stringified data
            timestamp INTEGER NOT NULL  -- Store Unix timestamp (milliseconds)
        );
    `);
	console.log('Schema initialized (pokemon_cache table).');
}

// Run schema initialization when the module loads
initializeSchema();

// ---- Database Functions ----

/**
 * Gets the cached Pokémon data.
 * @param {number} maxAgeMs - Maximum acceptable cache age in milliseconds.
 * @returns {object | null} The parsed data object { allPokemon, generations, types } or null if cache is invalid/missing.
 */
export function getPokemonCache(maxAgeMs) {
	console.log(`[db] Getting cache for key 'all_pokemon', maxAge=${maxAgeMs}ms`);
	const stmt = db.prepare('SELECT data, timestamp FROM pokemon_cache WHERE cache_key = ?');
	const row = stmt.get('all_pokemon');

	if (!row) {
		console.log('[db] Cache miss.');
		return null;
	}

	const cacheAge = Date.now() - row.timestamp;
	if (cacheAge > maxAgeMs) {
		console.log(`[db] Cache found but expired (age: ${cacheAge}ms > maxAge: ${maxAgeMs}ms).`);
		// Optional: Clean up expired cache entry here if desired
		// clearPokemonCache();
		return null;
	}

	try {
		console.log(`[db] Cache hit, age: ${cacheAge}ms. Parsing data...`);
		const parsedData = JSON.parse(row.data);
		// Basic validation
		if (!parsedData.allPokemon || !parsedData.generations || !parsedData.types) {
			throw new Error('Cached data is missing essential properties.');
		}
		console.log('[db] Cache data parsed successfully.');
		return parsedData; // Contains { allPokemon, generations, types }
	} catch (error) {
		console.error('[db] Error parsing cached JSON data:', error);
		// Clear corrupted cache
		clearPokemonCache();
		return null;
	}
}

/**
 * Saves the Pokémon data to the cache.
 * @param {object} data - The data object { allPokemon, generations, types } to cache.
 */
export function savePokemonCache(data) {
	console.log(`[db] Saving data to cache key 'all_pokemon'...`);
	try {
		const dataString = JSON.stringify(data);
		const timestamp = Date.now();
		// Use INSERT OR REPLACE (UPSERT) to add or update the cache entry
		const stmt = db.prepare(`
            INSERT OR REPLACE INTO pokemon_cache (cache_key, data, timestamp)
            VALUES (?, ?, ?)
        `);
		const info = stmt.run('all_pokemon', dataString, timestamp);
		console.log(`[db] Cache saved successfully. Rows changed: ${info.changes}`);
	} catch (error) {
		console.error('[db] Error saving cache to database:', error);
		// Handle potential errors like data being too large if there are limits
	}
}

/**
 * Clears the Pokémon cache entry.
 */
export function clearPokemonCache() {
	console.warn("[db] Clearing pokemon cache entry 'all_pokemon'...");
	try {
		const stmt = db.prepare('DELETE FROM pokemon_cache WHERE cache_key = ?');
		const info = stmt.run('all_pokemon');
		console.log(`[db] Cache cleared. Rows affected: ${info.changes}`);
	} catch (error) {
		console.error('[db] Error clearing cache:', error);
	}
}

// Optional: Graceful shutdown - close DB connection when app exits
// This might be important in long-running server processes.
process.on('exit', () => db.close());
process.on('SIGHUP', () => process.exit(128 + 1));
process.on('SIGINT', () => process.exit(128 + 2));
process.on('SIGTERM', () => process.exit(128 + 15));
