# Open Ecodan Dashboard

Darmowa karta Lovelace dla Mitsubishi Ecodan korzystająca z istniejących encji Home Assistant. Własny kod: MIT. [English documentation](README.en.md).

**v0.1.0 — działające MVP do testów, bez weryfikacji na fizycznej instalacji HA.** To karta dashboardu, nie nowa integracja MELCloud ani dodatek Supervisor. Nie jest związana z Mitsubishi Electric. Projekt nie zawiera jej kodu, grafik ani danych prywatnych.

## Przykładowy widok

<div align="center">
  <img src="docs/images/open-ecodan-dashboard-preview.png" alt="Open Ecodan Dashboard preview" width="1200" />
</div>

> Dashboard w Home Assistant: przegląd, temperatury, energia, sprężarka, CWU i ustawienia w jednym miejscu.

## Co działa

- Siedem zakładek: Przegląd, Temperatury, Energia, Sprężarka, CWU, Diagnostyka, Ustawienia.
- Aktualne wartości z `hass.states`; brak encji, `unknown` i `unavailable` nie są zamieniane na zera.
- Wykresy z lokalnej historii HA: 6/24/72/168 godzin, podgląd najbliższego odczytu po wskazaniu wykresu i rozwijana tabela pomiarów. Temperatury są pokazywane na osobnych wykresach dla wspólnego zakresu czasu. Nakładanie serii i przeciąganie zakresu nie są zaimplementowane.
- Wykrywanie encji na podstawie platformy integracji i urządzenia. Przy wielu pompach trzeba wybrać urządzenie. Przy niejednoznacznych nazwach trzeba przypisać czujnik ręcznie.
- Graficzny edytor wszystkich mapowań, języka PL/EN, taryfy i dostępu do sterowania.
- COP okresu z przyrostów godzinowych `sum` HA Recorder, wyłącznie dla pary energii o zgodnym zakresie. Nie jest to chwilowy COP ani certyfikowany SCOP.
- Szacunek kosztu dla stałej ceny za kWh. Bez ceny pokazuje brak wartości; jawna cena 0 jest dozwolona.
- Oszacowanie czasu i startów sprężarki z historii częstotliwości, z pokazaniem pokrycia danych. Luki powyżej 15 minut są pomijane.
- Ustawianie temperatury `climate` i `water_heater`, domyślnie wyłączone, z potwierdzeniem, sprawdzeniem zakresów i obsługą błędów usług.

## Wymagania i modele

Masz już działającą integrację `melcloud` w HA. Wykrywanie rozpoznaje także platformę `melcloud_home`, ale nie została ona osobno przetestowana. Inne integracje i dodatkowe lokalne czujniki można mapować ręcznie.

Cel zgodności: aktualne HA 2026.10; nie ustalono jeszcze najstarszej wspieranej wersji. Karta nie zakłada konkretnego FTC ani mocy pompy: działa na możliwościach encji. Ecodan Air-to-Water jest zakresem docelowym. Nie deklarujemy przetestowanej zgodności konkretnych modeli. Starsze HA mogą udostępniać mniej czujników. Część czujników diagnostycznych jest domyślnie wyłączona w HA.

Włącz `history` i `recorder` (standardowo w `default_config`); mapowane encje muszą być rejestrowane. Statystyki energii wymagają `device_class: energy`, `state_class: total` lub `total_increasing` i jednostki Wh/kWh/MWh. Nie nadawaj tych klas czujnikom, których semantyka ich nie spełnia.

## Instalacja ręczna — możliwa już z tej paczki

1. Skopiuj `dist/open-ecodan-dashboard.js` do `/config/www/open-ecodan-dashboard.js`.
2. Ustawienia → Pulpity → menu → Zasoby: dodaj `/local/open-ecodan-dashboard.js?v=0.1.0`, typ **JavaScript module**. W razie potrzeby włącz tryb zaawansowany profilu.
3. Odśwież przeglądarkę. Dodaj kartę **Open Ecodan Dashboard** lub wklej:

```yaml
type: custom:open-ecodan-dashboard
language: pl
controls: false
entities: {}
```

4. Otwórz edytor karty. Sprawdź automatyczne przypisania w zakładce Ustawienia. Wybierz urządzenie przy wielu pompach. Pole Auto próbuje wykrywania, None wyłącza rolę.
5. Przypisz energię ręcznie i potwierdź zgodność obiegu dopiero po sprawdzeniu znaczenia encji. Na przykład ogrzewanie pobrane ↔ ogrzewanie oddane; nie pobrane całego systemu ↔ oddane wyłącznie CWU.

## HACS jako niestandardowe repozytorium — po publikacji na GitHub

Repozytorium nie zostało opublikowane. Użyj nazwy `open-ecodan-dashboard`, zachowaj plik `hacs.json` i katalog `dist` w głównej gałęzi.

1. Po zatwierdzeniu publikacji wgraj całe repozytorium na własne konto GitHub.
2. HACS → menu → Niestandardowe repozytoria → wklej **rzeczywisty URL opublikowanego repozytorium** → typ **Dashboard** (w niektórych wersjach Plugin).
3. Pobierz Open Ecodan Dashboard.
4. Sprawdź zasób `/hacsfiles/open-ecodan-dashboard/open-ecodan-dashboard.js`, typ module. Dodaj ręcznie, jeśli HACS go nie zarejestrował. Nie dodawaj jednocześnie zasobu `/local/` tej samej karty.
5. Dodaj kartę jak powyżej.

To przygotowana struktura niestandardowego repozytorium, nie zatwierdzenie do domyślnego katalogu HACS.

## Aktualizacje

W HACS pobierz aktualizację i przeładuj frontend. Ręcznie: zastąp plik JS, zmień parametr `?v=...` zasobu i odśwież. Zapisz kopię konfiguracji karty przed aktualizacją. Usunięcie zasobu i karty nie usuwa historii Recorder.

## COP i koszty

Wybierz po jednej encji pobranej i oddanej energii tego samego obiegu. Nie ma automatycznego sumowania trzech obiegów; aby pokazać cały system, przygotuj poprawnie zsynchronizowane liczniki sumaryczne w HA. Nie dodawaj bez sprawdzenia dziennych sensorów resetujących się o różnych porach.

Karta prosi o godzinowe statystyki `sum` z konwersją do kWh. `sum` jest skorygowaną przez Recorder sumą przyrostów, a nie bieżącą wartością dziennego licznika. Dla każdego godzinowego odcinka wymaga obecności obu końców obu serii. Brak godziny, `null` lub ujemny przyrost powoduje brak wyniku. COP = suma przyrostów oddanej energii / suma przyrostów pobranej energii. Pobór 0 daje brak COP, a nie nieskończoność ani 0.

Statystyka oznaczona początkiem godziny zawiera sumę na jej końcu. Wyświetlany przedział jest odpowiednio przesunięty o godzinę. Dane kończą się na ostatniej pełnej godzinie UTC. Opóźnienie Recorder może czasowo uniemożliwić wynik; karta nie skraca po cichu okresu. Godzinowe próbki obu źródeł nie gwarantują identycznego fizycznego czasu pomiaru w chmurze — poprawność zależy też od integracji i liczników. Błędne skoki licznika skoryguj w narzędziach statystyk HA.

Koszt = energia pobrana × wpisana cena. Jest szacunkiem dla płaskiej ceny obejmującej wybrane przez Ciebie składniki; nie fakturą, nie wyceną taryfy G12 ani taryfy godzinowej. Zmiana ceny przelicza cały oglądany okres.

## Sterowanie i prywatność

Karta nie zbiera haseł MELCloud, nie otwiera dodatkowego połączenia do Mitsubishi i nie ma backendu, CDN ani analityki. Korzysta z obiektu `hass` i sesji użytkownika HA. W działaniu komunikuje się wyłącznie z własnym HA. Integracja MELCloud nadal używa chmury Mitsubishi; ten projekt nie zmienia jej w integrację lokalną. Żadna funkcja nie wymaga płatnej usługi projektu ani konta w serwisie innym niż MELCloud.

Temperatury można ustawiać po `controls: true`. Każda komenda wymaga potwierdzenia i nie jest pokazywana jako osiągnięty pomiar. Karta nie oferuje wyłączania zasilania, ponieważ MELCloud może wyłączyć cały system ze wszystkimi strefami i zasobnikiem. Nie ingeruje w program antylegionella ani zabezpieczenia sterownika. Uprawnienia egzekwuje serwer HA.

Brak encji defrost lub błędu oznacza **brak wiedzy**, a nie brak odszraniania lub awarii. Historyczne braki nie są uzupełniane sztucznymi wartościami. Linie na wykresie są wizualnym połączeniem odczytów, a nie dodatkowym pomiarem; długie odcinki bez zmian nie gwarantują częstego próbkowania.

## Rozwój i testy

Node.js 22+; brak zależności npm i brak procesu instalowania paczek:

```sh
npm run build
npm test
npm run check
```

Build łączy własne źródła w jeden plik, bez importów zewnętrznych. GitHub Actions buduje, sprawdza składnię, uruchamia testy i sprawdza zgodność `dist` ze źródłami. Nie publikuje kodu ani release automatycznie.

Testy obejmują matematykę COP, braki i reset licznika, bezpieczeństwo sterowania, wykrywanie wielu urządzeń, ładowanie dystrybucji i kontrakt wywołań HA. Testy karty stosują minimalny adapter DOM — nie są testem rzeczywistego frontendu HA. Przed wydaniem wykonaj [procedurę odbioru](docs/ACCEPTANCE.md).

## Ograniczenia i dalszy zakres

Nie zaimplementowano SCOP, dynamicznych taryf, edytora harmonogramów, powiadomień w tle, Summer ECO, automatyzacji PV, trybu nocnego, odczytu kodów serwisowych ani publicznych linków do raportów. Karta działa tylko przy otwartym dashboardzie; harmonogramy i alarmy muszą działać w backendzie HA. Architektura: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
