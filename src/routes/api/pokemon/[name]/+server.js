// src/routes/api/pokemon/[name]/+server.js
import { error, json } from '@sveltejs/kit';
import { getCacheEntry, saveCacheEntry } from '$lib/server/database';
import { typeColors } from '$lib/pokemonUtils'; // Assuming utils file exists

const API_BASE_URL = 'https://pokeapi.co/api/v2/';
// Use a slightly shorter cache duration for API endpoint potentially? Or same as page.
const CACHE_DURATION_MS = 6 * 60 * 60 * 1000;

// Shared function to process PokeAPI data (similar to detail page load)
async function getAndProcessPokemonData(name, fetchFn) {
	console.log(`[api/pokemon/${name}] Processing data...`);
	// Fetch primary Pokémon data
	const pokeResponse = await fetchFn(`${API_BASE_URL}pokemon/${name}`);
	if (!pokeResponse.ok) {
		if (pokeResponse.status === 404) throw error(404, `Pokemon "${name}" not found`);
		throw error(pokeResponse.status, `API Error (${pokeResponse.status})`);
	}
	const pokeData = await pokeResponse.json();

	// Fetch species data
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

	// Return structured data suitable for client/cache
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
			return json(cachedData); // Return cached data as JSON
		}
	} catch (dbError) {
		console.error(`[api/pokemon/${pokemonName}] Error accessing cache:`, dbError);
		// Don't fail the request, proceed to fetch
	}

	// 2. Fetch from PokeAPI if cache missed
	console.log(
		`%c[api/pokemon/${pokemonName}] Cache miss. Fetching from PokeAPI...`,
		'color: blue;'
	);
	try {
		// Use the shared processing function
		const processedData = await getAndProcessPokemonData(pokemonName, fetch);

		// 3. Save to server-side SQLite cache (fire-and-forget)
		console.log(`[api/pokemon/${pokemonName}] Saving fetched data to cache...`);
		saveCacheEntry(pokemonName, processedData);

		// 4. Return fresh data as JSON
		console.log(`[api/pokemon/${pokemonName}] Returning freshly fetched data.`);
		return json(processedData);
	} catch (fetchError) {
		console.error(`[api/pokemon/${pokemonName}] Failed to process data:`, fetchError);
		// If it's a SvelteKit error, use its status, otherwise 500
		const status = fetchError.status || 500;
		const message =
			fetchError.body?.message || fetchError.message || 'Failed to fetch Pokemon data';
		throw error(status, message); // Throw SvelteKit error for proper JSON response
	}
}
