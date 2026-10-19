// Contract tests of the actual distribution file with a minimal DOM adapter.
// These do not replace browser testing inside an actual HA instance.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
function setup(){
 const registry=new Map();
 class Element {isConnected=true;attachShadow(){this.shadowRoot={innerHTML:'',querySelector:()=>({}),querySelectorAll:()=>[]};} }
 const ctx={HTMLElement:Element,window:{},customElements:{get:n=>registry.get(n),define:(n,c)=>registry.set(n,c)},document:{createElement:n=>new (registry.get(n))()},Date,URLSearchParams,setInterval,clearInterval,console};
 return {ctx,registry};
}
const code=await readFile(new URL('../dist/open-ecodan-dashboard.js',import.meta.url),'utf8');
test('distribution loads twice, registers card and editor once',()=>{const {ctx,registry}=setup();vm.runInNewContext(code,ctx);vm.runInNewContext(code,ctx);assert.equal(registry.size,2);assert.equal(ctx.window.customCards.length,1);});
test('card handles empty HA, registry denial, unavailable history and all tabs',async()=>{const {ctx,registry}=setup();vm.runInNewContext(code,ctx);const card=new (registry.get('open-ecodan-dashboard'))();card.setConfig({entities:{outside:'sensor.outside'}});card._hass={states:{},callWS:async()=>{throw Error('denied');},callApi:async()=>{throw Error('offline');}};await card.initialize();assert.equal(card._loading,false);assert.match(card._error,/unavailable/);for(let i=0;i<7;i++){card._tab=i;card.render();assert.ok(card.shadowRoot.innerHTML.includes('ha-card'));assert.ok(!card.shadowRoot.innerHTML.includes('NaN'));}assert.equal(card._energy,null);card.disconnectedCallback();});
test('card requests only mapped history and kWh hourly sums; sends no commands on load',async()=>{const {ctx,registry}=setup();vm.runInNewContext(code,ctx);const card=new (registry.get('open-ecodan-dashboard'))();card.setConfig({entities:{consumed:'sensor.input',produced:'sensor.output'},energy_scope_confirmed:true});const calls=[];const sensor={state:'3',attributes:{device_class:'energy',state_class:'total_increasing',unit_of_measurement:'kWh'}};card._hass={states:{'sensor.input':sensor,'sensor.output':sensor},callApi:async(method,url)=>{calls.push({method,url});return [];},callWS:async msg=>{calls.push(msg);const start=Date.parse(msg.start_time),end=Date.parse(msg.end_time)-3600000;const rows=[];for(let t=start;t<=end;t+=3600000)rows.push({start:t,sum:(t-start)/3600000});return {'sensor.input':rows,'sensor.output':rows.map(r=>({...r,sum:r.sum*3}))};},callService:()=>{throw Error('No control during load');}};await card.load();assert.equal(card._energy.cop,3);assert.equal(card._energy.consumed,24);assert.equal(card._energy.end-card._energy.start,24*3600000);assert.equal(calls[0].method,'GET');assert.equal(calls[1].units.energy,'kWh');assert.equal(calls[1].type,'recorder/statistics_during_period');card.disconnectedCallback();});
