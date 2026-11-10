import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import {
  DeliveryRegion,
  DispatchStation,
  Parcel,
  ParcelDimensions,
  ParcelStatus,
  PickupPoint
} from '../models/domain.models';
import { MockDatabaseService } from './mock-database.service';

@Injectable({ providedIn: 'root' })
export class ParcelService {
  private readonly db = inject(MockDatabaseService);
  // W przyszłości: private readonly http = inject(HttpClient);

  readonly parcels$ = this.db.parcels$.asObservable();
  readonly pickupPoints$ = this.db.pickupPoints$.asObservable();

  private nowFormatted(): string {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }

  /**
   * PU „Sprawdzenie publicznego statusu przesyłki” oraz rozszerzenie „Sprawdzenie pełnych danych przesyłki”
   * Docelowo: return this.http.get<Parcel>(`/api/parcels/track/${trackingNumber}`);
   */
  getParcelByTrackingNumber(trackingNumber: string): Observable<Parcel> {
    const clean = trackingNumber.trim().toUpperCase();
    const found = this.db.parcels$.value.find((p) => p.trackingNumber.toUpperCase() === clean);

    if (!found) {
      // Przebieg alternatywny 1: Błędny numer przesyłki
      return throwError(
        () => new Error(`Brak przesyłki o numerze "${clean}" w bazie danych systemu.`)
      ).pipe(delay(250));
    }

    return of(structuredClone(found)).pipe(delay(250));
  }

  /**
   * PU „Zmiana adresu doręczenia” (Klient zweryfikowany)
   * Docelowo: return this.http.patch<Parcel>(`/api/parcels/${trackingNumber}/address`, { newAddress, postalCode, city });
   */
  changeDeliveryAddress(
    trackingNumber: string,
    newAddress: string,
    postalCode: string,
    city: string
  ): Observable<Parcel> {
    const parcels = [...this.db.parcels$.value];
    const index = parcels.findIndex((p) => p.trackingNumber === trackingNumber);
    if (index === -1) {
      return throwError(() => new Error('Przesyłka nie istnieje.')).pipe(delay(200));
    }

    const parcel = { ...parcels[index], history: [...parcels[index].history] };

    // Przebieg alternatywny: Paczka została już pobrana przez kuriera
    const unavailableStatuses: ParcelStatus[] = [
      'Pobrano ze stanowiska',
      'W doręczeniu',
      'Doręczona'
    ];
    if (unavailableStatuses.includes(parcel.status)) {
      return throwError(
        () =>
          new Error(
            'Zmiana adresu doręczenia jest niedostępna: paczka została już pobrana przez kuriera lub doręczona.'
          )
      ).pipe(delay(250));
    }

    parcel.deliveryAddress = `${newAddress}, ${postalCode} ${city}`;
    parcel.postalCode = postalCode;
    parcel.city = city;
    parcel.history.push({
      timestamp: this.nowFormatted(),
      status: parcel.status,
      location: 'Panel Klienta (Online)',
      description: `Zmieniono adres doręczenia na: ${parcel.deliveryAddress}. Powiadomiono sortownię.`,
      notificationSent: true
    });

    parcels[index] = parcel;
    this.db.parcels$.next(parcels);
    return of(structuredClone(parcel)).pipe(delay(250));
  }

  /**
   * PU „Przekierowanie paczki” (Klient zweryfikowany)
   * Docelowo: return this.http.post<Parcel>(`/api/parcels/${trackingNumber}/redirect`, { pickupPointId });
   */
  redirectParcelToPoint(trackingNumber: string, pickupPointId: string): Observable<Parcel> {
    const parcels = [...this.db.parcels$.value];
    const index = parcels.findIndex((p) => p.trackingNumber === trackingNumber);
    if (index === -1) {
      return throwError(() => new Error('Przesyłka nie istnieje.')).pipe(delay(200));
    }

    const point = this.db.pickupPoints$.value.find((pt) => pt.id === pickupPointId);
    if (!point) {
      return throwError(() => new Error('Wybrany punkt odbioru nie istnieje.')).pipe(delay(200));
    }

    const parcel = { ...parcels[index], history: [...parcels[index].history] };

    // Przebieg alternatywny: Przekierowanie niemożliwe ze względu na gabaryty paczki
    if (!point.maxDimensions.includes(parcel.dimensions)) {
      return throwError(
        () =>
          new Error(
            `Przekierowanie niemożliwe ze względu na gabaryty paczki (${parcel.dimensions}, ${parcel.weightKg} kg). Wybrany punkt (${point.name}) obsługuje wyłącznie gabaryty: ${point.maxDimensions.join(', ')}.`
          )
      ).pipe(delay(250));
    }

    parcel.redirectedPointId = point.id;
    parcel.redirectedPointName = `${point.name} (${point.address}, ${point.city})`;
    parcel.deliveryAddress = `${point.name} – ${point.address}, ${point.city}`;
    parcel.history.push({
      timestamp: this.nowFormatted(),
      status: parcel.status,
      location: 'Panel Klienta (Online)',
      description: `Przekierowano paczkę do punktu: ${parcel.redirectedPointName}. Zrekonfigurowano trasę doręczenia.`
    });

    parcels[index] = parcel;
    this.db.parcels$.next(parcels);
    return of(structuredClone(parcel)).pipe(delay(250));
  }

  /**
   * PU „Generowanie kodu odbioru” (Klient zweryfikowany)
   * Docelowo: return this.http.post<{ pickupCode: string }>(`/api/parcels/${trackingNumber}/pickup-code`, { sendSms });
   */
  generatePickupCode(trackingNumber: string, sendSms: boolean): Observable<{ pickupCode: string; smsSent: boolean }> {
    const parcels = [...this.db.parcels$.value];
    const index = parcels.findIndex((p) => p.trackingNumber === trackingNumber);
    if (index === -1) {
      return throwError(() => new Error('Przesyłka nie istnieje.')).pipe(delay(200));
    }

    const parcel = { ...parcels[index], history: [...parcels[index].history] };
    if (parcel.status !== 'W doręczeniu' && parcel.status !== 'Gotowa do odbioru') {
      return throwError(
        () =>
          new Error(
            `Kod odbioru można wygenerować wyłącznie dla przesyłki o statusie „W doręczeniu” lub „Gotowa do odbioru” (obecny status: „${parcel.status}”).`
          )
      ).pipe(delay(250));
    }

    const generatedPin = Math.floor(100000 + Math.random() * 900000).toString();
    parcel.pickupCode = generatedPin;
    parcel.history.push({
      timestamp: this.nowFormatted(),
      status: parcel.status,
      location: 'Panel Klienta',
      description: `Wygenerowano jednorazowy kod odbioru PIN/QR (${generatedPin})${sendSms ? ' i wysłano wiadomością SMS na numer ' + parcel.recipientPhone : ''}.`
    });

    parcels[index] = parcel;
    this.db.parcels$.next(parcels);
    return of({ pickupCode: generatedPin, smsSent: sendSms }).pipe(delay(250));
  }

  /**
   * Moduł Sortownia: PU „Rejestrowanie przesyłki” (zawiera <<include>> „Weryfikacja danych kontaktowych odbiorcy”)
   * Docelowo: return this.http.post<Parcel>('/api/sorting/parcels', payload);
   */
  registerParcelInSortingFacility(payload: {
    trackingNumber: string;
    senderName: string;
    senderPhone: string;
    recipientName: string;
    recipientEmail: string;
    recipientPhone: string;
    deliveryAddress: string;
    postalCode: string;
    city: string;
    weightKg: number;
    dimensions: ParcelDimensions;
  }): Observable<{ parcel: Parcel; verificationPassed: boolean; message: string }> {
    const parcels = [...this.db.parcels$.value];
    const cleanTracking = payload.trackingNumber.trim().toUpperCase();

    if (parcels.some((p) => p.trackingNumber.toUpperCase() === cleanTracking)) {
      return throwError(() => new Error(`Przesyłka o numerze ${cleanTracking} jest już zarejestrowana.`)).pipe(delay(200));
    }

    // Krok 2 (<<include>>): Weryfikacja danych kontaktowych odbiorcy
    const isContactValid =
      payload.recipientName.trim().length > 2 &&
      payload.recipientEmail.includes('@') &&
      payload.recipientPhone.trim().length >= 7 &&
      payload.deliveryAddress.trim().length > 3 &&
      payload.postalCode.trim().length >= 5;

    if (!isContactValid) {
      // Przebieg alternatywny: Dane odbiorcy są niepełne -> paczka trafia do wyjaśnienia
      const issueParcel: Parcel = {
        ...payload,
        trackingNumber: cleanTracking,
        status: 'Do wyjaśnienia (błąd danych odbiorcy)',
        currentLocation: 'Sortownia – Sekcja Wyjaśnień',
        history: [
          {
            timestamp: this.nowFormatted(),
            status: 'Do wyjaśnienia (błąd danych odbiorcy)',
            location: 'Sortownia Centralna Wrocław',
            description:
              'Błąd weryfikacji danych kontaktowych odbiorcy (dane niepełne lub niepoprawne). Przesyłka skierowana do wyjaśnienia.'
          }
        ]
      };
      this.db.parcels$.next([issueParcel, ...parcels]);
      return of({
        parcel: issueParcel,
        verificationPassed: false,
        message:
          'Weryfikacja danych kontaktowych odbiorcy zakończona błędem (dane niepełne). Paczka trafiła do wyjaśnienia.'
      }).pipe(delay(250));
    }

    const newParcel: Parcel = {
      ...payload,
      trackingNumber: cleanTracking,
      status: 'Zarejestrowana',
      currentLocation: 'Sortownia Centralna Wrocław – Przyjęcie',
      history: [
        {
          timestamp: this.nowFormatted(),
          status: 'Zarejestrowana',
          location: 'Sortownia Centralna Wrocław',
          description: `Pomyślnie zarejestrowano przesyłkę (${payload.weightKg} kg, gabaryt ${payload.dimensions}) i zweryfikowano dane kontaktowe odbiorcy.`
        }
      ]
    };

    this.db.parcels$.next([newParcel, ...parcels]);
    return of({
      parcel: newParcel,
      verificationPassed: true,
      message: 'Przesyłka została pomyślnie zweryfikowana i zarejestrowana w bazie danych sortowni.'
    }).pipe(delay(250));
  }

  /**
   * Moduł Sortownia: PU „Wyszukiwanie przesyłek”
   * Docelowo: return this.http.get<Parcel[]>('/api/sorting/parcels/search', { params: { query } });
   */
  searchParcels(query: string): Observable<Parcel[]> {
    const q = query.trim().toLowerCase();
    if (!q) {
      return of(structuredClone(this.db.parcels$.value)).pipe(delay(150));
    }
    const results = this.db.parcels$.value.filter(
      (p) =>
        p.trackingNumber.toLowerCase().includes(q) ||
        p.senderName.toLowerCase().includes(q) ||
        p.recipientName.toLowerCase().includes(q) ||
        p.recipientEmail.toLowerCase().includes(q) ||
        p.deliveryAddress.toLowerCase().includes(q)
    );
    return of(structuredClone(results)).pipe(delay(200));
  }

  /**
   * Moduł Sortownia: PU „Przyporządkowanie przesyłki do rejonu i stanowiska wydawczego”
   * Docelowo: return this.http.post<...>(`/api/sorting/parcels/${trackingNumber}/assign-region`, {});
   */
  assignParcelToRegionAndStation(trackingNumber: string): Observable<{
    parcel: Parcel;
    region?: DeliveryRegion;
    station?: DispatchStation;
    isProblematic: boolean;
    instruction: string;
  }> {
    const parcels = [...this.db.parcels$.value];
    const index = parcels.findIndex((p) => p.trackingNumber.toUpperCase() === trackingNumber.trim().toUpperCase());

    if (index === -1) {
      return throwError(() => new Error('Przesyłka o podanym kodzie nie jest zarejestrowana w systemie sortowni.')).pipe(
        delay(200)
      );
    }

    const parcel = { ...parcels[index], history: [...parcels[index].history] };
    const matchedRegion = this.db.regions$.value.find((r) =>
      r.postalCodePrefixes.some((prefix) => parcel.postalCode.startsWith(prefix))
    );

    if (!matchedRegion) {
      // Przebieg alternatywny: Adres nie należy do żadnego zdefiniowanego rejonu -> strefa przesyłek problematycznych
      parcel.status = 'Strefa przesyłek problematycznych';
      parcel.currentLocation = 'Sortownia – Strefa Przesyłek Problematycznych';
      parcel.assignedRegionId = undefined;
      parcel.assignedStationId = undefined;
      parcel.history.push({
        timestamp: this.nowFormatted(),
        status: 'Strefa przesyłek problematycznych',
        location: 'Taśma sortownicza',
        description: `Kod pocztowy ${parcel.postalCode} nie należy do żadnego zdefiniowanego rejonu. Skierowano do strefy przesyłek problematycznych.`
      });
      parcels[index] = parcel;
      this.db.parcels$.next(parcels);

      return of({
        parcel,
        isProblematic: true,
        instruction: `UWAGA: Adres (${parcel.postalCode} ${parcel.city}) nie należy do żadnego zdefiniowanego rejonu. Skieruj paczkę do STREFY PRZESYŁEK PROBLEMATYCZNYCH.`
      }).pipe(delay(250));
    }

    const matchedStation = this.db.stations$.value.find(
      (s) => s.id === matchedRegion.assignedStationId || s.assignedRegionId === matchedRegion.id
    );

    parcel.assignedRegionId = matchedRegion.id;
    parcel.assignedStationId = matchedStation?.id;
    parcel.status = 'Posortowano';
    parcel.currentLocation = `Sortownia – Skierowano na ${matchedStation ? matchedStation.id : matchedRegion.id}`;
    parcel.history.push({
      timestamp: this.nowFormatted(),
      status: 'Posortowano',
      location: 'Taśma sortownicza',
      description: `Przyporządkowano do rejonu ${matchedRegion.name} (${matchedRegion.id}) oraz stanowiska ${matchedStation?.id ?? 'brak'}.`
    });

    parcels[index] = parcel;
    this.db.parcels$.next(parcels);

    return of({
      parcel,
      region: matchedRegion,
      station: matchedStation,
      isProblematic: false,
      instruction: `Skieruj przesyłkę na stanowisko wydawcze ${matchedStation?.id ?? 'N/A'} (${matchedStation?.name ?? ''}) – Rejon: ${matchedRegion.name}.`
    }).pipe(delay(250));
  }

  /**
   * Moduł Sortownia: PU „Aktualizowanie statusu przesyłki”
   * (zawiera <<include>> „Zapisywanie zmiany w historii przesyłki” oraz <<include>> „Wysyłanie powiadomienia o zmianie statusu”)
   */
  updateParcelStatusInSorting(
    trackingNumber: string,
    newStatus: ParcelStatus,
    operatorNote?: string
  ): Observable<{ parcel: Parcel; historySaved: boolean; notificationMessage: string }> {
    const parcels = [...this.db.parcels$.value];
    const index = parcels.findIndex((p) => p.trackingNumber === trackingNumber);
    if (index === -1) {
      return throwError(() => new Error('Nie znaleziono wybranej przesyłki w systemie sortowni.')).pipe(delay(200));
    }

    const parcel = { ...parcels[index], history: [...parcels[index].history] };
    parcel.status = newStatus;
    parcel.currentLocation = 'Sortownia Centralna Wrocław';

    // <<include>> Zapisywanie zmiany w historii przesyłki + <<include>> Wysyłanie powiadomienia o zmianie statusu
    const desc = operatorNote
      ? `Zmiana statusu na „${newStatus}” (${operatorNote}). Wysłano powiadomienie e-mail/SMS do odbiorcy (${parcel.recipientEmail}).`
      : `Zmiana statusu w sortowni na „${newStatus}”. Wysłano powiadomienie e-mail/SMS do odbiorcy (${parcel.recipientEmail}).`;

    parcel.history.push({
      timestamp: this.nowFormatted(),
      status: newStatus,
      location: 'Sortownia Centralna Wrocław',
      description: desc,
      notificationSent: true
    });

    parcels[index] = parcel;
    this.db.parcels$.next(parcels);

    return of({
      parcel: structuredClone(parcel),
      historySaved: true,
      notificationMessage: `Zapisano wpis w historii przesyłki oraz wysłano powiadomienie o zmianie statusu („${newStatus}”) na adres ${parcel.recipientEmail}.`
    }).pipe(delay(250));
  }

  /**
   * Moduł Stanowisko wydawcze: PU „Umieść przesyłkę na stanowisku”
   */
  placeParcelOnStation(trackingNumber: string, targetStationId: string): Observable<Parcel> {
    const parcels = [...this.db.parcels$.value];
    const index = parcels.findIndex((p) => p.trackingNumber.toUpperCase() === trackingNumber.trim().toUpperCase());
    if (index === -1) {
      return throwError(() => new Error('Przesyłka o podanym kodzie nie istnieje.')).pipe(delay(200));
    }

    const parcel = { ...parcels[index], history: [...parcels[index].history] };
    const station = this.db.stations$.value.find((s) => s.id === targetStationId);
    if (!station) {
      return throwError(() => new Error('Wybrane stanowisko wydawcze nie istnieje.')).pipe(delay(200));
    }

    // Przebieg alternatywny: Błędne stanowisko (niezgodne z przypisanym rejonem/stanowiskiem)
    if (parcel.assignedStationId && parcel.assignedStationId !== targetStationId) {
      return throwError(
        () =>
          new Error(
            `SYGNAŁ OSTRZEGAWCZY – BŁĘDNE STANOWISKO! Przesyłka ${parcel.trackingNumber} (rejon ${parcel.assignedRegionId}) jest przydzielona do stanowiska ${parcel.assignedStationId}, a zeskanowano przy ${targetStationId}.`
          )
      ).pipe(delay(250));
    }

    if (parcel.assignedRegionId && station.assignedRegionId && parcel.assignedRegionId !== station.assignedRegionId) {
      return throwError(
        () =>
          new Error(
            `SYGNAŁ OSTRZEGAWCZY – BŁĘDNE STANOWISKO! Stanowisko ${station.id} obsługuje rejon ${station.assignedRegionId}, natomiast paczka ma przypisany rejon ${parcel.assignedRegionId}.`
          )
      ).pipe(delay(250));
    }

    parcel.assignedStationId = targetStationId;
    parcel.status = 'Oczekuje na stanowisku wydawczym';
    parcel.currentLocation = `Stanowisko wydawcze ${targetStationId}`;
    parcel.history.push({
      timestamp: this.nowFormatted(),
      status: 'Oczekuje na stanowisku wydawczym',
      location: `Stanowisko ${targetStationId}`,
      description: `Zeskanowano etykietę i potwierdzono zgodność stanowiska ${targetStationId} z rejonem ${parcel.assignedRegionId ?? station.assignedRegionId}.`
    });

    parcels[index] = parcel;
    this.db.parcels$.next(parcels);
    return of(structuredClone(parcel)).pipe(delay(250));
  }

  /**
   * Moduł Stanowisko wydawcze: PU „Sprawdź stan stanowiska” -> punkt rozszerzeń „Drukuj etykietę paczki”
   */
  reprintParcelLabel(trackingNumber: string): Observable<Parcel> {
    const parcels = [...this.db.parcels$.value];
    const index = parcels.findIndex((p) => p.trackingNumber === trackingNumber);
    if (index === -1) {
      return throwError(() => new Error('Przesyłka nie istnieje.')).pipe(delay(200));
    }

    const parcel = { ...parcels[index], history: [...parcels[index].history] };
    parcel.damagedLabel = false;
    parcel.history.push({
      timestamp: this.nowFormatted(),
      status: parcel.status,
      location: parcel.currentLocation,
      description: 'Wydrukowano duplikat etykiety przewozowej (zastąpiono uszkodzoną etykietę).'
    });

    parcels[index] = parcel;
    this.db.parcels$.next(parcels);
    return of(structuredClone(parcel)).pipe(delay(200));
  }

  /**
   * Moduł Stanowisko wydawcze: PU „Przyjmij niedoręczoną przesyłkę z trasy” (Pracownik sortowni)
   */
  acceptUndeliveredParcelFromRoute(trackingNumber: string, confirmedReason: string): Observable<Parcel> {
    const parcels = [...this.db.parcels$.value];
    const index = parcels.findIndex((p) => p.trackingNumber.toUpperCase() === trackingNumber.trim().toUpperCase());
    if (index === -1) {
      return throwError(() => new Error('Nie znaleziono przesyłki o zeskanowanym kodzie.')).pipe(delay(200));
    }

    const parcel = { ...parcels[index], history: [...parcels[index].history] };
    parcel.status = 'Zwrócona na stanowisko/sortownię';
    parcel.nonDeliveryReason = confirmedReason;
    parcel.currentLocation = `Stanowisko ${parcel.assignedStationId ?? 'ST-01'} (Zwrot z trasy)`;
    parcel.history.push({
      timestamp: this.nowFormatted(),
      status: 'Zwrócona na stanowisko/sortownię',
      location: parcel.currentLocation,
      description: `Przyjęto niedoręczoną przesyłkę z trasy. Potwierdzona przyczyna: ${confirmedReason}.`
    });

    parcels[index] = parcel;
    this.db.parcels$.next(parcels);
    return of(structuredClone(parcel)).pipe(delay(250));
  }

  /**
   * Moduł Stanowisko wydawcze: PU „Zabierz przesyłkę ze stanowiska” (Kurier - wybór z listy lub skan etykiety)
   */
  pickupParcelsFromStationByCourier(trackingNumbers: string[], courierId: string, courierName: string, scannedIndividually: boolean): Observable<Parcel[]> {
    const parcels = [...this.db.parcels$.value];
    const updatedList: Parcel[] = [];

    for (const tn of trackingNumbers) {
      const idx = parcels.findIndex((p) => p.trackingNumber.toUpperCase() === tn.trim().toUpperCase());
      if (idx === -1) {
        return throwError(() => new Error(`Przesyłka ${tn} nie została znaleziona na stanowisku.`)).pipe(delay(200));
      }
      const p = { ...parcels[idx], history: [...parcels[idx].history] };
      p.assignedCourierId = courierId;
      p.status = 'Pobrano ze stanowiska';
      p.currentLocation = `Kurier ${courierName}`;
      p.history.push({
        timestamp: this.nowFormatted(),
        status: 'Pobrano ze stanowiska',
        location: `Stanowisko ${p.assignedStationId ?? 'ST-01'}`,
        description: scannedIndividually
          ? `Zeskanowano etykietę fizycznej paczki i pobrano ze stanowiska przez kuriera: ${courierName}.`
          : `Przypisano i pobrano ze stanowiska przez kuriera: ${courierName}.`
      });
      parcels[idx] = p;
      updatedList.push(p);
    }

    this.db.parcels$.next(parcels);
    return of(structuredClone(updatedList)).pipe(delay(250));
  }

  /**
   * Moduł Stanowisko wydawcze: PU „Zdaj niedoręczoną paczkę” (Kurier)
   */
  reportUndeliveredParcelByCourier(trackingNumber: string, reason: string): Observable<Parcel> {
    const parcels = [...this.db.parcels$.value];
    const index = parcels.findIndex((p) => p.trackingNumber === trackingNumber);
    if (index === -1) {
      return throwError(() => new Error('Przesyłka nie istnieje.')).pipe(delay(200));
    }

    const parcel = { ...parcels[index], history: [...parcels[index].history] };
    parcel.status = 'Nieudana próba doręczenia (do zdania)';
    parcel.nonDeliveryReason = reason;
    parcel.currentLocation = 'Stanowisko wydawcze – Oczekuje na przyjęcie zwrotu przez sortownię';
    parcel.history.push({
      timestamp: this.nowFormatted(),
      status: 'Nieudana próba doręczenia (do zdania)',
      location: 'Powrót z trasy do sortowni',
      description: `Kurier zgłosił niedoręczoną paczkę do zdania na stanowisku wydawczym. Powód: ${reason}.`
    });

    parcels[index] = parcel;
    this.db.parcels$.next(parcels);
    return of(structuredClone(parcel)).pipe(delay(250));
  }

  /**
   * Moduł Doręczenia: PU „Potwierdzenie doręczenia przesyłki” (podpis lub <<extend>> „Wpisanie kodu odbioru”)
   */
  confirmParcelDelivery(
    trackingNumber: string,
    mode: 'SIGNATURE' | 'PICKUP_CODE',
    signatureOrCode: string
  ): Observable<Parcel> {
    const parcels = [...this.db.parcels$.value];
    const index = parcels.findIndex((p) => p.trackingNumber === trackingNumber);
    if (index === -1) {
      return throwError(() => new Error('Przesyłka nie istnieje.')).pipe(delay(200));
    }

    const parcel = { ...parcels[index], history: [...parcels[index].history] };

    if (mode === 'PICKUP_CODE') {
      const expectedCode = parcel.pickupCode;
      if (!expectedCode || expectedCode !== signatureOrCode.trim()) {
        return throwError(
          () =>
            new Error(
              'Niepoprawny kod odbioru PIN. Wprowadzony kod jest niezgodny z kodem wygenerowanym dla tej przesyłki.'
            )
        ).pipe(delay(250));
      }
    } else {
      if (!signatureOrCode.trim()) {
        return throwError(() => new Error('Wymagane jest pobranie podpisu odbiorcy na terminalu.')).pipe(delay(200));
      }
      parcel.recipientSignature = signatureOrCode.trim();
    }

    parcel.status = 'Doręczona';
    parcel.currentLocation = `Doręczono odbiorcy (${parcel.recipientName})`;
    parcel.history.push({
      timestamp: this.nowFormatted(),
      status: 'Doręczona',
      location: parcel.deliveryAddress,
      description:
        mode === 'PICKUP_CODE'
          ? `Potwierdzono doręczenie przesyłki jednorazowym kodem odbioru PIN (${signatureOrCode.trim()}).`
          : `Potwierdzono doręczenie przesyłki podpisem odbiorcy na terminalu (${signatureOrCode.trim()}).`,
      notificationSent: true
    });

    parcels[index] = parcel;
    this.db.parcels$.next(parcels);
    return of(structuredClone(parcel)).pipe(delay(250));
  }

  /**
   * Moduł Doręczenia: PU „Generowanie trasy rozwożenia przesyłek”
   */
  optimizeAndGenerateCourierRoute(courierId: string): Observable<Parcel[]> {
    const parcels = [...this.db.parcels$.value];
    const courierParcels = parcels.filter(
      (p) =>
        p.assignedCourierId === courierId &&
        (p.status === 'Pobrano ze stanowiska' || p.status === 'W doręczeniu')
    );

    // Sortujemy wg kodu pocztowego i ulicy, nadając kolejność punktów stopu i estymowane godziny
    courierParcels.sort((a, b) => a.postalCode.localeCompare(b.postalCode) || a.deliveryAddress.localeCompare(b.deliveryAddress));

    const slots = ['09:30 - 10:15', '10:30 - 11:15', '11:30 - 12:15', '12:30 - 13:15', '13:30 - 14:15', '14:30 - 15:15'];

    courierParcels.forEach((cp, idx) => {
      const globalIdx = parcels.findIndex((p) => p.trackingNumber === cp.trackingNumber);
      if (globalIdx !== -1) {
        const updated = { ...parcels[globalIdx], history: [...parcels[globalIdx].history] };
        updated.routeStopOrder = idx + 1;
        updated.estimatedStopTime = slots[idx % slots.length];
        if (updated.status === 'Pobrano ze stanowiska') {
          updated.status = 'W doręczeniu';
          updated.history.push({
            timestamp: this.nowFormatted(),
            status: 'W doręczeniu',
            location: updated.city,
            description: `Wygenerowano zoptymalizowaną trasę doręczeń (Punkt stopu #${updated.routeStopOrder}, okno ${updated.estimatedStopTime}).`
          });
        }
        parcels[globalIdx] = updated;
      }
    });

    this.db.parcels$.next(parcels);
    const result = parcels
      .filter((p) => p.assignedCourierId === courierId && p.routeStopOrder !== undefined)
      .sort((a, b) => (a.routeStopOrder ?? 99) - (b.routeStopOrder ?? 99));

    return of(structuredClone(result)).pipe(delay(300));
  }
}
