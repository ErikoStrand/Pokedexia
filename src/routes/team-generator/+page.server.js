// src/routes/team-generator/+page.server.js
// Re-use the same data loading logic as the main Pokédex page for simplicity,
// as the generator needs the full list. It will benefit from the same cache.
import { getCacheEntry, saveCacheEntry } from '$lib/server/database';
import { fetchPokemonDetails } from '$lib/pokemonUtils'; // We need the *details* for the cards
import { error } from '@sveltejs/kit';

const API_BASE_URL = 'https://pokeapi.co/api/v2/';
const POKEMON_LIMIT = 1025; // Use the same limit
const CACHE_KEY_ALL = 'all_pokemon'; // Use the same cache key
const CACHE_DURATION_MS = 6 * 60 * 60 * 1000;

/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch }) {
	console.log(
		'[load - server /team-generator] Function start. Attempting to load list from cache...'
	);

	// 1. Try to load the main list from SQLite cache
	try {
		const cachedData = getCacheEntry(CACHE_KEY_ALL, CACHE_DURATION_MS);
		if (cachedData && cachedData.allPokemon?.length > 0) {
			// Check if data exists
			console.log(
				'%c[load - server /team-generator] Cache hit! Returning cached list data.',
				'color: green;'
			);
			return {
				allPokemon: cachedData.allPokemon // Only need the pokemon list for generation
			};
		}
	} catch (dbError) {
		console.error('[load - server /team-generator] Error accessing SQLite cache:', dbError);
	}

	// 2. Fetch from API if cache missed
	console.log(
		'%c[load - server /team-generator] Cache miss or invalid. Fetching list data from API...',
		'color: blue;'
	);
	try {
		const listResponse = await fetch(`${API_BASE_URL}pokemon?limit=${POKEMON_LIMIT}&offset=0`);
		if (!listResponse.ok) {
			throw error(listResponse.status, `Failed to fetch Pokémon list: ${listResponse.statusText}`);
		}
		const listData = await listResponse.json();

		// Fetch details - needed to display cards correctly
		const detailPromises = listData.results.map((pokemon) => fetchPokemonDetails(pokemon.url));
		const detailedPokemonData = await Promise.all(detailPromises);
		const allPokemon = detailedPokemonData.filter((p) => p !== null).sort((a, b) => a.id - b.id);

		console.log(
			`[load - server /team-generator] Fetched ${allPokemon.length} Pokémon details successfully.`
		);

		// Also need generations/types if we want to save the full cache entry
		const generations = [...new Set(allPokemon.map((p) => p.generation))]
			.filter((gen) => gen !== 'unknown')
			.sort((a, b) => parseInt(a.split('-')[1]) - parseInt(b.split('-')[1]));
		const types = [...new Set(allPokemon.flatMap((p) => p.types))].sort();

		// 3. Save the fetched list data to the SQLite cache (if fetched)
		if (allPokemon.length > 0) {
			console.log('[load - server /team-generator] Saving fetched list data to SQLite cache...');
			saveCacheEntry(CACHE_KEY_ALL, { allPokemon, generations, types });
		}

		// 4. Return fetched data
		console.log('[load - server /team-generator] Returning freshly fetched list data.');
		return { allPokemon };
	} catch (fetchError) {
		console.error('[load - server /team-generator] Failed to load Pokémon list data:', fetchError);
		if (fetchError.status) throw fetchError;
		throw error(500, `Failed to load Pokémon list data: ${fetchError.message}`);
	}
}
