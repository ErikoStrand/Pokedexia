<!-- src/routes/+page.svelte -->
<script>
	import PokemonCard from '$lib/components/PokemonCard.svelte';
	import FilterNavbar from '$lib/components/FilterNavbar.svelte'; // Import the new component
	import { triggerPrefetch } from '$lib/client/prefetch';
	import { pokedexFilters } from '$lib/stores'; // Import the filters store
	import { beforeNavigate, afterNavigate } from '$app/navigation'; // Import navigation hooks
	import { browser } from '$app/environment'; // To check for browser env

	let { data } = $props();

	// --- Scroll Position Management ---
	const SCROLL_STORAGE_KEY = 'pokedexScrollPos';
	let POKEDEX_PAGE_PATH = '/'; // Or your specific base path if not root

	beforeNavigate(({ from, to, cancel }) => {
		// Save scroll position when navigating *away* from the Pokédex list
		if (browser && from?.route.id === POKEDEX_PAGE_PATH && to?.route.id !== POKEDEX_PAGE_PATH) {
			console.log(
				`[beforeNavigate] Saving scroll position from ${from.route.id}: ${window.scrollY}`
			);
			sessionStorage.setItem(SCROLL_STORAGE_KEY, window.scrollY.toString());
		}
	});

	afterNavigate(({ from, to }) => {
		// Restore scroll position when navigating *back* to the Pokédex list
		if (browser && to?.route.id === POKEDEX_PAGE_PATH && from?.route.id !== POKEDEX_PAGE_PATH) {
			const savedScrollPos = sessionStorage.getItem(SCROLL_STORAGE_KEY);
			if (savedScrollPos) {
				const scrollY = parseInt(savedScrollPos, 10);
				console.log(`[afterNavigate] Restoring scroll position to ${scrollY}`);
				// Use timeout or rAF to ensure DOM is ready
				setTimeout(() => {
					window.scrollTo({ top: scrollY, behavior: 'auto' }); // Use 'auto' for instant jump
					sessionStorage.removeItem(SCROLL_STORAGE_KEY); // Clean up after restoring
				}, 0);
			}
		}
	});

	// --- Filtering Logic (now uses the store) ---
	// No local $state needed for filters

	// Derived value now depends on the EXTERNAL store ($pokedexFilters)
	let filteredPokemon = $derived(
		(data.allPokemon || []).filter((pokemon) => {
			const filters = $pokedexFilters; // Get current store value
			const generationMatch =
				filters.generation === 'all' || pokemon.generation === filters.generation;
			const typeMatch = filters.type === 'all' || pokemon.types.includes(filters.type);
			return generationMatch && typeMatch;
		})
	);

	// Reset function is now handled within FilterNavbar

	// Effect for filter logging (optional)
	$effect(() => {
		console.log(
			`Filters store updated - Gen: ${$pokedexFilters.generation}, Type: ${$pokedexFilters.type}`
		);
	});
</script>

<svelte:head>
	<title>SvelteKit Pokédex (Persistent Filters)</title>
	<meta
		name="description"
		content="A Pokédex built with SvelteKit, persistent filters, and scroll restoration"
	/>
</svelte:head>

<div class="container">
	<h1>SvelteKit Pokédex</h1>

	{#if data.allPokemon}
		<!-- Use the FilterNavbar component -->
		<FilterNavbar generations={data.generations} types={data.types} />

		<!-- Pokedex Grid - No sticky controls div needed here anymore -->
		{#if filteredPokemon.length === 0 && ($pokedexFilters.generation !== 'all' || $pokedexFilters.type !== 'all')}
			<p class="no-results">No Pokémon match the selected filters.</p>
		{:else if data.allPokemon.length === 0}
			<p class="no-results">No Pokémon data available.</p>
		{/if}

		<div id="pokedex">
			<!-- Hover/Focus trigger remains -->
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
		<p class="error-message">Could not load Pokémon data. Please try again later.</p>
	{/if}
</div>

<style>
	/* Remove styles related to the old .controls div */

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
