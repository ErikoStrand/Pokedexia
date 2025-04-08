// src/lib/stores.js
import { writable } from 'svelte/store';

/**
 * Stores detailed Pokémon data prefetched on the client.
 * Key: pokemon name (lowercase string)
 * Value: pokemon detail object
 * @type {import('svelte/store').Writable<Map<string, object>>}
 */
export const prefetchedPokemon = writable(new Map());

/**
 * Stores the set of Pokémon names currently being prefetched.
 * @type {import('svelte/store').Writable<Set<string>>}
 */
export const pendingPrefetches = writable(new Set());

/**
 * Stores the currently selected filter values for the Pokédex list.
 * Persists across client-side navigation.
 * @type {import('svelte/store').Writable<{generation: string, type: string}>}
 */
export const pokedexFilters = writable({
	generation: 'all', // Default value
	type: 'all' // Default value
});
