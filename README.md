# Outpost – System Logistyczny i Śledzenie Przesyłek

Aplikacja demonstracyjna w technologii **Angular 19 + Angular Material** (Standalone Components) dla firmy kurierskiej **Outpost**, przygotowana pod integrację z backendowym REST API.

## Moduły systemu

1. **Śledzenie przesyłek (`/panel-klienta`)**
   - Wyszukiwanie przesyłek po numerze przewozowym.
   - Dwupoziomowy dostęp: status ogólny dla Gościa oraz pełne zarządzanie po weryfikacji tożsamości kodem jednorazowym e-mail.
   - Zmiana adresu doręczenia, przekierowanie do punktu/automatu paczkowego, generowanie kodu odbioru PIN/QR.

2. **Administracja (`/administracja`)**
   - Zarządzanie kontami pracowników (modyfikacja, dodawanie, blokowanie).
   - Wykonywanie i weryfikacja kopii zapasowej bazy danych.
   - Konfiguracja struktury oddziału: dodawanie stanowisk wydawczych i przypisywanie rejonów.
   - Generowanie raportów operacyjnych (obciążenie, skuteczność, przyczyny nieudanych doręczeń).

3. **Sortownia (`/sortownia`)**
   - Ewidencja i wyszukiwarka przesyłek ze zmianą statusu i powiadomieniami.
   - Rejestracja nowej przesyłki z automatyczną weryfikacją danych kontaktowych odbiorcy.
   - Taśma sortownicza – kwalifikacja przesyłek do rejonu i stanowiska.
   - Zestawienia wydajności pracy sortowni, siatka rejonów oraz zarządzanie personelem oddziału.

4. **Stanowiska wydawcze (`/stanowisko-wydawcze`)**
   - Weryfikacja stanu stanowiska oraz ponowny wydruk etykiet paczek.
   - Fizyczne rozmieszczenie posortowanych przesyłek na stanowiskach.
   - Przyjmowanie zwrotów niedoręczonych paczek z trasy.

5. **Panel kuriera (`/kurier`)**
   - Załadunek paczek ze stanowiska (wybór z listy lub skan etykiety).
   - Generowanie i wydruk dobowej listy przewozowej.
   - Optymalizacja trasy rozwożenia, okna czasowe i szczegóły dojazdu.
   - Wydanie przesyłki odbiorcy (podpis elektroniczny lub kod PIN).
   - Rozliczenie i zgłoszenie niedoręczonych paczek po zjeździe na bazę.

## Uruchomienie lokalne

```bash
npm install
npm start
```

Aplikacja uruchomi się pod adresem: `http://localhost:4200`

## Budowanie wersji produkcyjnej

```bash
npm run build
```
Wynik kompilacji znajduje się w katalogu `dist/courier-system-demo`.
