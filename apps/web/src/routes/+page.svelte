<script lang="ts">
  let { data } = $props();
  const date = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  const chart = $derived.by(() => {
    const measurements = [...data.measurements].reverse();
    const weights = measurements.map((measurement) => Number(measurement.weight_kg));
    const minimum = Math.min(...weights);
    const maximum = Math.max(...weights);
    const range = maximum - minimum || 1;
    const path = measurements
      .map((measurement, index) => {
        const x = measurements.length === 1 ? 50 : (index / (measurements.length - 1)) * 100;
        const y = 46 - ((Number(measurement.weight_kg) - minimum) / range) * 42;
        return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(' ');

    return { maximum, minimum, path };
  });
</script>

<svelte:head><title>Scale history · Health</title></svelte:head>

<section>
  <p class="eyebrow">Scale</p>
  <h1>History</h1>
  {#if data.measurements.length === 0}
    <div class="empty"><p>No measurements yet.</p><a href="/settings">Pair your scale</a> to begin collecting.</div>
  {:else}
    {#if data.measurements.length > 1}
      <section class="chart" aria-label="Weight trend">
        <div class="chart-heading"><h2>Weight trend</h2><span>{chart.minimum.toFixed(2)}–{chart.maximum.toFixed(2)} kg</span></div>
        <svg viewBox="0 0 100 50" preserveAspectRatio="none" role="img" aria-label="Weight trend over time">
          <line x1="0" y1="46" x2="100" y2="46" />
          <path d={chart.path} />
        </svg>
      </section>
    {/if}
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
  .empty, .table-wrap, .chart { background: white; border: 1px solid #e2e8f0; border-radius: .75rem; padding: 1.5rem; }
  .empty a { color: #0f766e; } table { width: 100%; border-collapse: collapse; } th, td { text-align: left; padding: .85rem .5rem; border-bottom: 1px solid #e2e8f0; } th { color: #64748b; font-size: .8rem; text-transform: uppercase; } tbody tr:last-child td { border: 0; }
  .chart { margin-bottom: 1rem; }.chart-heading { display:flex; justify-content:space-between; align-items:baseline; }.chart h2 { margin:0; font-size:1rem; }.chart-heading span { color:#64748b; font-size:.875rem; }.chart svg { display:block; width:100%; height:220px; margin-top:1rem; overflow:visible; }.chart line { stroke:#cbd5e1; stroke-width:.4; }.chart path { fill:none; stroke:#0f766e; stroke-width:1.2; vector-effect:non-scaling-stroke; }
</style>
