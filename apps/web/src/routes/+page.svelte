<script lang="ts">
  let { data } = $props();
  const date = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
</script>

<svelte:head><title>Scale history · Health</title></svelte:head>

<section>
  <p class="eyebrow">Scale</p>
  <h1>History</h1>
  {#if data.measurements.length === 0}
    <div class="empty"><p>No measurements yet.</p><a href="/settings">Pair your scale</a> to begin collecting.</div>
  {:else}
    <div class="table-wrap"><table>
      <thead><tr><th>When</th><th>Weight</th><th>Impedance</th><th>Device</th></tr></thead>
      <tbody>{#each data.measurements as measurement}
        <tr>
          <td>{date.format(new Date(measurement.measured_at))}</td>
          <td>{Number(measurement.weight_kg).toFixed(2)} kg</td>
          <td>{measurement.impedance_ohms ? `${measurement.impedance_ohms} Ω` : '—'}</td>
          <td>{measurement.device_name}</td>
        </tr>
      {/each}</tbody>
    </table></div>
  {/if}
</section>

<style>
  h1 { margin-top: .1rem; } .eyebrow { margin: 0; color: #0f766e; font-weight: 700; text-transform: uppercase; font-size: .8rem; letter-spacing: .08em; }
  .empty, .table-wrap { background: white; border: 1px solid #e2e8f0; border-radius: .75rem; padding: 1.5rem; }
  .empty a { color: #0f766e; } table { width: 100%; border-collapse: collapse; } th, td { text-align: left; padding: .85rem .5rem; border-bottom: 1px solid #e2e8f0; } th { color: #64748b; font-size: .8rem; text-transform: uppercase; } tbody tr:last-child td { border: 0; }
</style>
