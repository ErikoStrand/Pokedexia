<!-- src/routes/+layout.svelte -->
<script>
	import { navigating } from '$app/stores'; // Optional: For loading indicator during navigation
	let { children } = $props(); // Get child components
</script>

<div class="app-container">
	<header class="main-header">
		<nav class="main-nav">
			<a href="/" class="nav-logo" aria-label="Pokedex Home">Pokédexia</a>
			<ul>
				<li><a href="/">Pokédex</a></li>
				<li><a href="/team-generator">Team Generator</a></li>
				<!-- Add other links here later -->
			</ul>
		</nav>
	</header>

	{#if $navigating}
		<div class="navigation-loader">Loading...</div>
	{/if}

	<main class="main-content">
		{@render children()}
		<!-- Page content will be rendered here -->
	</main>

	<footer class="main-footer">
		<p>© {new Date().getFullYear()} Pokédexia. Pokémon data from PokeAPI.</p>
	</footer>
</div>

<style>
	:global(body) {
		margin: 0;
		font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
		background-color: #f0f0f0;
		color: #333;
		line-height: 1.6;
	}

	.app-container {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.main-header {
		background-color: #e3350d; /* Pokemon Red */
		color: white;
		padding: 0 20px;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
		position: sticky; /* Make header sticky */
		top: 0;
		z-index: 110; /* Above filter bar */
	}

	.main-nav {
		max-width: 1200px;
		margin: 0 auto;
		display: flex;
		justify-content: space-between;
		align-items: center;
		height: 60px;
	}

	.nav-logo {
		font-size: 1.5rem;
		font-weight: bold;
		color: white;
		text-decoration: none;
	}
	.nav-logo:hover {
		color: #ffcb05; /* Pokemon Yellow */
	}

	.main-nav ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		gap: 20px;
	}

	.main-nav a:not(.nav-logo) {
		color: white;
		text-decoration: none;
		font-weight: 500;
		padding: 5px 10px;
		border-radius: 4px;
		transition: background-color 0.2s ease;
	}

	.main-nav a:not(.nav-logo):hover,
	.main-nav a:not(.nav-logo)[aria-current='page'] {
		/* Style for active link */
		background-color: rgba(255, 255, 255, 0.2);
	}

	/* Optional: Loading indicator style */
	.navigation-loader {
		text-align: center;
		padding: 5px;
		background-color: #ffcb05;
		color: #3b4cca;
		font-weight: bold;
		position: sticky;
		top: 60px; /* Below header */
		z-index: 105;
	}

	.main-content {
		flex-grow: 1; /* Takes up remaining vertical space */
		/* Container logic moved to specific pages */
	}

	.main-footer {
		text-align: center;
		padding: 15px;
		margin-top: 30px;
		background-color: #ddd;
		color: #555;
		font-size: 0.9em;
	}
</style>
