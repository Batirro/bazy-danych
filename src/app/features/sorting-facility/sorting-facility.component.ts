import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import {
  DeliveryRegion,
  DispatchStation,
  Employee,
  EmployeeRole,
  Parcel,
  ParcelDimensions,
  ParcelStatus,
  SortingWorkSummaryResult
} from '../../core/models/domain.models';
import { ParcelService } from '../../core/services/parcel.service';
import { SortingFacilityService } from '../../core/services/sorting-facility.service';

@Component({
  selector: 'app-sorting-facility',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    RouterLinkActive,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatMenuModule
  ],
  template: `
    <div class="page-container">
      <div class="module-header">
        <div>
          <h1>
            <mat-icon color="primary">warehouse</mat-icon>
            Sortownia
          </h1>
          <p>Ewidencja przesyłek, obsługa taśmy sortowniczej oraz konfiguracja oddziału</p>
        </div>
      </div>

      <div class="subpage-nav">
        <a mat-stroked-button routerLink="/sortownia/wyszukiwanie" routerLinkActive="sub-active">
          <mat-icon>manage_search</mat-icon>
          Ewidencja przesyłek
        </a>
        <a mat-stroked-button routerLink="/sortownia/rejestracja" routerLinkActive="sub-active">
          <mat-icon>add_box</mat-icon>
          Rejestracja przesyłki
        </a>
        <a mat-stroked-button routerLink="/sortownia/tasma" routerLinkActive="sub-active">
          <mat-icon>qr_code_scanner</mat-icon>
          Taśma sortownicza
        </a>
        <a mat-stroked-button routerLink="/sortownia/zestawienia" routerLinkActive="sub-active">
          <mat-icon>analytics</mat-icon>
          Wydajność sortowni
        </a>
        <a mat-stroked-button routerLink="/sortownia/rejony" routerLinkActive="sub-active">
          <mat-icon>map</mat-icon>
          Siatka rejonów
        </a>
        <a mat-stroked-button routerLink="/sortownia/personel" routerLinkActive="sub-active">
          <mat-icon>badge</mat-icon>
          Personel oddziału
        </a>
      </div>

      <!-- Ewidencja i wyszukiwarka przesyłek -->
      <ng-container *ngIf="activeSection === 'wyszukiwanie'">
        <mat-card class="clean-card">
          <mat-card-header>
            <mat-card-title>Ewidencja przesyłek w sortowni</mat-card-title>
            <mat-card-subtitle>
              Wyszukaj przesyłkę po numerze, nadawcy lub odbiorcy i zarządzaj jej statusem.
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="search-toolbar">
              <mat-form-field appearance="outline" class="search-field">
                <mat-label>Szukaj (numer paczki, nadawca, odbiorca, miasto)</mat-label>
                <input
                  matInput
                  [(ngModel)]="searchQuery"
                  placeholder="np. PL-2026-1001, Zielińska..."
                  (keyup.enter)="executeSearch()"
                />
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>

              <button mat-flat-button color="primary" class="toolbar-btn" (click)="executeSearch()">
                Szukaj
              </button>
              <button
                *ngIf="searchQuery"
                mat-stroked-button
                class="toolbar-btn"
                (click)="searchQuery = ''; executeSearch()"
              >
                Wyczyść
              </button>
            </div>

            <div *ngIf="statusUpdateResultMsg" class="alert-box alert-success">
              <mat-icon>notifications_active</mat-icon>
              <div>{{ statusUpdateResultMsg }}</div>
            </div>

            <div *ngIf="searchResults.length === 0" class="alert-box alert-warning">
              <mat-icon>search_off</mat-icon>
              <div>Brak przesyłek spełniających podane kryteria wyszukiwania („{{ searchQuery }}”).</div>
            </div>

            <table *ngIf="searchResults.length > 0" mat-table [dataSource]="searchResults" class="full-width">
              <ng-container matColumnDef="trackingNumber">
                <th mat-header-cell *matHeaderCellDef>Nr przesyłki</th>
                <td mat-cell *matCellDef="let p">
                  <strong>{{ p.trackingNumber }}</strong>
                  <div class="cell-sub">Gabaryt {{ p.dimensions }} · {{ p.weightKg }} kg</div>
                </td>
              </ng-container>

              <ng-container matColumnDef="recipient">
                <th mat-header-cell *matHeaderCellDef>Odbiorca i adres</th>
                <td mat-cell *matCellDef="let p">
                  <strong>{{ p.recipientName }}</strong>
                  <div class="cell-sub">{{ p.postalCode }} {{ p.city }} · Od: {{ p.senderName }}</div>
                </td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status i lokalizacja</th>
                <td mat-cell *matCellDef="let p">
                  <span class="status-badge status-sorted">{{ p.status }}</span>
                  <div class="cell-sub">{{ p.currentLocation }}</div>
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let p">
                  <button mat-stroked-button [matMenuTriggerFor]="statusMenu">
                    Zmień status
                    <mat-icon>expand_more</mat-icon>
                  </button>
                  <mat-menu #statusMenu="matMenu">
                    <button mat-menu-item (click)="quickUpdateStatus(p.trackingNumber, 'Przyjęto w sortowni')">
                      <span>Przyjęto w sortowni</span>
                    </button>
                    <button mat-menu-item (click)="quickUpdateStatus(p.trackingNumber, 'Posortowano')">
                      <span>Posortowano</span>
                    </button>
                    <button mat-menu-item (click)="quickUpdateStatus(p.trackingNumber, 'Oczekuje na stanowisku wydawczym')">
                      <span>Oczekuje na stanowisku wydawczym</span>
                    </button>
                    <button mat-menu-item (click)="quickUpdateStatus(p.trackingNumber, 'Strefa przesyłek problematycznych')">
                      <span>Strefa przesyłek problematycznych</span>
                    </button>
                  </mat-menu>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="['trackingNumber', 'recipient', 'status', 'actions']"></tr>
              <tr mat-row *matRowDef="let row; columns: ['trackingNumber', 'recipient', 'status', 'actions']"></tr>
            </table>
          </mat-card-content>
        </mat-card>
      </ng-container>

      <!-- Rejestrowanie nowej przesyłki -->
      <ng-container *ngIf="activeSection === 'rejestracja'">
        <mat-card class="clean-card">
          <div class="card-header-flex">
            <div>
              <mat-card-title>Rejestracja nowej przesyłki</mat-card-title>
              <mat-card-subtitle>
                Wprowadź dane identyfikacyjne paczki, dane kontaktowe odbiorcy oraz parametry wagowo-gabarytowe.
              </mat-card-subtitle>
            </div>

            <button mat-stroked-button [matMenuTriggerFor]="regDemoMenu">
              <mat-icon>content_paste</mat-icon>
              Szablony danych
              <mat-icon>expand_more</mat-icon>
            </button>
            <mat-menu #regDemoMenu="matMenu">
              <button mat-menu-item (click)="prefillNewParcel(true)">
                <span>Przesyłka krajowa – kompletne dane</span>
              </button>
              <button mat-menu-item (click)="prefillNewParcel(false)">
                <span>Przesyłka z niepełnymi danymi odbiorcy</span>
              </button>
            </mat-menu>
          </div>

          <mat-card-content>
            <div class="form-stack">
              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Kod / Numer przesyłki *</mat-label>
                  <input matInput [(ngModel)]="registerForm.trackingNumber" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Nadawca przesyłki</mat-label>
                  <input matInput [(ngModel)]="registerForm.senderName" />
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Imię i nazwisko odbiorcy *</mat-label>
                  <input matInput [(ngModel)]="registerForm.recipientName" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Adres e-mail odbiorcy *</mat-label>
                  <input matInput [(ngModel)]="registerForm.recipientEmail" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Telefon odbiorcy *</mat-label>
                  <input matInput [(ngModel)]="registerForm.recipientPhone" />
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Ulica i numer budynku/lokalu *</mat-label>
                  <input matInput [(ngModel)]="registerForm.deliveryAddress" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Kod pocztowy *</mat-label>
                  <input matInput [(ngModel)]="registerForm.postalCode" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Miejscowość *</mat-label>
                  <input matInput [(ngModel)]="registerForm.city" />
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Waga przesyłki (kg)</mat-label>
                  <input matInput type="number" [(ngModel)]="registerForm.weightKg" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Gabaryt przesyłki</mat-label>
                  <mat-select [(ngModel)]="registerForm.dimensions">
                    <mat-option value="A">Gabaryt A (mała)</mat-option>
                    <mat-option value="B">Gabaryt B (średnia)</mat-option>
                    <mat-option value="C">Gabaryt C (duża)</mat-option>
                    <mat-option value="GABARYT_NIESTANDARDOWY">Gabaryt niestandardowy</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <div class="actions-bar">
                <button mat-flat-button color="primary" (click)="submitRegisterParcel()">
                  <mat-icon>add_box</mat-icon>
                  Zarejestruj przesyłkę
                </button>
              </div>

              <div
                *ngIf="registerOutcome"
                class="alert-box"
                [ngClass]="registerOutcome.verificationPassed ? 'alert-success' : 'alert-warning'"
              >
                <mat-icon>{{ registerOutcome.verificationPassed ? 'check_circle' : 'report_problem' }}</mat-icon>
                <div>
                  <strong>{{ registerOutcome.message }}</strong><br />
                  Aktualny status: <strong>{{ registerOutcome.parcel.status }}</strong>
                </div>
              </div>

              <div *ngIf="registerError" class="alert-box alert-error">
                <mat-icon>error</mat-icon>
                <div>{{ registerError }}</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </ng-container>

      <!-- Taśma sortownicza -->
      <ng-container *ngIf="activeSection === 'tasma'">
        <mat-card class="clean-card">
          <mat-card-header>
            <mat-card-title>Taśma sortownicza – Kwalifikacja do rejonu</mat-card-title>
            <mat-card-subtitle>
              Zeskanuj kod przesyłki, aby wyznaczyć właściwy rejon doręczeń oraz dedykowane stanowisko wydawcze.
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="form-stack">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Kod przesyłki na taśmie sortowniczej</mat-label>
                <mat-select [(ngModel)]="beltScanInput">
                  <mat-option *ngFor="let p of allParcels" [value]="p.trackingNumber">
                    {{ p.trackingNumber }} – {{ p.postalCode }} {{ p.city }} ({{ p.status }})
                  </mat-option>
                </mat-select>
              </mat-form-field>

              <div class="actions-bar">
                <button mat-flat-button color="primary" (click)="submitBeltAssignment()">
                  <mat-icon>qr_code_scanner</mat-icon>
                  Zeskanuj kod przesyłki
                </button>
              </div>

              <div
                *ngIf="beltAssignmentResult"
                class="alert-box"
                [ngClass]="beltAssignmentResult.isProblematic ? 'alert-error' : 'alert-success'"
              >
                <mat-icon>{{ beltAssignmentResult.isProblematic ? 'warning' : 'alt_route' }}</mat-icon>
                <div>{{ beltAssignmentResult.instruction }}</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </ng-container>

      <!-- Zestawienia pracy sortowni -->
      <ng-container *ngIf="activeSection === 'zestawienia'">
        <mat-card class="clean-card">
          <mat-card-header>
            <mat-card-title>Zestawienia wydajności pracy sortowni</mat-card-title>
            <mat-card-subtitle>
              Wybierz przedział czasowy oraz wskaźniki operacyjne procesu sortowania.
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="form-stack">
              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Przedział czasowy</mat-label>
                  <mat-select [(ngModel)]="sortingSummaryForm.timeRange">
                    <mat-option value="Zmiana poranna (06:00 - 14:00)">Zmiana poranna (06:00 - 14:00)</mat-option>
                    <mat-option value="Zmiana popołudniowa (14:00 - 22:00)">Zmiana popołudniowa (14:00 - 22:00)</mat-option>
                    <mat-option value="Ostatnie 7 dni operacyjnych">Ostatnie 7 dni operacyjnych</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Wskaźniki operacyjne</mat-label>
                  <mat-select [(ngModel)]="sortingSummaryForm.indicators" multiple>
                    <mat-option value="THROUGHPUT">Przepustowość taśmy (paczek/godz.)</mat-option>
                    <mat-option value="ACCURACY">Skuteczność automatycznego sortowania</mat-option>
                    <mat-option value="PROBLEMATIC">Udział przesyłek problematycznych</mat-option>
                    <mat-option value="STAFF_UTILIZATION">Wykorzystanie obsady zmianowej</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <div class="actions-bar">
                <button mat-flat-button color="primary" (click)="submitGenerateSortingSummary()">
                  <mat-icon>analytics</mat-icon>
                  Generuj zestawienie
                </button>
              </div>

              <div *ngIf="sortingSummaryResult" class="summary-result-box">
                <div class="kpi-row">
                  <div class="kpi-card">
                    <span>Przepustowość</span>
                    <strong>{{ sortingSummaryResult.throughputPerHour }} szt./h</strong>
                  </div>
                  <div class="kpi-card">
                    <span>Wydajność sortowania</span>
                    <strong>{{ sortingSummaryResult.sortingEfficiencyPercent }}%</strong>
                  </div>
                  <div class="kpi-card">
                    <span>Średni czas procesowania</span>
                    <strong>{{ sortingSummaryResult.averageProcessingMinutes }} min</strong>
                  </div>
                </div>
                <ul>
                  <li *ngFor="let ind of sortingSummaryResult.selectedIndicatorsSummary">
                    <strong>{{ ind.label }}:</strong> {{ ind.value }}
                  </li>
                </ul>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </ng-container>

      <!-- Konfiguracja rejonów -->
      <ng-container *ngIf="activeSection === 'rejony'">
        <mat-card class="clean-card">
          <mat-card-header>
            <mat-card-title>Siatka rejonów doręczeń i przypisanych stanowisk</mat-card-title>
            <mat-card-subtitle>
              Modyfikuj granice kodów pocztowych rejonów oraz ich powiązania ze stanowiskami wydawczymi.
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="region-chips-bar">
              <button
                *ngFor="let r of regions"
                mat-stroked-button
                [color]="regionForm.id === r.id ? 'primary' : undefined"
                (click)="loadRegionForEdit(r)"
              >
                {{ r.id }} ({{ r.postalCodePrefixes.join(', ') }} -> {{ r.assignedStationId }})
              </button>
            </div>

            <div class="form-stack">
              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Identyfikator rejonu</mat-label>
                  <input matInput [(ngModel)]="regionForm.id" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Nazwa rejonu doręczeń</mat-label>
                  <input matInput [(ngModel)]="regionForm.name" />
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Prefiksy kodów pocztowych (po przecinku)</mat-label>
                  <input matInput [(ngModel)]="regionForm.postalCodePrefixesCsv" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Przypisane stanowisko wydawcze</mat-label>
                  <mat-select [(ngModel)]="regionForm.assignedStationId">
                    <mat-option *ngFor="let st of stations" [value]="st.id">{{ st.id }} – {{ st.name }}</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Opis granic rejonu</mat-label>
                <input matInput [(ngModel)]="regionForm.boundariesDescription" />
              </mat-form-field>

              <div class="actions-bar">
                <button mat-flat-button color="primary" (click)="submitSaveRegionConfig()">
                  <mat-icon>save</mat-icon>
                  Zapisz konfigurację
                </button>
              </div>

              <div *ngIf="regionSaveMsg" class="alert-box alert-success">
                <mat-icon>check_circle</mat-icon>
                <div>{{ regionSaveMsg }}</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </ng-container>

      <!-- Personel oddziału -->
      <ng-container *ngIf="activeSection === 'personel'">
        <mat-card class="clean-card">
          <mat-card-header>
            <mat-card-title>Personel oddziału i uprawnienia</mat-card-title>
            <mat-card-subtitle>
              Zarządzaj rolami operacyjnymi, przypisanymi rejonami oraz uprawnieniami pracowników i kurierów.
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="form-stack">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Pracownik / Kurier</mat-label>
                <mat-select [(ngModel)]="staffForm.employeeId" (selectionChange)="onSelectBranchStaff()">
                  <mat-option *ngFor="let emp of branchStaff" [value]="emp.id">
                    {{ emp.fullName }} ({{ emp.role }} · Rejon: {{ emp.assignedRegionId || 'Stacjonarny' }})
                  </mat-option>
                </mat-select>
              </mat-form-field>

              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Rola operacyjna</mat-label>
                  <mat-select [(ngModel)]="staffForm.role">
                    <mat-option value="SORTER">Pracownik sortowni</mat-option>
                    <mat-option value="COURIER">Kurier</mat-option>
                    <mat-option value="MANAGER">Kierownik sortowni</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Przypisany rejon doręczeń</mat-label>
                  <mat-select [(ngModel)]="staffForm.assignedRegionId">
                    <mat-option [value]="undefined">Brak (praca stacjonarna w sortowni)</mat-option>
                    <mat-option *ngFor="let r of regions" [value]="r.id">{{ r.id }} – {{ r.name }}</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Uprawnienia operacyjne (po przecinku)</mat-label>
                <input matInput [(ngModel)]="staffForm.permissionsCsv" />
              </mat-form-field>

              <div class="actions-bar">
                <button mat-flat-button color="primary" (click)="submitBranchStaffUpdate()">
                  <mat-icon>save</mat-icon>
                  Zapisz zmiany
                </button>
              </div>

              <div *ngIf="staffSaveMsg" class="alert-box alert-success">
                <mat-icon>check_circle</mat-icon>
                <div>{{ staffSaveMsg }}</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </ng-container>
    </div>
  `,
  styles: [`
    .sub-active {
      background: #eff6ff !important;
      border-color: #93c5fd !important;
      color: #1d4ed8 !important;
      font-weight: 600;
    }
    .card-header-flex {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 20px;
    }
    .search-toolbar {
      display: flex;
      gap: 14px;
      align-items: flex-start;
      flex-wrap: wrap;
      margin-bottom: 16px;

      .search-field {
        flex: 1;
        min-width: 260px;
      }
      .toolbar-btn {
        height: 56px;
        padding: 0 24px;
      }
    }
    .cell-sub {
      font-size: 0.8rem;
      color: #64748b;
      margin-top: 3px;
    }
    .region-chips-bar {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 24px;
    }
    .summary-result-box {
      margin-top: 24px;
      padding: 24px;
      border-radius: 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;

      .kpi-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 16px;
        margin-bottom: 20px;
      }
      .kpi-card {
        background: white;
        padding: 16px;
        border-radius: 10px;
        border: 1px solid #e2e8f0;
        display: flex;
        flex-direction: column;
        gap: 4px;
        span { font-size: 0.8rem; color: #64748b; }
        strong { font-size: 1.3rem; color: #0f172a; }
      }
      ul {
        margin: 0;
        padding-left: 20px;
        li { margin-bottom: 8px; }
      }
    }
  `]
})
export class SortingFacilityComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly parcelService = inject(ParcelService);
  private readonly facilityService = inject(SortingFacilityService);

  activeSection = 'wyszukiwanie';

  allParcels: Parcel[] = [];
  searchResults: Parcel[] = [];
  regions: DeliveryRegion[] = [];
  stations: DispatchStation[] = [];
  branchStaff: Employee[] = [];

  searchQuery = '';
  statusUpdateResultMsg = '';

  registerForm = {
    trackingNumber: 'PL-2026-1099',
    senderName: 'X-KOM Sp. z o.o.',
    senderPhone: '+48 34 377 00 00',
    recipientName: 'Paweł Adamski',
    recipientEmail: 'pawel.adamski@example.pl',
    recipientPhone: '+48 505 404 303',
    deliveryAddress: 'ul. Legnicka 55/10',
    postalCode: '54-203',
    city: 'Wrocław',
    weightKg: 3.5,
    dimensions: 'B' as ParcelDimensions
  };
  registerOutcome: { parcel: Parcel; verificationPassed: boolean; message: string } | null = null;
  registerError = '';

  beltScanInput = 'PL-2026-1006';
  beltAssignmentResult: {
    isProblematic: boolean;
    instruction: string;
  } | null = null;

  sortingSummaryForm = {
    timeRange: 'Zmiana poranna (06:00 - 14:00)',
    indicators: ['THROUGHPUT', 'ACCURACY', 'PROBLEMATIC']
  };
  sortingSummaryResult: SortingWorkSummaryResult | null = null;

  regionForm = {
    id: 'REJ-POLUDNIE',
    name: 'Wrocław Krzyki / Fabryczna',
    postalCodePrefixesCsv: '52-, 53-, 54-',
    boundariesDescription: 'Obszar kodów 52-xxx do 54-xxx (Krzyki, Borek, Muchobór, Leśnica)',
    assignedStationId: 'ST-03'
  };
  regionSaveMsg = '';

  staffForm = {
    employeeId: 'EMP-04',
    role: 'COURIER' as EmployeeRole,
    assignedRegionId: 'REJ-CENTRUM' as string | undefined,
    permissionsCsv: ''
  };
  staffSaveMsg = '';

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.activeSection = params.get('section') ?? 'wyszukiwanie';
      this.statusUpdateResultMsg = '';
    });
    this.parcelService.parcels$.subscribe((p) => {
      this.allParcels = p;
      this.executeSearch();
    });
    this.facilityService.regions$.subscribe((r) => (this.regions = r));
    this.facilityService.stations$.subscribe((s) => (this.stations = s));
    this.facilityService.employees$.subscribe((emps) => {
      this.branchStaff = emps.filter((e) => e.role !== 'ADMIN');
      this.onSelectBranchStaff();
    });
  }

  executeSearch(): void {
    this.parcelService.searchParcels(this.searchQuery).subscribe((res) => {
      this.searchResults = res;
    });
  }

  quickUpdateStatus(trackingNumber: string, newStatus: ParcelStatus): void {
    this.statusUpdateResultMsg = '';
    this.parcelService.updateParcelStatusInSorting(trackingNumber, newStatus).subscribe((res) => {
      this.statusUpdateResultMsg = res.notificationMessage;
    });
  }

  prefillNewParcel(valid: boolean): void {
    const randomSuffix = Math.floor(1100 + Math.random() * 8000);
    if (valid) {
      this.registerForm = {
        trackingNumber: `PL-2026-${randomSuffix}`,
        senderName: 'X-KOM Sp. z o.o.',
        senderPhone: '+48 34 377 00 00',
        recipientName: 'Paweł Adamski',
        recipientEmail: 'pawel.adamski@example.pl',
        recipientPhone: '+48 505 404 303',
        deliveryAddress: 'ul. Legnicka 55/10',
        postalCode: '54-203',
        city: 'Wrocław',
        weightKg: 3.5,
        dimensions: 'B'
      };
    } else {
      this.registerForm = {
        trackingNumber: `PL-2026-${randomSuffix}`,
        senderName: 'Hurtownia ABC',
        senderPhone: '+48 22 100 20 30',
        recipientName: 'Jan',
        recipientEmail: 'niepoprawny-email',
        recipientPhone: '',
        deliveryAddress: 'ul. Krótka',
        postalCode: '50-001',
        city: 'Wrocław',
        weightKg: 1.2,
        dimensions: 'A'
      };
    }
  }

  submitRegisterParcel(): void {
    this.registerError = '';
    this.registerOutcome = null;

    this.parcelService.registerParcelInSortingFacility(this.registerForm).subscribe({
      next: (res) => {
        this.registerOutcome = res;
      },
      error: (err: Error) => {
        this.registerError = err.message;
      }
    });
  }

  submitBeltAssignment(): void {
    this.beltAssignmentResult = null;
    this.parcelService.assignParcelToRegionAndStation(this.beltScanInput).subscribe({
      next: (res) => {
        this.beltAssignmentResult = {
          isProblematic: res.isProblematic,
          instruction: res.instruction
        };
      }
    });
  }

  submitGenerateSortingSummary(): void {
    this.facilityService.generateSortingWorkSummary(this.sortingSummaryForm).subscribe((res) => {
      this.sortingSummaryResult = res;
    });
  }

  loadRegionForEdit(r: DeliveryRegion): void {
    this.regionSaveMsg = '';
    this.regionForm = {
      id: r.id,
      name: r.name,
      postalCodePrefixesCsv: r.postalCodePrefixes.join(', '),
      boundariesDescription: r.boundariesDescription,
      assignedStationId: r.assignedStationId ?? 'ST-01'
    };
  }

  submitSaveRegionConfig(): void {
    this.regionSaveMsg = '';
    this.facilityService.saveOrUpdateDeliveryRegion(this.regionForm).subscribe({
      next: (saved) => {
        this.regionSaveMsg = `Zaktualizowano rejon ${saved.id} (${saved.name}).`;
      }
    });
  }

  onSelectBranchStaff(): void {
    const found = this.branchStaff.find((e) => e.id === this.staffForm.employeeId);
    if (found) {
      this.staffForm.role = found.role;
      this.staffForm.assignedRegionId = found.assignedRegionId;
      this.staffForm.permissionsCsv = found.permissions.join(', ');
    }
  }

  submitBranchStaffUpdate(): void {
    this.staffSaveMsg = '';
    const perms = this.staffForm.permissionsCsv
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    this.facilityService
      .updateBranchStaffMember({
        employeeId: this.staffForm.employeeId,
        role: this.staffForm.role,
        assignedRegionId: this.staffForm.assignedRegionId,
        permissions: perms
      })
      .subscribe((updated) => {
        this.staffSaveMsg = `Zapisano zmiany dla pracownika: ${updated.fullName}.`;
      });
  }
}
