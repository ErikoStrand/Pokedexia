<!-- src/lib/components/PokemonCard.svelte -->
<script>
	import { typeColors } from '$lib/pokemonUtils'; // Use your correct import path
	// Import the updated store
	import { prefetchedPokemon } from '$lib/stores.js';

	let { pokemon } = $props();
	let primaryType = $derived(pokemon.types[0] || 'normal');
	let primaryColor = $derived(typeColors[primaryType] || '#A8A77A');

	// Derive the prefetch status for *this specific* pokemon
	let prefetchState = $derived(
		$prefetchedPokemon.get(pokemon.name.toLowerCase()) || { status: 'idle' }
	);

	function handleImageError(event) {
		console.warn(`Failed to load image: ${event.target.src}. Using placeholder.`);
		event.target.src = '/placeholder.png';
	}
</script>

<!-- Wrap card content in an anchor tag -->
<!-- The parent div in +page.svelte handles hover/focus -->
<a href="/pokemon/{pokemon.name}" class="card-link">
	<div class="pokemon-card" style="border-color: {primaryColor}; position: relative;">
		<!-- ID Badge is now a SIBLING to content and overlay -->
		<div class="pokemon-id-badge">
			#{String(pokemon.id).padStart(3, '0')}
		</div>

		<!-- Main Card Content -->
		<div
			class="card-content"
			class:overlay-active={prefetchState.status === 'pending' || prefetchState.status === 'error'}
		>
			<!-- Badge is REMOVED from here -->
			<div class="img-wrapper">
				<img
					src={pokemon.sprite}
					alt="Sprite of {pokemon.name}"
					loading="lazy"
					onerror={handleImageError}
				/>
			</div>
			<h2 style="color: {primaryColor};">{pokemon.name}</h2>
			<div class="types">
				{#each pokemon.types as type}
					<span class="type-badge type-{type}">{type}</span>
				{/each}
			</div>
			<div class="stats">
				{#each pokemon.stats as stat}
					<div class="stat-row">
						<span>{stat.name}</span>
						<span>{stat.base_stat}</span>
					</div>
				{/each}
			</div>
		</div>
		<!-- End card-content -->

		<!-- Loading/Error Overlay -->
		{#if prefetchState.status === 'pending' || prefetchState.status === 'error'}
			<div class="prefetch-overlay">
				{#if prefetchState.status === 'pending'}
					<div class="spinner" title="Loading details..."></div>
				{:else if prefetchState.status === 'error'}
					<div
						class="error-indicator"
						title="Failed to load details: {prefetchState.error || 'Unknown error'}"
					>
						!
					</div>
				{/if}
			</div>
		{/if}
	</div>
</a>

<style>
	/* Reset anchor default styles */
	.card-link {
		text-decoration: none;
		color: inherit;
		display: block;
	}
	.card-link:focus-visible {
		outline: 2px solid var(--pokemon-color, #3b4cca);
		outline-offset: 2px;
		border-radius: 10px;
	}

	.pokemon-card {
		background-color: #fff;
		border-radius: 10px;
		border: 4px solid #ccc;
		padding: 20px 15px 15px 15px;
		text-align: center;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
		position: relative;
		/* Ensure overflow allows the badge to be seen */
		overflow: visible;
	}
	.pokemon-card:hover {
		transform: translateY(-5px);
		box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
	}

	/* ID Badge Styles */
	.pokemon-id-badge {
		position: absolute;
		top: -12px; /* Position it correctly */
		right: 10px;
		background-color: rgba(0, 0, 0, 0.7); /* Slightly darker for visibility */
		color: white;
		font-size: 0.8rem;
		font-weight: bold;
		padding: 3px 8px;
		border-radius: 10px;
		/* Ensure badge is above the overlay AND the dimmed content */
		z-index: 4;
	}

	.card-content {
		transition:
			opacity 0.3s ease,
			filter 0.3s ease;
		/* Content is now naturally below the absolute badge */
	}

	.card-content.overlay-active {
		opacity: 0.6;
		filter: blur(1px);
	}

	/* --- Card inner styles (Image, Name, Types, Stats) --- */
	.img-wrapper {
		width: 120px;
		height: 120px;
		background-color: #f1f1f1;
		border-radius: 50%;
		margin: 15px auto 10px auto;
		display: flex;
		justify-content: center;
		align-items: center;
		overflow: hidden;
	}
	.img-wrapper img {
		width: 90%;
		height: 90%;
		object-fit: contain;
		image-rendering: pixelated;
		image-rendering: -moz-crisp-edges;
		image-rendering: crisp-edges;
	}
	h2 {
		margin-block: 10px 15px;
		font-size: 1.5rem;
		font-weight: 600;
		text-transform: capitalize;
		color: #333;
	}
	.types {
		margin-bottom: 20px;
		display: flex;
		justify-content: center;
		gap: 8px;
		flex-wrap: wrap;
	}
	.type-badge {
		display: inline-block;
		padding: 4px 14px;
		border-radius: 15px;
		font-size: 0.75rem;
		color: #fff;
		text-transform: uppercase;
		font-weight: bold;
		letter-spacing: 0.5px;
		text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.3);
	}
	.stats {
		font-size: 0.9rem;
		text-align: left;
		padding-top: 10px;
		margin-top: 15px;
		border-top: 1px dashed #e0e0e0;
	}
	.stat-row {
		display: flex;
		justify-content: space-between;
		margin-bottom: 6px;
		padding-inline: 5px;
	}
	.stat-row span:first-child {
		color: #555;
		font-weight: 500;
	}
	.stat-row span:last-child {
		color: #222;
		font-weight: 600;
	}

	/* Type Colors */
	.type-normal {
		background-color: #a8a77a;
	}
	.type-fire {
		background-color: #ee8130;
	}
	.type-water {
		background-color: #6390f0;
	}
	.type-electric {
		background-color: #f7d02c;
	}
	.type-grass {
		background-color: #7ac74c;
	}
	.type-ice {
		background-color: #96d9d6;
	}
	.type-fighting {
		background-color: #c22e28;
	}
	.type-poison {
		background-color: #a33ea1;
	}
	.type-ground {
		background-color: #e2bf65;
	}
	.type-flying {
		background-color: #a98ff3;
	}
	.type-psychic {
		background-color: #f95587;
	}
	.type-bug {
		background-color: #a6b91a;
	}
	.type-rock {
		background-color: #b6a136;
	}
	.type-ghost {
		background-color: #735797;
	}
	.type-dragon {
		background-color: #6f35fc;
	}
	.type-dark {
		background-color: #705746;
	}
	.type-steel {
		background-color: #b7b7ce;
	}
	.type-fairy {
		background-color: #d685ad;
	}

	/* --- Prefetch Overlay Styles --- */
	.prefetch-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(255, 255, 255, 0.5);
		display: flex;
		justify-content: center;
		align-items: center;
		/* Overlay sits below the badge */
		z-index: 3;
		pointer-events: none;
		border-radius: 6px; /* Match inner card rounding slightly */
	}
	.spinner {
		border: 4px solid rgba(0, 0, 0, 0.1);
		width: 36px;
		height: 36px;
		border-radius: 50%;
		border-left-color: var(--pokemon-color, #3b4cca);
		animation: spin 1s ease infinite;
	}
	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
	.error-indicator {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background-color: #e53e3e;
		color: white;
		font-size: 1.8rem;
		font-weight: bold;
		display: flex;
		justify-content: center;
		align-items: center;
		line-height: 1;
		cursor: help;
	}
</style>
