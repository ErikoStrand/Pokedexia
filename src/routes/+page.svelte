<!-- src/routes/+page.svelte -->
<script>
	import PokemonCard from '$lib/components/PokemonCard.svelte'; // Use your correct path

	// Data comes directly from +page.server.js load function
	let { data } = $props();

	// State for client-side filtering remains the same
	let selectedGeneration = $state('all');
	let selectedType = $state('all');

	// Derived value for filtering remains the same
	let filteredPokemon = $derived(
		(data.allPokemon || []).filter((pokemon) => {
			const generationMatch =
				selectedGeneration === 'all' || pokemon.generation === selectedGeneration;
			const typeMatch = selectedType === 'all' || pokemon.types.includes(selectedType);
			return generationMatch && typeMatch;
		})
	);

	function resetFilters() {
		selectedGeneration = 'all';
		selectedType = 'all';
	}

	// $effect for filter logging (optional)
	$effect(() => {
		console.log(`Filters updated - Gen: ${selectedGeneration}, Type: ${selectedType}`);
	});
</script>

<svelte:head>
	<title>SvelteKit Pokédex (DB Cache)</title>
	<meta name="description" content="A Pokédex built with SvelteKit and SQLite Caching" />
</svelte:head>

<div class="container">
	<h1>SvelteKit Pokédex (DB Cache)</h1>

	<!-- SvelteKit's error page will handle errors thrown from load -->
	<!-- Display controls and data if data.allPokemon exists -->
	{#if data.allPokemon}
		<div class="controls">
			<div>
				<label for="generation-filter">Generation:</label>
				<select id="generation-filter" bind:value={selectedGeneration}>
					<option value="all">All</option>
					{#each data.generations as gen}
						<option value={gen}>
							{gen.replace('generation-', 'Gen ').toUpperCase()}
						</option>
					{/each}
				</select>
			</div>
			<div>
				<label for="type-filter">Type:</label>
				<select id="type-filter" bind:value={selectedType}>
					<option value="all">All</option>
					{#each data.types as type}
						<option value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
					{/each}
				</select>
			</div>
			<button onclick={resetFilters}>Reset</button>
		</div>

		{#if filteredPokemon.length === 0 && (selectedGeneration !== 'all' || selectedType !== 'all')}
			<p class="no-results">No Pokémon match the selected filters.</p>
		{:else if data.allPokemon.length === 0}
			<p class="no-results">No Pokémon data available.</p>
			<!-- If API fetch somehow returned nothing -->
		{/if}

		<div id="pokedex">
			{#each filteredPokemon as pokemon (pokemon.id)}
				<PokemonCard {pokemon} />
			{/each}
		</div>
	{:else}
		<!-- This part should ideally not be reached if load throws errors correctly,
             but serves as a fallback message if data is unexpectedly missing -->
		<p class="error-message">Could not load Pokémon data. Please try again later.</p>
	{/if}
</div>

<style>
	/* --- Global/Page Styles (can also go in app.css or +layout.svelte) --- */
	:global(body) {
		/* Use :global for body styles from within a component */
		font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
		background-color: #f0f0f0;
		color: #333;
		line-height: 1.6;
		margin: 0; /* Remove default body margin */
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 20px;
	}

	h1 {
		text-align: center;
		color: #e3350d; /* Pokemon Red */
		margin-bottom: 20px;
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

	/* Controls Area */
	.controls {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 15px;
		margin-bottom: 30px;
		padding: 15px;
		background-color: #fff;
		border-radius: 8px;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
	}

	.controls label {
		font-weight: bold;
		margin-right: 5px;
		color: #555;
	}

	.controls select,
	.controls button {
		padding: 8px 12px;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 1em;
		cursor: pointer;
		background-color: #fff;
		transition: border-color 0.2s ease;
	}

	.controls select:hover,
	.controls button:hover {
		border-color: #aaa;
	}

	.controls select:focus,
	.controls button:focus {
		outline: 2px solid #3b4cca; /* Pokemon Blue outline */
		border-color: transparent;
	}

	.controls button {
		background-color: #ffcb05; /* Pokemon Yellow */
		color: #3b4cca;
		font-weight: bold;
		border: none;
	}
	.controls button:hover {
		background-color: #e6b804;
	}

	/* Pokédex Grid */
	#pokedex {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); /* Slightly wider minmax */
		gap: 20px;
		padding: 10px 0;
	}
</style>
