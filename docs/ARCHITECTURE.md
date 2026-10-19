# Architektura MVP

## Decyzja

Karta Dashboard/Plugin HACS jako jeden samowystarczalny plik JavaScript, bez nowej integracji Python. Istniejąca integracja MELCloud pozostaje jedynym właścicielem połączenia z Mitsubishi, konta i odpytywania urządzenia. Dodatkowy backend Python nie jest potrzebny do wyświetlenia encji, historii i wywołania usług HA.

| Warstwa | Odpowiedzialność |
|---|---|
| MELCloud w HA | Chmura Mitsubishi, dane urządzenia, stan encji i usługi |
| Recorder i History w HA | Lokalna retencja i statystyki; karta nie tworzy własnej bazy |
| `src/core.js` | Walidacja, wykrywanie, czysta matematyka energii i szacunki sprężarki |
| `src/card.js` | Web Component, własny Shadow DOM, siedem zakładek, edytor, API HA |
| `scripts/build.mjs` | Deterministyczne połączenie źródeł w jeden plik bez zależności |
| `dist/open-ecodan-dashboard.js` | Moduł ładowany przez Lovelace/HACS |

## Przepływ danych

HA przekazuje `hass` do karty. Karta pobiera `config/entity_registry/list` i `config/device_registry/list`, filtruje platformy `melcloud`/`melcloud_home` i grupuje po `device_id`. Przy wielu urządzeniach niczego automatycznie nie łączy. Nazwy/translation_key służą wyłącznie do propozycji roli wewnątrz wybranego urządzenia. Nie wybiera z kilku kandydatów. Wartości YAML/edytora nadpisują propozycje; pusty identyfikator jawnie wyłącza rolę.

Rejestry nie są pobierane przy każdym odświeżeniu stanu. Przy odmowie dostępu pozostaje ręczne mapowanie. Nie próbujemy omijać uprawnień HA.

Bieżący stan pochodzi z `hass.states`. Historia: `hass.callApi('GET', 'history/period/...')`, tylko zmapowane encje i maksymalnie 168h. Statystyki: `hass.callWS` dla dwóch liczników, okres `hour`, typ `sum`, jednostka kWh. Historia/statystyki odświeżają się na żądanie i co pięć minut przy otwartej karcie. Zamknięcie odłącza timer, a identyfikator żądania zapobiega zastosowaniu nieaktualnej odpowiedzi. Nie ma procesów działających poza otwartym frontendem.

## Sterowanie

Tylko `climate.set_temperature` lub `water_heater.set_temperature`, tylko dla zmapowanej roli i po `controls: true`. Walidujemy stan encji, feature bit, min/max i dostępność usługi. Nie ma dowolnego pola na nazwę usługi ani skrypt do wykonania. Każda komenda wymaga potwierdzenia użytkownika. Wynik przyjęcia usługi jest komunikatem; zmierzona temperatura pozostaje stanem z HA.

## Granice MVP

Jedna karta = wybrane urządzenie i jedna para energii. Dla kilku stref/obiegów użyj osobnych kart lub świadomie przygotowanych sumarycznych sensorów. Brak automatycznej agregacji energii uniemożliwia przypadkowe mieszanie CO/CWU. Urządzenie jest filtrem propozycji, a nie dodatkowym mechanizmem uprawnień; świadome ręczne przypisanie innego źródła jest możliwe.

Brak konwersji jednostek temperatur: karta wyświetla jednostki encji/HA. Energia normalizowana przez API do kWh. Brak sumowania mocy jako energii, estymacji COP z samego ΔT i zgadywania defrostu. Długie serie historii nie mają stronicowania — instalacje z bardzo częstymi zmianami powinny używać krótszego zakresu; optymalizacja to dalsza praca.

Harmonogramy, alerty, PV i sterowanie cenowe powinny być osobnymi, jawnymi automatyzacjami backendu HA. Implementacja w karcie byłaby zawodna przy zamkniętej przeglądarce. MVP nie instaluje żadnych automatyzacji.

## Bezpieczeństwo i licencje

Brak sieciowych importów, backendu projektu, fetch do zewnętrznych domen, hasła, tokena aplikacji lub CDN. Nazwy encji i teksty użytkownika są escapowane przy generowaniu HTML. Karta nie zapisuje telemetrii w localStorage. Konfigurację przechowuje Lovelace. MIT obejmuje własny kod; nazwy znaków towarowych są używane opisowo.

## Rozwój: Lit + Web Components

Dla dalszego rozwoju projektu zalecany jest przejście z monolitycznej struktury JavaScript do lekkiej architektury komponentowej opartą na Lit i Web Components. Główny cel: rozdzielić stan aplikacji, konfigurację, logikę biznesową i render UI, aby dodawanie kolejnych ustawień nie wymagało rozbudowy jednego dużego pliku.

### Proponowana struktura

```text
src/
  app/
    app-shell.js
    config.js
    defaults.js
    validation.js
    state-store.js
  components/
    open-ecodan-card.js
    tab-bar.js
    settings-panel.js
    entity-picker.js
    chart-card.js
  features/
    overview/
      overview-tab.js
      overview-data.js
    temperatures/
      temperatures-tab.js
      temperatures-data.js
    energy/
      energy-tab.js
      energy-data.js
    compressor/
      compressor-tab.js
      compressor-data.js
    settings/
      settings-tab.js
      settings-form.js
  services/
    hass-service.js
    history-service.js
    entity-discovery.js
    controls-service.js
    calculations.js
  utils/
    formatters.js
    validators.js
    safe-html.js
    constants.js
  index.js
```

### Zasady architektury

- `app/` — konfiguracja, walidacja, stan aplikacji i punkt wejścia.
- `components/` — małe, wielokrotnego użytku komponenty UI.
- `features/` — moduły funkcjonalne odpowiadające zakładkom i sekcjom karty.
- `services/` — integracja z `hass`, historia, wykrywanie encji, operacje na danych.
- `utils/` — wspólne formatowanie, walidacja i pomocnicze funkcje.

### Model danych

Każda sekcja korzysta z tego samego modelu:

- konfiguracja karty
- stan bieżący z HA
- przetworzone dane widoku
- akcje użytkownika / usługi

Nie mieszamy:

- renderowania UI,
- logiki obliczeń,
- pobierania danych z Home Assistant,
- walidacji ustawień.

### Jak dodawać nowe ustawienia

1. zdefiniować pole w `app/defaults.js` i `app/validation.js`,
2. dodać użytkowy komponent formularza w `features/settings/`,
3. podpiąć wartość do `state-store.js`,
4. użyć tego pola w odpowiedniej sekcji/zakładce,
5. dodać test dla walidacji i renderu.

### Korzyści

- łatwiejsze wydzielanie nowych zakładek,
- mniejsza ilość logiki w pojedynczych plikach,
- lepsza czytelność i testowalność,
- możliwość rozszerzania projektu bez przechodzenia na ciężki framework typu Angular.

To jest rekomendowana ścieżka rozwoju: lekki, komponentowy, zgodny z ekosystemem webowym i dobrze dopasowany do custom card w Home Assistant.
