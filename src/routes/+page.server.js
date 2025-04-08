// src/routes/+page.server.js
import { fetchPokemonDetails } from '$lib/pokemonUtils';
// Use generalized DB functions
import { getCacheEntry, saveCacheEntry } from '$lib/server/database';
import { error } from '@sveltejs/kit';

const API_BASE_URL = 'https://pokeapi.co/api/v2/';
const POKEMON_LIMIT = 1025;
const CACHE_KEY_ALL = 'all_pokemon'; // Define key for the main list
const CACHE_DURATION_MS = 6 * 60 * 60 * 1000; // 6 hours

/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch }) {
	console.log('[load - server /] Function start. Attempting to load from cache...');

	// 1. Try to load the main list from SQLite cache
	try {
		// Use specific key
		const cachedData = getCacheEntry(CACHE_KEY_ALL, CACHE_DURATION_MS);
		if (cachedData) {
			console.log(
				'%c[load - server /] Cache hit! Returning cached list data.',
				'color: green; font-weight: bold;'
			);
			return {
				allPokemon: cachedData.allPokemon,
				generations: cachedData.generations,
				types: cachedData.types
			};
		}
	} catch (dbError) {
		console.error('[load - server /] Error accessing SQLite cache:', dbError);
	}

	// 2. Fetch from API if cache missed
	console.log(
		'%c[load - server /] Cache miss or invalid. Fetching list data from API...',
		'color: blue;'
	);
	try {
		const listResponse = await fetch(`${API_BASE_URL}pokemon?limit=${POKEMON_LIMIT}&offset=0`);
		if (!listResponse.ok) {
			throw error(listResponse.status, `Failed to fetch Pokémon list: ${listResponse.statusText}`);
		}
		const listData = await listResponse.json();

		const detailPromises = listData.results.map((pokemon) => fetchPokemonDetails(pokemon.url));
		const detailedPokemonData = await Promise.all(detailPromises);

		const allPokemon = detailedPokemonData.filter((p) => p !== null).sort((a, b) => a.id - b.id);

		if (allPokemon.length === 0 && listData.results.length > 0) {
			console.warn('[load - server /] Fetched list but failed to get details.');
		} else {
			console.log(`[load - server /] Fetched ${allPokemon.length} Pokémon details successfully.`);
		}

		const generations = [...new Set(allPokemon.map((p) => p.generation))]
			.filter((gen) => gen !== 'unknown')
			.sort((a, b) => parseInt(a.split('-')[1]) - parseInt(b.split('-')[1]));
		const types = [...new Set(allPokemon.flatMap((p) => p.types))].sort();

		// 3. Save the fetched list data to the SQLite cache
		if (allPokemon.length > 0) {
			console.log('[load - server /] Saving fetched list data to SQLite cache...');
			// Use specific key and bundle data
			saveCacheEntry(CACHE_KEY_ALL, { allPokemon, generations, types });
		}

		// 4. Return fetched data
		console.log('[load - server /] Returning freshly fetched list data.');
		return { allPokemon, generations, types };
	} catch (fetchError) {
		console.error('[load - server /] Failed to load Pokémon list data:', fetchError);
		if (fetchError.status) throw fetchError;
		throw error(500, `Failed to load Pokémon list data: ${fetchError.message}`);
	}
}
