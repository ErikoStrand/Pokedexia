<!-- src/routes/team-generator/+page.svelte -->
<script>
	import PokemonCard from '$lib/components/PokemonCard.svelte';

	let { data } = $props();
	const { allPokemon } = data; // Get the full list loaded by +page.server.js

	let generatedTeam = $state([]); // Array to hold the 6 Pokémon objects
	let isLoading = $state(false); // To disable button during generation

	// Simple shuffle function (Fisher-Yates)
	function shuffleArray(array) {
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[array[i], array[j]] = [array[j], array[i]]; // Swap elements
		}
		return array;
	}

	function generateRandomTeam() {
		if (!allPokemon || allPokemon.length < 6) {
			console.error('Not enough Pokémon data loaded to generate a team.');
			// TODO: Show user feedback
			return;
		}
		isLoading = true;
		console.log('Generating random team...');

		// Shuffle a copy of the array and take the first 6
		const shuffled = shuffleArray([...allPokemon]);
		generatedTeam = shuffled.slice(0, 6);

		// Simulate a short delay if needed, or remove if generation is instant
		setTimeout(() => {
			isLoading = false;
			console.log(
				'Team generated:',
				generatedTeam.map((p) => p.name)
			);
		}, 100); // Small delay mainly for visual feedback if desired
	}

	// Optional: Generate a team on initial load
	// $effect(() => {
	//     if (allPokemon?.length > 0 && generatedTeam.length === 0) {
	//          generateRandomTeam();
	//     }
	// });
</script>

<svelte:head>
	<title>Team Generator | Pokédexia</title>
	<meta name="description" content="Generate random Pokémon teams." />
</svelte:head>

<div class="page-container">
	<h1>Team Generator</h1>
	<p class="description">
		Generate a random team of six Pokémon! Click the button below to start.
		<br />
		<em>(Note: Advanced generation based on playstyle/opponents is planned for the future!)</em>
	</p>

	<div class="controls">
		<button on:click={generateRandomTeam} disabled={isLoading}>
			{#if isLoading}
				Generating...
			{:else}
				✨ Generate Random Team ✨
			{/if}
		</button>
	</div>

	{#if generatedTeam.length > 0}
		<h2>Generated Team:</h2>
		<div class="team-display">
			{#each generatedTeam as pokemon (pokemon.id)}
				<PokemonCard {pokemon} />
			{/each}
		</div>
	{:else if !isLoading}
		<p class="no-team">Click the button above to generate your first team!</p>
	{/if}
</div>

<style>
	.page-container {
		max-width: 1200px;
		margin: 20px auto; /* Add top margin now that header is sticky */
		padding: 0 20px 20px 20px;
	}

	h1 {
		text-align: center;
		color: #3b4cca; /* Pokemon Blue */
		margin-block: 20px 15px;
	}

	.description {
		text-align: center;
		color: #555;
		margin-bottom: 30px;
		line-height: 1.7;
	}
	.description em {
		font-size: 0.9em;
		color: #777;
	}

	.controls {
		text-align: center;
		margin-bottom: 40px;
	}

	.controls button {
		padding: 12px 25px;
		font-size: 1.1rem;
		font-weight: bold;
		cursor: pointer;
		border: none;
		border-radius: 8px;
		background-color: #ffcb05; /* Pokemon Yellow */
		color: #3b4cca; /* Pokemon Blue */
		transition:
			background-color 0.2s ease,
			transform 0.1s ease;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
	}
	.controls button:hover:not(:disabled) {
		background-color: #e6b804;
	}
	.controls button:active:not(:disabled) {
		transform: scale(0.98);
	}
	.controls button:disabled {
		background-color: #ccc;
		color: #777;
		cursor: not-allowed;
	}

	h2 {
		text-align: center;
		margin-bottom: 20px;
		color: #444;
	}

	.team-display {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 20px;
	}

	.no-team {
		text-align: center;
		font-size: 1.1em;
		color: #777;
		margin-top: 40px;
	}
</style>
