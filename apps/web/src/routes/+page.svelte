<script lang="ts">
  import WeightChart from '$lib/WeightChart.svelte';

  let { data } = $props();
  const date = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  const displayedWeight = (measurement: (typeof data.measurements)[number]) =>
    Number(measurement.weight_kg) * (measurement.weight_display_unit === 'lb' ? 2.2046226218 : 1);
  const unitLabel = (measurement: (typeof data.measurements)[number]) =>
    measurement.weight_display_unit === 'lb' ? 'lbs' : 'kg';
  const chartPoints = $derived(
    [...data.measurements]
      .reverse()
      .map((measurement) => ({ measuredAt: new Date(measurement.measured_at), weight: displayedWeight(measurement) })),
  );
</script>

<svelte:head><title>Scale history · Health</title></svelte:head>

<section>
  <h1>WEIGHT HISTORY</h1>
  {#if data.measurements.length === 0}
    <div class="empty"><p>No measurements yet.</p><a href="/settings">Pair your scale</a> to begin collecting.</div>
  {:else}
    <section class="chart" aria-label="Weight trend">
      <div class="chart-heading"><h2>WEIGHT-O-MATIC 3000™</h2><span>← hover for secrets →</span></div>
      <WeightChart points={chartPoints} unit={unitLabel(data.measurements[0])} />
    </section>
    <div class="table-wrap"><table>
      <thead><tr><th>When</th><th>Weight</th><th>Impedance</th><th>Device</th></tr></thead>
      <tbody>{#each data.measurements as measurement}
        <tr>
          <td>{date.format(new Date(measurement.measured_at))}</td>
          <td>{displayedWeight(measurement).toFixed(2)} {unitLabel(measurement)}</td>
          <td>{measurement.impedance_ohms ? `${measurement.impedance_ohms} Ω` : '—'}</td>
          <td>{measurement.device_name}</td>
        </tr>
      {/each}</tbody>
    </table></div>
  {/if}
</section>

<style>
  h1 { margin:.2rem 0 1rem; color:#ffff00; font-family:Impact, fantasy; letter-spacing:.06em; text-shadow:2px 2px #ff00ff; }.eyebrow { margin:0; color:#00ff00; font-weight:bold; text-align:center; font-family:"Courier New", monospace; }
  .empty, .table-wrap, .chart { background:#000080; border:4px ridge #00ffff; padding:1rem; box-shadow:5px 5px #310059; }.empty { color:#fff; text-align:center; }.empty a { color:#ffff00; font-weight:bold; } table { width:100%; border-collapse:separate; border-spacing:2px; font-family:"Courier New", monospace; } th, td { text-align:left; padding:.65rem .5rem; } th { color:#000; background:#00ffff; font-size:.75rem; text-transform:uppercase; } td { color:#fff; background:#10106d; border:1px dotted #ff00ff; } .chart { margin-bottom:1rem; }.chart-heading { display:flex; justify-content:space-between; align-items:baseline; color:#ffff00; }.chart h2 { margin:0; font-size:1.05rem; }.chart-heading span { color:#00ff00; font-size:.75rem; }
</style>
