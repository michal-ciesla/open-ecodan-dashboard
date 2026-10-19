// Open Ecodan Dashboard v0.1.0 | MIT
{
// Own code, MIT. No network or DOM dependencies in calculation functions.
const ROLES = {
  climate: ['Strefa / Zone', 'climate'], water_heater: ['CWU / DHW', 'water_heater'],
  flow: ['Zasilanie / Flow', 'sensor'], return: ['Powrót / Return', 'sensor'],
  outside: ['Na zewnątrz / Outside', 'sensor'], room: ['Wewnątrz / Room', 'sensor'],
  tank: ['Zasobnik / Tank', 'sensor'], frequency: ['Sprężarka / Compressor', 'sensor'],
  defrost: ['Odszranianie / Defrost', 'binary_sensor'], error: ['Błąd / Error', 'sensor,binary_sensor'],
  consumed: ['Energia pobrana / Consumed', 'sensor'], produced: ['Energia oddana / Produced', 'sensor']
};
function numeric(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const n = Number(value); return Number.isFinite(n) ? n : null;
}
function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function validateConfig(c) {
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
function discover(registry, devices, states, deviceId = '') {
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
function energyPeriod(a, b, start, end) {
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
function compressorSummary(rows, start, end, maxGap = 15*60000) {
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
function temperatureRequest(state, id, value) {
  const domain=id?.split('.')[0], a=state?.attributes;
  if (!state || ['unknown','unavailable'].includes(state.state) || !['climate','water_heater'].includes(domain)) throw Error('Entity unavailable');
  const n=numeric(value), min=numeric(a.min_temp), max=numeric(a.max_temp);
  if(n===null || min===null || max===null || n<min || n>max) throw Error('Temperature outside entity limits');
  // SET_TEMPERATURE feature: climate=1, water_heater=1.
  if(!(Number(a.supported_features)&1)) throw Error('Temperature control not supported');
  return {domain, service:'set_temperature', data:{entity_id:id,temperature:n}};
}

const labels = {
  pl: {tabs:['Przegląd','Temperatury','Energia','Sprężarka','CWU','Diagnostyka','Ustawienia'],missing:'Brak danych',refresh:'Odśwież historię',loading:'Pobieranie…',history:'Historia lokalna HA',controls:'Sterowanie jest domyślnie wyłączone. Włącz je w edytorze karty.',save:'Zastosuj temperaturę',confirm:'Wysłać do Home Assistant zmianę temperatury?',sent:'Polecenie wysłane; czekaj na aktualizację encji.',config:'Mapowanie i taryfę zmienisz w edytorze karty Lovelace.',period:'Ostatnie pełne godziny (UTC)',pair:'Wybierz parę liczników dla tego samego obiegu i potwierdź zgodność zakresu w edytorze.',stats:'Brak zgodnych, ciągłych statystyk energii. Sprawdź Recorder i mapowanie.',cost:'Szacowany koszt',estimate:'Oszacowanie z próbek; nie licznik sprzętowy',noDefrost:'Bez encji defrost nie można wiarygodnie wykryć odszraniania.',noScop:'COP okresu nie jest certyfikowanym SCOP. Taryfy dynamiczne i harmonogramy: użyj automatyzacji HA.'},
  en: {tabs:['Overview','Temperatures','Energy','Compressor','DHW','Diagnostics','Settings'],missing:'No data',refresh:'Refresh history',loading:'Loading…',history:'Local HA history',controls:'Controls are disabled by default. Enable in the card editor.',save:'Apply temperature',confirm:'Send temperature change to Home Assistant?',sent:'Command sent; waiting for entity update.',config:'Change mappings and tariff in the Lovelace card editor.',period:'Last completed hours (UTC)',pair:'Select energy counters for the same circuit and confirm matching scope in the editor.',stats:'No matching continuous energy statistics. Check Recorder and mappings.',cost:'Estimated cost',estimate:'Estimate from samples; not a hardware counter',noDefrost:'Without a defrost entity, defrost cannot be reliably detected.',noScop:'Period COP is not certified SCOP. Use HA automations for dynamic tariffs and scheduling.'}
};
const css = `:host{display:block;--oed-accent:#0bb8a3}*{box-sizing:border-box}ha-card{display:block;overflow:hidden;background:var(--ha-card-background,var(--card-background-color,#fff));color:var(--primary-text-color,#162b35);border-radius:22px;border:1px solid var(--divider-color,#ddd)}header{padding:24px;background:linear-gradient(115deg,#102b38,#145450);color:white}header small{color:#9ce5d7;letter-spacing:.15em}h2{margin:6px 0;font-size:24px}h3{font-size:16px;margin:10px 0}p{line-height:1.6}nav{display:flex;overflow:auto;padding:10px;gap:5px;border-bottom:1px solid var(--divider-color,#ddd)}button,select,input{font:inherit;color:inherit;padding:10px 12px;border:1px solid var(--divider-color,#ccc);border-radius:10px;background:var(--ha-card-background,var(--card-background-color,#fff))}button{cursor:pointer}button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #0bb8a3}button.active{background:#117b70;color:white;border-color:#117b70}button:disabled{opacity:.55;cursor:default}nav button{white-space:nowrap;border:0}.body{padding:20px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:12px}.metric{padding:17px;border:1px solid var(--divider-color,#ddd);border-radius:15px}.value{font-size:27px;font-weight:650;margin:8px 0}.muted,small{color:var(--secondary-text-color,#617580)}.notice{padding:12px;border-left:3px solid #0bb8a3;background:rgba(11,184,163,.07);margin:12px 0}.error{border-color:#e58d53}footer{padding:14px 20px;font-size:12px;border-top:1px solid var(--divider-color,#ddd)}.toolbar{display:flex;flex-wrap:wrap;gap:10px;margin:12px 0;align-items:center}.chart{margin:14px 0;border:1px solid var(--divider-color,#ddd);border-radius:12px;padding:12px}.chart svg{display:block;width:100%;height:170px;overflow:visible}.chart text{fill:var(--secondary-text-color,#617580);font-size:12px}table{width:100%;border-collapse:collapse;font-size:13px}td,th{text-align:left;padding:9px;border-bottom:1px solid var(--divider-color,#ddd);overflow-wrap:anywhere}label{display:block;margin:12px 0}label input:not([type=checkbox]),label select{display:block;width:100%;margin-top:5px}details{margin:10px 0}summary{cursor:pointer}@media(max-width:480px){.body{padding:12px}header{padding:18px}.grid{grid-template-columns:repeat(2,minmax(0,1fr))}.metric{padding:12px}.value{font-size:23px}table{font-size:11px}}`;
class OpenEcodanDashboard extends HTMLElement {
  constructor(){super();this.attachShadow({mode:'open'});this._tab=0;this._hours=24;this._history={};this._stats={};this._auto={};this._request=0;}
  static getConfigElement(){return document.createElement('open-ecodan-editor');}
  static getStubConfig(){return {type:'custom:open-ecodan-dashboard',entities:{},language:'pl',controls:false};}
  setConfig(c){this._config=validateConfig(c);this._auto={};this._discovered=false;this._history={};this._energy=null;this._request++;this._loading=false;this.render();if(this._hass)this.initialize();}
  set hass(hass){this._hass=hass; if(!this._config)return;if(!['INPUT','SELECT'].includes(this.shadowRoot.activeElement?.tagName))this.render();if(this.isConnected&&!this._discovered)this.initialize();}
  getCardSize(){return 10;}
  getGridOptions(){return {columns:24,min_columns:6,rows:10,min_rows:5};}
  connectedCallback(){if(this._hass&&this._config)this.initialize();this._timer=setInterval(()=>{if(this._hass&&this._config)this.load();},300000);}
  disconnectedCallback(){clearInterval(this._timer);this._request++;this._loading=false;this._discovered=false;}
  get t(){return labels[this._config?.language||'pl'];}
  get mapping(){return {...this._auto,...this._config.entities};}
  state(role){return this._hass?.states[this.mapping[role]];}
  value(role){const s=this.state(role);if(!s||['unavailable','unknown'].includes(s.state))return this.t.missing;const n=numeric(s.state);return (n===null?esc(s.state):n.toLocaleString(this._config.language,{maximumFractionDigits:2}))+' '+esc(s.attributes.unit_of_measurement||'');}
  async initialize(){
    if(this._discovered)return;this._discovered=true;
    const request=this._request;
    try {
      const [entities,devices]=await Promise.all([this._hass.callWS({type:'config/entity_registry/list'}),this._hass.callWS({type:'config/device_registry/list'})]);
      if(request!==this._request)return;
      this._discovery=discover(entities,devices,this._hass.states,this._config.device_id);
      this._auto=this._discovery.entities;this._registryError='';
    }catch{if(request!==this._request)return;this._registryError='Rejestr niedostępny / Registry unavailable — map entities manually.';}
    this.render();await this.load();
  }
  async load(){
    if(this._loading||!this._hass||!this._config)return;
    this._loading=true;this._error='';this._history={};const request=++this._request;
    const end=new Date(),start=new Date(end.getTime()-this._hours*3600000);
    this._range={start:start.getTime(),end:end.getTime()};this.render();
    const ids=[...new Set(Object.values(this.mapping).filter(Boolean))];
    const jobs=[];
    if(ids.length)jobs.push(this._hass.callApi('GET',`history/period/${start.toISOString()}?${new URLSearchParams({filter_entity_id:ids.join(','),end_time:end.toISOString(),significant_changes_only:'0'})}`).then(data=>{if(request!==this._request)return;this._history=Object.fromEntries(data.filter(r=>r.length).map(r=>[r[0].entity_id,r]));}));
    const {consumed,produced}=this.mapping;
    this._energy=null;
    if(consumed&&produced&&consumed!==produced&&this._config.energy_scope_confirmed===true){
      const a=this._hass.states[consumed],b=this._hass.states[produced];
      if([a,b].every(s=>s?.attributes.device_class==='energy'&&['total','total_increasing'].includes(s.attributes.state_class)&&['kWh','Wh','MWh'].includes(s.attributes.unit_of_measurement))){
        // Row start t represents the hour [t,t+1h); use sums from adjacent rows.
        const endHour=Math.floor(end.getTime()/3600000)*3600000-3600000;
        const startHour=endHour-this._hours*3600000;
        jobs.push(this._hass.callWS({type:'recorder/statistics_during_period',start_time:new Date(startHour).toISOString(),end_time:new Date(endHour+3600000).toISOString(),statistic_ids:[consumed,produced],period:'hour',types:['sum'],units:{energy:'kWh'}}).then(data=>{if(request!==this._request)return;const result=energyPeriod(data[consumed],data[produced],startHour,endHour);this._energy=result.error?result:{...result,start:result.start+3600000,end:result.end+3600000};}));
      }
    }
    const results=await Promise.allSettled(jobs);
    if(request===this._request){this._error=results.some(r=>r.status==='rejected')?'Historia/statystyki niedostępne / History or statistics unavailable':'';this._loaded=new Date();}
    if(request===this._request){this._loading=false;this.render();}
  }
  metric(role){return `<div class="metric"><small>${esc(ROLES[role][0])}</small><div class="value">${this.value(role)}</div><small>${esc(this.mapping[role]||'—')}</small></div>`;}
  chart(role){
    const rows=this._history[this.mapping[role]]||[];
    const data=rows.map(r=>({t:Date.parse(r.last_updated||r.last_changed),n:numeric(r.state)}));
    const finite=data.filter(p=>p.n!==null&&Number.isFinite(p.t));
    if(finite.length<2)return `<div class="chart"><h3>${esc(ROLES[role][0])}</h3>${this.t.missing}</div>`;
    const lo=Math.min(...finite.map(p=>p.n)),hi=Math.max(...finite.map(p=>p.n)),min=this._range.start,max=this._range.end;
    let path='',pen=false;for(const p of data){if(p.n===null||!Number.isFinite(p.t)){pen=false;continue;}const x=45+Math.max(0,Math.min(1,(p.t-min)/(max-min)))*640,y=135-(p.n-lo)/(hi-lo||1)*110;path+=`${pen?'L':'M'}${x.toFixed(1)},${y.toFixed(1)} `;pen=true;}
    const unit=this.state(role)?.attributes.unit_of_measurement||'';
    return `<div class="chart" data-chart="${role}"><h3>${esc(ROLES[role][0])} <small>${esc(unit)}</small></h3><svg viewBox="0 0 720 175" role="img" aria-label="${esc(ROLES[role][0])}"><text x="0" y="26">${hi.toFixed(1)}</text><text x="0" y="139">${lo.toFixed(1)}</text><path d="M45 145H685" stroke="currentColor" opacity=".2"/><path d="${path}" fill="none" stroke="#0bb8a3" stroke-width="2"/><text x="45" y="168">${esc(new Date(min).toLocaleString(this._config.language))}</text><text x="510" y="168">${esc(new Date(max).toLocaleTimeString(this._config.language))}</text></svg><output aria-live="polite"></output><details><summary>${this._config.language==='pl'?'Odczyty i czas':'Readings and time'}</summary><div style="max-height:220px;overflow:auto"><table><tbody>${finite.map(p=>`<tr><td>${esc(new Date(p.t).toLocaleString())}</td><td>${p.n} ${esc(unit)}</td></tr>`).join('')}</tbody></table></div></details></div>`;
  }
  control(role){
    if(!this._config.controls)return `<p class="notice">${this.t.controls}</p>`;
    const s=this.state(role),a=s?.attributes||{};
    if(!s||['unknown','unavailable'].includes(s.state)||!(Number(a.supported_features)&1)||numeric(a.min_temp)===null||numeric(a.max_temp)===null)return `<p>${this.t.missing}</p>`;
    return `<form data-control="${role}"><label>${esc(ROLES[role][0])} · ${esc(a.unit_of_measurement||a.temperature_unit||'')} (${a.min_temp}–${a.max_temp})<input name="temperature" type="number" required min="${Number(a.min_temp)}" max="${Number(a.max_temp)}" step="any" value="${numeric(a.temperature)??''}"></label><button type="submit" ${this._sending?'disabled':''}>${this.t.save}</button></form>`;
  }
  energy(){const e=this._energy;if(!e||e.error)return `<p class="notice">${this.t.pair}</p><p>${this.t.stats}</p>`;return `<p>${this.t.period}: ${esc(new Date(e.start).toISOString())} → ${esc(new Date(e.end).toISOString())}</p><div class="grid">${[['Pobrano / Consumed',e.consumed,'kWh'],['Oddano / Produced',e.produced,'kWh'],['COP',e.cop,''],[this.t.cost,this._config.tariff===null?null:e.consumed*this._config.tariff,this._config.currency]].map(([l,n,u])=>`<div class="metric"><small>${l}</small><div class="value">${n===null?'—':n.toFixed(2)} ${esc(u)}</div></div>`).join('')}</div><p class="notice">${this.t.noScop}</p>`;}
  render(){
    if(!this._config||!this.shadowRoot)return;
    const t=this.t;let content='';
    if(this._tab===0){const f=numeric(this.state('flow')?.state),r=numeric(this.state('return')?.state);content=`<div class="notice">${esc(this.state('climate')?.attributes.status||this.state('climate')?.attributes.hvac_action||this.state('climate')?.state||t.missing)}</div><div class="grid">${['flow','return','outside','room','tank','frequency'].map(k=>this.metric(k)).join('')}</div><p>ΔT: ${f!==null&&r!==null&&this.state('flow')?.attributes.unit_of_measurement===this.state('return')?.attributes.unit_of_measurement?(f-r).toFixed(1)+' '+esc(this.state('flow').attributes.unit_of_measurement||''):t.missing}</p>${this.control('climate')}`;}
    if(this._tab===1)content=['flow','return','outside','room','tank'].map(k=>this.chart(k)).join('');
    if(this._tab===2)content=this.energy();
    if(this._tab===3){const summary=compressorSummary(this._history[this.mapping.frequency],this._range?.start||0,this._range?.end||1);content=this.metric('frequency')+this.chart('frequency')+`<p class="notice">${t.estimate}: ${summary.coverage>0?summary.runHours.toFixed(2)+' h · '+summary.starts+' start · pokrycie/coverage '+(summary.coverage*100).toFixed(0)+'%':t.missing}. Max gap: 15 min.</p>`;}
    if(this._tab===4)content=this.metric('tank')+this.chart('tank')+this.control('water_heater');
    if(this._tab===5)content=`<div class="grid">${this.metric('defrost')}${this.metric('error')}</div><p class="notice">${t.noDefrost}</p><p>Brak zdalnego odczytu kodów serwisowych w MVP / Remote service-code polling is not implemented.</p><table><tbody>${Object.entries(this.mapping).filter(([,id])=>id).map(([role,id])=>`<tr><td>${esc(role)}</td><td>${esc(id)}</td><td>${esc(this._hass?.states[id]?.last_updated||t.missing)}</td></tr>`).join('')}</tbody></table>`;
    if(this._tab===6)content=`<p>${t.config}</p><p>${esc(this._registryError||'')}</p><p>${esc(this._discovery?.devices.length>1&&!this._config.device_id?'Wiele urządzeń: wybierz device_id w edytorze / Multiple devices: select a device in the editor.':'')}</p><table><tbody>${Object.keys(ROLES).map(k=>`<tr><td>${esc(ROLES[k][0])}</td><td>${esc(this.mapping[k]||'—')}</td></tr>`).join('')}</tbody></table><p>${this._config.tariff??'—'} ${esc(this._config.currency)}/kWh · ${t.noScop}</p>`;
    this.shadowRoot.innerHTML=`<style>${css}</style><ha-card><header><small>OPEN ECODAN · v0.1.0 MVP</small><h2>${esc(this._config.title||'Twój komfort. Twoje dane.')}</h2><span>Home Assistant · MELCloud</span></header><nav aria-label="Sections">${t.tabs.map((name,i)=>`<button data-tab="${i}" class="${i===this._tab?'active':''}" aria-pressed="${i===this._tab}">${name}</button>`).join('')}</nav><div class="body"><div class="toolbar"><select aria-label="History period" id="hours">${[6,24,72,168].map(h=>`<option value="${h}" ${h===this._hours?'selected':''}>${h} h</option>`).join('')}</select><button id="refresh" ${this._loading?'disabled':''}>${this._loading?t.loading:t.refresh}</button></div>${this._error?`<p class="notice error" role="alert">${esc(this._error)}</p>`:''}${this._message?`<p class="notice" role="status">${esc(this._message)}</p>`:''}${content}</div><footer>${t.history} · ${esc(this._loaded?.toLocaleTimeString()||'—')} · Brak telemetrii projektu / No project telemetry</footer></ha-card>`;
    this.shadowRoot.querySelectorAll('[data-tab]').forEach(el=>el.onclick=()=>{this._tab=Number(el.dataset.tab);this._message='';this.render();});
    this.shadowRoot.querySelector('#hours').onchange=e=>{this._hours=Number(e.target.value);this.load();};
    this.shadowRoot.querySelector('#refresh').onclick=()=>{if(!this._discovery){this._discovered=false;this.initialize();}else this.load();};
    this.shadowRoot.querySelectorAll('[data-chart]').forEach(box=>{
      const svg=box.querySelector('svg'),output=box.querySelector('output'),rows=this._history[this.mapping[box.dataset.chart]]||[];
      svg.onpointermove=event=>{const rect=svg.getBoundingClientRect(),fraction=Math.max(0,Math.min(1,((event.clientX-rect.left)/rect.width*720-45)/640)),time=this._range.start+fraction*(this._range.end-this._range.start);const nearest=rows.reduce((best,row)=>Math.abs(Date.parse(row.last_updated||row.last_changed)-time)<Math.abs(Date.parse(best?.last_updated||best?.last_changed)-time)||!best?row:best,null);if(nearest)output.textContent=new Date(nearest.last_updated||nearest.last_changed).toLocaleString()+' · '+nearest.state+' '+(this.state(box.dataset.chart)?.attributes.unit_of_measurement||'');};
    });
    this.shadowRoot.querySelectorAll('form').forEach(form=>form.onsubmit=async event=>{
      event.preventDefault();if(this._sending)return;
      try{const role=form.dataset.control,req=temperatureRequest(this.state(role),this.mapping[role],new FormData(form).get('temperature'));
        if(!this._hass.services?.[req.domain]?.[req.service])throw Error('Service unavailable');
        if(!window.confirm(`${t.confirm}\n${req.data.entity_id}: ${req.data.temperature}`))return;
        this._sending=true;this.render();await this._hass.callService(req.domain,req.service,req.data);this._message=t.sent;
      }catch(e){this._message=String(e.message||e);}finally{this._sending=false;this.render();}
    });
  }
}
class OpenEcodanEditor extends HTMLElement {
  constructor(){super();this.attachShadow({mode:'open'});}
  setConfig(config){this._config=validateConfig(config);this.render();}
  set hass(hass){this._hass=hass;if(!this._ready){this._ready=true;this.render();this.loadDevices();}}
  async loadDevices(){try{const [r,d]=await Promise.all([this._hass.callWS({type:'config/entity_registry/list'}),this._hass.callWS({type:'config/device_registry/list'})]);this._devices=discover(r,d,this._hass.states).devices;this.render();}catch{ /* Manual mappings remain available. */ }}
  emit(){this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:this._config},bubbles:true,composed:true}));}
  render(){if(!this._config)return;const c=this._config;this.shadowRoot.innerHTML=`<style>${css}</style><div class="body"><h3>Open Ecodan Dashboard</h3><label>Title<input id="title" value="${esc(c.title||'')}"></label><label>Language<select id="language"><option value="pl" ${c.language==='pl'?'selected':''}>Polski</option><option value="en" ${c.language==='en'?'selected':''}>English</option></select></label><label>Device (auto only when one device)<select id="device_id"><option value="">Auto</option>${(this._devices||[]).map(d=>`<option value="${esc(d.id)}" ${d.id===c.device_id?'selected':''}>${esc(d.name)}</option>`).join('')}</select></label><p>Empty = automatic; “None” disables a role. Energy is always mapped manually.</p>${Object.entries(ROLES).map(([role,[label,domains]])=>`<label>${esc(label)}<select data-role="${role}"><option value="__auto" ${c.entities[role]===undefined?'selected':''}>Auto</option><option value="" ${c.entities[role]===''?'selected':''}>None</option>${c.entities[role]&&!this._hass?.states[c.entities[role]]?`<option selected value="${esc(c.entities[role])}">${esc(c.entities[role])} (unavailable)</option>`:''}${Object.keys(this._hass?.states||{}).filter(id=>domains.split(',').includes(id.split('.')[0])).sort().map(id=>`<option value="${esc(id)}" ${c.entities[role]===id?'selected':''}>${esc(this._hass.states[id].attributes.friendly_name||id)} (${esc(id)})</option>`).join('')}</select></label>`).join('')}<label>Price / kWh<input type="number" id="tariff" min="0" step="any" value="${c.tariff??''}"></label><label>Currency<input id="currency" value="${esc(c.currency)}"></label><label><input type="checkbox" id="energy_scope_confirmed" ${c.energy_scope_confirmed?'checked':''}> Energy counters cover the SAME circuit and measurement scope</label><label><input type="checkbox" id="controls" ${c.controls?'checked':''}> Enable temperature controls (commands require confirmation)</label><p>Power controls are deliberately absent: MELCloud power can affect all zones and DHW.</p></div>`;
    this.shadowRoot.querySelectorAll('input,select').forEach(el=>el.onchange=()=>{const next={...this._config,entities:{...this._config.entities}};if(el.dataset.role){if(el.value==='__auto')delete next.entities[el.dataset.role];else next.entities[el.dataset.role]=el.value;}else next[el.id]=el.type==='checkbox'?el.checked:el.id==='tariff'?(el.value===''?null:Number(el.value)):el.value;try{this._config=validateConfig(next);el.setCustomValidity('');this.emit();}catch(e){el.setCustomValidity(e.message);el.reportValidity();}});
  }
}
if(!customElements.get('open-ecodan-dashboard'))customElements.define('open-ecodan-dashboard',OpenEcodanDashboard);
if(!customElements.get('open-ecodan-editor'))customElements.define('open-ecodan-editor',OpenEcodanEditor);
window.customCards=window.customCards||[];
if(!window.customCards.some(c=>c.type==='open-ecodan-dashboard'))window.customCards.push({type:'open-ecodan-dashboard',name:'Open Ecodan Dashboard',description:'MELCloud entities, local history and matched-period energy COP',preview:false});

}
