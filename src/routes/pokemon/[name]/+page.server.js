// src/routes/pokemon/[name]/+page.server.js
import { error } from '@sveltejs/kit';
import { getCacheEntry, saveCacheEntry } from '$lib/server/database';
import { typeColors } from '$lib/pokemonUtils'; // Adjust path if needed

const API_BASE_URL = 'https://pokeapi.co/api/v2/';
const CACHE_DURATION_MS = 6 * 60 * 60 * 1000; // 6 hours

// --- Reusable Data Processing Logic ---
// (This could be moved to a shared utils file if preferred)
async function getAndProcessPokemonData(name, fetchFn) {
	console.log(`[page.server/${name}] Processing data...`);
	const pokeResponse = await fetchFn(`${API_BASE_URL}pokemon/${name}`);
	if (!pokeResponse.ok) {
		if (pokeResponse.status === 404) throw error(404, `Pokemon "${name}" not found`);
		throw error(pokeResponse.status, `API Error (${pokeResponse.status})`);
	}
	const pokeData = await pokeResponse.json();
	let speciesData = null;
	try {
		if (pokeData.species?.url) {
			const speciesResponse = await fetchFn(pokeData.species.url);
			if (speciesResponse.ok) speciesData = await speciesResponse.json();
		}
	} catch {
		/* Ignore species fetch errors */
	}
	const flavorTextEntry = speciesData?.flavor_text_entries?.find((e) => e.language.name === 'en');
	const flavorText =
		flavorTextEntry?.flavor_text.replace(/[\n\f]/g, ' ') || 'No description available.';
	const primaryType = pokeData.types[0]?.type.name || 'normal';
	return {
		id: pokeData.id,
		name: pokeData.name,
		sprite:
			pokeData.sprites.other?.['official-artwork']?.front_default ||
			pokeData.sprites.front_default ||
			'/placeholder.png',
		spriteShiny:
			pokeData.sprites.other?.['official-artwork']?.front_shiny || pokeData.sprites.front_shiny,
		spriteHome: pokeData.sprites.other?.home?.front_default,
		types: pokeData.types.map((t) => t.type.name),
		primaryType: primaryType,
		primaryColor: typeColors[primaryType] || '#A8A77A',
		height: (pokeData.height / 10).toFixed(1),
		weight: (pokeData.weight / 10).toFixed(1),
		abilities: pokeData.abilities.map((a) => ({
			name: a.ability.name.replace('-', ' '),
			isHidden: a.is_hidden
		})),
		stats: pokeData.stats.map((s) => ({
			name: s.stat.name.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
			base_stat: s.base_stat
		})),
		flavorText: flavorText,
		genus: speciesData?.genera?.find((g) => g.language.name === 'en')?.genus || ''
	};
}
// --- End Reusable Logic ---

/** @type {import('./$types').PageServerLoad} */
export async function load({ params, fetch }) {
	const pokemonName = params.name.toLowerCase();
	console.log(`[page.server/${pokemonName}] Load function start.`);

	// 1. Check server-side SQLite cache
	try {
		console.log(`[page.server/${pokemonName}] Checking cache...`);
		const cachedData = getCacheEntry(pokemonName, CACHE_DURATION_MS);
		if (cachedData) {
			console.log(
				`%c[page.server/${pokemonName}] Cache hit! Returning cached data.`,
				'color: green;'
			);
			return {
				pokemon: cachedData // The cached data is already the structure we need
			};
		}
	} catch (dbError) {
		console.error(`[page.server/${pokemonName}] Error accessing cache:`, dbError);
	}

	// 2. Fetch from PokeAPI if cache missed
	console.log(
		`%c[page.server/${pokemonName}] Cache miss. Fetching from PokeAPI...`,
		'color: blue;'
	);
	try {
		// Use the shared processing function
		const processedData = await getAndProcessPokemonData(pokemonName, fetch);

		// 3. Save to server-side SQLite cache (fire-and-forget)
		console.log(`[page.server/${pokemonName}] Saving fetched data to cache...`);
		saveCacheEntry(pokemonName, processedData);

		// 4. Return fresh data
		console.log(`[page.server/${pokemonName}] Returning freshly fetched data.`);
		return {
			pokemon: processedData
		};
	} catch (fetchError) {
		console.error(`[page.server/${pokemonName}] Failed to load data:`, fetchError);
		if (fetchError.status) throw fetchError;
		throw error(500, `Failed to load data for ${params.name}: ${fetchError.message}`);
	}
}
