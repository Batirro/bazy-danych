import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  DeliveryRegion,
  DispatchStation,
  Employee,
  Parcel,
  PickupPoint
} from '../models/domain.models';

@Injectable({ providedIn: 'root' })
export class MockDatabaseService {
  private readonly initialRegions: DeliveryRegion[] = [
    {
      id: 'REJ-CENTRUM',
      name: 'Wrocław Śródmieście / Stare Miasto',
      postalCodePrefixes: ['50-'],
      boundariesDescription: 'Obszar kodów 50-001 do 50-999 (Rynek, Plac Grunwaldzki, Ołbin)',
      assignedStationId: 'ST-01'
    },
    {
      id: 'REJ-POLNOC',
      name: 'Wrocław Psie Pole / Północ',
      postalCodePrefixes: ['51-'],
      boundariesDescription: 'Obszar kodów 51-001 do 51-999 (Psie Pole, Karłowice, Swojczyce)',
      assignedStationId: 'ST-02'
    },
    {
      id: 'REJ-POLUDNIE',
      name: 'Wrocław Krzyki / Fabryczna',
      postalCodePrefixes: ['52-', '53-', '54-'],
      boundariesDescription: 'Obszar kodów 52-xxx do 54-xxx (Krzyki, Borek, Muchobór, Leśnica)',
      assignedStationId: 'ST-03'
    }
  ];

  private readonly initialStations: DispatchStation[] = [
    {
      id: 'ST-01',
      name: 'Stanowisko Wydawcze A1 (Centrum)',
      operationalParams: 'Rampa północna, skaner stacjonarny S-101, obsługa aut dostawczych do 3.5t',
      maxCapacity: 120,
      assignedRegionId: 'REJ-CENTRUM'
    },
    {
      id: 'ST-02',
      name: 'Stanowisko Wydawcze A2 (Północ)',
      operationalParams: 'Rampa północna, skaner stacjonarny S-102, taśmociąg szybki',
      maxCapacity: 100,
      assignedRegionId: 'REJ-POLNOC'
    },
    {
      id: 'ST-03',
      name: 'Stanowisko Wydawcze B1 (Południe)',
      operationalParams: 'Rampa południowa, skaner S-201, strefa gabarytów C i niestandardowych',
      maxCapacity: 150,
      assignedRegionId: 'REJ-POLUDNIE'
    }
  ];

  private readonly initialEmployees: Employee[] = [
    {
      id: 'EMP-01',
      fullName: 'Bartłomiej Rutkowski',
      login: 'admin',
      password: '123',
      email: 'b.rutkowski@outpost.pl',
      phone: '+48 600 100 101',
      role: 'ADMIN',
      status: 'ACTIVE',
      permissions: ['DB_BACKUP', 'MANAGE_ACCOUNTS', 'ASSIGN_ROLES', 'AUDIT_LOGS']
    },
    {
      id: 'EMP-02',
      fullName: 'Jonasz Przybylski',
      login: 'kierownik',
      password: '123',
      email: 'j.przybylski@outpost.pl',
      phone: '+48 600 100 102',
      role: 'MANAGER',
      status: 'ACTIVE',
      permissions: ['MANAGE_STATIONS', 'MANAGE_REGIONS', 'GENERATE_REPORTS', 'MANAGE_BRANCH_STAFF']
    },
    {
      id: 'EMP-03',
      fullName: 'Mateusz Janowicz',
      login: 'sortownia',
      password: '123',
      email: 'm.janowicz@outpost.pl',
      phone: '+48 600 100 103',
      role: 'SORTER',
      status: 'ACTIVE',
      permissions: ['REGISTER_PARCEL', 'SORT_PARCEL', 'STATION_PLACEMENT', 'PRINT_LABELS']
    },
    {
      id: 'EMP-04',
      fullName: 'Piotr Kowalczyk',
      login: 'kurier',
      password: '123',
      email: 'p.kowalczyk@outpost.pl',
      phone: '+48 600 100 104',
      role: 'COURIER',
      status: 'ACTIVE',
      permissions: ['PICKUP_FROM_STATION', 'DELIVER_PARCEL', 'GENERATE_WAYBILL', 'RETURN_UNDELIVERED'],
      assignedRegionId: 'REJ-CENTRUM'
    },
    {
      id: 'EMP-05',
      fullName: 'Kamil Nowak',
      login: 'kurier2',
      password: '123',
      email: 'k.nowak@outpost.pl',
      phone: '+48 600 100 105',
      role: 'COURIER',
      status: 'ACTIVE',
      permissions: ['PICKUP_FROM_STATION', 'DELIVER_PARCEL', 'GENERATE_WAYBILL'],
      assignedRegionId: 'REJ-POLNOC'
    },
    {
      id: 'EMP-06',
      fullName: 'Tomasz Wiśniewski',
      login: 'zablokowany',
      password: '123',
      email: 't.wisniewski@outpost.pl',
      phone: '+48 600 100 106',
      role: 'SORTER',
      status: 'BLOCKED',
      permissions: ['REGISTER_PARCEL']
    }
  ];

  private readonly initialPickupPoints: PickupPoint[] = [
    {
      id: 'PKT-01',
      name: 'Automat Paczkowy WRO-01A (Pasaż Grunwaldzki)',
      type: 'AUTOMAT_PACZKOWY',
      address: 'pl. Grunwaldzki 22',
      city: 'Wrocław',
      maxDimensions: ['A', 'B', 'C']
    },
    {
      id: 'PKT-02',
      name: 'Punkt Odbioru Żabka WRO-14 (Rynek)',
      type: 'PUNKT_ODBIORU',
      address: 'ul. Świdnicka 12',
      city: 'Wrocław',
      maxDimensions: ['A', 'B']
    },
    {
      id: 'PKT-03',
      name: 'Automat Paczkowy WRO-55K (Krzyki Borek)',
      type: 'AUTOMAT_PACZKOWY',
      address: 'ul. Powstańców Śląskich 160',
      city: 'Wrocław',
      maxDimensions: ['A', 'B', 'C']
    }
  ];

  private readonly initialParcels: Parcel[] = [
    {
      trackingNumber: 'PL-2026-1001',
      senderName: 'Komputronik S.A.',
      senderPhone: '+48 61 888 00 00',
      recipientName: 'Anna Zielińska',
      recipientEmail: 'anna.zielinska@example.pl',
      recipientPhone: '+48 501 234 567',
      deliveryAddress: 'ul. Wybrzeże Wyspiańskiego 27, 50-370 Wrocław',
      postalCode: '50-370',
      city: 'Wrocław',
      deliveryNotes: 'Budynek C-13, portiernia na parterze, kod do domofonu: 27#',
      weightKg: 2.4,
      dimensions: 'A',
      status: 'Przyjęto w sortowni',
      currentLocation: 'Sortownia Centralna Wrocław',
      assignedRegionId: 'REJ-CENTRUM',
      assignedStationId: 'ST-01',
      history: [
        {
          timestamp: '2026-11-10 08:15',
          status: 'Zarejestrowana',
          location: 'Punkt nadawczy Poznań',
          description: 'Zarejestrowano dane przesyłki w systemie'
        },
        {
          timestamp: '2026-11-10 14:30',
          status: 'Przyjęto w sortowni',
          location: 'Sortownia Centralna Wrocław',
          description: 'Fizyczne przyjęcie i weryfikacja parametrów w sortowni',
          notificationSent: true
        }
      ]
    },
    {
      trackingNumber: 'PL-2026-1002',
      senderName: 'Allegro Sp. z o.o.',
      senderPhone: '+48 22 123 45 67',
      recipientName: 'Marek Lewandowski',
      recipientEmail: 'marek.lewandowski@example.pl',
      recipientPhone: '+48 502 998 877',
      deliveryAddress: 'ul. Mikołaja Reja 44/12, 50-338 Wrocław',
      postalCode: '50-338',
      city: 'Wrocław',
      deliveryNotes: 'Proszę dzwonić przed doręczeniem, 3 piętro bez windy',
      weightKg: 5.8,
      dimensions: 'B',
      status: 'W doręczeniu',
      currentLocation: 'Kurier Piotr Kowalczyk (Trasa Rejon Centrum)',
      assignedRegionId: 'REJ-CENTRUM',
      assignedStationId: 'ST-01',
      assignedCourierId: 'EMP-04',
      pickupCode: '482910',
      routeStopOrder: 1,
      estimatedStopTime: '11:30 - 12:15',
      history: [
        {
          timestamp: '2026-11-10 06:10',
          status: 'Przyjęto w sortowni',
          location: 'Sortownia Centralna Wrocław',
          description: 'Przyjęcie przesyłki na oddział'
        },
        {
          timestamp: '2026-11-10 07:05',
          status: 'Oczekuje na stanowisku wydawczym',
          location: 'Stanowisko ST-01',
          description: 'Rozmieszczono na stanowisku wydawczym ST-01'
        },
        {
          timestamp: '2026-11-10 08:20',
          status: 'Pobrano ze stanowiska',
          location: 'Stanowisko ST-01',
          description: 'Pobrano przez kuriera: Piotr Kowalczyk'
        },
        {
          timestamp: '2026-11-10 08:45',
          status: 'W doręczeniu',
          location: 'Wrocław Śródmieście',
          description: 'Wydano kurierowi do doręczenia (kod odbioru wygenerowany)',
          notificationSent: true
        }
      ]
    },
    {
      trackingNumber: 'PL-2026-1003',
      senderName: 'Meble Bodzio Fabryka',
      senderPhone: '+48 71 399 00 00',
      recipientName: 'Karolina Mazur',
      recipientEmail: 'karolina.mazur@example.pl',
      recipientPhone: '+48 509 111 222',
      deliveryAddress: 'ul. Powstańców Śląskich 95, 53-332 Wrocław',
      postalCode: '53-332',
      city: 'Wrocław',
      deliveryNotes: 'Wjazd od strony parkingu podziemnego',
      weightKg: 34.0,
      dimensions: 'GABARYT_NIESTANDARDOWY',
      status: 'Posortowano',
      currentLocation: 'Sortownia Centralna Wrocław – Taśma B',
      assignedRegionId: 'REJ-POLUDNIE',
      assignedStationId: 'ST-03',
      history: [
        {
          timestamp: '2026-11-10 09:00',
          status: 'Przyjęto w sortowni',
          location: 'Sortownia Centralna Wrocław',
          description: 'Przyjęcie przesyłki ponadgabarytowej'
        },
        {
          timestamp: '2026-11-10 10:15',
          status: 'Posortowano',
          location: 'Sortownia Centralna Wrocław',
          description: 'Przyporządkowano do rejonu REJ-POLUDNIE i stanowiska ST-03'
        }
      ]
    },
    {
      trackingNumber: 'PL-2026-1004',
      senderName: 'Empik S.A.',
      senderPhone: '+48 22 462 72 50',
      recipientName: 'Michał Dąbrowski',
      recipientEmail: 'michal.dabrowski@example.pl',
      recipientPhone: '+48 604 321 987',
      deliveryAddress: 'ul. Jedności Narodowej 112/4, 50-301 Wrocław',
      postalCode: '50-301',
      city: 'Wrocław',
      deliveryNotes: 'Zostawić u sąsiada pod nr 5 w razie nieobecności',
      weightKg: 1.1,
      dimensions: 'A',
      status: 'Oczekuje na stanowisku wydawczym',
      currentLocation: 'Stanowisko ST-01',
      assignedRegionId: 'REJ-CENTRUM',
      assignedStationId: 'ST-01',
      damagedLabel: true,
      history: [
        {
          timestamp: '2026-11-10 07:30',
          status: 'Posortowano',
          location: 'Sortownia Centralna Wrocław',
          description: 'Skierowano na stanowisko ST-01'
        },
        {
          timestamp: '2026-11-10 07:55',
          status: 'Oczekuje na stanowisku wydawczym',
          location: 'Stanowisko ST-01',
          description: 'Umieszczono na stanowisku (Uwaga: częściowo uszkodzona etykieta)'
        }
      ]
    },
    {
      trackingNumber: 'PL-2026-1005',
      senderName: 'Modivo S.A.',
      senderPhone: '+48 68 888 99 00',
      recipientName: 'Ewa Kamińska',
      recipientEmail: 'ewa.kaminska@example.pl',
      recipientPhone: '+48 691 555 444',
      deliveryAddress: 'ul. Szczytnicka 28/9, 50-382 Wrocław',
      postalCode: '50-382',
      city: 'Wrocław',
      deliveryNotes: 'Kod domofonu 9*1234',
      weightKg: 1.9,
      dimensions: 'B',
      status: 'W doręczeniu',
      currentLocation: 'Kurier Piotr Kowalczyk (Trasa Rejon Centrum)',
      assignedRegionId: 'REJ-CENTRUM',
      assignedStationId: 'ST-01',
      assignedCourierId: 'EMP-04',
      routeStopOrder: 2,
      estimatedStopTime: '12:30 - 13:15',
      history: [
        {
          timestamp: '2026-11-10 08:25',
          status: 'Pobrano ze stanowiska',
          location: 'Stanowisko ST-01',
          description: 'Pobrano przez kuriera: Piotr Kowalczyk'
        },
        {
          timestamp: '2026-11-10 08:50',
          status: 'W doręczeniu',
          location: 'Wrocław Śródmieście',
          description: 'Kurier wyruszył w trasę'
        }
      ]
    },
    {
      trackingNumber: 'PL-2026-1006',
      senderName: 'Morele.net Sp. z o.o.',
      senderPhone: '+48 12 418 40 26',
      recipientName: 'Łukasz Wójcik',
      recipientEmail: 'lukasz.wojcik@example.pl',
      recipientPhone: '+48 722 333 111',
      deliveryAddress: 'ul. Kiełczowska 70, 51-354 Wrocław',
      postalCode: '51-354',
      city: 'Wrocław',
      weightKg: 4.2,
      dimensions: 'B',
      status: 'Zarejestrowana',
      currentLocation: 'Sortownia Centralna Wrocław – Taśma wejściowa',
      history: [
        {
          timestamp: '2026-11-10 10:40',
          status: 'Zarejestrowana',
          location: 'Sortownia Centralna Wrocław',
          description: 'Zarejestrowano w sortowni – oczekuje na przyporządkowanie do rejonu na taśmie'
        }
      ]
    },
    {
      trackingNumber: 'PL-2026-1007',
      senderName: 'Sklep Sportowy Decathlon',
      senderPhone: '+48 22 333 00 11',
      recipientName: 'Grzegorz Szymański',
      recipientEmail: 'grzegorz.szymanski@example.pl',
      recipientPhone: '+48 511 000 999',
      deliveryAddress: 'ul. Długa 15, 99-999 Nieznanów',
      postalCode: '99-999',
      city: 'Nieznanów',
      weightKg: 3.1,
      dimensions: 'B',
      status: 'Zarejestrowana',
      currentLocation: 'Sortownia Centralna Wrocław – Taśma wejściowa',
      history: [
        {
          timestamp: '2026-11-10 10:50',
          status: 'Zarejestrowana',
          location: 'Sortownia Centralna Wrocław',
          description: 'Zarejestrowano paczkę z kodem pocztowym spoza obsługiwanych rejonów oddziału'
        }
      ]
    },
    {
      trackingNumber: 'PL-2026-1008',
      senderName: 'Apteka Gemini',
      senderPhone: '+48 58 777 11 22',
      recipientName: 'Zofia Krawczyk',
      recipientEmail: 'zofia.krawczyk@example.pl',
      recipientPhone: '+48 608 777 666',
      deliveryAddress: 'ul. Sienkiewicza 18/3, 50-335 Wrocław',
      postalCode: '50-335',
      city: 'Wrocław',
      deliveryNotes: 'Domofon nie działa, proszę dzwonić na telefon',
      weightKg: 0.8,
      dimensions: 'A',
      status: 'Nieudana próba doręczenia (do zdania)',
      currentLocation: 'Kurier Piotr Kowalczyk (Powrót z trasy)',
      assignedRegionId: 'REJ-CENTRUM',
      assignedStationId: 'ST-01',
      assignedCourierId: 'EMP-04',
      nonDeliveryReason: 'Nieobecność odbiorcy pod wskazanym adresem (brak kontaktu telefonicznego)',
      routeStopOrder: 3,
      estimatedStopTime: '13:30 - 14:00',
      history: [
        {
          timestamp: '2026-11-10 08:30',
          status: 'W doręczeniu',
          location: 'Wrocław Śródmieście',
          description: 'Wydano kurierowi do doręczenia'
        },
        {
          timestamp: '2026-11-10 13:40',
          status: 'Nieudana próba doręczenia (do zdania)',
          location: 'ul. Sienkiewicza 18/3, Wrocław',
          description: 'Nieudana próba doręczenia: Nieobecność odbiorcy pod wskazanym adresem'
        }
      ]
    }
  ];

  readonly regions$ = new BehaviorSubject<DeliveryRegion[]>(this.initialRegions);
  readonly stations$ = new BehaviorSubject<DispatchStation[]>(this.initialStations);
  readonly employees$ = new BehaviorSubject<Employee[]>(this.initialEmployees);
  readonly pickupPoints$ = new BehaviorSubject<PickupPoint[]>(this.initialPickupPoints);
  readonly parcels$ = new BehaviorSubject<Parcel[]>(this.initialParcels);
}
