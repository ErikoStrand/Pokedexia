// src/routes/pokemon/[name]/+page.server.js
import { error } from '@sveltejs/kit';
// Import getCacheEntry, saveCacheEntry, AND clearCacheEntry
import { getCacheEntry, saveCacheEntry, clearCacheEntry } from '$lib/server/database';
// Import the processor
import { getAndProcessPokemonData } from '$lib/server/pokemonProcessor';

const CACHE_DURATION_MS = 6 * 60 * 60 * 1000; // 6 hours

/** @type {import('./$types').PageServerLoad} */
export async function load({ params, fetch }) {
	const pokemonName = params.name.toLowerCase();
	console.log(`[page.server/${pokemonName}] Load function start.`);

	// 1. Check server-side SQLite cache
	try {
		console.log(`[page.server/${pokemonName}] Checking cache...`);
		const cachedData = getCacheEntry(pokemonName, CACHE_DURATION_MS);

		// Check if we got *anything* back from the cache
		if (cachedData) {
			console.log(
				`%c[page.server/${pokemonName}] Cache hit! Validating data structure...`,
				'color: green;'
			);

			// --- Stricter Validation ---
			// Check for essential properties, especially the moves array which indicates
			// the newer cache structure. Add other checks if needed.
			const isCacheValid =
				cachedData.id && // Check if essential base data exists
				Array.isArray(cachedData.levelUpMoves); // Crucially, check if moves array exists

			if (isCacheValid) {
				console.log(
					`[page.server/${pokemonName}] Cached data structure is valid. Returning cache.`
				);
				return { pokemon: cachedData }; // Return valid, complete cache
			} else {
				// If cache exists but is incomplete/invalid (e.g., old format without moves)
				console.warn(
					`[page.server/${pokemonName}] Cached data exists but is INCOMPLETE or INVALID (missing moves array?). Clearing and refetching.`
				);
				clearCacheEntry(pokemonName); // Clear the bad entry
				// Do NOT return here. Let execution fall through to fetch fresh data.
			}
		} else {
			console.log(`[page.server/${pokemonName}] Cache miss (no entry found or expired).`);
			// No cache entry found, proceed to fetch.
		}
		// If cachedData was null OR validation failed (and cache was cleared), execution continues below...
	} catch (dbError) {
		console.error(`[page.server/${pokemonName}] Error accessing cache:`, dbError);
		// Don't fail the load, proceed to fetch if DB error occurs
	}

	// 2. Fetch/Process using the processor function if cache missed OR was invalid/cleared
	console.log(
		`%c[page.server/${pokemonName}] Cache miss or invalid/outdated. Fetching/processing...`,
		'color: blue;'
	);
	try {
		// Use the extracted processor function to get complete data
		const processedData = await getAndProcessPokemonData(pokemonName, fetch);

		// 3. Save the newly fetched, complete data to the cache
		console.log(`[page.server/${pokemonName}] Saving fetched data to cache...`);
		saveCacheEntry(pokemonName, processedData);

		// 4. Return the fresh data for the page
		console.log(`[page.server/${pokemonName}] Returning freshly processed data.`);
		return {
			pokemon: processedData
		};
	} catch (fetchError) {
		console.error(`[page.server/${pokemonName}] Failed to load data:`, fetchError);
		if (fetchError.status) throw fetchError; // Re-throw SvelteKit HTTP errors
		throw error(500, `Failed to load data for ${params.name}: ${fetchError.message}`); // Throw generic 500 otherwise
	}
}
