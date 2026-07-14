<script lang="ts">
  let { children } = $props();
</script>

<svelte:head><title>Health</title></svelte:head>

<header>
  <a href="/">Health</a>
  <nav><a href="/">History</a><a href="/settings">Settings</a></nav>
</header>
<main>{@render children()}</main>

<style>
  :global(*) { box-sizing: border-box; }
  :global(body) { margin: 0; background: #f8fafc; color: #172033; font-family: Inter, system-ui, sans-serif; }
  header, main { max-width: 960px; margin: auto; padding: 1.25rem; }
  header { display: flex; justify-content: space-between; align-items: center; }
  header > a { color: #0f766e; font-weight: 750; font-size: 1.25rem; text-decoration: none; }
  nav { display: flex; gap: 1rem; } nav a { color: #475569; text-decoration: none; }
</style>
