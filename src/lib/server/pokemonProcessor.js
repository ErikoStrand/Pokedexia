// src/lib/server/pokemonProcessor.js
import { error } from '@sveltejs/kit';
import { typeColors } from '$lib/pokemonUtils'; // Adjust path if needed

const API_BASE_URL = 'https://pokeapi.co/api/v2/';

// Define a preference order for version groups (most recent first)
const PREFERRED_VERSION_GROUPS = [
	'scarlet-violet',
	'legends-arceus', // Note: May have different move mechanics/availability
	'brilliant-diamond-shining-pearl',
	'sword-shield', // (Consider DLCs if API differentiates?)
	'lets-go-pikachu-lets-go-eevee',
	'ultra-sun-ultra-moon',
	'sun-moon'
	// Add older generations if desired (e.g., 'omega-ruby-alpha-sapphire', 'x-y')
];

/**
 * Fetches and processes comprehensive data for a single Pokémon, including moves
 * from the best available recent version group.
 * @param {string} name - The lowercase name of the Pokémon.
 * @param {function} fetchFn - The fetch implementation.
 * @returns {Promise<object>} - The processed Pokémon data object.
 */
export async function getAndProcessPokemonData(name, fetchFn) {
	console.log(`[pokemonProcessor/${name}] Processing data...`);

	// --- Fetch Primary and Species Data ---
	let pokeData, speciesData;
	try {
		const pokeResponse = await fetchFn(`${API_BASE_URL}pokemon/${name}`);
		if (!pokeResponse.ok) {
			if (pokeResponse.status === 404) throw error(404, `Pokemon "${name}" not found`);
			throw error(pokeResponse.status, `API Error (${pokeResponse.status}) fetching main data`);
		}
		pokeData = await pokeResponse.json();

		if (pokeData.species?.url) {
			const speciesResponse = await fetchFn(pokeData.species.url);
			if (speciesResponse.ok) speciesData = await speciesResponse.json();
			else
				console.warn(
					`[pokemonProcessor/${name}] Failed to fetch species data: ${speciesResponse.status}`
				);
		}
	} catch (err) {
		console.error(`[pokemonProcessor/${name}] Error during primary/species fetch:`, err);
		if (err.status) throw err;
		throw error(500, `Failed fetching base data for ${name}: ${err.message}`);
	}

	// --- Process Basic Info ---
	const flavorTextEntry = speciesData?.flavor_text_entries?.find((e) => e.language.name === 'en');
	const flavorText =
		flavorTextEntry?.flavor_text.replace(/[\n\f]/g, ' ') || 'No description available.';
	const primaryType = pokeData.types[0]?.type.name || 'normal';
	const genus = speciesData?.genera?.find((g) => g.language.name === 'en')?.genus || '';

	// --- Determine Best Version Group and Extract Relevant Move URLs/Methods ---
	let actualVersionGroup = null;
	const moveLearnInfoForGroup = new Map(); // key: moveUrl, value: { moveName, learnMethods: [{ method, level }] }

	if (pokeData.moves) {
		// Find the most preferred version group that this Pokemon has *any* move data for
		for (const preferredGroup of PREFERRED_VERSION_GROUPS) {
			let foundMovesInThisGroup = false;
			const tempMapForGroup = new Map(); // Store moves *only* for this group temporarily

			for (const moveEntry of pokeData.moves) {
				const moveName = moveEntry.move.name;
				const moveUrl = moveEntry.move.url;

				for (const versionDetail of moveEntry.version_group_details) {
					if (versionDetail.version_group.name === preferredGroup) {
						foundMovesInThisGroup = true; // Mark that this group has data
						const learnMethod = versionDetail.move_learn_method.name;
						const levelLearned = versionDetail.level_learned_at;

						if (!tempMapForGroup.has(moveUrl)) {
							tempMapForGroup.set(moveUrl, { moveName, learnMethods: [] });
						}
						// Add learn method specific to this group
						tempMapForGroup.get(moveUrl).learnMethods.push({
							method: learnMethod,
							level: levelLearned
						});
						break; // Found the target group for this move entry, move to next move entry
					}
				}
			}

			// If we found moves in this preferred group, use it and stop searching
			if (foundMovesInThisGroup) {
				actualVersionGroup = preferredGroup;
				// Copy the found moves to the final map
				tempMapForGroup.forEach((value, key) => {
					moveLearnInfoForGroup.set(key, value);
				});
				console.log(
					`[pokemonProcessor/${name}] Using best available version group: ${actualVersionGroup}`
				);
				break; // Exit the preferred group loop
			}
		}
	} // End if (pokeData.moves)

	// --- Process Moves based on Determined Group ---
	let levelUpMoves = [];
	let tmMoves = [];
	let eggMoves = [];
	let tutorMoves = [];

	if (!actualVersionGroup) {
		console.warn(
			`[pokemonProcessor/${name}] Could not find move data in any preferred version group.`
		);
	} else if (moveLearnInfoForGroup.size === 0) {
		console.warn(
			`[pokemonProcessor/${name}] Found version group ${actualVersionGroup} but move map is empty?`
		);
	} else {
		console.log(
			`[pokemonProcessor/${name}] Processing ${moveLearnInfoForGroup.size} moves for group ${actualVersionGroup}. Fetching details...`
		);

		// Fetch details for the moves found in the chosen group
		const urlsToFetch = Array.from(moveLearnInfoForGroup.keys());
		const moveDetailPromises = urlsToFetch.map((url) =>
			fetchFn(url)
				.then((res) =>
					res.ok ? res.json() : Promise.reject(new Error(`Failed move fetch: ${url}`))
				)
				.catch((err) => {
					console.warn(`[pokemonProcessor/${name}] ${err.message}`);
					return null;
				})
		);
		const moveDetails = await Promise.all(moveDetailPromises);
		console.log(
			`[pokemonProcessor/${name}] Fetched details for ${moveDetails.filter((d) => d !== null).length} moves.`
		);

		// Combine learn info with move details and categorize
		for (let i = 0; i < moveDetails.length; i++) {
			const detail = moveDetails[i];
			if (!detail) continue;

			const url = urlsToFetch[i];
			// learnMethods here only contains methods for the actualVersionGroup
			const { moveName, learnMethods } = moveLearnInfoForGroup.get(url);

			const moveInfo = {
				name: detail.name.replace('-', ' '),
				id: detail.id,
				type: detail.type.name,
				category: detail.damage_class.name,
				power: detail.power ?? null,
				accuracy: detail.accuracy ?? null,
				pp: detail.pp ?? null
			};

			for (const learnInfo of learnMethods) {
				const combinedMoveData = { ...moveInfo, level: learnInfo.level };
				switch (learnInfo.method) {
					case 'level-up':
						if (!levelUpMoves.some((m) => m.id === combinedMoveData.id))
							levelUpMoves.push(combinedMoveData);
						break;
					case 'machine':
						if (!tmMoves.some((m) => m.id === combinedMoveData.id)) tmMoves.push(combinedMoveData);
						break;
					case 'egg':
						if (!eggMoves.some((m) => m.id === combinedMoveData.id))
							eggMoves.push(combinedMoveData);
						break;
					case 'tutor':
						if (!tutorMoves.some((m) => m.id === combinedMoveData.id))
							tutorMoves.push(combinedMoveData);
						break;
				}
			}
		}

		// Sort the move lists
		levelUpMoves.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
		tmMoves.sort((a, b) => a.name.localeCompare(b.name));
		eggMoves.sort((a, b) => a.name.localeCompare(b.name));
		tutorMoves.sort((a, b) => a.name.localeCompare(b.name));
	}

	// --- Compile Final Result ---
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
		genus: genus,
		// Add the processed move lists and the version group they are from
		levelUpMoves: levelUpMoves,
		tmMoves: tmMoves,
		eggMoves: eggMoves,
		tutorMoves: tutorMoves,
		movesVersionGroup: actualVersionGroup // This will be the name like 'sword-shield' or null
	};
}
