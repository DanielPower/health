<script lang="ts">
  import { page } from '$app/state';
  import { onMount } from 'svelte';

  let { children } = $props();
  let visits = $state<number | null>(null);

  onMount(async () => {
    try {
      const response = await fetch('/api/visits', { method: 'POST' });
      const body = await response.json();
      if (response.ok) visits = Number(body.count);
    } catch {
      // The decorative counter should never prevent the page from working.
    }
  });
</script>

<svelte:head><title>Health</title></svelte:head>

<div class="page-shell">
  <header>
    <p class="top-note">★ STOP BEING FAT ★</p>
    <div class="banner">
      <span class="star">✦</span>
      <a href="/">DAN IS FAT</a>
      <span class="star">✦</span>
    </div>
    <div class="ticker"><span>+++ LIVE FROM THE HEALTHFORMATION SUPER HUB +++</span></div>
    <nav aria-label="Main navigation">
      <a class:active={page.url.pathname === '/'} href="/">📈 WEIGHT HISTORY</a>
      <a class:active={page.url.pathname === '/settings'} href="/settings">⚙ SCALE CONTROL PANEL</a>
    </nav>
  </header>
  <main>{@render children()}</main>
  <footer>
    <span>Best viewed in Internet Explorer 6</span>
    <span class="counter">VISITORS: {visits === null ? 'LOADING…' : String(visits).padStart(6, '0')}</span>
  </footer>
</div>

<style>
  :global(*) { box-sizing: border-box; }
  :global(body) {
    margin: 0;
    color: #fff;
    font-family: "Comic Sans MS", "Trebuchet MS", sans-serif;
    background-color: #07035c;
    background-image: radial-gradient(#fff 1px, transparent 1px), radial-gradient(#00ffff 1px, transparent 1px);
    background-position: 0 0, 10px 13px;
    background-size: 22px 22px;
  }
  :global(a) { color: #ffff00; }
  .page-shell { width: min(960px, calc(100% - 1.5rem)); margin: 0 auto; background: #050070; border-left: 5px ridge #ff00ff; border-right: 5px ridge #00ffff; min-height: 100vh; box-shadow: 0 0 35px #000; }
  header, main, footer { padding: 1rem; }
  .top-note { margin: 0; text-align: center; color: #00ffff; font-family: Impact, sans-serif; letter-spacing: .15em; font-size: .75rem; animation: blink 1s steps(2, start) infinite; }
  .banner { display:flex; align-items:center; justify-content:center; gap:2.5rem; padding: .75rem; text-align:center; border: 4px outset #ff00ff; background: linear-gradient(90deg, #1300a8, #4300c4, #1300a8); }
  .banner a { color:#fff; font-family: Impact, fantasy; font-size: clamp(2rem, 7vw, 4rem); line-height:.72; letter-spacing:.08em; text-decoration:none; text-shadow: 3px 3px #ff00ff, -2px -2px #00ffff; }
  .banner em { color:#ffff00; font-style:normal; font-size:.65em; }
  .star { color:#ffff00; font-size:2.5rem; text-shadow:0 0 10px #00ffff; animation: spin 3s linear infinite; }
  .ticker { overflow:hidden; white-space:nowrap; border:3px inset #00ffff; margin-top:.6rem; color:#00ff00; background:#000; font-family:"Courier New", monospace; font-weight:bold; }
  .ticker span { display:inline-block; padding-left:100%; animation: ticker 18s linear infinite; }
  nav { display:flex; flex-wrap:wrap; justify-content:center; gap:.6rem; padding-top:.85rem; }
  nav a { color:#fff; background:#e600a9; border:3px outset #ff8eea; padding:.45rem .7rem; font-weight:bold; font-size:.78rem; text-decoration:none; text-shadow:1px 1px #000; }
  nav a:hover { background:#00a8a8; color:#ffff00; }
  nav a.active { background:#00a8a8; border-style:inset; border-color:#00ffff; color:#ffff00; transform:translate(1px, 1px); }
  footer { display:flex; justify-content:space-between; gap:1rem; color:#00ffff; font-size:.75rem; border-top:3px dashed #ff00ff; text-align:center; }
  .counter { color:#00ff00; background:#000; border:2px inset #777; padding:.2rem .35rem; font-family:"Courier New", monospace; }
  @keyframes ticker { to { transform:translateX(-100%); } }
  @keyframes blink { 50% { opacity:.2; } }
  @keyframes spin { to { transform:rotate(360deg); } }
  @media (max-width: 540px) { .banner { gap:.8rem; }.star { font-size:1.5rem; } footer { flex-direction:column; align-items:center; } }
</style>
