<!-- src/lib/components/PokemonCard.svelte -->
<script>
	// ... (keep existing script content: import, props, derived vars, handleImageError)
	import { typeColors } from '$lib/pokemonUtils'; // Use your correct import path

	let { pokemon } = $props();
	let primaryType = $derived(pokemon.types[0] || 'normal');
	let primaryColor = $derived(typeColors[primaryType] || '#A8A77A');
	function handleImageError(event) {
		/* ... */
	}
</script>

<!-- Wrap card content in an anchor tag -->
<a href="/pokemon/{pokemon.name}" class="card-link">
	<div class="pokemon-card" style="border-color: {primaryColor};">
		<div class="pokemon-id-badge">
			#{String(pokemon.id).padStart(3, '0')}
		</div>
		<div class="img-wrapper">
			<img
				src={pokemon.sprite}
				alt="Sprite of {pokemon.name}"
				loading="lazy"
				on:error={handleImageError}
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
</a>

<style>
	/* Reset anchor default styles */
	.card-link {
		text-decoration: none;
		color: inherit; /* Inherit color from parent */
		display: block; /* Make the link take up the block space */
		height: 100%; /* Make link fill the grid cell height */
	}
	.card-link:focus-visible {
		outline: 2px solid var(--pokemon-color, #3b4cca); /* Accessibility outline */
		outline-offset: 2px;
		border-radius: 10px; /* Match card radius */
	}

	/* --- KEEP ALL PREVIOUS .pokemon-card styles below --- */
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
		overflow: visible;
		height: 100%; /* Ensure card fills the link height */
		display: flex; /* Use flexbox for better internal alignment */
		flex-direction: column; /* Stack elements vertically */
		justify-content: space-between; /* Distribute space */
	}

	.pokemon-card:hover {
		transform: translateY(-5px);
		box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
	}

	/* --- ID Badge --- */
	.pokemon-id-badge {
		position: absolute;
		top: -12px; /* Position overlapping the top border */
		right: 10px;
		background-color: rgba(0, 0, 0, 0.6); /* Dark semi-transparent background */
		color: white;
		font-size: 0.8rem;
		font-weight: bold;
		padding: 3px 8px;
		border-radius: 10px; /* Pill shape */
		z-index: 1; /* Ensure it's above the card content */
	}

	/* --- Image Wrapper --- */
	.img-wrapper {
		width: 120px; /* Size of the circle */
		height: 120px;
		border: 3px solid #292929; /* Dark border */
		background-color: #f1f1f1; /* Light grey background */
		border-radius: 50%; /* Make it a circle */
		margin: 15px auto 10px auto; /* Center and space */
		display: flex;
		justify-content: center;
		align-items: center;
		overflow: hidden; /* Hide parts of image outside circle */
	}

	/* --- Image --- */
	.img-wrapper img {
		width: 90%; /* Image size within the circle */
		height: 90%;
		object-fit: contain;
		image-rendering: pixelated;
		image-rendering: -moz-crisp-edges;
		image-rendering: crisp-edges;
	}

	/* --- Name --- */
	h2 {
		margin-block: 10px 15px; /* Vertical spacing */
		font-size: 1.5rem; /* Larger name */
		font-weight: 600; /* Bolder */
		text-transform: capitalize;
		color: #333; /* Default color, overridden by inline style */
	}

	/* --- Types --- */
	.types {
		margin-bottom: 20px; /* Space before stats */
		display: flex;
		justify-content: center;
		gap: 8px;
		flex-wrap: wrap;
	}

	.type-badge {
		display: inline-block;
		padding: 4px 14px; /* Slightly larger badges */
		border-radius: 15px; /* More rounded */
		font-size: 0.75rem; /* Smaller font inside badge */
		color: #fff;
		text-transform: uppercase;
		font-weight: bold;
		letter-spacing: 0.5px;
		text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.3);
	}

	/* --- Stats Section --- */
	.stats {
		font-size: 0.9rem;
		text-align: left;
		padding-top: 10px;
		margin-top: 15px;
		border-top: 1px dashed #e0e0e0; /* Dashed line like image */
	}

	.stat-row {
		display: flex;
		justify-content: space-between; /* Pushes label left, value right */
		margin-bottom: 6px;
		padding-inline: 5px; /* Small horizontal padding */
	}

	/* Stat Label */
	.stat-row span:first-child {
		color: #555; /* Dark grey for label */
		font-weight: 500;
	}

	/* Stat Value */
	.stat-row span:last-child {
		color: #222; /* Black/very dark grey for value */
		font-weight: 600; /* Bold value */
	}

	/* --- Type Colors (copied for completeness, ensure they match utils/CSS) --- */
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
</style>
