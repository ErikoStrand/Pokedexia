// src/lib/client/prefetch.js
import { prefetchedPokemon, pendingPrefetches } from '$lib/stores';
import { get } from 'svelte/store'; // To read store value once

/**
 * Initiates prefetching for a specific Pokémon if not already fetched or pending.
 * @param {string} pokemonNameLowercase - The lowercase name of the Pokémon.
 */
export async function triggerPrefetch(pokemonNameLowercase) {
	const currentPrefetched = get(prefetchedPokemon);
	const currentPending = get(pendingPrefetches);

	// Don't prefetch if already cached or already being fetched
	if (currentPrefetched.has(pokemonNameLowercase) || currentPending.has(pokemonNameLowercase)) {
		// console.log(`[prefetch] Skipping prefetch for ${pokemonNameLowercase} (already cached or pending).`);
		return;
	}

	console.log(`[prefetch] Initiating prefetch for ${pokemonNameLowercase}...`);

	// Mark as pending
	pendingPrefetches.update((set) => set.add(pokemonNameLowercase));

	try {
		// Fetch from our OWN API endpoint (which handles its own caching)
		const response = await fetch(`/api/pokemon/${pokemonNameLowercase}`);

		if (!response.ok) {
			throw new Error(
				`API fetch failed for ${pokemonNameLowercase}: ${response.status} ${response.statusText}`
			);
		}

		const data = await response.json();

		// Basic validation of fetched data structure might be good here
		if (data && data.id) {
			console.log(`[prefetch] Prefetch successful for ${pokemonNameLowercase}. Updating store.`);
			// Update the store with the fetched data
			prefetchedPokemon.update((map) => {
				map.set(pokemonNameLowercase, data);
				return map; // Return the modified map
			});
		} else {
			console.warn(`[prefetch] Prefetched data for ${pokemonNameLowercase} seems invalid.`, data);
		}
	} catch (error) {
		console.error(`[prefetch] Error prefetching ${pokemonNameLowercase}:`, error);
		// Optionally, remove from prefetch store if failed? Or leave it to retry later?
		// prefetchStore.update(map => { map.delete(pokemonNameLowercase); return map; });
	} finally {
		// Remove from pending set regardless of success or failure
		pendingPrefetches.update((set) => {
			set.delete(pokemonNameLowercase);
			return set; // Return the modified set
		});
		// console.log(`[prefetch] Prefetch attempt finished for ${pokemonNameLowercase}.`);
	}
}
