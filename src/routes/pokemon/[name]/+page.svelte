<!-- src/routes/pokemon/[name]/+page.svelte -->
<script>
	import { typeColors } from '$lib/pokemonUtils'; // Adjust path if needed

	let { data } = $props();
	const { pokemon } = data; // Destructure for easier access

	// Reactive state for potentially toggling sprites (example)
	let showShiny = $state(false);
	let currentSprite = $derived(
		showShiny && pokemon.spriteShiny ? pokemon.spriteShiny : pokemon.spriteHome || pokemon.sprite
	);

	function handleImageError(event) {
		console.warn(`Failed to load image: ${event.target.src}. Trying fallback...`);
		// Fallback logic if needed, e.g., try the basic sprite
		if (event.target.src !== pokemon.sprite) {
			event.target.src = pokemon.sprite;
		} else {
			event.target.src = '/placeholder.png'; // Ultimate fallback
		}
	}
</script>

<svelte:head>
	<title>{pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)} - Pokédex</title>
	<meta name="description" content="Details for Pokémon {pokemon.name}" />
</svelte:head>

<div class="pokemon-detail-container" style="--pokemon-color: {pokemon.primaryColor};">
	<a href="/" class="back-link">« Back to Pokédex</a>

	<h1 class="pokemon-name">{pokemon.name}</h1>
	<span class="pokemon-id">#{String(pokemon.id).padStart(3, '0')}</span>
	{#if pokemon.genus}<p class="pokemon-genus">{pokemon.genus}</p>{/if}

	<div class="content-grid">
		<!-- Left Column: Sprites & Basic Info -->
		<div class="left-column">
			<div class="sprite-container">
				<img
					src={currentSprite}
					alt="{pokemon.name} {showShiny ? 'Shiny' : 'Official'} Artwork"
					class="main-sprite"
					onerror={handleImageError}
				/>
				{#if pokemon.spriteShiny}
					<button
						class="shiny-toggle"
						onclick={() => (showShiny = !showShiny)}
						class:active={showShiny}
						aria-pressed={showShiny}
						title="Toggle Shiny">✨</button
					>
				{/if}
			</div>

			<div class="types detail-types">
				{#each pokemon.types as type}
					<span class="type-badge type-{type}">{type}</span>
				{/each}
			</div>

			<p class="flavor-text">{pokemon.flavorText}</p>

			<div class="physical-info">
				<div><strong>Height:</strong> {pokemon.height} m</div>
				<div><strong>Weight:</strong> {pokemon.weight} kg</div>
			</div>

			<div class="abilities">
				<h3>Abilities</h3>
				<ul>
					{#each pokemon.abilities as ability}
						<li class:hidden-ability={ability.isHidden}>
							{ability.name.replace(/\b\w/g, (l) => l.toUpperCase())}
							{#if ability.isHidden}(Hidden Ability){/if}
						</li>
					{/each}
				</ul>
			</div>
		</div>

		<!-- Right Column: Stats -->
		<div class="right-column">
			<h3>Base Stats</h3>
			<div class="stats-list">
				{#each pokemon.stats as stat (stat.name)}
					<div class="stat-item">
						<span class="stat-name">{stat.name}</span>
						<span class="stat-value">{stat.base_stat}</span>
						<!-- Optional: Stat bar -->
						<div class="stat-bar-container">
							<div
								class="stat-bar"
								style="width: {Math.min(
									100,
									(stat.base_stat / 200) * 100
								)}%; background-color: var(--pokemon-color);"
							></div>
						</div>
					</div>
				{/each}
			</div>
			<!-- Placeholder for future content like evolutions, moves etc. -->
			<!-- <h3>Evolutions</h3> -->
			<!-- <p>(Evolution chain coming soon...)</p> -->
		</div>
	</div>
</div>

<style>
	.pokemon-detail-container {
		max-width: 900px;
		margin: 20px auto;
		padding: 25px;
		background-color: #fff;
		border-radius: 15px;
		border-top: 10px solid var(--pokemon-color, #ddd);
		box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
		position: relative; /* For potential absolute elements */
	}

	.back-link {
		display: inline-block;
		margin-bottom: 20px;
		color: var(--pokemon-color, #555);
		text-decoration: none;
		font-weight: 600;
		transition: color 0.2s;
	}
	.back-link:hover {
		color: #333;
	}

	.pokemon-name {
		text-transform: capitalize;
		font-size: 2.8rem;
		margin-bottom: 0;
		color: #333;
		line-height: 1.1;
	}
	.pokemon-id {
		font-size: 1.2rem;
		color: #888;
		display: block;
		margin-bottom: 5px;
	}
	.pokemon-genus {
		font-style: italic;
		color: #666;
		margin-bottom: 20px;
	}

	.content-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 30px;
		margin-top: 20px;
	}

	.sprite-container {
		background-color: #f8f8f8;
		border-radius: 10px;
		padding: 20px;
		display: flex;
		justify-content: center;
		align-items: center;
		margin-bottom: 20px;
		position: relative;
	}
	.main-sprite {
		max-width: 100%;
		height: auto;
		max-height: 300px;
		object-fit: contain;
	}
	.shiny-toggle {
		position: absolute;
		top: 10px;
		right: 10px;
		background: none;
		border: 2px solid transparent;
		border-radius: 50%;
		padding: 5px;
		font-size: 1.5rem;
		cursor: pointer;
		transition:
			transform 0.2s ease,
			border-color 0.2s;
	}
	.shiny-toggle:hover {
		transform: scale(1.1);
	}
	.shiny-toggle.active {
		border-color: gold;
		background-color: rgba(255, 215, 0, 0.2);
	}

	.detail-types {
		justify-content: start;
		margin-bottom: 20px;
	}
	/* Inherit type badge styles or redefine if needed */
	.types {
		margin-bottom: 15px;
		display: flex;
		justify-content: center;
		gap: 8px;
		flex-wrap: wrap;
	}
	.type-badge {
		display: inline-block;
		padding: 4px 14px;
		border-radius: 15px;
		font-size: 0.8rem;
		color: #fff;
		text-transform: uppercase;
		font-weight: bold;
		letter-spacing: 0.5px;
	}
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

	.flavor-text {
		font-size: 1rem;
		color: #555;
		margin-bottom: 20px;
		line-height: 1.6;
	}

	.physical-info,
	.abilities {
		margin-bottom: 20px;
		background-color: #fdfdfd;
		padding: 15px;
		border-radius: 8px;
		border: 1px solid #eee;
	}
	.physical-info div {
		margin-bottom: 5px;
	}
	.abilities h3 {
		margin-top: 0;
		margin-bottom: 10px;
		font-size: 1.2rem;
		color: #444;
	}
	.abilities ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	.abilities li {
		margin-bottom: 5px;
		text-transform: capitalize;
		color: #555;
	}
	.abilities li.hidden-ability {
		font-style: italic;
		color: #777;
	}

	.right-column h3 {
		margin-top: 0;
		margin-bottom: 15px;
		font-size: 1.4rem;
		color: #444;
		border-bottom: 2px solid var(--pokemon-color, #eee);
		padding-bottom: 5px;
	}
	.stats-list {
		display: grid;
		gap: 10px;
	}
	.stat-item {
		display: grid;
		grid-template-columns: 80px 40px 1fr; /* Name | Value | Bar */
		align-items: center;
		gap: 10px;
		font-size: 0.95rem;
	}
	.stat-name {
		color: #555;
		font-weight: 500;
	}
	.stat-value {
		font-weight: 700;
		color: #333;
		text-align: right;
	}
	.stat-bar-container {
		background-color: #e0e0e0;
		border-radius: 5px;
		overflow: hidden;
		height: 12px; /* Height of the bar */
	}
	.stat-bar {
		height: 100%;
		border-radius: 5px;
		/* background-color is set inline via style */
		transition: width 0.5s ease-out; /* Animate bar width */
	}

	/* Basic Responsive Adjustments */
	@media (max-width: 650px) {
		.pokemon-name {
			font-size: 2rem;
		}
		.content-grid {
			grid-template-columns: 1fr;
		} /* Stack columns */
		.stat-item {
			grid-template-columns: 70px 35px 1fr;
		} /* Adjust stat grid */
	}
</style>
