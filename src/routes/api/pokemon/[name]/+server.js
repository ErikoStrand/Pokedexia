// src/routes/api/pokemon/[name]/+server.js
import { error, json } from '@sveltejs/kit';
import { getCacheEntry, saveCacheEntry } from '$lib/server/database';
// Import the processor
import { getAndProcessPokemonData } from '$lib/server/pokemonProcessor';

const CACHE_DURATION_MS = 6 * 60 * 60 * 1000; // 6 hours

/** @type {import('./$types').RequestHandler} */
export async function GET({ params, fetch }) {
	const pokemonName = params.name.toLowerCase();
	console.log(`[api/pokemon/${pokemonName}] GET request received.`);

	// 1. Check server-side SQLite cache
	try {
		const cachedData = getCacheEntry(pokemonName, CACHE_DURATION_MS);
		if (cachedData) {
			console.log(
				`%c[api/pokemon/${pokemonName}] Cache hit! Returning cached data.`,
				'color: green;'
			);
			return json(cachedData);
		}
	} catch (dbError) {
		console.error(`[api/pokemon/${pokemonName}] Error accessing cache:`, dbError);
	}

	// 2. Fetch using the processor function if cache missed
	console.log(`%c[api/pokemon/${pokemonName}] Cache miss. Fetching/processing...`, 'color: blue;');
	try {
		// Use the extracted processor function
		const processedData = await getAndProcessPokemonData(pokemonName, fetch);

		// 3. Save to server-side SQLite cache
		console.log(`[api/pokemon/${pokemonName}] Saving fetched data to cache...`);
		saveCacheEntry(pokemonName, processedData); // Save the full processed data

		// 4. Return fresh data as JSON
		console.log(`[api/pokemon/${pokemonName}] Returning freshly processed data.`);
		return json(processedData);
	} catch (fetchError) {
		console.error(`[api/pokemon/${pokemonName}] Failed to process data:`, fetchError);
		const status = fetchError.status || 500;
		const message =
			fetchError.body?.message || fetchError.message || 'Failed to fetch Pokemon data';
		throw error(status, message);
	}
}
