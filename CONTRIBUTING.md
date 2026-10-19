# Współpraca

Dziękujemy za zainteresowanie projektem Open Ecodan Dashboard.

## Jak zgłaszać problemy

- Najpierw sprawdź, czy problem nie został już zgłoszony.
- Otwórz nowe zgłoszenie z jasnym opisem:
  - co zostało zrobione,
  - jakie były oczekiwania,
  - jakie dane/konfiguracja Home Assistant są istotne,
  - czy problem występuje na konkretnym modelu pompy lub wersji HA.

## Jak przygotować pull request

1. Zrób fork repozytorium lub utwórz osobną gałąź.
2. Wprowadź zmiany w sposób minimalny i czytelny.
3. Uruchom lokalnie:

```sh
npm run build
npm test
```

4. Zadbaj o opis PR: co zostało zmienione i dlaczego.
5. Upewnij się, że zmiany nie wprowadzają regresji i są zgodne z dokumentacją projektu.

## Styl i standardy

- Preferuj małe, czytelne zmiany.
- Nie dodawaj niepotrzebnych zależności.
- Dokumentuj zmiany w README lub docs, jeśli wpływają na użytkowanie.
- Dla UI i logiki zachowuj zgodność z istniejącym stylem projektu.

## Kiedy warto otworzyć PR

- poprawka błędu,
- ulepszenie wykrywania encji,
- dodanie wsparcia dla nowych konfiguracji,
- poprawa dokumentacji i testów.

## Licencja

Przez udział w projekcie akceptujesz warunki licencji MIT zawartej w pliku [LICENSE](LICENSE).
