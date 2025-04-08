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

	// Helper for formatting null values in tables
	function formatStat(value) {
		return value === null || value === undefined ? '—' : value;
	}

	// Helper to format the version group name for display
	function formatVersionGroup(groupName) {
		if (!groupName) return 'N/A';
		// Simple replace and capitalize
		return groupName.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
	}
</script>

<svelte:head>
	<title>{pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)} - Pokédex</title>
	<meta name="description" content="Details and moves for Pokémon {pokemon.name}" />
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

		<!-- Right Column: Stats & Moves -->
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

			<!-- === MOVES SECTION === -->
			<div class="moves-section">
				<!-- Display the actual version group used, or a message if none found -->
				<h2 class="moves-header">
					Moveset ({pokemon.movesVersionGroup
						? formatVersionGroup(pokemon.movesVersionGroup)
						: 'Unavailable'})
				</h2>

				<!-- Only show tables if a version group was found AND there are moves -->
				{#if pokemon.movesVersionGroup}
					<!-- Level Up Moves -->
					{#if pokemon.levelUpMoves && pokemon.levelUpMoves.length > 0}
						<div class="move-table-container">
							<h3>Moves learnt by level up</h3>
							<table class="move-table">
								<thead>
									<tr>
										<th class="col-level">Lv.</th>
										<th class="col-move">Move</th>
										<th class="col-type">Type</th>
										<th class="col-cat">Cat.</th>
										<th class="col-power">Power</th>
										<th class="col-acc">Acc.</th>
									</tr>
								</thead>
								<tbody>
									{#each pokemon.levelUpMoves as move (move.id)}
										<tr>
											<td class="col-level">{move.level}</td>
											<td class="col-move">{move.name.replace(/\b\w/g, (l) => l.toUpperCase())}</td>
											<td class="col-type"
												><span class="type-badge type-{move.type}">{move.type}</span></td
											>
											<td class="col-cat"
												><img
													src="/images/{move.category}.png"
													alt={move.category}
													title={move.category}
													class="cat-icon"
												/></td
											>
											<td class="col-power">{formatStat(move.power)}</td>
											<td class="col-acc">{formatStat(move.accuracy)}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{:else}
						<p class="no-moves-notice">No level-up moves found for this version.</p>
					{/if}

					<!-- TM Moves -->
					{#if pokemon.tmMoves && pokemon.tmMoves.length > 0}
						<div class="move-table-container">
							<h3>Moves learnt by TM</h3>
							<table class="move-table">
								<thead>
									<tr>
										<!-- Optional: Add TM# column if data available -->
										<th class="col-move">Move</th>
										<th class="col-type">Type</th>
										<th class="col-cat">Cat.</th>
										<th class="col-power">Power</th>
										<th class="col-acc">Acc.</th>
									</tr>
								</thead>
								<tbody>
									{#each pokemon.tmMoves as move (move.id)}
										<tr>
											<td class="col-move">{move.name.replace(/\b\w/g, (l) => l.toUpperCase())}</td>
											<td class="col-type"
												><span class="type-badge type-{move.type}">{move.type}</span></td
											>
											<td class="col-cat"
												><img
													src="/images/{move.category}.png"
													alt={move.category}
													title={move.category}
													class="cat-icon"
												/></td
											>
											<td class="col-power">{formatStat(move.power)}</td>
											<td class="col-acc">{formatStat(move.accuracy)}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{:else}
						<p class="no-moves-notice">No TM moves found for this version.</p>
					{/if}

					<!-- Egg Moves -->
					{#if pokemon.eggMoves && pokemon.eggMoves.length > 0}
						<div class="move-table-container">
							<h3>Egg moves</h3>
							<table class="move-table">
								<thead>
									<tr>
										<th class="col-move">Move</th>
										<th class="col-type">Type</th>
										<th class="col-cat">Cat.</th>
										<th class="col-power">Power</th>
										<th class="col-acc">Acc.</th>
									</tr>
								</thead>
								<tbody>
									{#each pokemon.eggMoves as move (move.id)}
										<tr>
											<td class="col-move">{move.name.replace(/\b\w/g, (l) => l.toUpperCase())}</td>
											<td class="col-type"
												><span class="type-badge type-{move.type}">{move.type}</span></td
											>
											<td class="col-cat"
												><img
													src="/images/{move.category}.png"
													alt={move.category}
													title={move.category}
													class="cat-icon"
												/></td
											>
											<td class="col-power">{formatStat(move.power)}</td>
											<td class="col-acc">{formatStat(move.accuracy)}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{:else}
						<p class="no-moves-notice">No egg moves found for this version.</p>
					{/if}

					<!-- Optional: Tutor Moves -->
					{#if pokemon.tutorMoves && pokemon.tutorMoves.length > 0}
						<div class="move-table-container">
							<h3>Moves learnt by tutor</h3>
							<table class="move-table">
								<thead>
									<tr>
										<th class="col-move">Move</th>
										<th class="col-type">Type</th>
										<th class="col-cat">Cat.</th>
										<th class="col-power">Power</th>
										<th class="col-acc">Acc.</th>
									</tr>
								</thead>
								<tbody>
									{#each pokemon.tutorMoves as move (move.id)}
										<tr>
											<td class="col-move">{move.name.replace(/\b\w/g, (l) => l.toUpperCase())}</td>
											<td class="col-type"
												><span class="type-badge type-{move.type}">{move.type}</span></td
											>
											<td class="col-cat"
												><img
													src="/images/{move.category}.png"
													alt={move.category}
													title={move.category}
													class="cat-icon"
												/></td
											>
											<td class="col-power">{formatStat(move.power)}</td>
											<td class="col-acc">{formatStat(move.accuracy)}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{:else}
						<!-- Optional: Tutor moves might just not be shown if empty -->
						<!-- <p class="no-moves-notice">No tutor moves found for this version.</p> -->
					{/if}
				{:else}
					<!-- Message if NO version group with moves could be found at all -->
					<p class="no-moves-notice">
						Could not find move data for this Pokémon in recent game versions.
					</p>
				{/if}
			</div>
			<!-- === END MOVES SECTION === -->
		</div>
	</div>
</div>

<style>
	/* --- Keep ALL existing styles from previous step --- */
	.pokemon-detail-container {
		max-width: 900px;
		margin: 20px auto;
		padding: 25px;
		background-color: #fff;
		border-radius: 15px;
		border-top: 10px solid var(--pokemon-color, #ddd);
		box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
		position: relative;
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
	.left-column,
	.right-column {
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
		font-size: 0.75rem;
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
		grid-template-columns: 80px 40px 1fr;
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
		height: 12px;
	}
	.stat-bar {
		height: 100%;
		border-radius: 5px;
		transition: width 0.5s ease-out;
	}

	/* --- MOVES SECTION STYLES --- */
	.moves-section {
		margin-top: 40px; /* Space above the moves */
	}
	.moves-header {
		text-align: center;
		font-size: 1.6rem;
		color: #333;
		margin-bottom: 25px;
		border-bottom: 2px solid #eee;
		padding-bottom: 10px;
	}
	.move-table-container {
		margin-bottom: 35px;
	}
	.move-table-container h3 {
		font-size: 1.3rem;
		color: #444;
		margin-bottom: 15px;
	}
	.move-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
	}
	.move-table th,
	.move-table td {
		border: 1px solid #ddd;
		padding: 8px 6px;
		text-align: center;
		vertical-align: middle;
	}
	.move-table th {
		background-color: #f2f2f2;
		font-weight: 600;
		white-space: nowrap;
	}
	.move-table tbody tr:nth-child(odd) {
		background-color: #f9f9f9; /* Zebra striping */
	}
	.move-table tbody tr:hover {
		background-color: #f1f1f1;
	}

	/* Column specific styles */
	.col-level {
		width: 7%;
		text-align: right;
		padding-right: 10px !important;
	}
	.col-move {
		width: 28%;
		text-align: left;
		padding-left: 10px !important;
		font-weight: 500;
		text-transform: capitalize;
	}
	.col-type {
		width: 15%;
	}
	.col-cat {
		width: 10%;
	}
	.col-power,
	.col-acc {
		width: 10%;
		text-align: right;
		padding-right: 10px !important;
	}

	.move-table .type-badge {
		font-size: 0.7rem; /* Smaller badge in table */
		padding: 3px 8px;
	}
	.cat-icon {
		width: 24px; /* Adjust size as needed */
		height: auto;
		vertical-align: middle;
		display: inline-block; /* Ensure proper alignment */
	}

	.no-moves-notice {
		font-style: italic;
		color: #666;
		margin: 15px 0 30px 0;
		padding: 10px;
		background-color: #f9f9f9;
		border-left: 3px solid #ddd;
	}

	/* Responsive table adjustments */
	@media (max-width: 768px) {
		.move-table th,
		.move-table td {
			padding: 6px 4px;
			font-size: 0.85rem;
		}
		.col-move {
			width: auto;
		} /* Let move name take more space */
		.move-table .type-badge {
			font-size: 0.65rem;
			padding: 2px 6px;
		}
		.cat-icon {
			width: 20px;
		}
	}
	@media (max-width: 480px) {
		.col-power,
		.col-acc {
			display: none;
		} /* Hide Power/Acc */
		.col-cat {
			width: 15%;
		}
		.col-level {
			width: 12%;
		}
		.col-type {
			width: 25%;
		}
	}

	@media (max-width: 650px) {
		.pokemon-name {
			font-size: 2rem;
		}
		.content-grid {
			grid-template-columns: 1fr;
		}
		.stat-item {
			grid-template-columns: 70px 35px 1fr;
		}
	}
</style>
