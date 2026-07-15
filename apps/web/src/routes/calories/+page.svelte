<script lang="ts">
  let { data, form } = $props();

  const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'full' });
  const displayDate = $derived(dateFormatter.format(new Date(`${data.selectedDate}T12:00:00`)));
</script>

<svelte:head><title>Calorie tracker · Health</title></svelte:head>

<section>
  <p class="eyebrow">★ FUEL CONSUMPTION LOG ★</p>
  <h1>CALORIE COMMAND CENTER</h1>

  <div class="day-picker">
    <form method="GET"><label for="date">DATE:</label><input id="date" name="date" type="date" value={data.selectedDate} /><button>LOAD LOG</button></form>
    <strong>{displayDate}</strong>
  </div>

  <div class="total"><span>TODAY'S TOTAL</span><strong>{data.total.toLocaleString()} <small>kcal</small></strong></div>

  <div class="panel">
    <h2>ADD FOOD TRANSMISSION</h2>
    <form method="POST" action="?/estimate" class="entry-form">
      <input name="date" type="hidden" value={data.selectedDate} />
      <label>MEAL <select name="meal"><option value="breakfast">Breakfast</option><option value="lunch">Lunch</option><option value="dinner">Dinner</option><option value="snack">Snack</option></select></label>
      <label>FOOD <input name="description" required maxlength="200" placeholder="e.g. Coffee and toast" /></label>
      <label>MANUAL KCAL <input name="calories" type="number" min="1" max="10000" placeholder="Optional" /></label>
      <div class="ai-label"><strong>AI</strong> <span class="ai-note">AI estimates calories</span></div>
      <button formaction="?/add">ADD MANUALLY</button>
      <button>ESTIMATE WITH AI</button>
    </form>
    {#if form?.error}<p class="error" role="alert">⚠ {form.error}</p>{/if}
    {#if form?.estimate}
      <div class="estimate">
        <strong>AI ESTIMATE: {form.estimate.calories.toLocaleString()} kcal</strong>
        <span>{form.estimate.explanation}</span>
        <form method="POST" action="?/add">
          <input name="date" type="hidden" value={form.estimate.date} />
          <input name="meal" type="hidden" value={form.estimate.meal} />
          <input name="description" type="hidden" value={form.estimate.description} />
          <input name="calories" type="hidden" value={form.estimate.calories} />
          <button>ADD ESTIMATE TO LOG</button>
        </form>
      </div>
    {/if}
  </div>

  <div class="log panel">
    <h2>DAILY FOOD LOG</h2>
    {#if data.entries.length === 0}
      <p>NO FOOD SIGNALS DETECTED. THE VOID IS HUNGRY.</p>
    {:else}
      <table>
        <thead><tr><th>Meal</th><th>Food</th><th>Calories</th><th>Action</th></tr></thead>
        <tbody>{#each data.entries as entry}
          <tr>
            <td>{entry.meal.toUpperCase()}</td><td>{entry.description}</td><td>{entry.calories.toLocaleString()} kcal</td>
            <td><form method="POST" action="?/delete"><input name="id" type="hidden" value={entry.id} /><input name="date" type="hidden" value={data.selectedDate} /><button class="delete">DELETE</button></form></td>
          </tr>
        {/each}</tbody>
      </table>
    {/if}
  </div>
</section>

<style>
  h1 { margin:.2rem 0 1rem; color:#ffff00; font-family:Impact, fantasy; letter-spacing:.06em; text-shadow:2px 2px #ff00ff; }.eyebrow { margin:0; color:#00ff00; font-weight:bold; text-align:center; font-family:"Courier New", monospace; }.panel, .day-picker { background:#000080; border:4px ridge #00ffff; padding:1rem; box-shadow:5px 5px #310059; }.day-picker { display:flex; justify-content:space-between; align-items:center; gap:1rem; margin-bottom:1rem; color:#00ff00; }.day-picker form { display:flex; align-items:center; gap:.5rem; }.total { margin-bottom:1rem; padding:1rem; text-align:center; border:4px outset #ff00ff; background:linear-gradient(90deg,#260070,#b0009b,#260070); }.total span { display:block; color:#00ffff; font:bold .8rem "Courier New", monospace; }.total strong { color:#ffff00; font:2.5rem Impact, fantasy; text-shadow:2px 2px #000; }.total small { font:1rem "Comic Sans MS", sans-serif; }.panel h2 { margin:0 0 1rem; color:#00ffff; font:1.2rem Impact, fantasy; letter-spacing:.07em; }.entry-form { display:grid; grid-template-columns:1fr 2fr .8fr .7fr auto auto; gap:.7rem; align-items:end; }.entry-form label, .entry-form .ai-label { display:grid; gap:.25rem; color:#00ff00; font:bold .75rem "Courier New", monospace; } input, select { min-width:0; padding:.45rem; color:#000; background:#fff; border:3px inset #aaa; font:inherit; } button { background:#e600a9; color:#fff; border:3px outset #ff8eea; padding:.5rem .7rem; font:inherit; font-weight:bold; cursor:pointer; text-shadow:1px 1px #000; } button:hover { background:#00a8a8; color:#ffff00; }.ai-note { color:#fff; font:normal .7rem "Comic Sans MS", sans-serif; }.estimate { display:grid; gap:.55rem; margin-top:1rem; padding:1rem; border:3px dashed #00ff00; background:#12005f; color:#fff; }.estimate strong { color:#ffff00; }.log { margin-top:1rem; } table { width:100%; border-collapse:separate; border-spacing:2px; font-family:"Courier New", monospace; } th, td { padding:.55rem; text-align:left; } th { background:#00ffff; color:#000; font-size:.75rem; } td { background:#10106d; border:1px dotted #ff00ff; }.delete { padding:.25rem .4rem; background:#5e1b6c; font-size:.7rem; }.error { color:#ffff00; font-weight:bold; } @media (max-width:900px) { .entry-form { grid-template-columns:1fr 1fr; }.day-picker { align-items:flex-start; flex-direction:column; }.day-picker form { flex-wrap:wrap; } }
</style>
