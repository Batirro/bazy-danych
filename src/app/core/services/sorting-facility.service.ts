import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import {
  DeliveryRegion,
  DispatchStation,
  Employee,
  EmployeeRole,
  OperationalReportRequest,
  OperationalReportResult,
  SortingWorkSummaryRequest,
  SortingWorkSummaryResult
} from '../models/domain.models';
import { MockDatabaseService } from './mock-database.service';

@Injectable({ providedIn: 'root' })
export class SortingFacilityService {
  private readonly db = inject(MockDatabaseService);
  // W przyszłości: private readonly http = inject(HttpClient);

  readonly stations$ = this.db.stations$.asObservable();
  readonly regions$ = this.db.regions$.asObservable();
  readonly employees$ = this.db.employees$.asObservable();

  /**
   * Moduł Administracja: PU „Dodaj stanowisko wydawcze”
   * Docelowo: return this.http.post<DispatchStation>('/api/facility/stations', payload);
   */
  addDispatchStation(payload: {
    id: string;
    name: string;
    operationalParams: string;
    maxCapacity: number;
  }): Observable<DispatchStation> {
    const stations = [...this.db.stations$.value];
    const cleanId = payload.id.trim().toUpperCase();

    if (!cleanId || !payload.name.trim()) {
      return throwError(() => new Error('Identyfikator oraz nazwa stanowiska są wymagane.')).pipe(delay(200));
    }

    // Przebieg alternatywny: Stanowisko o podanym identyfikatorze już istnieje
    if (stations.some((s) => s.id.toUpperCase() === cleanId)) {
      return throwError(
        () => new Error(`Stanowisko wydawcze o identyfikatorze "${cleanId}" już istnieje w strukturze oddziału!`)
      ).pipe(delay(250));
    }

    const newStation: DispatchStation = {
      id: cleanId,
      name: payload.name.trim(),
      operationalParams: payload.operationalParams.trim() || 'Standardowy terminal skanujący',
      maxCapacity: payload.maxCapacity || 100
    };

    this.db.stations$.next([...stations, newStation]);
    return of(structuredClone(newStation)).pipe(delay(250));
  }

  /**
   * Moduł Administracja: PU „Przypisz rejon doręczeń do stanowiska”
   * Zwraca informację o kolizji, jeśli rejon jest już przypisany do innego stanowiska i nie wymuszono potwierdzenia.
   */
  assignRegionToStation(
    stationId: string,
    regionId: string,
    forceReassign = false
  ): Observable<{
    requiresConfirmation: boolean;
    previousStationId?: string;
    updatedStation?: DispatchStation;
    updatedRegion?: DeliveryRegion;
  }> {
    const stations = [...this.db.stations$.value];
    const regions = [...this.db.regions$.value];

    const stationIdx = stations.findIndex((s) => s.id === stationId);
    const regionIdx = regions.findIndex((r) => r.id === regionId);

    if (stationIdx === -1 || regionIdx === -1) {
      return throwError(() => new Error('Wybrane stanowisko lub rejon doręczeń nie istnieje.')).pipe(delay(200));
    }

    const existingStationWithRegion = stations.find(
      (s) => s.id !== stationId && (s.assignedRegionId === regionId || regions[regionIdx].assignedStationId === s.id)
    );

    // Przebieg alternatywny: Rejon jest już przypisany do innego stanowiska -> dopytaj o potwierdzenie
    if (existingStationWithRegion && !forceReassign) {
      return of({
        requiresConfirmation: true,
        previousStationId: existingStationWithRegion.id
      }).pipe(delay(200));
    }

    // Usuń przypisanie z poprzedniego stanowiska jeśli było
    stations.forEach((s, idx) => {
      if (s.assignedRegionId === regionId && s.id !== stationId) {
        stations[idx] = { ...s, assignedRegionId: undefined };
      }
    });

    stations[stationIdx] = { ...stations[stationIdx], assignedRegionId: regionId };
    regions[regionIdx] = { ...regions[regionIdx], assignedStationId: stationId };

    this.db.stations$.next(stations);
    this.db.regions$.next(regions);

    return of({
      requiresConfirmation: false,
      updatedStation: structuredClone(stations[stationIdx]),
      updatedRegion: structuredClone(regions[regionIdx])
    }).pipe(delay(250));
  }

  /**
   * Moduł Sortownia: PU „Zarządzanie stanowiskami wydawczymi i rejonami doręczeń”
   */
  saveOrUpdateDeliveryRegion(payload: {
    id: string;
    name: string;
    postalCodePrefixesCsv: string;
    boundariesDescription: string;
    assignedStationId?: string;
  }): Observable<DeliveryRegion> {
    const regions = [...this.db.regions$.value];
    const stations = [...this.db.stations$.value];
    const cleanId = payload.id.trim().toUpperCase();
    const prefixes = payload.postalCodePrefixesCsv
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (!cleanId || !payload.name.trim() || prefixes.length === 0) {
      return throwError(() => new Error('Podaj kod rejonu, nazwę oraz co najmniej jeden prefiks kodu pocztowego.')).pipe(
        delay(200)
      );
    }

    const existingIdx = regions.findIndex((r) => r.id.toUpperCase() === cleanId);
    const regionObj: DeliveryRegion = {
      id: cleanId,
      name: payload.name.trim(),
      postalCodePrefixes: prefixes,
      boundariesDescription: payload.boundariesDescription.trim(),
      assignedStationId: payload.assignedStationId
    };

    if (existingIdx >= 0) {
      regions[existingIdx] = regionObj;
    } else {
      regions.push(regionObj);
    }

    if (payload.assignedStationId) {
      const stIdx = stations.findIndex((s) => s.id === payload.assignedStationId);
      if (stIdx >= 0) {
        stations[stIdx] = { ...stations[stIdx], assignedRegionId: cleanId };
        this.db.stations$.next(stations);
      }
    }

    this.db.regions$.next(regions);
    return of(structuredClone(regionObj)).pipe(delay(250));
  }

  /**
   * Moduł Sortownia: PU „Zarządzanie kontami pracowników i kurierów oraz uprawnieniami” (Kierownik sortowni)
   */
  updateBranchStaffMember(payload: {
    employeeId: string;
    role: EmployeeRole;
    assignedRegionId?: string;
    permissions: string[];
  }): Observable<Employee> {
    const employees = [...this.db.employees$.value];
    const idx = employees.findIndex((e) => e.id === payload.employeeId);
    if (idx === -1) {
      return throwError(() => new Error('Nie znaleziono wybranego pracownika.')).pipe(delay(200));
    }

    employees[idx] = {
      ...employees[idx],
      role: payload.role,
      assignedRegionId: payload.assignedRegionId,
      permissions: [...payload.permissions]
    };

    this.db.employees$.next(employees);
    return of(structuredClone(employees[idx])).pipe(delay(250));
  }

  /**
   * Moduł Administracja: PU „Utwórz raport” (wraz z 3 przebiegami alternatywnymi / rozszerzeniami)
   */
  generateOperationalReport(req: OperationalReportRequest): Observable<OperationalReportResult> {
    const parcels = this.db.parcels$.value;
    const stations = this.db.stations$.value;
    const couriers = this.db.employees$.value.filter((e) => e.role === 'COURIER');

    const deliveredCount = parcels.filter((p) => p.status === 'Doręczona').length + 42; // + dane historyczne z okresu
    const returnedCount =
      parcels.filter(
        (p) =>
          p.status === 'Nieudana próba doręczenia (do zdania)' ||
          p.status === 'Zwrócona na stanowisko/sortownię'
      ).length + 4;
    const pendingCount = parcels.length;
    const total = deliveredCount + returnedCount + pendingCount;

    const result: OperationalReportResult = {
      generatedAt: new Date().toLocaleString('pl-PL'),
      dateFrom: req.dateFrom,
      dateTo: req.dateTo,
      totalProcessedParcels: total,
      summaryNote: `Raport operacyjny oddziału Wrocław za okres ${req.dateFrom} – ${req.dateTo}. Łącznie przeprocesowano ${total} przesyłek.`
    };

    if (req.includeWorkloadSummary) {
      result.workloadSummary = {
        stationLoads: stations.map((st, idx) => {
          const count = parcels.filter((p) => p.assignedStationId === st.id).length + (idx + 1) * 18;
          return {
            stationId: st.id,
            stationName: st.name,
            parcelCount: count,
            utilizationPercent: Math.min(100, Math.round((count / st.maxCapacity) * 100))
          };
        }),
        courierLoads: couriers.map((c, idx) => {
          const assigned = parcels.filter((p) => p.assignedCourierId === c.id).length + 15 + idx * 4;
          return {
            courierName: c.fullName,
            region: c.assignedRegionId ?? 'Nieprzypisany',
            assignedCount: assigned,
            completedCount: Math.max(0, assigned - 2)
          };
        })
      };
    }

    if (req.includeFailedDeliveryReasons) {
      result.failedDeliveryReasons = [
        { reason: 'Nieobecność odbiorcy pod wskazanym adresem', count: 6, sharePercent: 54.5 },
        { reason: 'Błędny kod domofonu / brak dostępu do klatki', count: 2, sharePercent: 18.2 },
        { reason: 'Odmowa przyjęcia przesyłki przez odbiorcę', count: 2, sharePercent: 18.2 },
        { reason: 'Niepełne dane adresowe / rejon spoza oddziału', count: 1, sharePercent: 9.1 }
      ];
    }

    if (req.includeDeliveryEffectiveness) {
      result.effectivenessStats = {
        deliveredCount,
        returnedCount,
        pendingCount,
        effectivenessRatePercent: Number(((deliveredCount / (deliveredCount + returnedCount)) * 100).toFixed(1))
      };
    }

    return of(result).pipe(delay(300));
  }

  /**
   * Moduł Sortownia: PU „Generowanie zestawień dotyczących pracy sortowni”
   */
  generateSortingWorkSummary(req: SortingWorkSummaryRequest): Observable<SortingWorkSummaryResult> {
    const problematicCount = this.db.parcels$.value.filter(
      (p) =>
        p.status === 'Strefa przesyłek problematycznych' ||
        p.status === 'Do wyjaśnienia (błąd danych odbiorcy)'
    ).length;

    const indicatorMap: Record<string, string> = {
      THROUGHPUT: '385 paczek / godz. (szczyt poranny: 460 paczek / godz.)',
      ACCURACY: '98.4% poprawnych przypisań automatycznych na taśmie',
      PROBLEMATIC: `${problematicCount} przesyłek w strefie problematycznej / do wyjaśnienia`,
      STAFF_UTILIZATION: '87% wykorzystania obsady zmianowej sortowni'
    };

    return of({
      generatedAt: new Date().toLocaleString('pl-PL'),
      timeRange: req.timeRange,
      throughputPerHour: 385,
      sortingEfficiencyPercent: 98.4,
      averageProcessingMinutes: 14.5,
      problematicParcelsCount: problematicCount,
      selectedIndicatorsSummary: req.indicators.map((ind) => ({
        label: ind,
        value: indicatorMap[ind] ?? 'W normie operacyjnej'
      }))
    }).pipe(delay(300));
  }
}
