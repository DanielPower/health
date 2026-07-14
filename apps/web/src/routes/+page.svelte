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
  <p class="eyebrow">Scale</p>
  <h1>History</h1>
  {#if data.measurements.length === 0}
    <div class="empty"><p>No measurements yet.</p><a href="/settings">Pair your scale</a> to begin collecting.</div>
  {:else}
    <section class="chart" aria-label="Weight trend">
      <div class="chart-heading"><h2>Weight trend</h2><span>Hover a point for details</span></div>
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
  h1 { margin-top: .1rem; } .eyebrow { margin: 0; color: #0f766e; font-weight: 700; text-transform: uppercase; font-size: .8rem; letter-spacing: .08em; }
  .empty, .table-wrap, .chart { background: white; border: 1px solid #e2e8f0; border-radius: .75rem; padding: 1.5rem; }
  .empty a { color: #0f766e; } table { width: 100%; border-collapse: collapse; } th, td { text-align: left; padding: .85rem .5rem; border-bottom: 1px solid #e2e8f0; } th { color: #64748b; font-size: .8rem; text-transform: uppercase; } tbody tr:last-child td { border: 0; }
  .chart { margin-bottom: 1rem; }.chart-heading { display:flex; justify-content:space-between; align-items:baseline; }.chart h2 { margin:0; font-size:1rem; }.chart-heading span { color:#64748b; font-size:.875rem; }
</style>
