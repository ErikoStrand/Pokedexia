// src/lib/utils/pokemonUtils.js

/**
 * PokeAPI doesn't directly return generation *name* in the main pokemon endpoint.
 * We determine it based on ID ranges.
 * Note: These ranges might need slight adjustments as new Pokémon forms are added
 * within existing generation IDs by PokeAPI, but are generally accurate for base species.
 */
export const generationRanges = {
	'generation-i': { start: 1, end: 151 },
	'generation-ii': { start: 152, end: 251 },
	'generation-iii': { start: 252, end: 386 },
	'generation-iv': { start: 387, end: 493 },
	'generation-v': { start: 494, end: 649 },
	'generation-vi': { start: 650, end: 721 },
	'generation-vii': { start: 722, end: 809 },
	'generation-viii': { start: 810, end: 905 },
	'generation-ix': { start: 906, end: 1025 } // As of Gen 9 end
	// Add future generations here
};

export function getGenerationNameById(id) {
	for (const genName in generationRanges) {
		if (id >= generationRanges[genName].start && id <= generationRanges[genName].end) {
			return genName;
		}
	}
	return 'unknown'; // Fallback for IDs outside known ranges (e.g., forms, future Pokémon)
}
const desiredStats = {
	hp: 'HP',
	attack: 'Attack',
	defense: 'Defense',
	'special-attack': 'Sp. Atk',
	'special-defense': 'Sp. Def',
	speed: 'Speed'
};
// Optional: Type colors if needed elsewhere, though CSS handles it now
export const typeColors = {
	normal: '#A8A77A',
	fire: '#EE8130',
	water: '#6390F0',
	electric: '#F7D02C',
	grass: '#7AC74C',
	ice: '#96D9D6',
	fighting: '#C22E28',
	poison: '#A33EA1',
	ground: '#E2BF65',
	flying: '#A98FF3',
	psychic: '#F95587',
	bug: '#A6B91A',
	rock: '#B6A136',
	ghost: '#735797',
	dragon: '#6F35FC',
	dark: '#705746',
	steel: '#B7B7CE',
	fairy: '#D685AD'
};

/**
 * Fetches detailed data for a single Pokémon.
 * @param {string} url - The PokeAPI URL for the specific Pokémon.
 * @returns {Promise<object|null>} Detailed Pokémon data or null on error.
 */
export async function fetchPokemonDetails(url) {
	try {
		const response = await fetch(url); // Use global fetch here, SvelteKit wrapper is in +page.js
		if (!response.ok) {
			console.warn(`Failed to fetch details for ${url}: ${response.status}`);
			return null;
		}
		const data = await response.json();

		// Process stats: Filter first, then map
		const processedStats = data.stats
			.filter((statInfo) => desiredStats.hasOwnProperty(statInfo.stat.name)) // Keep only desired stats by original name
			.map((statInfo) => ({
				name: desiredStats[statInfo.stat.name], // Use our defined display name
				base_stat: statInfo.base_stat
			}));
		// Optional: Ensure a specific order if needed (e.g., HP, Atk, Def, SpA, SpD, Spe)
		// processedStats.sort((a, b) => Object.values(desiredStats).indexOf(a.name) - Object.values(desiredStats).indexOf(b.name));

		const animatedSprite =
			data.sprites.versions?.['generation-v']?.['black-white']?.animated?.front_default;
		const defaultSprite = data.sprites.front_default;
		const sprite = animatedSprite || defaultSprite || '/placeholder.png';

		return {
			id: data.id,
			name: data.name,
			types: data.types.map((typeInfo) => typeInfo.type.name),
			stats: processedStats, // Use the correctly filtered and mapped stats
			sprite: sprite,
			generation: getGenerationNameById(data.id)
		};
	} catch (error) {
		console.error(`Error fetching details for ${url}:`, error);
		return null;
	}
}
