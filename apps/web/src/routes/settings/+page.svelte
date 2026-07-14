<script lang="ts">
  type Device = { address: string; name: string; model: string };
  let devices = $state<Device[]>([]);
  let status = $state('');
  let loading = $state(false);

  async function scan() {
    loading = true; status = 'Looking for an active Etekcity scale…';
    try {
      const response = await fetch('/api/settings/scale/scan', { method: 'POST' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.detail ?? 'Scan failed');
      devices = body.devices; status = devices.length ? 'Select your scale.' : 'No scale found. Step on it and try again.';
    } catch (error) { status = error instanceof Error ? error.message : 'Scan failed'; }
    finally { loading = false; }
  }

  async function pair(device: Device) {
    loading = true; status = `Pairing ${device.name}…`;
    try {
      const response = await fetch('/api/settings/scale/pair', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(device) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.detail ?? 'Pairing failed');
      status = `${body.name} is paired. Measurements will appear on History.`;
    } catch (error) { status = error instanceof Error ? error.message : 'Pairing failed'; }
    finally { loading = false; }
  }
</script>

<svelte:head><title>Settings · Health</title></svelte:head>

<section>
  <p class="eyebrow">Scale</p><h1>Settings</h1>
  <div class="card">
    <h2>Pair an Etekcity scale</h2>
    <p>Keep the scale nearby and step on it before scanning. Bluetooth access is handled by the collector running on the Linux host.</p>
    <button onclick={scan} disabled={loading}>{loading ? 'Working…' : 'Scan for scale'}</button>
    {#if status}<p aria-live="polite">{status}</p>{/if}
    {#each devices as device}
      <div class="device"><span><strong>{device.name}</strong><small>{device.address} · {device.model}</small></span><button onclick={() => pair(device)} disabled={loading}>Pair</button></div>
    {/each}
  </div>
</section>

<style>
  h1 { margin-top: .1rem; }.eyebrow { margin: 0; color:#0f766e; font-weight:700; text-transform:uppercase; font-size:.8rem; letter-spacing:.08em; }.card { max-width: 620px; background:#fff; border:1px solid #e2e8f0; padding:1.5rem; border-radius:.75rem; }.card p { color:#475569; line-height:1.5; }button { background:#0f766e; color:#fff; border:0; padding:.65rem .9rem; border-radius:.4rem; font:inherit; cursor:pointer; }button:disabled { opacity:.6; cursor:wait; }.device { display:flex; justify-content:space-between; align-items:center; gap:1rem; margin-top:1rem; padding-top:1rem; border-top:1px solid #e2e8f0; }.device small { display:block; color:#64748b; margin-top:.2rem; }
</style>
