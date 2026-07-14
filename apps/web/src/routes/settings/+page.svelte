<script lang="ts">
  type Device = { address: string; name: string; model: string };
  let { data } = $props();
  let pairedDuringSession = $state(false);
  let isPaired = $derived(data.pairedDevices.length > 0 || pairedDuringSession);
  let updatingUnit = $state(false);
  let unitOverrides = $state<Record<string, 'kg' | 'lb'>>({});
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
      pairedDuringSession = true;
      devices = [];
      status = `${body.name} is paired. Measurements will appear on History.`;
    } catch (error) { status = error instanceof Error ? error.message : 'Pairing failed'; }
    finally { loading = false; }
  }

  async function setDisplayUnit(address: string, displayUnit: 'kg' | 'lb') {
    updatingUnit = true;
    try {
      const response = await fetch(`/api/settings/scale/${encodeURIComponent(address)}/display-unit`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ display_unit: displayUnit }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.detail ?? 'Could not update display unit');
      unitOverrides[address] = displayUnit;
      status = `Weight display set to ${displayUnit === 'kg' ? 'kilograms' : 'pounds'}.`;
    } catch (error) { status = error instanceof Error ? error.message : 'Could not update display unit'; }
    finally { updatingUnit = false; }
  }
</script>

<svelte:head><title>Settings · Health</title></svelte:head>

<section>
  <p class="eyebrow">★ CONFIGURATION TERMINAL ★</p><h1>SCALE CONTROL PANEL</h1>
  <div class="card">
    <h2>PAIR AN ETEKCITY SCALE</h2>
    {#if isPaired}
      <p>Your paired scale is being monitored for weigh-ins.</p>
      {#each data.pairedDevices as device}
        <div class="device"><span><strong>{device.name}</strong><small>{device.bluetooth_address} · {device.model}</small></span><span>Paired</span></div>
        <fieldset disabled={updatingUnit}>
          <legend>Weight display unit</legend>
          <button class:active={(unitOverrides[device.bluetooth_address] ?? device.weight_display_unit) === 'kg'} onclick={() => setDisplayUnit(device.bluetooth_address, 'kg')}>kg</button>
          <button class:active={(unitOverrides[device.bluetooth_address] ?? device.weight_display_unit) === 'lb'} onclick={() => setDisplayUnit(device.bluetooth_address, 'lb')}>lbs</button>
        </fieldset>
      {/each}
    {:else}
      <p>Keep the scale nearby and step on it before scanning. Bluetooth access is handled by the collector running on the Linux host.</p>
      <button onclick={scan} disabled={loading}>{loading ? 'Working…' : 'Scan for scale'}</button>
    {/if}
    {#if status}<p aria-live="polite">{status}</p>{/if}
    {#each devices as device}
      <div class="device"><span><strong>{device.name}</strong><small>{device.address} · {device.model}</small></span><button onclick={() => pair(device)} disabled={loading}>Pair</button></div>
    {/each}
  </div>
</section>

<style>
  h1 { margin:.2rem 0 1rem; color:#ffff00; font-family:Impact, fantasy; letter-spacing:.06em; text-shadow:2px 2px #ff00ff; }.eyebrow { margin:0; color:#00ff00; font-weight:bold; text-align:center; font-family:"Courier New", monospace; }.card { max-width:620px; background:#000080; border:4px ridge #00ffff; padding:1rem; box-shadow:5px 5px #310059; }.card h2 { margin-top:0; color:#00ffff; font-family:Impact, fantasy; letter-spacing:.05em; }.card p { color:#fff; line-height:1.5; }button { background:#e600a9; color:#fff; border:3px outset #ff8eea; padding:.55rem .8rem; font:inherit; font-weight:bold; cursor:pointer; text-shadow:1px 1px #000; }button:hover { background:#00a8a8; color:#ffff00; }button:disabled { opacity:.6; cursor:wait; }.device { display:flex; justify-content:space-between; align-items:center; gap:1rem; margin-top:1rem; padding-top:1rem; border-top:2px dotted #ff00ff; color:#ffff00; }.device small { display:block; color:#00ffff; margin-top:.2rem; font-family:"Courier New", monospace; }fieldset { display:flex; gap:.5rem; border:2px groove #ff00ff; padding:.7rem; margin-top:1rem; }legend { color:#00ff00; font-weight:bold; }fieldset button { background:#222; border-color:#aaa; }fieldset button.active { background:#00a8a8; color:#ffff00; border-color:#00ffff; }
</style>
