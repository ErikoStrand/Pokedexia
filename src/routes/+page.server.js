// src/routes/+page.server.js <--- RENAME THE FILE
import { fetchPokemonDetails } from '$lib/pokemonUtils'; // Your utility function
import { getPokemonCache, savePokemonCache } from '$lib/server/database'; // Import DB functions
import { error } from '@sveltejs/kit'; // For throwing proper SvelteKit errors

const API_BASE_URL = 'https://pokeapi.co/api/v2/';
const POKEMON_LIMIT = 1025;
const CACHE_DURATION_MS = 6 * 60 * 60 * 1000; // 6 hours

/** @type {import('./$types').PageServerLoad} */ // Type changes for .server.js
export async function load({ fetch }) {
	// 'fetch' is still available for API calls
	console.log('[load - server] Function start. Attempting to load from cache...');

	// 1. Try to load from SQLite cache first
	try {
		const cachedData = getPokemonCache(CACHE_DURATION_MS);
		if (cachedData) {
			console.log(
				'%c[load - server] Cache hit! Returning cached data.',
				'color: green; font-weight: bold;'
			);
			return {
				// No 'error' property needed here on success
				allPokemon: cachedData.allPokemon,
				generations: cachedData.generations,
				types: cachedData.types
			};
		}
	} catch (dbError) {
		// Log DB errors but proceed to fetch - don't crash the page load
		console.error('[load - server] Error accessing SQLite cache:', dbError);
	}

	// 2. Fetch from API if cache missed or was invalid
	console.log('%c[load - server] Cache miss or invalid. Fetching data from API...', 'color: blue;');
	try {
		const listResponse = await fetch(`${API_BASE_URL}pokemon?limit=${POKEMON_LIMIT}&offset=0`);

		// Handle API errors more gracefully using SvelteKit's error helper
		if (!listResponse.ok) {
			console.error(`[load - server] API error! Status: ${listResponse.status}`);
			throw error(listResponse.status, `Failed to fetch Pokémon list: ${listResponse.statusText}`);
		}
		const listData = await listResponse.json();

		// Fetch details - Ensure fetchPokemonDetails uses GLOBAL fetch or pass SvelteKit's fetch
		// Since fetchPokemonDetails doesn't NEED the SvelteKit wrapper benefits anymore,
		// using global fetch inside it is fine.
		const detailPromises = listData.results.map((pokemon) => fetchPokemonDetails(pokemon.url));
		const detailedPokemonData = await Promise.all(detailPromises);

		const allPokemon = detailedPokemonData.filter((p) => p !== null).sort((a, b) => a.id - b.id);

		// Basic check if fetch worked
		if (allPokemon.length === 0 && listData.results.length > 0) {
			console.warn('[load - server] Fetched list but failed to get details for any Pokemon.');
			// Maybe throw a less severe error or return empty state?
			// Let's proceed but the cache won't save much.
		} else {
			console.log(`[load - server] Fetched ${allPokemon.length} Pokémon details successfully.`);
		}

		const generations = [...new Set(allPokemon.map((p) => p.generation))]
			.filter((gen) => gen !== 'unknown')
			.sort((a, b) => parseInt(a.split('-')[1]) - parseInt(b.split('-')[1]));
		const types = [...new Set(allPokemon.flatMap((p) => p.types))].sort();

		// 3. Save the fetched data to the SQLite cache (don't await this, let it run in background)
		if (allPokemon.length > 0) {
			console.log('[load - server] Saving fetched data to SQLite cache...');
			savePokemonCache({ allPokemon, generations, types }); // Fire-and-forget saving
		} else {
			console.log(
				'[load - server] Skipping cache save as no Pokemon data was successfully detailed.'
			);
		}

		// 4. Return fetched data
		console.log('[load - server] Returning freshly fetched data.');
		return {
			allPokemon,
			generations,
			types
		};
	} catch (fetchError) {
		console.error('[load - server] Failed to load Pokémon data:', fetchError);
		// If it's already a SvelteKit error, re-throw it
		if (fetchError.status) throw fetchError;
		// Otherwise, throw a generic 500 error
		throw error(500, `Failed to load Pokémon data: ${fetchError.message}`);
	}
}
