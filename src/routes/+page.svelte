<!-- src/routes/+page.svelte -->
<script>
	import PokemonCard from '$lib/components/PokemonCard.svelte';
	import FilterNavbar from '$lib/components/FilterNavbar.svelte'; // Filter bar is specific to this page
	import { triggerPrefetch } from '$lib/client/prefetch';
	import { pokedexFilters } from '$lib/stores';
	import { beforeNavigate, afterNavigate } from '$app/navigation';
	import { browser } from '$app/environment';

	let { data } = $props();

	// --- Scroll Position Management ---
	const SCROLL_STORAGE_KEY = 'pokedexScrollPos';
	let POKEDEX_PAGE_PATH = '/';

	beforeNavigate(({ from, to }) => {
		if (browser && from?.route.id === POKEDEX_PAGE_PATH && to?.route.id !== POKEDEX_PAGE_PATH) {
			console.log(
				`[beforeNavigate] Saving scroll position from ${from.route.id}: ${window.scrollY}`
			);
			sessionStorage.setItem(SCROLL_STORAGE_KEY, window.scrollY.toString());
		}
	});

	afterNavigate(({ from, to }) => {
		if (browser && to?.route.id === POKEDEX_PAGE_PATH && from?.route.id !== POKEDEX_PAGE_PATH) {
			const savedScrollPos = sessionStorage.getItem(SCROLL_STORAGE_KEY);
			if (savedScrollPos) {
				const scrollY = parseInt(savedScrollPos, 10);
				console.log(`[afterNavigate] Restoring scroll position to ${scrollY}`);
				setTimeout(() => {
					window.scrollTo({ top: scrollY, behavior: 'auto' });
					sessionStorage.removeItem(SCROLL_STORAGE_KEY);
				}, 0);
			}
		}
	});

	// --- Filtering Logic ---
	let filteredPokemon = $derived(
		(data.allPokemon || []).filter((pokemon) => {
			const filters = $pokedexFilters;
			const generationMatch =
				filters.generation === 'all' || pokemon.generation === filters.generation;
			const typeMatch = filters.type === 'all' || pokemon.types.includes(filters.type);
			return generationMatch && typeMatch;
		})
	);

	$effect(() => {
		console.log(
			`Filters store updated - Gen: ${$pokedexFilters.generation}, Type: ${$pokedexFilters.type}`
		);
	});
</script>

<svelte:head>
	<title>Pokédex | Pokédexia</title>
	<meta name="description" content="Browse all Pokémon" />
</svelte:head>

<!-- Container for this specific page's content -->
<div class="page-container">
	{#if data.allPokemon}
		<!-- Filter bar remains specific to this page -->
		<FilterNavbar generations={data.generations} types={data.types} />

		<!-- Pokedex Grid -->
		{#if filteredPokemon.length === 0 && ($pokedexFilters.generation !== 'all' || $pokedexFilters.type !== 'all')}
			<p class="no-results">No Pokémon match the selected filters.</p>
		{:else if data.allPokemon.length === 0}
			<p class="no-results">No Pokémon data available.</p>
		{/if}

		<div id="pokedex">
			{#each filteredPokemon as pokemon (pokemon.id)}
				<div
					onpointerenter={() => triggerPrefetch(pokemon.name)}
					onfocusin={() => triggerPrefetch(pokemon.name)}
				>
					<PokemonCard {pokemon} />
				</div>
			{/each}
		</div>
	{:else}
		<!-- Error/Loading state handled by SvelteKit or can be added if needed -->
		<p class="error-message">
			Could not load Pokémon data. Please check the console or try again later.
		</p>
	{/if}
</div>

<style>
	/* Styles specific to the Pokédex page layout */
	.page-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 20px 20px 20px; /* Horizontal and bottom padding */
	}

	/* H1 is optional here as layout could provide it, or keep it per-page */
	/* h1 { text-align: center; color: #e3350d; margin-block: 20px 15px; text-transform: uppercase; letter-spacing: 2px; } */

	.error-message {
		color: red;
		text-align: center;
		font-size: 1.2em;
		padding: 20px;
		background-color: #ffebee;
		border: 1px solid red;
		border-radius: 5px;
		margin-top: 20px;
	}
	.no-results {
		text-align: center;
		font-size: 1.1em;
		color: #555;
		padding: 20px;
		margin-top: 20px;
	}

	#pokedex {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 20px;
		padding-top: 0;
	}
	:global(body) {
		font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
		background-color: #f0f0f0;
		color: #333;
		line-height: 1.6;
		margin: 0;
	}
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 20px 20px 20px; /* Remove top padding, handled by navbar wrapper */
	}
	h1 {
		text-align: center;
		color: #e3350d;
		margin-block: 20px 15px;
		text-transform: uppercase;
		letter-spacing: 2px;
	}
	.error-message {
		color: red;
		text-align: center;
		font-size: 1.2em;
		padding: 20px;
		background-color: #ffebee;
		border: 1px solid red;
		border-radius: 5px;
	}
	.no-results {
		text-align: center;
		font-size: 1.1em;
		color: #555;
		padding: 20px;
		margin-top: 20px;
	}

	#pokedex {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 20px;
		padding-top: 0; /* No extra padding needed */
	}
</style>
