# Weryfikacja i odbiór / Acceptance

## Wykonane w środowisku przygotowania

- Budowanie jednego pliku dystrybucyjnego bez zależności.
- Kontrola składni Node.js.
- 15 automatycznych testów jednostkowych/kontraktowych: poprawne i brakujące pomiary, walidacja konfiguracji, escaping, COP ważony energią, sumy po resecie, brak wspólnych godzin, null, zerowy pobór, ujemne korekty, wiele urządzeń, niejednoznaczne czujniki, pokrycie częstotliwości, walidacja usług, rejestracja karty, odmowa API i kontrakt historii/statystyk.
- Przegląd własnego kodu: brak połączeń z serwerem projektu, hasła MELCloud i danych prywatnych w repozytorium.

Adapter DOM w testach nie renderuje interfejsu jak przeglądarka. Poniższych punktów nie wykonano, ponieważ nie udostępniono instancji HA. Nie oznaczać tego wydania jako zweryfikowanego na sprzęcie.

## Procedura w istniejącym HA — najpierw tylko odczyt

1. Zainstaluj ręcznie JS i dodaj kartę z `controls: false`. Sprawdź brak błędów konsoli i widoczność karty w pickerze.
2. Porównaj każdą wykrytą encję z Narzędzia deweloperskie → Stany. Przy wielu urządzeniach wybierz właściwe; potwierdź brak mieszania modeli/stref. Sprawdź ręczne mapowanie i None.
3. Otwórz wszystkie siedem zakładek, zakresy 6/24/72/168h, tabelę pomiarów i podgląd kursorem. Porównaj z Historią HA. Sprawdź 360px telefonu, tablet i desktop oraz jasny/ciemny motyw i języki PL/EN.
4. Sprawdź edytor GUI: zapis mapowania, odświeżenie strony, ponowne otwarcie edytora i zgodność YAML. Testuj także encję, która chwilowo nie istnieje lub jest unavailable.
5. Wybierz parę CO pobrane/oddane, potwierdź zgodność, poczekaj na pełne statystyki. Porównaj przyrosty Recorder w dokładnie tym samym wyświetlonym okresie. Powtórz przez północ i przy zmianie czasu lokalnego; zakres obliczeń jest UTC.
6. Sprawdź przypadek brakującej godziny, braku Recorder, błędu uprawnień i braku statystyk. Karta ma pokazywać brak wyniku, a nie 0 kWh/COP. Nie psuj produkcyjnych liczników — użyj osobnej instalacji testowej lub fixture.
7. Bez ceny koszt ma być niedostępny. Po wpisaniu ceny porównaj ręcznie energia × cena. Nie oceniaj tego jako pełnego rozliczenia taryfy wielostrefowej.
8. Jeśli częstotliwość istnieje, porównaj obserwowane przejścia 0→>0 z historią. Interpretuj starty/czas jako szacunki, uwzględniając pokrycie; nie porównuj ich bezpośrednio z licznikiem całkowitym sterownika.
9. Brak encji defrost/błędu musi dawać brak danych. Nie uruchamiaj defrostu lub błędu celowo.
10. W narzędziach sieciowych sprawdź wywołania wyłącznie do własnego HA. Karta nie może prosić o ponowne logowanie do MELCloud ani o klucz projektu.

## Sterowanie — tylko świadomy test użytkownika

Włącz `controls: true` dopiero po weryfikacji mapowania i zakresów. Wybierz bezpieczną dla własnej instalacji temperaturę. Anulowanie potwierdzenia nie może wywoływać usługi. Potwierdzona komenda ma trafić tylko do zmapowanej encji i nie może od razu zastąpić temperatury zmierzonej. Sprawdź obsługę odmowy usługi i odłączenia chmury. Przywróć poprzedni cel, jeśli był zmieniony. Ten dokument nie autoryzuje automatycznego testowania na pompie użytkownika.

## HACS i wydanie

Po zatwierdzeniu publikacji użyj publicznego repo `open-ecodan-dashboard` i wykonaj instalację przez niestandardowe repozytorium Dashboard na czystym profilu HA. Sprawdź ścieżkę zasobu, aktualizację, wersję, brak podwójnego ładowania i możliwość usunięcia. Sprawdź CI na GitHub. Nie deklarować wpisu w domyślnym katalogu HACS przed jego akceptacją.
