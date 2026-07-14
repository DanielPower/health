<script lang="ts">
  import { onMount } from 'svelte';
  import type { Chart } from 'chart.js';

  type Point = { measuredAt: Date; weight: number };

  let { points, unit }: { points: Point[]; unit: 'kg' | 'lbs' } = $props();
  let canvas: HTMLCanvasElement;
  let chart: Chart | undefined;

  const date = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

  onMount(() => {
    let destroyed = false;

    void import('chart.js/auto').then(({ default: ChartConstructor }) => {
      if (destroyed) return;
      chart = new ChartConstructor(canvas, {
      type: 'line',
      data: {
        labels: points.map((point) => date.format(point.measuredAt)),
        datasets: [
          {
            data: points.map((point) => point.weight),
            borderColor: '#ff00ff',
            backgroundColor: '#00ffff',
            borderWidth: 3,
            pointRadius: 3,
            pointHoverRadius: 6,
            tension: 0.2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `${Number(context.parsed.y).toFixed(2)} ${unit}`,
            },
          },
        },
        scales: {
          x: { grid: { color: '#251a9d' }, ticks: { color: '#00ffff', maxTicksLimit: 6 } },
          y: { grid: { color: '#251a9d' }, ticks: { color: '#ffff00', callback: (value) => `${value} ${unit}` } },
        },
      },
      });
    });

    return () => {
      destroyed = true;
      chart?.destroy();
    };
  });
</script>

<div class="chart"><canvas bind:this={canvas} aria-label="Weight trend"></canvas></div>

<style>
  .chart { height: 260px; }
</style>
