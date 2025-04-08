// src/lib/stores.js
import { writable } from 'svelte/store';

/**
 * @typedef {'idle' | 'pending' | 'success' | 'error'} PrefetchStatus
 */

/**
 * @typedef {{ status: PrefetchStatus, data?: object, error?: string }} PokemonPrefetchState
 */

/**
 * Stores detailed Pokémon data and status prefetched on the client.
 * Key: pokemon name (lowercase string)
 * Value: PokemonPrefetchState object
 * @type {import('svelte/store').Writable<Map<string, PokemonPrefetchState>>}
 */
export const prefetchedPokemon = writable(new Map());

/**
 * Stores the set of Pokémon names currently being prefetched
 * (still useful for a quick check in triggerPrefetch).
 * @type {import('svelte/store').Writable<Set<string>>}
 */
export const pendingPrefetches = writable(new Set());

/**
 * Stores the currently selected filter values for the Pokédex list.
 * Persists across client-side navigation.
 * @type {import('svelte/store').Writable<{generation: string, type: string}>}
 */
export const pokedexFilters = writable({
	generation: 'all',
	type: 'all'
});
