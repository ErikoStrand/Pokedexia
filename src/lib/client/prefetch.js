// src/lib/client/prefetch.js
import { prefetchedPokemon, pendingPrefetches } from '$lib/stores';
import { get } from 'svelte/store';

/**
 * Initiates prefetching for a specific Pokémon if not already successfully fetched or pending.
 * @param {string} pokemonNameLowercase - The lowercase name of the Pokémon.
 */
export async function triggerPrefetch(pokemonNameLowercase) {
	const currentPrefetchedMap = get(prefetchedPokemon);
	const currentPendingSet = get(pendingPrefetches);
	const currentStatus = currentPrefetchedMap.get(pokemonNameLowercase)?.status;

	// Don't prefetch if already successful or currently pending
	if (currentStatus === 'success' || currentPendingSet.has(pokemonNameLowercase)) {
		// console.log(`[prefetch] Skipping prefetch for ${pokemonNameLowercase} (status: ${currentStatus}, pending: ${currentPendingSet.has(pokemonNameLowercase)}).`);
		return;
	}

	console.log(`[prefetch] Initiating prefetch for ${pokemonNameLowercase}...`);

	// Mark as pending in BOTH stores
	pendingPrefetches.update((set) => set.add(pokemonNameLowercase));
	prefetchedPokemon.update((map) => {
		map.set(pokemonNameLowercase, { status: 'pending' });
		return map;
	});

	try {
		const response = await fetch(`/api/pokemon/${pokemonNameLowercase}`);

		if (!response.ok) {
			let errorMsg = `API fetch failed: ${response.status} ${response.statusText}`;
			try {
				// Try to get more specific error from response body if possible
				const errorBody = await response.json();
				if (errorBody.message) errorMsg = errorBody.message;
			} catch {
				/* Ignore parsing error */
			}
			throw new Error(errorMsg);
		}

		const data = await response.json();

		if (data && data.id) {
			console.log(`[prefetch] Prefetch successful for ${pokemonNameLowercase}. Updating store.`);
			// Update the store with success status and data
			prefetchedPokemon.update((map) => {
				map.set(pokemonNameLowercase, { status: 'success', data: data });
				return map;
			});
		} else {
			console.warn(`[prefetch] Prefetched data for ${pokemonNameLowercase} seems invalid.`, data);
			throw new Error('Received invalid data structure after prefetch.'); // Treat as error
		}
	} catch (error) {
		console.error(`[prefetch] Error prefetching ${pokemonNameLowercase}:`, error);
		// Update the store with error status and message
		prefetchedPokemon.update((map) => {
			map.set(pokemonNameLowercase, { status: 'error', error: error.message });
			return map;
		});
	} finally {
		// Remove from pending set regardless of success or failure
		pendingPrefetches.update((set) => {
			set.delete(pokemonNameLowercase);
			return set;
		});
		// console.log(`[prefetch] Prefetch attempt finished for ${pokemonNameLowercase}.`);
	}
}
