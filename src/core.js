// Own code, MIT. No network or DOM dependencies in calculation functions.
export const ROLES = {
  climate: ['Strefa / Zone', 'climate'], water_heater: ['CWU / DHW', 'water_heater'],
  flow: ['Zasilanie / Flow', 'sensor'], return: ['Powrót / Return', 'sensor'],
  outside: ['Na zewnątrz / Outside', 'sensor'], room: ['Wewnątrz / Room', 'sensor'],
  tank: ['Zasobnik / Tank', 'sensor'], frequency: ['Sprężarka / Compressor', 'sensor'],
  defrost: ['Odszranianie / Defrost', 'binary_sensor'], error: ['Błąd / Error', 'sensor,binary_sensor'],
  consumed: ['Energia pobrana / Consumed', 'sensor'], produced: ['Energia oddana / Produced', 'sensor'],
  mode: ['Tryb pracy / Mode', 'sensor'], dhw_valve: ['Zawór CWU / DHW valve', 'binary_sensor'],
  heater: ['Grzałki / Electric heater', 'binary_sensor'], demand: ['Zapotrzebowanie / Demand', 'sensor'],
  cop: ['COP z encji / COP entity', 'sensor']
};
export function numeric(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const n = Number(value); return Number.isFinite(n) ? n : null;
}
export function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
export function validateConfig(c) {
  if (!c || typeof c !== 'object' || Array.isArray(c)) throw Error('Invalid card configuration');
  const out = {...c, entities: {...(c.entities || {})}};
  for (const [role, id] of Object.entries(out.entities)) {
    if (!(role in ROLES) || typeof id !== 'string' || (id && !/^[a-z_]+\.[a-z0-9_]+$/.test(id))) throw Error('Invalid entity mapping: ' + role);
    if (id && !ROLES[role][1].split(',').includes(id.split('.')[0])) throw Error('Invalid domain: ' + role);
  }
  if (c.tariff !== undefined && c.tariff !== null && (numeric(c.tariff) === null || Number(c.tariff) < 0)) throw Error('Tariff must be >= 0');
  return {...out, type: 'custom:open-ecodan-dashboard', language: c.language === 'en' ? 'en' : 'pl', tariff: c.tariff === undefined || c.tariff === null ? null : Number(c.tariff), currency: String(c.currency || 'PLN'), controls: c.controls === true};
}
const patterns = {
  flow: /system.flow.temperature|flow.temperature|zasilani|wyjściow/i,
  return: /system.return.temperature|return.temperature|powrot/i,
  outside: /outside.temperature|outdoor.temperature|zewnętrz/i,
  room: /room.temperature|indoor.temperature|wewnętrz/i,
  tank: /tank.*temperature|tank.water|cwu.*temperat/i,
  frequency: /frequency|częstotliwo/i
};
// Never choose among several units or ambiguous sensors; manual mapping wins.
export function discover(registry, devices, states, deviceId = '') {
  const candidates = registry.filter(e => ['melcloud', 'melcloud_home'].includes(e.platform) && !e.disabled_by && states[e.entity_id]);
  const ids = [...new Set(candidates.map(e => e.device_id).filter(Boolean))];
  const selected = deviceId || (ids.length === 1 ? ids[0] : '');
  const entities = {};
  if (selected) {
    const rows = candidates.filter(e => e.device_id === selected);
    for (const role of ['climate','water_heater',...Object.keys(patterns)]) {
      const matches = rows.filter(e => {
        const domain = e.entity_id.split('.')[0];
        return role === 'climate' || role === 'water_heater' ? domain === role : domain === 'sensor' && patterns[role].test([e.entity_id,e.original_name,e.translation_key].join(' '));
      });
      if (matches.length === 1) entities[role] = matches[0].entity_id;
    }
  }
  return {entities, selected, devices: ids.map(id => ({id, name: devices.find(d=>d.id===id)?.name_by_user || devices.find(d=>d.id===id)?.name || id}))};
}
// sum is HA recorder's reset-adjusted cumulative sum, not a daily sensor's raw state.
// Require exactly matching hourly boundaries and continuous coverage for BOTH series.
export function energyPeriod(a, b, start, end) {
  const hour = 3600000;
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || start % hour || end % hour) return {error:'invalid_period'};
  const map = rows => new Map((rows || []).map(r => [typeof r.start === 'number' ? r.start : Date.parse(r.start), numeric(r.sum)]));
  const x = map(a), y = map(b); let input = 0, output = 0;
  for (let t = start; t <= end; t += hour) {
    const p=x.get(t), q=y.get(t);
    if (p === undefined || p === null || q === undefined || q === null) return {error:'missing_statistics'};
    if(t > start) {
      const dx=p-x.get(t-hour), dy=q-y.get(t-hour);
      if(dx < -1e-6 || dy < -1e-6) return {error:'negative_delta'};
      input += Math.max(0,dx); output += Math.max(0,dy);
    }
  }
  return {consumed:input, produced:output, cop:input>0 ? output/input : null, start, end};
}
// Daily rows use recorder's own per-day change; a missing day stays missing, never 0.
export function dailyEnergy(rowsA, rowsB, limit = 14) {
  const map = rows => new Map((rows || []).map(r => [typeof r.start === 'number' ? r.start : Date.parse(r.start), numeric(r.change)]));
  const x = map(rowsA), y = map(rowsB);
  const days = [...x.keys()].filter(Number.isFinite).sort((a,b)=>a-b).slice(-limit).map(t => {
    const consumed = x.get(t), produced = y.has(t) ? y.get(t) : null;
    const okIn = consumed !== null && consumed >= -1e-6;
    const okOut = produced !== null && produced >= -1e-6;
    return {t, consumed: okIn ? Math.max(0, consumed) : null, produced: okOut ? Math.max(0, produced) : null,
      cop: okIn && okOut && consumed > 0 ? produced / consumed : null};
  });
  const complete = key => days.length > 0 && days.every(d => d[key] !== null);
  const sum = key => days.reduce((a,d) => d[key] === null ? a : a + d[key], 0);
  return {days,
    consumed: complete('consumed') ? sum('consumed') : null,
    produced: complete('produced') ? sum('produced') : null,
    cop: complete('consumed') && complete('produced') && sum('consumed') > 0 ? sum('produced')/sum('consumed') : null};
}
export function compressorSummary(rows, start, end, maxGap = 15*60000) {
  let runMs=0, starts=0, coveredMs=0;
  const list=(rows||[]).map(r=>({t:Date.parse(r.last_updated || r.last_changed), n:numeric(r.state)})).sort((a,b)=>a.t-b.t);
  for(let i=1;i<list.length;i++) {
    const p=list[i-1], q=list[i], left=Math.max(start,p.t), right=Math.min(end,q.t);
    if(p.n===null || q.n===null || q.t-p.t>maxGap || right<=left) continue;
    coveredMs += right-left;
    if(p.n>0) runMs += right-left;
    if(p.n===0 && q.n>0 && q.t>=start && q.t<=end) starts++;
  }
  return {runHours:runMs/3600000,starts,coverage: Math.max(0,Math.min(1,coveredMs/(end-start)))};
}
// Last known state per slot. Recorder stores changes only, so an unchanged value
// has no new rows: carry it forward. A real hole is recorded as unavailable/unknown
// and stays null, so the chart breaks there instead of inventing a reading.
export function sampleSeries(rows, start, end, steps) {
  const out = new Array(steps).fill(null);
  const list = (rows||[]).map(r=>({t:Date.parse(r.last_updated||r.last_changed), s:r.state})).filter(p=>Number.isFinite(p.t)).sort((a,b)=>a.t-b.t);
  if(!list.length) return out;
  const step = (end-start)/steps;
  let j = 0, last = null;
  for(let i=0;i<steps;i++) {
    const t = start + (i+1)*step;
    while(j<list.length && list[j].t<=t) last = list[j++];
    if(last && !['unavailable','unknown'].includes(last.s)) out[i]=last.s;
  }
  return out;
}
export function temperatureRequest(state, id, value) {
  const domain=id?.split('.')[0], a=state?.attributes;
  if (!state || ['unknown','unavailable'].includes(state.state) || !['climate','water_heater'].includes(domain)) throw Error('Entity unavailable');
  const n=numeric(value), min=numeric(a.min_temp), max=numeric(a.max_temp);
  if(n===null || min===null || max===null || n<min || n>max) throw Error('Temperature outside entity limits');
  // SET_TEMPERATURE feature: climate=1, water_heater=1.
  if(!(Number(a.supported_features)&1)) throw Error('Temperature control not supported');
  return {domain, service:'set_temperature', data:{entity_id:id,temperature:n}};
}
