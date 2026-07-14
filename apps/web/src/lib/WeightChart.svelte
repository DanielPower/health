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
          datasets: [
            {
              data: points.map((point) => ({ x: point.measuredAt.getTime(), y: point.weight })),
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
              title: (contexts) => {
                const timestamp = contexts[0]?.parsed.x;
                return timestamp === null || timestamp === undefined
                  ? ''
                  : date.format(new Date(timestamp));
              },
              label: (context) => `${Number(context.parsed.y).toFixed(2)} ${unit}`,
            },
          },
        },
        scales: {
          x: {
            type: 'linear',
            grid: { color: '#251a9d' },
            ticks: {
              color: '#00ffff',
              maxTicksLimit: 6,
              callback: (value) => date.format(new Date(Number(value))),
            },
          },
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
