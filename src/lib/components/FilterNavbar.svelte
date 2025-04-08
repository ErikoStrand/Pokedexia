<!-- src/lib/components/FilterNavbar.svelte -->
<script>
	import { pokedexFilters } from '$lib/stores'; // Import the shared store

	// Props passed from the parent page
	let { generations = [], types = [] } = $props();

	function resetFilters() {
		// Update the store, components subscribed will react
		pokedexFilters.update((state) => ({
			...state, // Keep other potential state properties if added later
			generation: 'all',
			type: 'all'
		}));
	}

	// No local $state needed for filters anymore
</script>

<div class="controls-wrapper">
	<div class="controls">
		<div>
			<label for="generation-filter">Generation:</label>
			<!-- Bind directly to the store's value -->
			<select id="generation-filter" bind:value={$pokedexFilters.generation}>
				<option value="all">All</option>
				{#each generations as gen}
					<option value={gen}>
						{gen.replace('generation-', 'Gen ').toUpperCase()}
					</option>
				{/each}
			</select>
		</div>
		<div>
			<label for="type-filter">Type:</label>
			<!-- Bind directly to the store's value -->
			<select id="type-filter" bind:value={$pokedexFilters.type}>
				<option value="all">All</option>
				{#each types as type}
					<option value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
				{/each}
			</select>
		</div>
		<button on:click={resetFilters}>Reset</button>
	</div>
</div>

<style>
	.controls-wrapper {
		position: sticky;
		/* Stick below the main header (adjust 60px if header height changes) */
		top: 60px;
		z-index: 100; /* Below main header's z-index */
		background-color: #ffffff; /* Match controls background */
		padding-block: 10px; /* Add some padding top/bottom for spacing */
		margin-bottom: 20px; /* Space below the bar */
		/* Optional: Add a subtle shadow or border */
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
		border-bottom: 1px solid #eee;
	}

	.controls {
		/* --- Styles moved from +page.svelte --- */
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center; /* Align items vertically */
		gap: 15px;
		/* Remove margin/padding specific to being inline in the page */
		max-width: 1200px; /* Match page container width potentially */
		margin-inline: auto; /* Center within the wrapper */
		padding-inline: 15px; /* Horizontal padding */
	}

	.controls label {
		font-weight: bold;
		margin-right: 5px;
		color: #555;
		display: block; /* Ensure label is above select on small screens */
		margin-bottom: 3px;
		font-size: 0.9em;
	}

	.controls select,
	.controls button {
		padding: 8px 12px;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 0.95em; /* Slightly smaller */
		cursor: pointer;
		background-color: #fff;
		transition: border-color 0.2s ease;
		vertical-align: middle; /* Align selects/button nicely */
	}

	.controls select:hover,
	.controls button:hover {
		border-color: #aaa;
	}
	.controls select:focus,
	.controls button:focus {
		outline: 2px solid #3b4cca;
		border-color: transparent;
	}

	.controls button {
		background-color: #ffcb05;
		color: #3b4cca;
		font-weight: bold;
		border: none;
		margin-top: auto; /* Align button nicely if labels wrap */
		height: fit-content; /* Match select height more closely */
	}
	.controls button:hover {
		background-color: #e6b804;
	}

	@media (max-width: 450px) {
		.controls {
			gap: 10px;
		}
		.controls > div {
			flex-basis: 45%; /* Two selects per row roughly */
		}
		.controls button {
			flex-basis: 100%; /* Button takes full width */
			margin-top: 10px;
		}
		.controls label {
			font-size: 0.8em;
		}
		.controls select,
		.controls button {
			font-size: 0.9em;
			width: 100%; /* Make selects take full width of their container */
		}
	}
</style>
