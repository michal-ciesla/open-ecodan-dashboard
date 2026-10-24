import {ROLES,numeric,esc,validateConfig,discover,energyPeriod,dailyEnergy,compressorSummary,sampleSeries,temperatureRequest} from './core.js';
const labels = {
  pl: {
    tabs:[['overview','Przegląd','grid'],['temperature','Temperatury','thermo'],['energy','Energia i koszty','bolt'],['compressor','Sprężarka','fan'],['dhw','Ciepła woda','drop'],['diagnostics','Diagnostyka','pulse'],['settings','Ustawienia','settings']],
    brand:'Home climate, understood', live:'DANE LIVE', crumb:'Home Assistant',
    missing:'Brak danych', refresh:'Odśwież historię', loading:'Pobieranie…', history:'Historia lokalna HA',
    controls:'Sterowanie jest domyślnie wyłączone', save:'Zastosuj temperaturę',
    confirm:'Wysłać do Home Assistant zmianę temperatury?', sent:'Polecenie wysłane; czekaj na aktualizację encji.',
    config:'Mapowanie, taryfę i sterowanie zmienisz w edytorze karty Lovelace.',
    pair:'Brak pary liczników dla tego samego obiegu', stats:'Wybierz licznik pobranej i oddanej energii w edytorze karty i potwierdź zgodność zakresu. Bez tego karta nie policzy COP.',
    cost:'Szacowany koszt', estimate:'Oszacowanie z próbek historii; nie licznik sprzętowy',
    noDefrost:'Bez encji defrost nie można wiarygodnie wykryć odszraniania.',
    noScop:'COP okresu nie jest certyfikowanym SCOP. Taryfy dynamiczne i harmonogramy: użyj automatyzacji HA.',
    ranges:[['6','6 godzin'],['24','24 godziny'],['168','7 dni']],
    notice:'<strong>Dane z Twojej instalacji.</strong> Wszystkie wartości pochodzą z encji Home Assistanta i lokalnego Recordera. Brakujące źródło pokazuje „Brak danych”.',
    heads:{
      overview:['Dobrze wiedzieć, co się dzieje.','Cała instalacja w jednym miejscu. Bez zgadywania.'],
      temperature:['Temperatury pod kontrolą.','Porównaj obiegi, zobacz reakcję instalacji i znajdź konkretny odczyt.'],
      energy:['Energia, która ma znaczenie.','Bilans poboru, oddanego ciepła i kosztu — z liczników, nie z szacunków.'],
      compressor:['Spokojny rytm pracy.','Częstotliwość, cykle i przerwy w czytelnej osi czasu.'],
      dhw:['Ciepła woda, kiedy jej potrzebujesz.','Stan zasobnika, historia i sterowanie temperaturą zadaną.'],
      diagnostics:['Zrozum stan instalacji.','Pomiary, dostępność encji i zdarzenia z opisem ich ograniczeń.'],
      settings:['Panel dopasowany do Twoich encji.','Mapowanie źródeł, taryfa i dostępność funkcji.']
    },
    eyebrow:'Instalacja / Home Assistant',
    series:{flow:'Zasilanie',return:'Powrót',outside:'Na zewnątrz',room:'W pomieszczeniu',tank:'Zasobnik CWU',frequency:'Częstotliwość'},
    modes:{heat:'Ogrzewanie domu',dhw:'Ładowanie CWU',defrost:'Odszranianie',idle:'Postój',unknown:'Brak danych',nodata:'Brak danych'},
    short:{heat:'CO',dhw:'CWU',defrost:'Defrost',idle:'Postój',unknown:'?'},
    csv:'CSV', samples:'Próbki historii', hover:'Wskaż wykres lub dotknij punktu', show:'Pokaż dane', hide:'Ukryj dane',
    diagram:['Jak pracuje Twoja instalacja','Wybierz element schematu, aby zobaczyć szczegóły'],
    air:'POWIETRZE', house:'Ogrzewanie domu', tankTitle:'Zasobnik CWU', pump:'Pompa ciepła', dhwLoop:'Obieg CWU',
    tempsNow:['Temperatury teraz','Stan encji z tej chwili'], deltaLabel:'Różnica zasilanie − powrót',
    roomTarget:'Cel pomieszczenia', target:'Temperatura zadana', measured:'pomiar z encji',
    tempChart:['Temperatury w czasie','Kliknij legendę, aby porównać wybrane serie'],
    compareChart:['Porównanie temperatur','Wspólna oś temperatury · wyłącz serie, aby dopasować skalę'],
    roomChart:['Komfort w pomieszczeniu','Pomieszczenie na tle temperatury zewnętrznej'],
    freqChart:['Częstotliwość sprężarki','Zera oznaczają postój w zapisanej historii'],
    tankChart:['Historia zasobnika','Temperatura zasobnika i zasilania'],
    eventsTitle:['Oś zdarzeń','Z historii encji w wybranym zakresie'], eventsMore:'Szczegóły →', noEvents:'Brak zapisanych zdarzeń w tym zakresie.',
    barsTitle:['Bilans energii · 14 dni','Dobowe przyrosty liczników z Recordera'],
    barsIn:'Energia pobrana', barsOut:'Energia oddana', barsHover:'Najedź na słupki, aby porównać dzień',
    effTitle:['Efektywność okresu','COP liczony z dwóch zgodnych liczników'],
    copMethod:['COP liczony z energii','Oddana energia cieplna ÷ pobrana energia elektryczna dla tego samego okresu i obiegu. To nie jest chwilowy COP ani SCOP.'],
    timelineTitle:['Rytm pracy pompy','Stany z historii encji; wybierz segment'],
    timelineHint:'Dotknij segmentu, aby zobaczyć godzinę i stan.',
    interpret:['Co mówi ten wykres?','Pomoc w interpretacji'],
    modulation:['Modulacja nie oznacza taktowania','Zmiana częstotliwości może być normalną regulacją mocy. Spadek Hz nie jest sam w sobie startem lub zatrzymaniem sprężarki.'],
    gaps:'Długie przerwy w historii obniżają pokrycie analizy. Starty i czas pracy policzone z próbek to nie liczniki sprzętowe.',
    tankCard:['Zasobnik ciepłej wody','Pomiar i temperatura zadana z encji'],
    tankSafe:['Każda zmiana wymaga potwierdzenia','Karta wysyła wyłącznie set_temperature do wskazanej encji, po potwierdzeniu w okienku. Nie przełącza zasilania ani trybów.'],
    zone:['Strefa ogrzewania','Temperatura zadana strefy z encji climate'],
    sourceTitle:'Źródło danych', defrostTitle:'Odszranianie', errorTitle:'Kody błędów',
    availability:['Dostępność funkcji','Co działa przy obecnym mapowaniu'],
    availHead:['Funkcja','Źródło','Stan'], avail:{ok:'Dostępne',no:'Brak źródła'},
    noData:['Brak danych ≠ brak problemu','Niedostępna encja jest oznaczona jako „Brak danych”. Karta nie zastępuje jej zerem ani zielonym statusem.'],
    mappingTitle:['Mapowanie źródeł danych','Encje użyte przez tę kartę'], mappingHead:['Rola','Encja','Ostatnia aktualizacja'],
    tariffTitle:['Taryfa i waluta','Stała cena energii z konfiguracji karty'],
    exported:'Pobrano CSV z historii encji.', copTitle:'COP okresu — zgodne liczniki i godziny',
    infoTitle:'Panel, który pomaga zrozumieć pompę',
    info:'<p>Ten panel pokazuje <strong>wyłącznie dane z Twojego Home Assistanta</strong>: bieżące stany encji, lokalną historię Recordera i statystyki energii.</p><p>Przeglądaj zakładki, wskaż wykres, wyłączaj serie w legendzie, wybierz zakres lub element schematu. Możesz pobrać CSV z próbkami historii.</p><p>Karta wysyła do HA tylko polecenie <code>set_temperature</code>, po potwierdzeniu. Sterowania zasilaniem celowo nie ma: w MELCloud dotyczy ono wszystkich stref i CWU.</p>'
  },
  en: {
    tabs:[['overview','Overview','grid'],['temperature','Temperatures','thermo'],['energy','Energy and cost','bolt'],['compressor','Compressor','fan'],['dhw','Hot water','drop'],['diagnostics','Diagnostics','pulse'],['settings','Settings','settings']],
    brand:'Home climate, understood', live:'LIVE DATA', crumb:'Home Assistant',
    missing:'No data', refresh:'Refresh history', loading:'Loading…', history:'Local HA history',
    controls:'Controls are disabled by default', save:'Apply temperature',
    confirm:'Send temperature change to Home Assistant?', sent:'Command sent; waiting for entity update.',
    config:'Change mappings, tariff and controls in the Lovelace card editor.',
    pair:'No counter pair for the same circuit', stats:'Select a consumed and a produced energy counter in the card editor and confirm matching scope. Without it the card will not compute COP.',
    cost:'Estimated cost', estimate:'Estimate from history samples; not a hardware counter',
    noDefrost:'Without a defrost entity, defrost cannot be reliably detected.',
    noScop:'Period COP is not certified SCOP. Use HA automations for dynamic tariffs and scheduling.',
    ranges:[['6','6 hours'],['24','24 hours'],['168','7 days']],
    notice:'<strong>Your own data.</strong> Every value comes from Home Assistant entities and the local Recorder. A missing source shows “No data”.',
    heads:{
      overview:['Good to know what is going on.','The whole system in one place. No guessing.'],
      temperature:['Temperatures under control.','Compare circuits, see how the system reacts, find a single reading.'],
      energy:['Energy that matters.','Consumption, delivered heat and cost — from counters, not estimates.'],
      compressor:['A calm working rhythm.','Frequency, cycles and pauses on a readable timeline.'],
      dhw:['Hot water when you need it.','Tank state, history and target temperature control.'],
      diagnostics:['Understand the system state.','Readings, entity availability and events with their limits.'],
      settings:['A panel matched to your entities.','Source mapping, tariff and feature availability.']
    },
    eyebrow:'Installation / Home Assistant',
    series:{flow:'Flow',return:'Return',outside:'Outside',room:'Room',tank:'DHW tank',frequency:'Frequency'},
    modes:{heat:'Space heating',dhw:'DHW charging',defrost:'Defrost',idle:'Idle',unknown:'No data',nodata:'No data'},
    short:{heat:'Heat',dhw:'DHW',defrost:'Defrost',idle:'Idle',unknown:'?'},
    csv:'CSV', samples:'History samples', hover:'Hover the chart or tap a point', show:'Show data', hide:'Hide data',
    diagram:['How your system works','Select a part of the diagram for details'],
    air:'AIR', house:'Space heating', tankTitle:'DHW tank', pump:'Heat pump', dhwLoop:'DHW circuit',
    tempsNow:['Temperatures now','Entity states at this moment'], deltaLabel:'Flow − return difference',
    roomTarget:'Room target', target:'Target temperature', measured:'entity reading',
    tempChart:['Temperatures over time','Click the legend to compare series'],
    compareChart:['Temperature comparison','Shared temperature axis · hide series to rescale'],
    roomChart:['Indoor comfort','Room against outside temperature'],
    freqChart:['Compressor frequency','Zeros mean idle in the recorded history'],
    tankChart:['Tank history','Tank and flow temperature'],
    eventsTitle:['Event timeline','From entity history in the selected range'], eventsMore:'Details →', noEvents:'No recorded events in this range.',
    barsTitle:['Energy balance · 14 days','Daily counter deltas from Recorder'],
    barsIn:'Consumed energy', barsOut:'Delivered energy', barsHover:'Hover the bars to compare a day',
    effTitle:['Period efficiency','COP from two matching counters'],
    copMethod:['COP from energy','Delivered heat ÷ electrical energy for the same period and circuit. Not instantaneous COP, not SCOP.'],
    timelineTitle:['Pump working rhythm','States from entity history; select a segment'],
    timelineHint:'Tap a segment to see its time and state.',
    interpret:['What does this chart say?','Reading help'],
    modulation:['Modulation is not cycling','A frequency change can be normal output control. Falling Hz is not by itself a compressor start or stop.'],
    gaps:'Long history gaps lower analysis coverage. Starts and runtime from samples are not hardware counters.',
    tankCard:['Hot water tank','Measurement and target from entities'],
    tankSafe:['Every change needs confirmation','The card only sends set_temperature to the mapped entity, after a confirmation dialog. It never switches power or modes.'],
    zone:['Heating zone','Zone target from the climate entity'],
    sourceTitle:'Data source', defrostTitle:'Defrost', errorTitle:'Error codes',
    availability:['Feature availability','What works with the current mapping'],
    availHead:['Feature','Source','State'], avail:{ok:'Available',no:'No source'},
    noData:['No data ≠ no problem','An unavailable entity is marked “No data”. The card never replaces it with a zero or a green status.'],
    mappingTitle:['Data source mapping','Entities used by this card'], mappingHead:['Role','Entity','Last updated'],
    tariffTitle:['Tariff and currency','Fixed energy price from the card configuration'],
    exported:'CSV with entity history downloaded.', copTitle:'Period COP — matching counters and hours',
    infoTitle:'A panel that helps you understand the pump',
    info:'<p>This panel shows <strong>only data from your Home Assistant</strong>: current entity states, local Recorder history and energy statistics.</p><p>Browse the tabs, hover a chart, toggle series in the legend, pick a range or a diagram part. You can download a CSV of the history samples.</p><p>The card sends only <code>set_temperature</code> to HA, after confirmation. Power control is deliberately absent: in MELCloud it affects all zones and DHW.</p>'
  }
};

const SPRITE = `<svg aria-hidden="true" style="position:absolute;width:0;height:0"><defs>
<symbol id="oed-grid" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></symbol>
<symbol id="oed-thermo" viewBox="0 0 24 24"><path d="M9 14V5a3 3 0 0 1 6 0v9a5 5 0 1 1-6 0Z"/><path d="M12 8v10"/><circle cx="12" cy="18" r="1"/></symbol>
<symbol id="oed-bolt" viewBox="0 0 24 24"><path d="m13 2-9 12h7l-1 8 10-13h-7z"/></symbol>
<symbol id="oed-fan" viewBox="0 0 24 24"><circle cx="12" cy="12" r="2"/><path d="M12 10c-5-7 5-11 6-5 1 3-2 5-4 6M14 12c8-1 6 9 1 7-3-1-3-4-3-5M11 14c-3 8-11 1-6-3 2-2 5-1 6 0"/></symbol>
<symbol id="oed-drop" viewBox="0 0 24 24"><path d="M12 2C9 7 5 10 5 14a7 7 0 0 0 14 0c0-4-4-7-7-12Z"/><path d="M9 15a3 3 0 0 0 3 3"/></symbol>
<symbol id="oed-pulse" viewBox="0 0 24 24"><path d="M2 12h5l3-8 4 16 3-8h5"/></symbol>
<symbol id="oed-settings" viewBox="0 0 24 24"><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/></symbol>
<symbol id="oed-info" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/></symbol>
<symbol id="oed-download" viewBox="0 0 24 24"><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/></symbol>
<symbol id="oed-home" viewBox="0 0 24 24"><path d="m3 10 9-7 9 7v11H3Zm6 11v-7h6v7"/></symbol>
<symbol id="oed-check" viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></symbol>
<symbol id="oed-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></symbol>
<symbol id="oed-close" viewBox="0 0 24 24"><path d="m6 6 12 12M6 18 18 6"/></symbol>
<symbol id="oed-leaf" viewBox="0 0 24 24"><path d="M20 3C8 2 2 10 7 16s15 2 13-13ZM4 21 16 8"/></symbol>
<symbol id="oed-refresh" viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v4h-4"/></symbol>
</defs></svg>`;
const icon = n => `<svg class="icon" aria-hidden="true"><use href="#oed-${n}"/></svg>`;

// Paleta, typografia i układ przeniesione z makiety. Lewy pasek nawigacji zastąpiony
// poziomym, bo karta Lovelace nie może zająć lewej kolumny przeglądarki.
const css = `
:host{display:block;--bg:#101617;--panel:#182022;--panel2:#1d282b;--line:#2b383a;--text:#eff6f5;--muted:#91a6a7;--teal:#56ddc0;--blue:#73b6f4;--orange:#f3b36b;--purple:#bc9aff;--red:#ff858b;--grid:#293639;--shadow:0 18px 45px #0002;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
.app.light{--bg:#eef3f2;--panel:#fff;--panel2:#f4f8f7;--line:#dbe5e2;--text:#18322f;--muted:#647d78;--teal:#087e69;--blue:#276eb9;--orange:#b56919;--purple:#7b4abd;--red:#c63c50;--grid:#e0e8e6}
*{box-sizing:border-box}
ha-card{display:block;overflow:hidden;border:0;background:transparent;box-shadow:none}
.app{background:var(--bg);color:var(--text);font-size:14px;line-height:1.5;border-radius:16px;overflow:hidden;color-scheme:dark}
.app.light{color-scheme:light}
button,input,select{font:inherit}
button{cursor:pointer;color:inherit;border:0;background:transparent}
button:disabled{cursor:not-allowed;opacity:.45}
button:focus-visible,input:focus-visible,select:focus-visible,[tabindex]:focus-visible{outline:3px solid var(--teal);outline-offset:3px}
code{font-size:11px;overflow-wrap:anywhere}
h1,h2{font-weight:600}
.icon{width:20px;height:20px;stroke:currentColor;stroke-width:1.7;fill:none;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0;vertical-align:middle}
.topbar{display:flex;align-items:center;justify-content:space-between;gap:15px;padding:16px 24px;border-bottom:1px solid var(--line);background:var(--panel)}
.brand{display:flex;align-items:center;gap:11px;font-size:17px;font-weight:700;letter-spacing:-.6px}
.brandmark{width:34px;height:37px;display:grid;place-items:center;color:var(--teal);background:#56ddc012;border:1px solid #56ddc033;border-radius:11px}
.brandmark .icon{width:24px;height:24px}
.brand small{display:block;font-size:9px;letter-spacing:2px;text-transform:uppercase;font-weight:500;color:var(--muted)}
.top-actions{display:flex;gap:9px;align-items:center;flex-wrap:wrap;justify-content:flex-end}
.device-chip{display:flex;align-items:center;gap:7px;border:1px solid var(--line);border-radius:9px;padding:7px 11px;font-size:11px;color:var(--muted)}
.device-chip b{color:var(--text);font-weight:500}
.live{color:var(--teal);background:#56ddc00d;border:1px solid #56ddc035;padding:5px 10px;font-size:10px;letter-spacing:.8px;border-radius:6px;font-weight:650}
.iconbtn{display:grid;place-items:center;width:34px;height:34px;border:1px solid var(--line);border-radius:8px}
.nav{display:flex;gap:5px;overflow:auto;padding:10px 18px;border-bottom:1px solid var(--line);background:var(--panel)}
.nav button{display:flex;align-items:center;gap:9px;padding:10px 13px;color:var(--muted);border-radius:9px;font-weight:550;white-space:nowrap;font-size:13px}
.nav button:hover{background:var(--panel2);color:var(--text)}
.nav button.active{color:var(--teal);background:#56ddc013}
.nav .icon{width:17px;height:17px}
.main{max-width:1600px;margin:auto;padding:26px 24px 18px}
.eyebrow{text-transform:uppercase;letter-spacing:1.8px;font-size:10px;color:var(--muted);font-weight:600}
.heading{display:flex;align-items:center;justify-content:space-between;margin-bottom:23px;gap:18px}
.heading h1{font-size:27px;letter-spacing:-1px;margin:4px 0 5px}
.heading p{margin:0;color:var(--muted);font-size:12px}
.heading-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.btn{border:1px solid var(--line);background:var(--panel);padding:9px 13px;display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:8px;font-size:12px;font-weight:550}
.btn:hover{border-color:var(--muted)}
.btn.primary{background:var(--teal);color:#082e27;border-color:transparent}
.light .btn.primary{color:#fff}
.btn .icon{width:15px;height:15px}
.range{display:flex;padding:3px;background:var(--panel);border:1px solid var(--line);border-radius:8px}
.range button{padding:6px 11px;border-radius:5px;font-size:11px;color:var(--muted);white-space:nowrap}
.range button.active{background:var(--panel2);color:var(--text);box-shadow:0 1px 4px #0002}
.notice{padding:10px 14px;border-radius:8px;background:#56ddc008;border:1px solid #56ddc022;color:var(--muted);font-size:11px;margin-bottom:20px;display:flex;align-items:center;gap:9px}
.notice .icon{color:var(--teal);width:16px;height:16px}
.notice strong{color:var(--teal);font-weight:550}
.notice.warn{background:#f3b36b08;border-color:#f3b36b22}
.notice.warn .icon,.notice.warn strong{color:var(--orange)}
.notice.error{background:#ff858b0d;border-color:#ff858b33}
.notice.error .icon,.notice.error strong{color:var(--red)}
.stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:20px}
.stat,.card{background:var(--panel);border:1px solid var(--line);border-radius:13px;box-shadow:var(--shadow)}
.stat{padding:17px 19px;position:relative;overflow:hidden}
.stat-top{display:flex;align-items:center;justify-content:space-between;color:var(--muted);font-size:11px;gap:8px}
.stat-top .icon{color:var(--teal);width:17px;height:17px}
.stat-value{font-size:30px;font-weight:550;letter-spacing:-1.2px;margin:11px 0 3px;line-height:1.2}
.stat-value span{font-size:14px;color:var(--muted);letter-spacing:0;font-weight:400;margin-left:5px}
.stat-value.none{font-size:18px;color:var(--muted);letter-spacing:-.2px}
.stat-foot{font-size:10px;color:var(--muted);margin-top:9px;overflow-wrap:anywhere}
.stat .spark{position:absolute;width:80px;height:26px;right:18px;bottom:14px;opacity:.65}
.layout{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(285px,1fr);gap:18px;margin-bottom:18px}
.layout.equal{grid-template-columns:repeat(2,minmax(0,1fr))}
.card{min-width:0;overflow:hidden}
.card-head{padding:18px 21px 0;display:flex;align-items:start;justify-content:space-between;gap:12px}
.card h2{margin:0;font-size:14px;font-weight:550;letter-spacing:-.2px}
.card-head p{margin:4px 0 0;color:var(--muted);font-size:10px}
.card-body{padding:20px 21px}
.tag{display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border-radius:5px;background:var(--panel2);border:1px solid var(--line);color:var(--muted);font-size:9px;white-space:nowrap}
.tag.green{color:var(--teal);border-color:#56ddc02b;background:#56ddc008}
.dot{width:6px;height:6px;display:inline-block;background:var(--teal);border-radius:50%;box-shadow:0 0 10px #56ddc033}
.diagram{padding:15px 18px 12px}
.diagram-svg{width:100%;height:auto;display:block;overflow:visible}
.diagram-svg text{font-family:inherit;fill:var(--text)}
.diagram-svg .sub{fill:var(--muted);font-size:10px}
.diagram-svg .node{fill:var(--panel2);stroke:var(--line);stroke-width:1}
.diagram-svg .heat{stroke:var(--orange);fill:none;stroke-width:2.3}
.diagram-svg .return{stroke:var(--blue);fill:none;stroke-width:2.3}
.diagram-svg .water{stroke:var(--purple);fill:none;stroke-width:2.3}
.diagram-svg [data-node]{cursor:pointer}
.diagram-svg [data-node]:hover .node{stroke:var(--teal)}
.flow-dot{fill:var(--orange)}
.diagram-note{display:flex;align-items:center;justify-content:space-between;padding:13px 17px;border-top:1px solid var(--line);font-size:10px;color:var(--muted);gap:8px;flex-wrap:wrap}
.legend{display:flex;gap:15px;align-items:center;flex-wrap:wrap}
.legend span{display:flex;align-items:center;gap:6px}
.swatch{width:7px;height:7px;border-radius:50%;display:inline-block;background:var(--teal)}
.temps{display:grid;grid-template-columns:1fr 1fr;gap:0 20px}
.temp{padding:12px 0;border-bottom:1px solid var(--line)}
.temp label{font-size:10px;color:var(--muted);display:block}
.temp b{display:block;font-size:21px;font-weight:500;letter-spacing:-.4px;margin-top:3px}
.temp b span{font-size:12px;color:var(--muted)}
.temp b.none{font-size:14px;color:var(--muted)}
.temp:last-child,.temp:nth-last-child(2){border-bottom:0}
.delta{background:var(--panel2);border-radius:8px;margin-top:12px;padding:11px 12px;display:flex;justify-content:space-between;align-items:center;font-size:10px;color:var(--muted);gap:10px}
.delta b{font-size:14px;color:var(--teal);font-weight:500;white-space:nowrap}
.chart-wrap{position:relative;padding:8px 17px}
.chart{width:100%;height:225px;display:block;overflow:visible}
.chart text{fill:var(--muted);font-size:10px;font-family:inherit}
.chart .grid{stroke:var(--grid);stroke-width:1}
.chart-empty{padding:34px 21px;color:var(--muted);font-size:12px;text-align:center}
.series-legend{display:flex;flex-wrap:wrap;gap:6px 12px;padding:14px 21px 0}
.series-legend button,.series-legend span{display:flex;gap:6px;align-items:center;font-size:10px;color:var(--muted);padding:3px 0}
.series-legend button.off{opacity:.35;text-decoration:line-through}
.chart-tip{position:absolute;pointer-events:none;top:20px;left:60px;min-width:145px;max-width:240px;border:1px solid var(--line);border-radius:8px;background:var(--panel);box-shadow:0 5px 20px #0003;padding:10px 12px;font-size:11px;display:none;z-index:3}
.chart-tip strong{display:block;margin-bottom:5px;color:var(--muted);font-size:10px}
.chart-tip span{display:block;padding:2px 0}
.chart-bottom{padding:0 21px 15px;display:flex;justify-content:space-between;gap:10px;align-items:center;color:var(--muted);font-size:10px}
.link-btn{color:var(--teal);font-size:10px;padding:4px 0}
.event-list{padding:8px 21px 10px}
.event{display:flex;gap:12px;align-items:start;padding:13px 0;border-bottom:1px solid var(--line)}
.event:last-child{border:0}
.event-symbol{background:var(--panel2);border:1px solid var(--line);border-radius:8px;width:31px;height:31px;display:grid;place-items:center;color:var(--teal)}
.event-symbol .icon{width:15px;height:15px}
.event strong{font-size:11px;display:block;font-weight:500}
.event p{font-size:10px;color:var(--muted);margin:3px 0;overflow-wrap:anywhere}
.event time{font-size:9px;color:var(--muted);margin-left:auto;white-space:nowrap}
.progress-info{display:flex;justify-content:space-between;font-size:11px;margin-bottom:9px;gap:10px}
.progress-info span{color:var(--muted)}
.progress-info strong{font-weight:500;overflow-wrap:anywhere;text-align:right}
.callout{padding:13px;border-radius:9px;background:#56ddc008;border:1px solid #56ddc022;font-size:11px;color:var(--muted);margin-top:14px}
.callout strong{color:var(--teal);display:block;margin-bottom:3px;font-weight:500}
.callout.warn{background:#f3b36b08;border-color:#f3b36b22}
.callout.warn strong{color:var(--orange)}
.footer{display:flex;justify-content:space-between;font-size:10px;color:var(--muted);gap:14px;margin-top:25px;border-top:1px solid var(--line);padding-top:17px}
.table-scroll{overflow:auto}
table{width:100%;border-collapse:collapse;font-size:11px;white-space:nowrap}
th{text-transform:uppercase;letter-spacing:1px;color:var(--muted);font-size:9px;font-weight:500;text-align:left}
td,th{padding:11px 10px;border-bottom:1px solid var(--line)}
td:last-child,th:last-child{text-align:right}
.table-scroll table tr:last-child td{border-bottom:0}
.chart-table{display:none;max-height:260px;overflow:auto;margin:0 21px 15px}
.chart-table.open{display:block}
.table-toggle{color:var(--teal);font-size:10px}
.large-chart .chart{height:310px}
.statusgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.statusitem{padding:16px}
.statusitem small{color:var(--muted);font-size:10px}
.statusitem b{font-weight:500;display:flex;align-items:center;gap:7px;margin:8px 0 3px}
.statusitem p{font-size:10px;color:var(--muted);margin:0}
.settings-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.field{margin:0 0 18px}
.field label{font-size:11px;display:block;margin-bottom:7px;color:var(--muted)}
input,select{border:1px solid var(--line);border-radius:7px;background:var(--panel2);color:var(--text);padding:9px 11px;max-width:100%}
.field input,.field select{width:100%}
.toggle{display:flex;justify-content:space-between;gap:14px;padding:13px 0;border-bottom:1px solid var(--line);font-size:11px;align-items:center}
input[type=checkbox]{accent-color:var(--teal);width:16px;height:16px}
.tank-layout{display:grid;grid-template-columns:180px 1fr;align-items:center;gap:25px}
.tank{width:130px;height:230px;border:2px solid var(--line);border-radius:50px 50px 30px 30px;position:relative;overflow:hidden;margin:15px auto;background:var(--panel2)}
.tank-fill{position:absolute;bottom:0;width:100%;background:linear-gradient(0deg,#56ddc00a,#56ddc02b);border-top:1px solid #56ddc066}
.tank-text{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column}
.tank-text b{font-size:27px;font-weight:500}
.tank-text span{font-size:10px;color:var(--muted)}
.thermostat{display:flex;align-items:center;gap:18px;justify-content:space-between;padding:17px;border:1px solid var(--line);border-radius:10px;margin:14px 0}
.thermostat b{font-size:23px;font-weight:500}
.thermostat small{color:var(--muted);display:block;font-size:10px;overflow-wrap:anywhere}
.presets{display:flex;gap:8px;flex-wrap:wrap}
.presets button{background:var(--panel2);border:1px solid var(--line);border-radius:7px;padding:8px 12px;font-size:10px}
.presets button.active{border-color:var(--teal);color:var(--teal)}
.timeline{display:flex;height:30px;border-radius:6px;overflow:hidden;margin:15px 0 8px;gap:2px}
.timeline button{height:100%;min-width:2px;padding:0;background:#56ddc04d}
.timeline button.idle{background:var(--panel2)}
.timeline button.dhw{background:#bc9aff77}
.timeline button.defrost{background:#73b6f488}
.timeline button.nodata{background:repeating-linear-gradient(45deg,var(--line),var(--line) 2px,transparent 2px,transparent 4px)}
.timeline button:hover{filter:brightness(1.5)}
.timeline-hours{display:flex;justify-content:space-between;color:var(--muted);font-size:9px}
.tip-label{font-size:10px;min-height:21px;margin-top:12px;color:var(--muted)}
.modal{position:fixed;inset:0;background:#0008;display:none;align-items:center;justify-content:center;z-index:30;padding:20px;backdrop-filter:blur(5px)}
.modal.open{display:flex}
.dialog{max-width:520px;width:100%;padding:25px;background:var(--panel);border:1px solid var(--line);border-radius:16px;box-shadow:0 30px 80px #0005;max-height:90vh;overflow:auto;color:var(--text)}
.dialog-head{display:flex;justify-content:space-between;align-items:center;gap:10px}
.dialog h2{font-size:18px;letter-spacing:-.5px;margin:0}
.dialog p{color:var(--muted);font-size:12px;line-height:1.8}
.toast{position:fixed;bottom:25px;left:50%;transform:translateX(-50%) translateY(140px);transition:.2s;background:var(--panel);border:1px solid var(--teal);box-shadow:0 10px 40px #0004;border-radius:10px;padding:13px 20px;font-size:12px;z-index:40;max-width:90vw;color:var(--text)}
.toast.show{transform:translateX(-50%) translateY(0)}
.mode-pills{display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end}
.mode-pills span{color:var(--muted);border:1px solid var(--line);padding:5px 8px;border-radius:5px;font-size:9px}
.mode-pills span.active{color:var(--teal);border-color:#56ddc044;background:#56ddc009}
.cap{color:var(--orange);font-size:10px}
form.control label{font-size:11px;color:var(--muted);display:block;margin-bottom:7px}
form.control input{width:100%;margin:7px 0 13px}
@media(max-width:1150px){.main{padding:22px 16px}.stats{gap:10px}.stat{padding:15px}.stat-value{font-size:26px}.layout{grid-template-columns:minmax(0,1.45fr) minmax(265px,1fr)}.stat .spark{display:none}.heading{align-items:start}}
@media(max-width:920px){.layout{grid-template-columns:1fr}.layout.equal{grid-template-columns:1fr 1fr}.settings-grid{grid-template-columns:1fr}.statusgrid{grid-template-columns:1fr 1fr}.heading h1{font-size:24px}}
@media(max-width:620px){.topbar{padding:14px 16px}.nav{padding:8px 12px}.main{padding:20px 14px 16px}.heading{display:block;margin-bottom:15px}.heading-actions{margin-top:16px}.stats{grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px}.stat-value{font-size:24px}.layout,.layout.equal{grid-template-columns:1fr;gap:14px;margin-bottom:14px}.card-head{padding:16px 16px 0}.card-body{padding:16px}.diagram{padding:12px 3px}.chart-wrap{padding-inline:5px}.chart{height:210px}.large-chart .chart{height:260px}.chart-bottom,.series-legend{padding-inline:16px}.statusgrid{grid-template-columns:1fr}.tank-layout{grid-template-columns:120px 1fr;gap:12px}.tank{width:98px;height:195px}.footer{display:block}.footer span{display:block;margin:6px 0}.device-chip{display:none}}
@media(prefers-reduced-motion:reduce){.flow-dot{display:none}.toast{transition:none}}
`;

const COLORS = {flow:'var(--orange)',return:'var(--blue)',outside:'var(--muted)',room:'var(--teal)',tank:'var(--purple)',frequency:'var(--teal)'};
const STEPS = {6:72, 24:96, 168:168};
const TIMELINE_FILL = {heat:'#56ddc04d',dhw:'#bc9aff77',defrost:'#73b6f488',idle:'var(--panel2)',nodata:'var(--line)'};

class OpenEcodanDashboard extends HTMLElement {
  constructor(){super();this.attachShadow({mode:'open'});this._page='overview';this._hours=24;this._history={};this._auto={};this._request=0;this._hidden=new Set();this._tables=new Set();this._charts={};this._note='';this._pendingTarget=null;}
  static getConfigElement(){return document.createElement('open-ecodan-editor');}
  static getStubConfig(){return {type:'custom:open-ecodan-dashboard',entities:{},language:'pl',controls:false};}
  setConfig(c){this._config=validateConfig(c);this._auto={};this._discovered=false;this._history={};this._energy=null;this._daily=null;this._cache=null;this._request++;this._loading=false;this.render();if(this._hass)this.initialize();}
  set hass(hass){this._hass=hass;if(!this._config)return;if(this.isConnected&&!this._discovered)this.initialize();this.schedule();}
  getCardSize(){return 16;}
  getGridOptions(){return {columns:'full',min_columns:6,rows:'auto',min_rows:8};}
  connectedCallback(){if(this._hass&&this._config)this.initialize();this._timer=setInterval(()=>{if(this._hass&&this._config)this.load();},300000);}
  disconnectedCallback(){clearInterval(this._timer);clearTimeout(this._paint);clearTimeout(this._toastTimer);this._paint=null;this._request++;this._loading=false;this._discovered=false;}
  get t(){return labels[this._config?.language||'pl'];}
  get lang(){return this._config?.language==='en'?'en':'pl';}
  get mapping(){return {...this._auto,...this._config.entities};}
  get light(){return this._hass?.themes?.darkMode===false;}
  // Repaint is throttled: one MELCloud poll touches many entities at once.
  schedule(){
    if(this._paint)return;
    const active=this.shadowRoot.activeElement;
    if(active&&['INPUT','SELECT'].includes(active.tagName))return;
    const wait=Math.max(0,1200-(Date.now()-(this._painted||0)));
    this._paint=setTimeout(()=>{this._paint=null;this.render();},wait);
  }
  state(role){return this._hass?.states[this.mapping[role]];}
  unit(role){return this.state(role)?.attributes.unit_of_measurement||'';}
  num(role){const s=this.state(role);return s&&!['unavailable','unknown'].includes(s.state)?numeric(s.state):null;}
  on(role){const s=this.state(role);return s&&['on','off'].includes(s.state)?s.state==='on':null;}
  targetValue(role){return numeric(this.state(role)?.attributes.temperature);}
  fmt(n,digits=1){return n===null||n===undefined?null:Number(n).toLocaleString(this.lang,{minimumFractionDigits:digits,maximumFractionDigits:digits});}
  value(role,digits=1){
    const n=this.num(role);
    if(n!==null)return this.fmt(n,digits)+(this.unit(role)?' '+this.unit(role):'');
    const s=this.state(role);
    return s&&!['unavailable','unknown'].includes(s.state)?s.state:null;
  }

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
    this._loading=true;this._error='';this._history={};this._cache=null;const request=++this._request;
    const end=new Date(),start=new Date(end.getTime()-this._hours*3600000);
    this._range={start:start.getTime(),end:end.getTime()};this.render();
    const ids=[...new Set(Object.values(this.mapping).filter(Boolean))];
    const jobs=[];
    if(ids.length)jobs.push(this._hass.callApi('GET',`history/period/${start.toISOString()}?${new URLSearchParams({filter_entity_id:ids.join(','),end_time:end.toISOString(),significant_changes_only:'0'})}`).then(data=>{if(request!==this._request)return;this._history=Object.fromEntries(data.filter(r=>r.length).map(r=>[r[0].entity_id,r]));this._cache=null;}));
    const {consumed,produced}=this.mapping;
    this._energy=null;this._daily=null;
    const counter=id=>{const s=this._hass.states[id];return !!s&&s.attributes.device_class==='energy'&&['total','total_increasing'].includes(s.attributes.state_class)&&['kWh','Wh','MWh'].includes(s.attributes.unit_of_measurement);};
    const paired=!!(consumed&&produced&&consumed!==produced&&this._config.energy_scope_confirmed===true&&counter(consumed)&&counter(produced));
    if(paired){
      // Row start t represents the hour [t,t+1h); use sums from adjacent rows.
      const endHour=Math.floor(end.getTime()/3600000)*3600000-3600000;
      const startHour=endHour-this._hours*3600000;
      jobs.push(this._hass.callWS({type:'recorder/statistics_during_period',start_time:new Date(startHour).toISOString(),end_time:new Date(endHour+3600000).toISOString(),statistic_ids:[consumed,produced],period:'hour',types:['sum'],units:{energy:'kWh'}}).then(data=>{if(request!==this._request)return;const result=energyPeriod(data[consumed],data[produced],startHour,endHour);this._energy=result.error?result:{...result,start:result.start+3600000,end:result.end+3600000};}));
    }
    if(consumed&&counter(consumed)){
      const midnight=new Date();midnight.setHours(0,0,0,0);
      const from=new Date(midnight.getTime()-14*86400000);
      const list=paired?[consumed,produced]:[consumed];
      jobs.push(this._hass.callWS({type:'recorder/statistics_during_period',start_time:from.toISOString(),statistic_ids:list,period:'day',types:['change'],units:{energy:'kWh'}}).then(data=>{if(request!==this._request)return;this._daily={...dailyEnergy(data[consumed],paired?data[produced]:[]),paired};}));
    }
    const results=await Promise.allSettled(jobs);
    if(request===this._request){
      this._error=results.some(r=>r.status==='rejected')?(this.lang==='pl'?'Historia lub statystyki niedostępne':'History or statistics unavailable'):'';
      this._loaded=new Date();this._loading=false;this.render();
    }
  }

  // ------------------------------------------------------------------ dane
  get steps(){return STEPS[this._hours]||96;}
  series(role){
    if(!this._range)return new Array(this.steps).fill(null);
    const key=`${this._hours}|${this._range.start}`;
    if(!this._cache||this._cache.key!==key)this._cache={key,map:new Map()};
    if(this._cache.map.has(role))return this._cache.map.get(role);
    const raw=sampleSeries(this._history[this.mapping[role]],this._range.start,this._range.end,this.steps);
    const out=['defrost','dhw_valve','heater','error','mode'].includes(role)?raw:raw.map(numeric);
    this._cache.map.set(role,out);
    return out;
  }
  slotTime(i){const step=(this._range.end-this._range.start)/this.steps;return new Date(this._range.start+(i+1)*step);}
  slotLabel(i){
    const d=this.slotTime(i);
    return this._hours>24?d.toLocaleString(this.lang,{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):d.toLocaleTimeString(this.lang,{hour:'2-digit',minute:'2-digit'});
  }
  // Stan chwilowy: defrost > CWU > sprężarka. Bez encji „Brak danych”, nie „Postój”.
  currentMode(){
    if(this.on('defrost')===true)return 'defrost';
    const valve=this.on('dhw_valve'),hz=this.num('frequency');
    if(hz===null&&valve===null)return 'unknown';
    if(valve===true&&(hz===null||hz>0))return 'dhw';
    if(hz!==null&&hz>0)return 'heat';
    if(hz===0||valve===false)return 'idle';
    return 'unknown';
  }
  slotMode(i){
    const defrost=this.series('defrost')[i],valve=this.series('dhw_valve')[i],hz=this.series('frequency')[i];
    if(defrost==='on')return 'defrost';
    if(hz===null&&valve===null)return 'nodata';
    if(valve==='on'&&(hz===null||hz>0))return 'dhw';
    if(hz!==null&&hz>0)return 'heat';
    return 'idle';
  }
  eventRows(){
    if(!this._range)return [];
    const out=[],pl=this.lang==='pl';
    const rows=role=>this._history[this.mapping[role]]||[];
    const name=id=>this._hass?.states[id]?.attributes.friendly_name||id||'';
    const push=(t,ic,title,desc)=>{if(Number.isFinite(t)&&t>=this._range.start&&t<=this._range.end)out.push({t,ic,title,desc});};
    if(this.mapping.mode){
      for(const r of rows('mode')){
        if(['unavailable','unknown'].includes(r.state))continue;
        push(Date.parse(r.last_changed||r.last_updated),'thermo',r.state,name(this.mapping.mode));
      }
    }else{
      const freq=rows('frequency').map(r=>({t:Date.parse(r.last_updated||r.last_changed),n:numeric(r.state)}));
      for(let i=1;i<freq.length;i++){
        const a=freq[i-1],b=freq[i];
        if(a.n===null||b.n===null)continue;
        if(a.n===0&&b.n>0)push(b.t,'fan',pl?'Start sprężarki':'Compressor start',`${this.fmt(b.n,0)} ${this.unit('frequency')}`);
        if(a.n>0&&b.n===0)push(b.t,'clock',pl?'Zatrzymanie sprężarki':'Compressor stop',name(this.mapping.frequency));
      }
    }
    const transitions=[
      ['dhw_valve','drop',pl?'Ładowanie CWU':'DHW charging',pl?'Koniec ładowania CWU':'DHW charging ended'],
      ['defrost','pulse',pl?'Odszranianie':'Defrost',pl?'Koniec odszraniania':'Defrost ended'],
      ['heater','bolt',pl?'Grzałka elektryczna':'Electric heater',pl?'Grzałka wyłączona':'Heater off']
    ];
    for(const [role,ic,on,off] of transitions){
      let prev=null;
      for(const r of rows(role)){
        if(prev!==null&&r.state!==prev&&['on','off'].includes(r.state))push(Date.parse(r.last_changed||r.last_updated),ic,r.state==='on'?on:off,name(this.mapping[role]));
        prev=r.state;
      }
    }
    let prevError=null;
    for(const r of rows('error')){
      if(prevError!==null&&r.state!==prevError)push(Date.parse(r.last_changed||r.last_updated),'pulse',(pl?'Zmiana kodu błędu: ':'Error code change: ')+r.state,name(this.mapping.error));
      prevError=r.state;
    }
    return out.sort((a,b)=>b.t-a.t).slice(0,6);
  }

  // -------------------------------------------------------------- elementy
  head(page){
    const t=this.t,[title,desc]=t.heads[page];
    const device=this._discovery?.devices.find(d=>d.id===this._discovery.selected);
    return `<section class="heading"><div><div class="eyebrow">${esc(t.eyebrow)}${device?' / '+esc(device.name):''}</div><h1>${esc(title)}</h1><p>${esc(desc)}</p></div>
      <div class="heading-actions"><div class="range" role="group" aria-label="${this.lang==='pl'?'Zakres historii':'History range'}">${t.ranges.map(([v,l])=>`<button data-period="${v}" class="${String(this._hours)===v?'active':''}" aria-pressed="${String(this._hours)===v}">${esc(l)}</button>`).join('')}</div>
      <button class="btn" id="refresh" ${this._loading?'disabled':''}>${icon('refresh')} ${this._loading?esc(t.loading):esc(t.refresh)}</button>
      <button class="btn" data-export>${icon('download')} ${esc(t.csv)}</button></div></section>
      <div class="notice">${icon('info')}<span>${t.notice}</span></div>
      ${this._error?`<div class="notice error" role="alert">${icon('info')}<span>${esc(this._error)}</span></div>`:''}
      ${this._registryError?`<div class="notice warn">${icon('info')}<span>${esc(this._registryError)}</span></div>`:''}
      ${this._message?`<div class="notice" role="status">${icon('check')}<span>${esc(this._message)}</span></div>`:''}`;
  }
  cardHead(title,sub='',extra=''){return `<div class="card-head"><div><h2>${esc(title)}</h2>${sub?`<p>${esc(sub)}</p>`:''}</div>${extra}</div>`;}
  spark(role,color){
    const data=this.series(role).filter(n=>n!==null&&Number.isFinite(n));
    if(data.length<4)return '';
    const lo=Math.min(...data),span=(Math.max(...data)-lo)||1;
    const d=data.map((n,i)=>`${i?'L':'M'}${(i/(data.length-1)*85).toFixed(1)},${(26-(n-lo)/span*24).toFixed(1)}`).join(' ');
    return `<svg class="spark" viewBox="0 0 85 28" aria-hidden="true"><path d="${d}" fill="none" stroke="${color}" stroke-width="1.5"/></svg>`;
  }
  stat(label,value,unit,foot,ic='bolt',role=null,color='var(--teal)'){
    const none=value===null||value===undefined;
    return `<article class="stat"><div class="stat-top"><span>${esc(label)}</span>${icon(ic)}</div>
      <div class="stat-value${none?' none':''}">${none?esc(this.t.missing):esc(value)+(unit?`<span>${esc(unit)}</span>`:'')}</div>
      <div class="stat-foot">${esc(foot)}</div>${none||!role?'':this.spark(role,color)}</article>`;
  }
  tempTile(label,role,color){
    const v=this.num(role);
    return `<div class="temp"><label>${esc(label)}</label>${v===null?`<b class="none">${esc(this.t.missing)}</b>`:`<b style="color:${color}">${esc(this.fmt(v,1))} <span>${esc(this.unit(role)||'°C')}</span></b>`}</div>`;
  }
  temperatures(){
    const t=this.t,f=this.num('flow'),r=this.num('return');
    const delta=f!==null&&r!==null&&this.unit('flow')===this.unit('return')?this.fmt(f-r,1):null;
    const zone=this.targetValue('climate');
    return `<article class="card">${this.cardHead(t.tempsNow[0],t.tempsNow[1],`<span class="tag green"><span class="dot"></span> ${esc(t.live)}</span>`)}
      <div class="card-body" style="padding-top:6px"><div class="temps">
      ${this.tempTile(t.series.flow,'flow','var(--orange)')}
      ${this.tempTile(t.series.return,'return','var(--blue)')}
      ${this.tempTile(t.series.outside,'outside','var(--muted)')}
      ${this.tempTile(t.series.room,'room','var(--teal)')}
      ${this.tempTile(t.series.tank,'tank','var(--purple)')}
      <div class="temp"><label>${esc(t.roomTarget)}</label>${zone===null?`<b class="none">${esc(t.missing)}</b>`:`<b style="color:var(--muted)">${esc(this.fmt(zone,1))} <span>°C</span></b>`}</div>
      </div><div class="delta"><span>${esc(t.deltaLabel)}</span><b>${delta===null?esc(t.missing):'ΔT '+esc(delta)+' K'}</b></div></div></article>`;
  }
  diagram(){
    const t=this.t,mode=this.currentMode();
    const isHeat=mode==='heat',isDhw=mode==='dhw'||mode==='defrost',idle=mode==='idle'||mode==='unknown';
    const show=(n,digits=1)=>n===null?t.missing:this.fmt(n,digits);
    const flow=this.num('flow'),ret=this.num('return'),hz=this.num('frequency');
    const room=this.num('room'),tank=this.num('tank'),out=this.num('outside');
    const zone=this.targetValue('climate'),dhwTarget=this.targetValue('water_heater');
    const pills=['heat','dhw','idle'].map(m=>`<span class="${mode===m?'active':''}">${esc(t.short[m])}</span>`).join('')
      +(mode==='defrost'||mode==='unknown'?`<span class="active">${esc(t.short[mode])}</span>`:'');
    return `<article class="card">${this.cardHead(t.diagram[0],t.diagram[1],`<div class="mode-pills">${pills}</div>`)}
    <div class="diagram"><svg class="diagram-svg" viewBox="0 0 700 255" role="group" aria-label="${this.lang==='pl'?'Schemat pompy, obiegu ogrzewania i zasobnika CWU':'Diagram of the pump, heating circuit and DHW tank'}">
      <path class="heat" opacity="${isHeat?1:.2}" d="M210 95H295Q310 95 310 80V67H480"/>
      <path class="return" opacity="${isHeat?1:.2}" d="M480 116H335Q325 116 325 135V175H210"/>
      <path class="water" opacity="${isDhw?1:.2}" d="M210 95H270Q283 95 283 110V203H480"/>
      <path class="return" opacity="${isDhw?1:.2}" d="M480 230H252Q240 230 240 175H210"/>
      ${idle?'':`<circle r="3" class="flow-dot" style="fill:${isDhw?'var(--purple)':'var(--orange)'}"><animateMotion dur="4s" repeatCount="indefinite" path="${isDhw?'M210 95H270Q283 95 283 110V203H480':'M210 95H295Q310 95 310 80V67H480'}"/></circle>`}
      <g data-node="pump" tabindex="0" role="button" aria-label="${esc(t.pump)}"><rect class="node" x="36" y="52" width="174" height="151" rx="12"/><rect x="52" y="69" width="142" height="86" rx="7" fill="var(--panel)" stroke="var(--line)"/><circle cx="97" cy="111" r="27" fill="none" stroke="var(--muted)" stroke-width="1"/><g transform="translate(80,94) scale(1.4)" stroke="var(--teal)" fill="none" stroke-width="1"><circle cx="12" cy="12" r="2"/><path d="M12 10c-5-7 5-11 6-5 1 3-2 5-4 6M14 12c8-1 6 9 1 7-3-1-3-4-3-5M11 14c-3 8-11 1-6-3 2-2 5-1 6 0"/></g><path d="M145 85h31m-31 8h31m-31 8h31m-31 8h31m-31 8h31m-31 8h31m-31 8h31" stroke="var(--line)"/><text x="52" y="177" font-size="12">${esc(t.pump)}</text><text x="52" y="192" class="sub">${esc(t.modes[mode])}${hz===null?'':' · '+esc(this.fmt(hz,0))+' '+esc(this.unit('frequency')||'Hz')}</text></g>
      <text x="40" y="32" class="sub">${esc(t.air)}</text><text x="147" y="32" font-size="12">${esc(show(out))}${out===null?'':' °C'}</text>
      <g data-node="heating" tabindex="0" role="button" aria-label="${esc(t.house)}"><rect class="node" x="480" y="35" width="184" height="98" rx="12"/><path d="m499 65 13-11 13 11m-22-2v18h18V63m-13 18V71h7v10" fill="none" stroke="var(--teal)"/><text x="538" y="62" font-size="12">${esc(t.house)}</text><text x="538" y="87" font-size="${room===null?13:22}">${esc(show(room))}${room===null?'':'<tspan class="sub"> °C</tspan>'}</text><text x="538" y="112" class="sub">${this.lang==='pl'?'Cel':'Target'} ${esc(show(zone))}${zone===null?'':' °C'}</text></g>
      <g data-node="tank" tabindex="0" role="button" aria-label="${esc(t.tankTitle)}"><rect class="node" x="480" y="166" width="184" height="83" rx="12"/><rect x="501" y="181" width="23" height="48" rx="8" fill="none" stroke="var(--purple)"/><path d="M504 204h17m-17 7h17m-17 7h17" stroke="var(--purple)" opacity=".4"/><text x="538" y="189" font-size="12">${esc(t.tankTitle)}</text><text x="538" y="214" font-size="${tank===null?13:22}">${esc(show(tank))}${tank===null?'':'<tspan class="sub"> °C</tspan>'}</text><text x="538" y="234" class="sub">${this.lang==='pl'?'Cel':'Target'} ${esc(show(dhwTarget))}${dhwTarget===null?'':' °C'}</text></g>
      <rect x="342" y="49" width="95" height="23" rx="6" fill="var(--panel)"/><text x="352" y="65" style="fill:var(--orange)" font-size="12">${esc(show(flow))}${flow===null?'':' °C →'}</text>
      <text x="353" y="139" style="fill:var(--blue)" font-size="12">${ret===null?esc(t.missing):'← '+esc(show(ret))+' °C'}</text>
      <text x="304" y="225" style="fill:var(--purple)" font-size="11">${esc(t.dhwLoop)}</text>
    </svg></div>
    <div class="diagram-note"><div class="legend"><span><i class="swatch" style="background:var(--orange)"></i>${esc(t.series.flow)}</span><span><i class="swatch" style="background:var(--blue)"></i>${esc(t.series.return)}</span><span><i class="swatch" style="background:var(--purple)"></i>CWU</span></div>
    <span>${this.lang==='pl'?'Schemat poglądowy · stan z encji':'Schematic view · state from entities'}</span></div></article>`;
  }
  lineChart(id,title,keys,sub='',large=false){
    const t=this.t,mapped=keys.filter(k=>this.mapping[k]);
    const visible=mapped.filter(k=>!this._hidden.has(k));
    const series=Object.fromEntries(mapped.map(k=>[k,this.series(k)]));
    this._charts[id]={keys:mapped,visible,series};
    const any=visible.some(k=>series[k].some(n=>n!==null));
    const legend=keys.map(k=>this.mapping[k]
      ? `<button data-series="${k}" class="${this._hidden.has(k)?'off':''}" aria-pressed="${!this._hidden.has(k)}"><i class="swatch" style="background:${COLORS[k]}"></i>${esc(t.series[k])}</button>`
      : `<span><i class="swatch" style="background:var(--line)"></i>${esc(t.series[k])} · ${esc(t.missing)}</span>`).join('');
    const open=this._tables.has(id);
    const body=any
      ? `<div class="chart-wrap"><svg class="chart" id="${id}" viewBox="0 0 760 245" role="img" aria-label="${esc(title)}">${this.lineSvg(id)}</svg><div class="chart-tip"></div></div>
         <div class="chart-bottom"><span>${esc(t.hover)}</span><button class="table-toggle" data-table="${id}" aria-expanded="${open}">${open?esc(t.hide):esc(t.show)}</button></div>
         <div class="chart-table ${open?'open':''}">${open?this.chartTable(id):''}</div>`
      : `<div class="chart-empty">${esc(t.missing)}</div>`;
    return `<article class="card ${large?'large-chart':''}">${this.cardHead(title,sub,`<span class="tag">${esc(t.samples)} · ${this.steps}</span>`)}<div class="series-legend">${legend}</div>${body}</article>`;
  }
  lineSvg(id){
    const {visible,series}=this._charts[id];
    const values=visible.flatMap(k=>series[k]).filter(n=>n!==null&&Number.isFinite(n));
    if(!values.length)return '';
    const lo=Math.min(...values),hi=Math.max(...values);
    const min=Math.floor(lo/5)*5,max=Math.max(Math.ceil((hi+0.5)/5)*5,min+5);
    const span=max-min,w=680,x0=48,y0=15,height=185,n=this.steps;
    let html='';
    for(let j=0;j<=4;j++){const y=y0+j*height/4;html+=`<line class="grid" x1="${x0}" y1="${y}" x2="735" y2="${y}"/><text x="8" y="${y+4}">${esc(this.fmt(max-span*j/4,0))}</text>`;}
    for(let j=0;j<=4;j++){const i=Math.round(j*(n-1)/4);html+=`<text x="${x0+w*j/4}" y="225" text-anchor="${j===0?'start':j===4?'end':'middle'}">${esc(this.slotLabel(i))}</text>`;}
    for(const k of visible){
      let d='',pen=false;
      series[k].forEach((v,i)=>{
        if(v===null||!Number.isFinite(v)){pen=false;return;}
        const x=x0+i/(n-1)*w,y=y0+(max-v)/span*height;
        d+=`${pen?'L':'M'}${x.toFixed(1)},${y.toFixed(1)} `;pen=true;
      });
      d=d.trim();
      if(!d)continue;
      if(visible.length===1)html+=`<path d="${d} L${x0+w},${y0+height} L${x0},${y0+height} Z" fill="${COLORS[k]}" opacity=".07"/>`;
      html+=`<path d="${d}" fill="none" stroke="${COLORS[k]}" stroke-width="2" stroke-linejoin="round"/>`;
    }
    html+=`<line class="crosshair" x1="0" y1="15" x2="0" y2="200" stroke="var(--muted)" stroke-dasharray="3 4" visibility="hidden"/><rect x="${x0}" y="${y0}" width="${w}" height="${height}" fill="transparent"/>`;
    return html;
  }
  chartTable(id){
    const {keys,series}=this._charts[id],t=this.t,rows=[];
    for(let i=0;i<this.steps;i++){
      if(keys.every(k=>series[k][i]===null))continue;
      rows.push(`<tr><td>${esc(this.slotLabel(i))}</td>${keys.map(k=>`<td>${series[k][i]===null?esc(t.missing):esc(this.fmt(series[k][i],1))}</td>`).join('')}</tr>`);
    }
    return `<table><thead><tr><th>${this.lang==='pl'?'Czas':'Time'}</th>${keys.map(k=>`<th>${esc(t.series[k])} · ${esc(this.unit(k))}</th>`).join('')}</tr></thead>
      <tbody>${rows.join('')||`<tr><td>${esc(t.missing)}</td></tr>`}</tbody></table>`;
  }
  events(){
    const t=this.t,rows=this.eventRows();
    return `<article class="card">${this.cardHead(t.eventsTitle[0],t.eventsTitle[1],`<button class="link-btn" data-go="diagnostics">${esc(t.eventsMore)}</button>`)}
      <div class="event-list">${rows.length?rows.map(e=>`<div class="event"><div class="event-symbol">${icon(e.ic)}</div><div><strong>${esc(e.title)}</strong><p>${esc(e.desc)}</p></div><time>${esc(new Date(e.t).toLocaleTimeString(this.lang,{hour:'2-digit',minute:'2-digit'}))}</time></div>`).join(''):`<p class="cap">${esc(t.noEvents)}</p>`}</div></article>`;
  }
  energyBars(){
    const t=this.t,d=this._daily;
    const head=this.cardHead(t.barsTitle[0],t.barsTitle[1],`<span class="tag">kWh</span>`);
    if(!d||!d.days.length)return `<article class="card">${head}<div class="chart-empty">${esc(t.missing)}<p class="cap" style="margin-top:10px">${esc(t.stats)}</p></div></article>`;
    this._bars=d.days;
    const peak=Math.max(...d.days.flatMap(x=>[x.consumed||0,x.produced||0]));
    const max=Math.max(5,Math.ceil(peak/5)*5),w=696,x0=42,y0=15,height=185;
    const slot=w/d.days.length,bar=Math.min(27,slot*0.55);
    const day=ms=>new Date(ms).toLocaleDateString(this.lang,{day:'2-digit',month:'2-digit'});
    let svg='';
    for(let j=0;j<=4;j++){const y=y0+j*height/4;svg+=`<line class="grid" x1="${x0}" y1="${y}" x2="738" y2="${y}"/><text x="7" y="${y+4}">${esc(this.fmt(max-max*j/4,0))}</text>`;}
    d.days.forEach((row,i)=>{
      const x=x0+slot*i+(slot-bar)/2;
      const hIn=row.consumed===null?0:row.consumed/max*height,hOut=row.produced===null?0:row.produced/max*height;
      svg+=`<g data-day="${i}" tabindex="0" role="button" aria-label="${esc(day(row.t))}">`
        +(hOut?`<rect x="${x.toFixed(1)}" y="${(y0+height-hOut).toFixed(1)}" width="${bar.toFixed(1)}" height="${hOut.toFixed(1)}" rx="3" fill="var(--teal)" opacity=".23"/>`:'')
        +(hIn?`<rect x="${x.toFixed(1)}" y="${(y0+height-hIn).toFixed(1)}" width="${bar.toFixed(1)}" height="${hIn.toFixed(1)}" rx="3" fill="var(--teal)"/>`:'')
        +`<rect x="${(x0+slot*i).toFixed(1)}" y="${y0}" width="${slot.toFixed(1)}" height="${height}" fill="transparent"/>`
        +`<text x="${(x+bar/2).toFixed(1)}" y="225" text-anchor="middle">${esc(day(row.t))}</text></g>`;
    });
    const open=this._tables.has('energy-bars');
    const cost=row=>row.consumed===null||this._config.tariff===null?null:row.consumed*this._config.tariff;
    const table=`<table><thead><tr><th>${this.lang==='pl'?'Dzień':'Day'}</th><th>${esc(t.barsIn)}</th><th>${esc(t.barsOut)}</th><th>COP</th><th>${esc(t.cost)}</th></tr></thead><tbody>${d.days.map(row=>`<tr><td>${esc(day(row.t))}</td><td>${row.consumed===null?esc(t.missing):esc(this.fmt(row.consumed,2))}</td><td>${row.produced===null?esc(t.missing):esc(this.fmt(row.produced,2))}</td><td>${row.cop===null?esc(t.missing):esc(this.fmt(row.cop,2))}</td><td>${cost(row)===null?esc(t.missing):esc(this.fmt(cost(row),2))+' '+esc(this._config.currency)}</td></tr>`).join('')}</tbody></table>`;
    return `<article class="card">${head}
      <div class="series-legend"><span><i class="swatch"></i>${esc(t.barsIn)}</span><span><i class="swatch" style="background:var(--teal);opacity:.25"></i>${esc(t.barsOut)}${d.paired?'':' · '+esc(t.missing)}</span></div>
      <div class="chart-wrap"><svg class="chart" id="energy-bars" viewBox="0 0 760 245" role="img" aria-label="${esc(t.barsTitle[0])}">${svg}</svg><div class="chart-tip"></div></div>
      <div class="chart-bottom"><span>${esc(t.barsHover)}</span><button class="table-toggle" data-table="energy-bars" aria-expanded="${open}">${open?esc(t.hide):esc(t.show)}</button></div>
      <div class="chart-table ${open?'open':''}">${open?table:''}</div></article>`;
  }
  efficiency(){
    const t=this.t,d=this._daily,e=this._energy&&!this._energy.error?this._energy:null;
    const cop=d?.cop??e?.cop??this.num('cop');
    const consumed=d?.consumed??e?.consumed??null,produced=d?.produced??e?.produced??null;
    const cost=consumed===null||this._config.tariff===null?null:consumed*this._config.tariff;
    const ring=cop===null?0:Math.max(0,Math.min(1,cop/5))*289;
    const row=(label,value)=>`<div class="progress-info"><span>${esc(label)}</span><strong>${value===null?esc(t.missing):esc(value)}</strong></div>`;
    return `<article class="card">${this.cardHead(t.effTitle[0],t.effTitle[1])}<div class="card-body">
      <div style="display:flex;align-items:center;gap:22px;flex-wrap:wrap">
      <svg viewBox="0 0 120 120" width="120" height="120" role="img" aria-label="COP ${cop===null?esc(t.missing):esc(this.fmt(cop,2))}"><circle cx="60" cy="60" r="46" fill="none" stroke="var(--panel2)" stroke-width="12"/>${ring?`<circle cx="60" cy="60" r="46" fill="none" stroke="var(--teal)" stroke-width="12" stroke-dasharray="${ring.toFixed(0)} 289" transform="rotate(-90 60 60)"/>`:''}<text x="60" y="58" text-anchor="middle" fill="var(--text)" font-size="${cop===null?12:23}">${cop===null?esc(t.missing):esc(this.fmt(cop,2))}</text><text x="60" y="77" text-anchor="middle" fill="var(--muted)" font-size="10">COP</text></svg>
      <div style="flex:1;min-width:180px">
        ${row(t.barsIn,consumed===null?null:this.fmt(consumed,2)+' kWh')}
        ${row(t.barsOut,produced===null?null:this.fmt(produced,2)+' kWh')}
        ${row(t.cost,cost===null?null:this.fmt(cost,2)+' '+this._config.currency)}
      </div></div>
      <div class="callout"><strong>${esc(t.copMethod[0])}</strong>${esc(t.copMethod[1])}</div>
      <button class="link-btn" data-explain="cop">${this.lang==='pl'?'Poznaj metodę obliczeń →':'See how it is calculated →'}</button>
      ${d?.paired?'':`<div class="callout warn"><strong>${esc(t.pair)}</strong>${esc(t.stats)}</div>`}</div></article>`;
  }
  timeline(){
    if(!this._range)return '';
    const t=this.t,modes=Array.from({length:this.steps},(_,i)=>this.slotMode(i));
    const legend=[['heat',t.modes.heat],['dhw',t.modes.dhw],['idle',t.modes.idle],['defrost',t.modes.defrost],['nodata',t.missing]];
    return `<article class="card">${this.cardHead(t.timelineTitle[0],t.timelineTitle[1])}<div class="card-body">
      <div class="timeline">${modes.map((m,i)=>`<button class="${m==='heat'?'':m}" data-segment="${i}" style="flex:1" aria-label="${esc(this.slotLabel(i))} ${esc(t.modes[m])}"></button>`).join('')}</div>
      <div class="timeline-hours"><span>${esc(this.slotLabel(0))}</span><span>${esc(this.slotLabel(Math.floor(this.steps/2)))}</span><span>${esc(this.slotLabel(this.steps-1))}</span></div>
      <div class="legend" style="margin-top:17px;font-size:10px;color:var(--muted)">${legend.map(([m,l])=>`<span><i class="swatch" style="background:${TIMELINE_FILL[m]}"></i>${esc(l)}</span>`).join('')}</div>
      <div class="tip-label" id="timeline-detail">${esc(this._note||t.timelineHint)}</div></div></article>`;
  }
  control(role,title,sub){
    const t=this.t,s=this.state(role),a=s?.attributes||{};
    const head=this.cardHead(title,sub);
    if(!this._config.controls)return `<article class="card">${head}<div class="card-body"><div class="callout warn"><strong>${esc(t.controls)}</strong>${esc(t.config)}</div></div></article>`;
    if(!s||['unknown','unavailable'].includes(s.state)||!(Number(a.supported_features)&1)||numeric(a.min_temp)===null||numeric(a.max_temp)===null)
      return `<article class="card">${head}<div class="card-body"><p style="color:var(--muted);font-size:12px">${esc(t.missing)}</p></div></article>`;
    return `<article class="card">${head}<div class="card-body"><form class="control" data-control="${role}">
      <label>${esc(ROLES[role][0])} · ${esc(a.unit_of_measurement||a.temperature_unit||'°C')} (${esc(a.min_temp)}–${esc(a.max_temp)})
      <input name="temperature" type="number" required min="${Number(a.min_temp)}" max="${Number(a.max_temp)}" step="any" value="${numeric(a.temperature)??''}"></label>
      <button class="btn primary" type="submit" ${this._sending?'disabled':''}>${esc(t.save)}</button></form></div></article>`;
  }

  // ---------------------------------------------------------------- strony
  overview(){
    const t=this.t,d=this._daily,e=this._energy&&!this._energy.error?this._energy:null;
    const cop=d?.cop??e?.cop??this.num('cop');
    const consumed=d?.consumed??e?.consumed??null,produced=d?.produced??e?.produced??null;
    const cost=consumed===null||this._config.tariff===null?null:consumed*this._config.tariff;
    const scope=d?.days.length?(this.lang==='pl'?`Suma ${d.days.length} dób z Recordera`:`${d.days.length}-day Recorder total`):(this.lang==='pl'?'Wymaga liczników energii':'Needs energy counters');
    return this.head('overview')+`<section class="stats">
      ${this.stat('COP',cop===null?null:this.fmt(cop,2),'',scope,'leaf')}
      ${this.stat(t.barsIn,consumed===null?null:this.fmt(consumed,2),'kWh',scope,'bolt',null,'var(--orange)')}
      ${this.stat(t.barsOut,produced===null?null:this.fmt(produced,2),'kWh',scope,'home',null,'var(--blue)')}
      ${this.stat(t.cost,cost===null?null:this.fmt(cost,2),this._config.currency,this._config.tariff===null?(this.lang==='pl'?'Ustaw cenę w edytorze karty':'Set the price in the card editor'):`${this.fmt(this._config.tariff,2)} ${this._config.currency}/kWh`,'bolt')}
      </section>
      <div class="layout">${this.diagram()}${this.temperatures()}</div>
      <div class="layout">${this.lineChart('overview-temp',t.tempChart[0],['flow','return','outside'],t.tempChart[1])}${this.events()}</div>
      <div class="layout">${this.energyBars()}${this.efficiency()}</div>`;
  }
  tempPage(){
    const t=this.t,f=this.num('flow'),r=this.num('return'),room=this.num('room');
    const same=this.unit('flow')===this.unit('return'),zone=this.targetValue('climate');
    return this.head('temperature')+`<section class="stats">
      ${this.stat(t.series.flow,f===null?null:this.fmt(f,1),this.unit('flow')||'°C',this.mapping.flow||t.missing,'thermo','flow','var(--orange)')}
      ${this.stat(t.series.return,r===null?null:this.fmt(r,1),this.unit('return')||'°C',this.mapping.return||t.missing,'thermo','return','var(--blue)')}
      ${this.stat(t.deltaLabel,f!==null&&r!==null&&same?this.fmt(f-r,1):null,'K',this.lang==='pl'?'Zasilanie − powrót':'Flow − return','pulse')}
      ${this.stat(t.series.room,room===null?null:this.fmt(room,1),this.unit('room')||'°C',zone===null?t.missing:(this.lang==='pl'?'Cel ':'Target ')+this.fmt(zone,1)+' °C','home','room')}
      </section>
      ${this.lineChart('compare-temp',t.compareChart[0],['flow','return','outside','room','tank'],t.compareChart[1],true)}
      <div class="layout equal" style="margin-top:18px">${this.lineChart('room-temp',t.roomChart[0],['room','outside'],t.roomChart[1])}${this.temperatures()}</div>
      <div class="layout equal">${this.control('climate',t.zone[0],t.zone[1])}${this.events()}</div>`;
  }
  energyPage(){
    const t=this.t,d=this._daily;
    const consumed=d?.consumed??null,produced=d?.produced??null,cop=d?.cop??null;
    const cost=consumed===null||this._config.tariff===null?null:consumed*this._config.tariff;
    const scope=this.lang==='pl'?'Dobowe przyrosty z Recordera':'Daily Recorder deltas';
    const span=d?.days.length?`${new Date(d.days[0].t).toLocaleDateString(this.lang)} → ${new Date(d.days.at(-1).t).toLocaleDateString(this.lang)}`:null;
    return this.head('energy')+`<section class="stats">
      ${this.stat(t.barsIn,consumed===null?null:this.fmt(consumed,2),'kWh',scope,'bolt')}
      ${this.stat(t.barsOut,produced===null?null:this.fmt(produced,2),'kWh',scope,'home',null,'var(--blue)')}
      ${this.stat('COP',cop===null?null:this.fmt(cop,2),'',this.lang==='pl'?'Iloraz sum energii':'Ratio of energy sums','leaf')}
      ${this.stat(t.cost,cost===null?null:this.fmt(cost,2),this._config.currency,this._config.tariff===null?(this.lang==='pl'?'Brak ceny w konfiguracji':'No price configured'):`${this.fmt(this._config.tariff,2)} ${this._config.currency}/kWh`,'bolt',null,'var(--orange)')}
      </section>
      <div class="layout">${this.energyBars()}${this.efficiency()}</div>
      <div class="layout equal">
      <article class="card">${this.cardHead(t.tariffTitle[0],t.tariffTitle[1])}<div class="card-body">
        <div class="progress-info"><span>${this.lang==='pl'?'Cena energii':'Energy price'}</span><strong>${this._config.tariff===null?esc(t.missing):esc(this.fmt(this._config.tariff,2))+' '+esc(this._config.currency)+'/kWh'}</strong></div>
        <div class="progress-info"><span>${this.lang==='pl'?'Licznik poboru':'Consumption counter'}</span><strong><code>${esc(this.mapping.consumed||'—')}</code></strong></div>
        <div class="progress-info"><span>${this.lang==='pl'?'Licznik produkcji':'Production counter'}</span><strong><code>${esc(this.mapping.produced||'—')}</code></strong></div>
        <div class="progress-info"><span>${this.lang==='pl'?'Okres wykresu':'Chart period'}</span><strong>${span===null?esc(t.missing):esc(span)}</strong></div>
        <div class="callout"><strong>${esc(t.config)}</strong>${esc(t.noScop)}</div></div></article>
      <article class="card">${this.cardHead(t.copMethod[0],t.effTitle[1])}<div class="card-body">
        <div class="delta"><span>${esc(t.barsOut)} ÷ ${esc(t.barsIn)}</span><b>${cop===null?esc(t.missing):esc(this.fmt(cop,2))}</b></div>
        <p style="font-size:11px;color:var(--muted)">${esc(t.copMethod[1])}</p>
        ${this._energy?.error?`<div class="callout warn"><strong>${esc(t.stats)}</strong>${esc(this._energy.error)}</div>`:''}
        <button class="link-btn" data-explain="cop">${this.lang==='pl'?'Poznaj metodę obliczeń →':'See how it is calculated →'}</button></div></article></div>`;
  }
  compressorPage(){
    const t=this.t,hz=this.num('frequency');
    const s=compressorSummary(this._history[this.mapping.frequency],this._range?.start||0,this._range?.end||1);
    const has=!!this.mapping.frequency&&s.coverage>0;
    return this.head('compressor')+`<section class="stats">
      ${this.stat(t.series.frequency,hz===null?null:this.fmt(hz,0),this.unit('frequency')||'Hz',this.mapping.frequency||t.missing,'fan','frequency')}
      ${this.stat(this.lang==='pl'?'Czas pracy w zakresie':'Runtime in range',has?this.fmt(s.runHours,2):null,'h',t.estimate,'clock')}
      ${this.stat(this.lang==='pl'?'Obserwowane starty':'Observed starts',has?String(s.starts):null,'',this.lang==='pl'?'Przejścia 0 → >0 Hz':'Transitions 0 → >0 Hz','pulse')}
      ${this.stat(this.lang==='pl'?'Pokrycie danych':'Data coverage',has?this.fmt(s.coverage*100,0):null,'%',this.lang==='pl'?'Maks. przerwa 15 min':'Max gap 15 min','check')}
      </section>
      ${this.lineChart('frequency',t.freqChart[0],['frequency'],t.freqChart[1],true)}
      <div style="margin-top:18px">${this.timeline()}</div>
      <div class="layout equal" style="margin-top:18px">
      <article class="card">${this.cardHead(t.interpret[0],t.interpret[1])}<div class="card-body">
        <div class="callout"><strong>${esc(t.modulation[0])}</strong>${esc(t.modulation[1])}</div>
        <p style="font-size:11px;color:var(--muted)">${esc(t.gaps)}</p></div></article>${this.events()}</div>`;
  }
  dhwPage(){
    const t=this.t,tank=this.num('tank'),a=this.state('water_heater')?.attributes||{};
    const target=numeric(a.temperature),min=numeric(a.min_temp)??20,max=numeric(a.max_temp)??60;
    const fill=tank===null?null:Math.max(4,Math.min(100,(tank-min)/((max-min)||1)*100));
    const pending=this._pendingTarget??target;
    const presets=[45,48,52].filter(v=>v>=min&&v<=max);
    const controls=!!(this._config.controls&&this.mapping.water_heater&&(Number(a.supported_features)&1)&&target!==null);
    const dirty=this._pendingTarget!==null&&this._pendingTarget!==target;
    return this.head('dhw')+`<div class="layout equal">
      <article class="card">${this.cardHead(t.tankCard[0],t.tankCard[1],`<span class="tag green"><span class="dot"></span> ${esc(t.modes[this.currentMode()])}</span>`)}<div class="card-body">
      <div class="tank-layout">
        <div class="tank">${fill===null?'':`<div class="tank-fill" style="height:${fill.toFixed(0)}%"></div>`}<div class="tank-text">${tank===null?`<b style="font-size:15px;color:var(--muted)">${esc(t.missing)}</b>`:`<b>${esc(this.fmt(tank,1))}°</b>`}<span>${esc(t.measured)}</span></div></div>
        <div><div class="eyebrow">${esc(t.target)}</div>
        <div class="thermostat"><button class="iconbtn" data-target="-0.5" ${controls?'':'disabled'} aria-label="−">−</button>
          <div><b>${pending===null?esc(t.missing):esc(this.fmt(pending,1))+' °C'}</b><small>${esc(this.mapping.water_heater||t.missing)}</small></div>
          <button class="iconbtn" data-target="0.5" ${controls?'':'disabled'} aria-label="+">+</button></div>
        <div class="presets">${presets.map(v=>`<button data-preset="${v}" class="${pending===v?'active':''}" ${controls?'':'disabled'}>${v}°</button>`).join('')}</div>
        ${controls
          ? `<button class="btn primary" id="apply-dhw" style="width:100%;margin-top:15px" ${this._sending||!dirty?'disabled':''}>${icon('drop')} ${esc(t.save)}</button>`
          : `<div class="callout warn" style="margin-top:12px"><strong>${esc(t.controls)}</strong>${esc(t.config)}</div>`}
        </div></div>
      <div class="callout"><strong>${esc(t.tankSafe[0])}</strong>${esc(t.tankSafe[1])}</div></div></article>
      ${this.lineChart('tank-chart',t.tankChart[0],['tank','flow'],t.tankChart[1])}</div>
      <div class="layout equal">${this.diagram()}${this.events()}</div>`;
  }
  diagnosticsPage(){
    const t=this.t;
    const defrost=this.mapping.defrost?(this.value('defrost')??t.missing):t.missing;
    const error=this.mapping.error?(this.value('error')??t.missing):t.missing;
    const feature=(label,source,ok)=>`<tr><td>${esc(label)}</td><td><code>${esc(source||'—')}</code></td><td>${ok?esc(t.avail.ok):esc(t.avail.no)}</td></tr>`;
    return this.head('diagnostics')+`<div class="statusgrid">
      <article class="card statusitem"><small>${esc(t.sourceTitle)}</small><b>${icon('info')} ${esc(t.history)}</b><p>${esc(this._loaded?this._loaded.toLocaleString(this.lang):t.missing)}</p></article>
      <article class="card statusitem"><small>${esc(t.defrostTitle)}</small><b>${icon('pulse')} ${esc(defrost)}</b><p>${esc(t.noDefrost)}</p></article>
      <article class="card statusitem"><small>${esc(t.errorTitle)}</small><b>${icon('check')} ${esc(error)}</b><p>${this.lang==='pl'?'MELCloud nie udostępnia zdalnie kodów serwisowych.':'MELCloud does not expose service codes remotely.'}</p></article>
      </div>
      <div style="margin-top:18px">${this.timeline()}</div>
      <div class="layout equal" style="margin-top:18px">${this.events()}
      <article class="card">${this.cardHead(t.availability[0],t.availability[1])}<div class="card-body"><div class="table-scroll">
      <table><thead><tr>${t.availHead.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>
      ${feature(this.lang==='pl'?'Temperatury':'Temperatures',[this.mapping.flow,this.mapping.return].filter(Boolean).join(', '),!!(this.mapping.flow&&this.mapping.return))}
      ${feature(this.lang==='pl'?'COP okresu':'Period COP',[this.mapping.consumed,this.mapping.produced].filter(Boolean).join(', '),!!this._daily?.paired)}
      ${feature(t.series.frequency,this.mapping.frequency,!!this.mapping.frequency)}
      ${feature(t.defrostTitle,this.mapping.defrost,!!this.mapping.defrost)}
      ${feature(t.errorTitle,this.mapping.error,!!this.mapping.error)}
      ${feature('SCOP','',false)}
      </tbody></table></div>
      <div class="callout"><strong>${esc(t.noData[0])}</strong>${esc(t.noData[1])}</div></div></article></div>
      <div class="layout equal">${this.lineChart('diag-temp',t.tempChart[0],['flow','return','tank'],t.tempChart[1])}${this.temperatures()}</div>`;
  }
  settingsPage(){
    const t=this.t,pl=this.lang==='pl';
    const rows=Object.keys(ROLES).map(role=>{
      const id=this.mapping[role],s=id?this._hass?.states[id]:null;
      return `<tr><td>${esc(ROLES[role][0])}</td><td><code>${esc(id||'—')}</code></td><td>${s?esc(new Date(s.last_updated).toLocaleString(this.lang)):esc(t.missing)}</td></tr>`;
    }).join('');
    const device=this._discovery?.devices.find(d=>d.id===this._discovery.selected);
    const row=(label,value)=>`<div class="progress-info"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`;
    return this.head('settings')+`<div class="settings-grid">
      <article class="card">${this.cardHead(t.mappingTitle[0],t.mappingTitle[1])}<div class="card-body"><div class="table-scroll">
      <table><thead><tr>${t.mappingHead.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>
      <div class="callout"><strong>${esc(t.config)}</strong>${pl?'Automatyczne wykrywanie działa tylko wtedy, gdy rola ma dokładnie jedno dopasowanie w jednym urządzeniu MELCloud.':'Auto-discovery applies only when a role has exactly one match within one MELCloud device.'}</div></div></article>
      <article class="card">${this.cardHead(pl?'Karta i urządzenie':'Card and device',pl?'Konfiguracja z YAML lub edytora karty':'Configuration from YAML or the card editor')}<div class="card-body">
        ${row(pl?'Urządzenie':'Device',device?.name||t.missing)}
        ${row(pl?'Język':'Language',this.lang)}
        ${row(pl?'Cena energii':'Energy price',this._config.tariff===null?t.missing:this.fmt(this._config.tariff,2)+' '+this._config.currency+'/kWh')}
        ${row(pl?'Sterowanie temperaturą':'Temperature controls',this._config.controls?(pl?'Włączone':'Enabled'):(pl?'Wyłączone':'Disabled'))}
        ${row(pl?'Zgodność liczników potwierdzona':'Counter scope confirmed',this._config.energy_scope_confirmed===true?(pl?'Tak':'Yes'):(pl?'Nie':'No'))}
        ${row(pl?'Zakres historii':'History range',`${this._hours} h · ${this.steps} ${pl?'próbek':'samples'}`)}
        <div class="callout warn"><strong>${pl?'Czego karta nie robi':'What the card never does'}</strong>${pl?'Nie przełącza zasilania ani trybów: w MELCloud dotyczy to wszystkich stref i CWU. Nie wysyła telemetrii projektu.':'No power or mode switching: in MELCloud that affects all zones and DHW. No project telemetry.'}</div>
        <button class="btn" id="about" style="margin-top:15px">${icon('info')} ${pl?'O tym panelu':'About this panel'}</button></div></article></div>`;
  }

  // ---------------------------------------------------------------- render
  render(){
    if(!this._config||!this.shadowRoot)return;
    this._painted=Date.now();this._charts={};this._bars=null;
    const t=this.t;
    const pages={overview:()=>this.overview(),temperature:()=>this.tempPage(),energy:()=>this.energyPage(),compressor:()=>this.compressorPage(),dhw:()=>this.dhwPage(),diagnostics:()=>this.diagnosticsPage(),settings:()=>this.settingsPage()};
    const device=this._discovery?.devices.find(d=>d.id===this._discovery.selected);
    const body=(pages[this._page]||pages.overview)();
    this.shadowRoot.innerHTML=`<style>${css}</style>${SPRITE}<ha-card><div class="app${this.light?' light':''}">
      <header class="topbar">
        <div class="brand"><div class="brandmark">${icon('leaf')}</div><div>open ecodan<small>${esc(t.brand)}</small></div></div>
        <div class="top-actions"><div class="device-chip"><span class="dot"></span><b>${esc(this._config.title||device?.name||'Ecodan')}</b> · ${esc(t.crumb)}</div>
        <span class="live">${esc(t.live)}</span>
        <button class="iconbtn" id="info" aria-label="${esc(t.infoTitle)}">${icon('info')}</button></div></header>
      <nav class="nav" aria-label="Sections">${t.tabs.map(([id,label,ic])=>`<button data-go="${id}" class="${id===this._page?'active':''}" ${id===this._page?'aria-current="page"':''}>${icon(ic)}<span>${esc(label)}</span></button>`).join('')}</nav>
      <main class="main">${body}
        <footer class="footer"><span>Open Ecodan · v0.2.1 · MIT</span><span>${esc(t.history)} · ${esc(this._loaded?this._loaded.toLocaleTimeString(this.lang):'—')}${this._loading?' · '+esc(t.loading):''}</span></footer></main>
      <div class="modal" id="modal" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div class="dialog">
        <div class="dialog-head"><h2 id="dialog-title"></h2><button class="iconbtn" id="modal-close" aria-label="${this.lang==='pl'?'Zamknij':'Close'}">${icon('close')}</button></div>
        <div id="dialog-content"></div></div></div>
      <div class="toast" id="toast" role="status"></div></div></ha-card>`;
    this.bind();
  }
  $(selector){return this.shadowRoot.querySelector(selector);}
  $$(selector){return [...this.shadowRoot.querySelectorAll(selector)];}
  toast(text){const el=this.$('#toast');if(!el)return;el.textContent=text;el.classList.add('show');clearTimeout(this._toastTimer);this._toastTimer=setTimeout(()=>el.classList.remove('show'),3500);}
  modal(title,html){const m=this.$('#modal');if(!m)return;this.$('#dialog-title').textContent=title;this.$('#dialog-content').innerHTML=html;m.classList.add('open');this.$('#modal-close').focus();}
  closeModal(){this.$('#modal')?.classList.remove('open');}
  bind(){
    const t=this.t;
    this.$$('[data-go]').forEach(b=>b.onclick=()=>{this._page=b.dataset.go;this._note='';this._message='';this.render();});
    this.$$('[data-period]').forEach(b=>b.onclick=()=>{this._hours=Number(b.dataset.period);this.load();});
    this.$$('[data-series]').forEach(b=>b.onclick=()=>{const k=b.dataset.series;this._hidden.has(k)?this._hidden.delete(k):this._hidden.add(k);this.render();});
    this.$$('[data-table]').forEach(b=>b.onclick=()=>{const id=b.dataset.table;this._tables.has(id)?this._tables.delete(id):this._tables.add(id);this.render();});
    this.$$('[data-export]').forEach(b=>b.onclick=()=>this.exportCsv());
    this.$$('[data-segment]').forEach(b=>b.onclick=()=>{
      const i=Number(b.dataset.segment),m=this.slotMode(i),hz=this.series('frequency')[i];
      this._note=`${this.slotLabel(i)} · ${t.modes[m]}${hz===null?'':' · '+this.fmt(hz,0)+' '+(this.unit('frequency')||'Hz')}`;
      const label=this.$('#timeline-detail');if(label)label.textContent=this._note;
    });
    this.$$('[data-node]').forEach(node=>{
      const open=()=>this.nodeInfo(node.dataset.node);
      node.onclick=open;
      node.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}};
    });
    this.$$('[data-explain="cop"]').forEach(b=>b.onclick=()=>this.modal(t.copTitle,
      `<p>${this.lang==='pl'?'Karta dzieli sumy dwóch liczników energii dla tego samego zakresu i obiegu:':'The card divides the sums of two energy counters for the same range and circuit:'}</p>
       <p><code>${esc(this.mapping.produced||t.missing)}</code> ÷ <code>${esc(this.mapping.consumed||t.missing)}</code></p>
       <p>${esc(t.stats)}</p><p>${esc(t.noScop)}</p>`));
    const info=this.$('#info'),about=this.$('#about');
    if(info)info.onclick=()=>this.modal(t.infoTitle,t.info);
    if(about)about.onclick=()=>this.modal(t.infoTitle,t.info);
    const refresh=this.$('#refresh');
    if(refresh)refresh.onclick=()=>{if(!this._discovery){this._discovered=false;this.initialize();}else this.load();};
    const close=this.$('#modal-close');if(close)close.onclick=()=>this.closeModal();
    const modal=this.$('#modal');if(modal)modal.onclick=e=>{if(e.target===modal)this.closeModal();};
    // Shadow root survives re-renders, so attach the Escape handler once.
    if(!this._keys){this._keys=true;this.shadowRoot.addEventListener('keydown',e=>{if(e.key==='Escape')this.closeModal();});}
    this.$$('[data-target]').forEach(b=>b.onclick=()=>{
      const a=this.state('water_heater')?.attributes||{},min=numeric(a.min_temp)??20,max=numeric(a.max_temp)??60;
      const base=this._pendingTarget??numeric(a.temperature)??min;
      this._pendingTarget=Math.max(min,Math.min(max,base+Number(b.dataset.target)));
      this.render();
    });
    this.$$('[data-preset]').forEach(b=>b.onclick=()=>{this._pendingTarget=Number(b.dataset.preset);this.render();});
    const apply=this.$('#apply-dhw');
    if(apply)apply.onclick=()=>this.send('water_heater',this._pendingTarget);
    this.$$('form.control').forEach(form=>form.onsubmit=e=>{e.preventDefault();this.send(form.dataset.control,new FormData(form).get('temperature'));});
    for(const [id,cfg] of Object.entries(this._charts)){
      const svg=this.$('#'+id);
      if(!svg||!cfg.visible.length)continue;
      const tip=svg.parentElement.querySelector('.chart-tip'),cross=svg.querySelector('.crosshair');
      const show=e=>{
        const rect=svg.getBoundingClientRect(),x=(e.clientX-rect.left)/rect.width*760;
        const i=Math.max(0,Math.min(this.steps-1,Math.round((x-48)/680*(this.steps-1))));
        tip.innerHTML=`<strong>${esc(this.slotLabel(i))}</strong>`+cfg.visible.map(k=>`<span style="color:${COLORS[k]}">${esc(t.series[k])}: ${cfg.series[k][i]===null?esc(t.missing):esc(this.fmt(cfg.series[k][i],1))} ${esc(this.unit(k))}</span>`).join('');
        tip.style.display='block';
        tip.style.left=Math.min(Math.max(15,e.clientX-rect.left+15),Math.max(15,rect.width-210))+'px';
        if(cross){const px=48+i/(this.steps-1)*680;cross.setAttribute('x1',px);cross.setAttribute('x2',px);cross.setAttribute('visibility','visible');}
      };
      svg.onpointermove=show;svg.onpointerdown=show;
      svg.onpointerleave=()=>{tip.style.display='none';cross?.setAttribute('visibility','hidden');};
    }
    const bars=this.$('#energy-bars');
    if(bars&&this._bars){
      const tip=bars.parentElement.querySelector('.chart-tip'),days=this._bars;
      this.$$('#energy-bars [data-day]').forEach(g=>{
        const show=()=>{
          const row=days[Number(g.dataset.day)];if(!row)return;
          const cost=row.consumed===null||this._config.tariff===null?null:row.consumed*this._config.tariff;
          tip.innerHTML=`<strong>${esc(new Date(row.t).toLocaleDateString(this.lang))}</strong>`
            +`<span>${esc(t.barsIn)}: ${row.consumed===null?esc(t.missing):esc(this.fmt(row.consumed,2))+' kWh'}</span>`
            +`<span>${esc(t.barsOut)}: ${row.produced===null?esc(t.missing):esc(this.fmt(row.produced,2))+' kWh'}</span>`
            +`<span>COP: ${row.cop===null?esc(t.missing):esc(this.fmt(row.cop,2))}</span>`
            +`<span>${esc(t.cost)}: ${cost===null?esc(t.missing):esc(this.fmt(cost,2))+' '+esc(this._config.currency)}</span>`;
          tip.style.display='block';
          const rect=bars.getBoundingClientRect();
          tip.style.left=Math.min(25+Number(g.dataset.day)*rect.width/(days.length+1),Math.max(20,rect.width-215))+'px';
        };
        g.onpointerenter=show;g.onfocus=show;g.onclick=show;
      });
      bars.onpointerleave=()=>{tip.style.display='none';};
    }
  }
  nodeInfo(node){
    const t=this.t,show=(role,digits=1)=>this.value(role,digits)??t.missing;
    const target=this.targetValue('water_heater');
    const content={
      pump:[t.pump,`<p>${esc(t.modes[this.currentMode()])}</p><div class="delta"><span>${esc(t.series.frequency)}</span><b>${esc(show('frequency',0))}</b></div><p><code>${esc(this.mapping.frequency||t.missing)}</code></p>`],
      heating:[t.house,`<p>${esc(t.series.room)}: ${esc(show('room'))}</p><div class="delta"><span>${esc(t.series.flow)} / ${esc(t.series.return)}</span><b>${esc(show('flow'))} / ${esc(show('return'))}</b></div><p><code>${esc(this.mapping.climate||t.missing)}</code></p>`],
      tank:[t.tankTitle,`<p>${esc(t.series.tank)}: ${esc(show('tank'))}</p><p>${esc(t.target)}: ${target===null?esc(t.missing):esc(this.fmt(target,1))+' °C'}</p><button class="btn primary" id="go-dhw">${this.lang==='pl'?'Otwórz widok ciepłej wody →':'Open the hot water view →'}</button>`]
    }[node];
    if(!content)return;
    this.modal(content[0],content[1]);
    const go=this.$('#go-dhw');
    if(go)go.onclick=()=>{this.closeModal();this._page='dhw';this.render();};
  }
  async send(role,value){
    const t=this.t;
    if(this._sending)return;
    try{
      const req=temperatureRequest(this.state(role),this.mapping[role],value);
      if(!this._hass.services?.[req.domain]?.[req.service])throw Error('Service unavailable');
      if(!window.confirm(`${t.confirm}\n${req.data.entity_id}: ${req.data.temperature}`))return;
      this._sending=true;this.render();
      await this._hass.callService(req.domain,req.service,req.data);
      this._message=t.sent;this._pendingTarget=null;
    }catch(e){this._message=String(e.message||e);}
    finally{this._sending=false;this.render();}
  }
  exportCsv(){
    const t=this.t,roles=['flow','return','outside','room','tank','frequency'].filter(r=>this.mapping[r]);
    if(!this._range)return;
    const header=['time',...roles.map(r=>`${r}${this.unit(r)?'_'+this.unit(r).replace(/[^\w°]/g,''):''}`),'mode'].join(';');
    const lines=[];
    for(let i=0;i<this.steps;i++){
      const values=roles.map(r=>{const v=this.series(r)[i];return v===null?'':String(v).replace('.',',');});
      lines.push([this.slotTime(i).toISOString(),...values,this.slotMode(i)].join(';'));
    }
    const url=URL.createObjectURL(new Blob(['﻿'+[header,...lines].join('\r\n')],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a');
    a.href=url;a.download=`open-ecodan-${this._hours}h-${new Date().toISOString().slice(0,10)}.csv`;a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    this.toast(t.exported);
  }
}
class OpenEcodanEditor extends HTMLElement {
  constructor(){super();this.attachShadow({mode:'open'});}
  setConfig(config){this._config=validateConfig(config);this.render();}
  set hass(hass){this._hass=hass;if(!this._ready){this._ready=true;this.render();this.loadDevices();}}
  async loadDevices(){try{const [r,d]=await Promise.all([this._hass.callWS({type:'config/entity_registry/list'}),this._hass.callWS({type:'config/device_registry/list'})]);this._devices=discover(r,d,this._hass.states).devices;this.render();}catch{ /* Manual mappings remain available. */ }}
  emit(){this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:this._config},bubbles:true,composed:true}));}
  render(){if(!this._config)return;const c=this._config;
    this.shadowRoot.innerHTML=`<style>${css}</style><div class="app"><div class="main"><h2 style="margin-top:0">Open Ecodan Dashboard</h2>
      <div class="field"><label>Title</label><input id="title" value="${esc(c.title||'')}"></div>
      <div class="field"><label>Language</label><select id="language"><option value="pl" ${c.language==='pl'?'selected':''}>Polski</option><option value="en" ${c.language==='en'?'selected':''}>English</option></select></div>
      <div class="field"><label>Device (auto only when one device)</label><select id="device_id"><option value="">Auto</option>${(this._devices||[]).map(d=>`<option value="${esc(d.id)}" ${d.id===c.device_id?'selected':''}>${esc(d.name)}</option>`).join('')}</select></div>
      <p style="font-size:11px;color:var(--muted)">Empty = automatic; “None” disables a role. Energy is always mapped manually.</p>
      ${Object.entries(ROLES).map(([role,[label,domains]])=>`<div class="field"><label>${esc(label)}</label><select data-role="${role}"><option value="__auto" ${c.entities[role]===undefined?'selected':''}>Auto</option><option value="" ${c.entities[role]===''?'selected':''}>None</option>${c.entities[role]&&!this._hass?.states[c.entities[role]]?`<option selected value="${esc(c.entities[role])}">${esc(c.entities[role])} (unavailable)</option>`:''}${Object.keys(this._hass?.states||{}).filter(id=>domains.split(',').includes(id.split('.')[0])).sort().map(id=>`<option value="${esc(id)}" ${c.entities[role]===id?'selected':''}>${esc(this._hass.states[id].attributes.friendly_name||id)} (${esc(id)})</option>`).join('')}</select></div>`).join('')}
      <div class="field"><label>Price / kWh</label><input type="number" id="tariff" min="0" step="any" value="${c.tariff??''}"></div>
      <div class="field"><label>Currency</label><input id="currency" value="${esc(c.currency)}"></div>
      <label class="toggle"><span>Energy counters cover the SAME circuit and measurement scope</span><input type="checkbox" id="energy_scope_confirmed" ${c.energy_scope_confirmed?'checked':''}></label>
      <label class="toggle"><span>Enable temperature controls (commands require confirmation)</span><input type="checkbox" id="controls" ${c.controls?'checked':''}></label>
      <p style="font-size:11px;color:var(--muted)">Power controls are deliberately absent: MELCloud power can affect all zones and DHW.</p></div></div>`;
    this.shadowRoot.querySelectorAll('input,select').forEach(el=>el.onchange=()=>{const next={...this._config,entities:{...this._config.entities}};if(el.dataset.role){if(el.value==='__auto')delete next.entities[el.dataset.role];else next.entities[el.dataset.role]=el.value;}else next[el.id]=el.type==='checkbox'?el.checked:el.id==='tariff'?(el.value===''?null:Number(el.value)):el.value;try{this._config=validateConfig(next);el.setCustomValidity('');this.emit();}catch(e){el.setCustomValidity(e.message);el.reportValidity();}});
  }
}
if(!customElements.get('open-ecodan-dashboard'))customElements.define('open-ecodan-dashboard',OpenEcodanDashboard);
if(!customElements.get('open-ecodan-editor'))customElements.define('open-ecodan-editor',OpenEcodanEditor);
window.customCards=window.customCards||[];
if(!window.customCards.some(c=>c.type==='open-ecodan-dashboard'))window.customCards.push({type:'open-ecodan-dashboard',name:'Open Ecodan Dashboard',description:'MELCloud entities, local history and matched-period energy COP',preview:false});
