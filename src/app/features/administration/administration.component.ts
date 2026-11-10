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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {
  BackupResult,
  DeliveryRegion,
  DispatchStation,
  Employee,
  EmployeeRole,
  OperationalReportResult
} from '../../core/models/domain.models';
import { AdminService } from '../../core/services/admin.service';
import { SortingFacilityService } from '../../core/services/sorting-facility.service';

@Component({
  selector: 'app-administration',
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
    MatCheckboxModule,
    MatTableModule,
    MatMenuModule,
    MatProgressBarModule
  ],
  template: `
    <div class="page-container">
      <div class="module-header">
        <div>
          <h1>
            <mat-icon color="primary">admin_panel_settings</mat-icon>
            Administracja i zarządzanie oddziałem
          </h1>
          <p>Zarządzanie kontami użytkowników, strukturą stanowisk wydawczych oraz raportowaniem</p>
        </div>
      </div>

      <div class="subpage-nav">
        <a mat-stroked-button routerLink="/administracja/konta" routerLinkActive="sub-active">
          <mat-icon>manage_accounts</mat-icon>
          Konta pracowników
        </a>
        <a mat-stroked-button routerLink="/administracja/kopia-zapasowa" routerLinkActive="sub-active">
          <mat-icon>backup</mat-icon>
          Kopia zapasowa bazy
        </a>
        <a mat-stroked-button routerLink="/administracja/stanowiska" routerLinkActive="sub-active">
          <mat-icon>add_business</mat-icon>
          Nowe stanowisko
        </a>
        <a mat-stroked-button routerLink="/administracja/przypisz-rejon" routerLinkActive="sub-active">
          <mat-icon>link</mat-icon>
          Przypisanie rejonu
        </a>
        <a mat-stroked-button routerLink="/administracja/raporty" routerLinkActive="sub-active">
          <mat-icon>assessment</mat-icon>
          Raporty operacyjne
        </a>
      </div>

      <!-- Konta pracowników -->
      <ng-container *ngIf="activeSection === 'konta'">
        <mat-card class="clean-card" *ngIf="!showEmployeeEditor">
          <div class="card-header-flex">
            <div>
              <mat-card-title>Konta pracowników</mat-card-title>
              <mat-card-subtitle>
                Przeglądaj listę pracowników, edytuj uprawnienia lub twórz nowe konta w systemie.
              </mat-card-subtitle>
            </div>
            <button mat-flat-button color="primary" (click)="startAddingNewEmployee()">
              <mat-icon>person_add</mat-icon>
              Dodaj konto pracownika
            </button>
          </div>

          <mat-card-content>
            <div *ngIf="employeeFormMsg" class="alert-box alert-success">
              <mat-icon>check_circle</mat-icon>
              <div>{{ employeeFormMsg }}</div>
            </div>

            <table mat-table [dataSource]="employees" class="full-width">
              <ng-container matColumnDef="fullName">
                <th mat-header-cell *matHeaderCellDef>Pracownik</th>
                <td mat-cell *matCellDef="let emp">
                  <strong>{{ emp.fullName }}</strong>
                  <div class="cell-sub">{{ emp.login }} · {{ emp.email }}</div>
                </td>
              </ng-container>

              <ng-container matColumnDef="role">
                <th mat-header-cell *matHeaderCellDef>Rola</th>
                <td mat-cell *matCellDef="let emp">{{ roleLabel(emp.role) }}</td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status konta</th>
                <td mat-cell *matCellDef="let emp">
                  <span
                    class="status-badge"
                    [ngClass]="emp.status === 'ACTIVE' ? 'status-delivered' : 'status-issue'"
                  >
                    {{ emp.status === 'ACTIVE' ? 'Aktywne' : 'Zablokowane' }}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Opcje</th>
                <td mat-cell *matCellDef="let emp">
                  <button mat-stroked-button [matMenuTriggerFor]="empActionMenu">
                    Zarządzaj
                    <mat-icon>expand_more</mat-icon>
                  </button>
                  <mat-menu #empActionMenu="matMenu">
                    <button mat-menu-item (click)="selectEmployeeForEdit(emp)">
                      <mat-icon>edit</mat-icon>
                      <span>Edytuj dane i uprawnienia</span>
                    </button>
                    <button mat-menu-item (click)="quickToggleBlock(emp)">
                      <mat-icon color="warn">{{ emp.status === 'ACTIVE' ? 'block' : 'lock_open' }}</mat-icon>
                      <span>{{ emp.status === 'ACTIVE' ? 'Zablokuj konto' : 'Odblokuj konto' }}</span>
                    </button>
                  </mat-menu>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="['fullName', 'role', 'status', 'actions']"></tr>
              <tr mat-row *matRowDef="let row; columns: ['fullName', 'role', 'status', 'actions']"></tr>
            </table>
          </mat-card-content>
        </mat-card>

        <mat-card class="clean-card" *ngIf="showEmployeeEditor">
          <div class="card-header-flex">
            <div>
              <mat-card-title>
                {{ isAddingEmployee ? 'Nowe konto pracownika' : 'Edycja konta: ' + (selectedEmployee?.fullName || '') }}
              </mat-card-title>
            </div>
            <button mat-stroked-button (click)="showEmployeeEditor = false">
              <mat-icon>arrow_back</mat-icon>
              Wróć do listy
            </button>
          </div>

          <mat-card-content>
            <div class="form-stack">
              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Imię i nazwisko *</mat-label>
                  <input matInput [(ngModel)]="employeeForm.fullName" />
                </mat-form-field>

                <mat-form-field appearance="outline" *ngIf="isAddingEmployee">
                  <mat-label>Login systemowy *</mat-label>
                  <input matInput [(ngModel)]="employeeForm.login" placeholder="np. j.kowalski" />
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Adres e-mail *</mat-label>
                  <input matInput [(ngModel)]="employeeForm.email" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Telefon służbowy</mat-label>
                  <input matInput [(ngModel)]="employeeForm.phone" />
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Rola w systemie</mat-label>
                  <mat-select [(ngModel)]="employeeForm.role">
                    <mat-option value="ADMIN">Administrator systemu</mat-option>
                    <mat-option value="MANAGER">Kierownik sortowni</mat-option>
                    <mat-option value="SORTER">Pracownik sortowni</mat-option>
                    <mat-option value="COURIER">Kurier</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Uprawnienia (po przecinku)</mat-label>
                  <input matInput [(ngModel)]="employeeForm.permissionsCsv" />
                </mat-form-field>
              </div>

              <div class="actions-bar">
                <button mat-flat-button color="primary" (click)="saveEmployeeForm()">
                  <mat-icon>save</mat-icon>
                  {{ isAddingEmployee ? 'Utwórz konto' : 'Zapisz zmiany' }}
                </button>

                <button
                  *ngIf="!isAddingEmployee && selectedEmployee"
                  mat-stroked-button
                  color="warn"
                  (click)="toggleBlockSelectedEmployee()"
                >
                  <mat-icon>{{ selectedEmployee.status === 'ACTIVE' ? 'block' : 'lock_open' }}</mat-icon>
                  {{ selectedEmployee.status === 'ACTIVE' ? 'Zablokuj konto' : 'Odblokuj konto' }}
                </button>
              </div>

              <div *ngIf="employeeFormError" class="alert-box alert-error">
                <mat-icon>error</mat-icon>
                <div>{{ employeeFormError }}</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </ng-container>

      <!-- Kopia zapasowa bazy danych -->
      <ng-container *ngIf="activeSection === 'kopia-zapasowa'">
        <mat-card class="clean-card">
          <mat-card-header>
            <mat-card-title>Kopia zapasowa i integralność bazy danych</mat-card-title>
            <mat-card-subtitle>
              Utwórz archiwum bazy danych i przeprowadź automatyczną weryfikację spójności danych.
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="form-stack">
              <div class="actions-bar">
                <button
                  mat-flat-button
                  color="primary"
                  [disabled]="backupInProgress"
                  (click)="executeDatabaseBackup()"
                >
                  <mat-icon>backup</mat-icon>
                  Wykonaj kopię zapasową bazy danych
                </button>
              </div>

              <mat-progress-bar *ngIf="backupInProgress" mode="indeterminate"></mat-progress-bar>

              <div *ngIf="backupResult" class="alert-box alert-success">
                <mat-icon>check_circle</mat-icon>
                <div>
                  <strong>Kopia zapasowa została pomyślnie zapisana.</strong><br />
                  Plik: <code>{{ backupResult.fileName }}</code> ({{ backupResult.sizeMb }} MB) · Data:
                  {{ backupResult.timestamp }} · Integralność: Zweryfikowana.
                </div>
              </div>

              <div *ngIf="backupError" class="alert-box alert-error">
                <mat-icon>error</mat-icon>
                <div>{{ backupError }}</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </ng-container>

      <!-- Dodaj stanowisko wydawcze -->
      <ng-container *ngIf="activeSection === 'stanowiska'">
        <mat-card class="clean-card">
          <mat-card-header>
            <mat-card-title>Nowe stanowisko wydawcze</mat-card-title>
            <mat-card-subtitle>
              Zdefiniuj nowe stanowisko wydawcze i jego parametry techniczne w strukturze sortowni.
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="form-stack">
              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Identyfikator stanowiska *</mat-label>
                  <input matInput [(ngModel)]="newStationForm.id" placeholder="np. ST-04" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Maksymalna pojemność (liczba paczek)</mat-label>
                  <input matInput type="number" [(ngModel)]="newStationForm.maxCapacity" />
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Nazwa stanowiska wydawczego *</mat-label>
                <input matInput [(ngModel)]="newStationForm.name" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Parametry operacyjne stanowiska</mat-label>
                <input matInput [(ngModel)]="newStationForm.operationalParams" />
              </mat-form-field>

              <div class="actions-bar">
                <button mat-flat-button color="primary" (click)="submitAddStation()">
                  <mat-icon>add_business</mat-icon>
                  Zatwierdź
                </button>
              </div>

              <div *ngIf="stationAddSuccess" class="alert-box alert-success">
                <mat-icon>check_circle</mat-icon>
                <div>{{ stationAddSuccess }}</div>
              </div>
              <div *ngIf="stationAddError" class="alert-box alert-error">
                <mat-icon>error</mat-icon>
                <div>{{ stationAddError }}</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </ng-container>

      <!-- Przypisz rejon doręczeń do stanowiska -->
      <ng-container *ngIf="activeSection === 'przypisz-rejon'">
        <mat-card class="clean-card">
          <mat-card-header>
            <mat-card-title>Przypisanie rejonu doręczeń do stanowiska</mat-card-title>
            <mat-card-subtitle>
              Skonfiguruj powiązanie pomiędzy rejonem doręczeń a stanowiskiem wydawczym oddziału.
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="form-stack">
              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Stanowisko wydawcze</mat-label>
                  <mat-select [(ngModel)]="assignForm.stationId">
                    <mat-option *ngFor="let st of stations" [value]="st.id">
                      {{ st.id }} – {{ st.name }} (Obecny rejon: {{ st.assignedRegionId || 'Brak' }})
                    </mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Rejon doręczeń</mat-label>
                  <mat-select [(ngModel)]="assignForm.regionId">
                    <mat-option *ngFor="let reg of regions" [value]="reg.id">
                      {{ reg.id }} – {{ reg.name }} (Obecne stanowisko: {{ reg.assignedStationId || 'Brak' }})
                    </mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <div class="actions-bar">
                <button mat-flat-button color="primary" (click)="submitAssignRegion(false)">
                  <mat-icon>link</mat-icon>
                  Zapisz przypisanie
                </button>
              </div>

              <div *ngIf="reassignConfirmationPrompt" class="alert-box alert-warning">
                <mat-icon>help_outline</mat-icon>
                <div>
                  <strong>Rejon jest już przypisany do stanowiska {{ reassignPreviousStation }}.</strong><br />
                  Czy chcesz zmienić przypisanie rejonu <strong>{{ assignForm.regionId }}</strong> na stanowisko
                  <strong>{{ assignForm.stationId }}</strong>?
                  <div class="actions-bar">
                    <button mat-flat-button color="warn" (click)="submitAssignRegion(true)">
                      Potwierdź zmianę
                    </button>
                    <button mat-button (click)="reassignConfirmationPrompt = false">Anuluj</button>
                  </div>
                </div>
              </div>

              <div *ngIf="assignRegionSuccess" class="alert-box alert-success">
                <mat-icon>check_circle</mat-icon>
                <div>{{ assignRegionSuccess }}</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </ng-container>

      <!-- Raporty operacyjne -->
      <ng-container *ngIf="activeSection === 'raporty'">
        <mat-card class="clean-card">
          <mat-card-header>
            <mat-card-title>Raporty operacyjne oddziału</mat-card-title>
            <mat-card-subtitle>
              Wybierz zakres dat oraz parametry zestawienia.
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="form-stack">
              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Data początkowa</mat-label>
                  <input matInput type="date" [(ngModel)]="reportReq.dateFrom" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Data końcowa</mat-label>
                  <input matInput type="date" [(ngModel)]="reportReq.dateTo" />
                </mat-form-field>
              </div>

              <div class="checkbox-group-box">
                <mat-checkbox [(ngModel)]="reportReq.includeWorkloadSummary">
                  Zestawienie obciążenia stanowisk wydawczych i kurierów
                </mat-checkbox>
                <mat-checkbox [(ngModel)]="reportReq.includeFailedDeliveryReasons">
                  Analiza i klasyfikacja przyczyn nieudanych doręczeń
                </mat-checkbox>
                <mat-checkbox [(ngModel)]="reportReq.includeDeliveryEffectiveness">
                  Statystyki skuteczności doręczeń oraz liczby zwrotów
                </mat-checkbox>
              </div>

              <div class="actions-bar">
                <button mat-flat-button color="primary" (click)="generateReport()">
                  <mat-icon>assessment</mat-icon>
                  Generuj raport
                </button>
              </div>
            </div>

            <div *ngIf="generatedReport" class="report-results">
              <div class="alert-box alert-info">
                <mat-icon>summarize</mat-icon>
                <div>
                  <strong>{{ generatedReport.summaryNote }}</strong><br />
                  <small>Data wygenerowania: {{ generatedReport.generatedAt }}</small>
                </div>
              </div>

              <div class="report-sections">
                <div *ngIf="generatedReport.effectivenessStats" class="report-block">
                  <h4>Skuteczność doręczeń i zwrotów</h4>
                  <p class="big-stat">{{ generatedReport.effectivenessStats.effectivenessRatePercent }}%</p>
                  <p>
                    Doręczone: <strong>{{ generatedReport.effectivenessStats.deliveredCount }}</strong> ·
                    Zwroty: <strong>{{ generatedReport.effectivenessStats.returnedCount }}</strong> ·
                    W procesie: <strong>{{ generatedReport.effectivenessStats.pendingCount }}</strong>
                  </p>
                </div>

                <div *ngIf="generatedReport.workloadSummary" class="report-block">
                  <h4>Obciążenie stanowisk i kurierów</h4>
                  <ul>
                    <li *ngFor="let st of generatedReport.workloadSummary.stationLoads">
                      {{ st.stationId }} ({{ st.stationName }}): <strong>{{ st.parcelCount }} paczek</strong> ({{ st.utilizationPercent }}%)
                    </li>
                  </ul>
                  <ul>
                    <li *ngFor="let c of generatedReport.workloadSummary.courierLoads">
                      {{ c.courierName }} ({{ c.region }}): przypisane {{ c.assignedCount }}, zrealizowane {{ c.completedCount }}
                    </li>
                  </ul>
                </div>

                <div *ngIf="generatedReport.failedDeliveryReasons" class="report-block">
                  <h4>Przyczyny nieudanych doręczeń</h4>
                  <ul>
                    <li *ngFor="let item of generatedReport.failedDeliveryReasons">
                      {{ item.reason }}: <strong>{{ item.count }} szt.</strong> ({{ item.sharePercent }}%)
                    </li>
                  </ul>
                </div>
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
      margin-bottom: 24px;
    }
    .cell-sub {
      font-size: 0.8rem;
      color: #64748b;
      margin-top: 2px;
    }
    .checkbox-group-box {
      display: flex;
      flex-direction: column;
      gap: 10px;
      background: #f8fafc;
      padding: 18px 20px;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
    }
    .report-results {
      margin-top: 28px;
      padding-top: 24px;
      border-top: 1px solid #e2e8f0;
    }
    .report-sections {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin-top: 16px;
    }
    .report-block {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 20px;

      h4 {
        margin: 0 0 12px;
        color: #0f172a;
      }
      .big-stat {
        font-size: 1.5rem;
        font-weight: 700;
        color: #15803d;
        margin: 0 0 8px;
      }
      ul {
        margin: 8px 0 0;
        padding-left: 18px;
        li {
          margin-bottom: 8px;
          font-size: 0.9rem;
        }
      }
    }
  `]
})
export class AdministrationComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly adminService = inject(AdminService);
  private readonly facilityService = inject(SortingFacilityService);

  activeSection = 'konta';

  employees: Employee[] = [];
  stations: DispatchStation[] = [];
  regions: DeliveryRegion[] = [];

  showEmployeeEditor = false;
  selectedEmployee: Employee | null = null;
  isAddingEmployee = false;
  employeeForm = {
    fullName: '',
    login: '',
    email: '',
    phone: '',
    role: 'SORTER' as EmployeeRole,
    permissionsCsv: ''
  };
  employeeFormMsg = '';
  employeeFormError = '';

  backupInProgress = false;
  simulateBackupDiskError = false;
  backupResult: BackupResult | null = null;
  backupError = '';

  newStationForm = {
    id: 'ST-04',
    name: 'Stanowisko Wydawcze B2 (Zachód)',
    operationalParams: 'Rampa zachodnia, skaner stacjonarny S-204',
    maxCapacity: 110
  };
  stationAddSuccess = '';
  stationAddError = '';

  assignForm = {
    stationId: 'ST-01',
    regionId: 'REJ-POLNOC'
  };
  reassignConfirmationPrompt = false;
  reassignPreviousStation = '';
  assignRegionSuccess = '';

  reportReq = {
    dateFrom: '2026-11-01',
    dateTo: '2026-11-10',
    includeWorkloadSummary: true,
    includeFailedDeliveryReasons: true,
    includeDeliveryEffectiveness: true
  };
  generatedReport: OperationalReportResult | null = null;

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.activeSection = params.get('section') ?? 'konta';
      this.showEmployeeEditor = false;
    });
    this.adminService.employees$.subscribe((list) => (this.employees = list));
    this.facilityService.stations$.subscribe((st) => (this.stations = st));
    this.facilityService.regions$.subscribe((reg) => (this.regions = reg));
  }

  roleLabel(role: EmployeeRole): string {
    const map: Record<EmployeeRole, string> = {
      ADMIN: 'Administrator systemu',
      MANAGER: 'Kierownik sortowni',
      SORTER: 'Pracownik sortowni',
      COURIER: 'Kurier'
    };
    return map[role];
  }

  selectEmployeeForEdit(emp: Employee): void {
    this.isAddingEmployee = false;
    this.selectedEmployee = emp;
    this.showEmployeeEditor = true;
    this.employeeFormMsg = '';
    this.employeeFormError = '';
    this.employeeForm = {
      fullName: emp.fullName,
      login: emp.login,
      email: emp.email,
      phone: emp.phone,
      role: emp.role,
      permissionsCsv: emp.permissions.join(', ')
    };
  }

  startAddingNewEmployee(): void {
    this.isAddingEmployee = true;
    this.selectedEmployee = null;
    this.showEmployeeEditor = true;
    this.employeeFormMsg = '';
    this.employeeFormError = '';
    this.employeeForm = {
      fullName: '',
      login: '',
      email: '',
      phone: '',
      role: 'COURIER',
      permissionsCsv: 'PICKUP_FROM_STATION, DELIVER_PARCEL'
    };
  }

  saveEmployeeForm(): void {
    this.employeeFormMsg = '';
    this.employeeFormError = '';
    const perms = this.employeeForm.permissionsCsv
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (this.isAddingEmployee) {
      this.adminService
        .addEmployeeAccount({
          fullName: this.employeeForm.fullName,
          login: this.employeeForm.login,
          email: this.employeeForm.email,
          phone: this.employeeForm.phone,
          role: this.employeeForm.role,
          permissions: perms
        })
        .subscribe({
          next: (created) => {
            this.showEmployeeEditor = false;
            this.employeeFormMsg = `Utworzono nowe konto pracownika: ${created.fullName} (${created.id}).`;
          },
          error: (err: Error) => {
            this.employeeFormError = err.message;
          }
        });
    } else if (this.selectedEmployee) {
      this.adminService
        .updateEmployeeAccount({
          id: this.selectedEmployee.id,
          fullName: this.employeeForm.fullName,
          email: this.employeeForm.email,
          phone: this.employeeForm.phone,
          role: this.employeeForm.role,
          permissions: perms,
          assignedRegionId: this.selectedEmployee.assignedRegionId
        })
        .subscribe({
          next: (updated) => {
            this.showEmployeeEditor = false;
            this.employeeFormMsg = `Zaktualizowano konto pracownika: ${updated.fullName}.`;
          },
          error: (err: Error) => {
            this.employeeFormError = err.message;
          }
        });
    }
  }

  quickToggleBlock(emp: Employee): void {
    const shouldBlock = emp.status === 'ACTIVE';
    this.adminService.toggleBlockEmployeeAccount(emp.id, shouldBlock).subscribe((updated) => {
      this.employeeFormMsg =
        updated.status === 'BLOCKED'
          ? `Zablokowano konto pracownika ${updated.fullName}.`
          : `Odblokowano konto pracownika ${updated.fullName}.`;
    });
  }

  toggleBlockSelectedEmployee(): void {
    if (!this.selectedEmployee) return;
    const shouldBlock = this.selectedEmployee.status === 'ACTIVE';
    this.adminService.toggleBlockEmployeeAccount(this.selectedEmployee.id, shouldBlock).subscribe((updated) => {
      this.selectedEmployee = updated;
      this.showEmployeeEditor = false;
      this.employeeFormMsg =
        updated.status === 'BLOCKED'
          ? `Zablokowano konto pracownika ${updated.fullName}.`
          : `Odblokowano konto pracownika ${updated.fullName}.`;
    });
  }

  executeDatabaseBackup(): void {
    this.backupInProgress = true;
    this.backupResult = null;
    this.backupError = '';

    this.adminService.createDatabaseBackup(this.simulateBackupDiskError).subscribe({
      next: (res) => {
        this.backupInProgress = false;
        this.backupResult = res;
      },
      error: (err: Error) => {
        this.backupInProgress = false;
        this.backupError = err.message;
      }
    });
  }

  submitAddStation(): void {
    this.stationAddSuccess = '';
    this.stationAddError = '';

    this.facilityService.addDispatchStation(this.newStationForm).subscribe({
      next: (st) => {
        this.stationAddSuccess = `Dodano stanowisko wydawcze ${st.id} (${st.name}).`;
      },
      error: (err: Error) => {
        this.stationAddError = err.message;
      }
    });
  }

  submitAssignRegion(forceReassign: boolean): void {
    this.assignRegionSuccess = '';

    this.facilityService
      .assignRegionToStation(this.assignForm.stationId, this.assignForm.regionId, forceReassign)
      .subscribe({
        next: (res) => {
          if (res.requiresConfirmation) {
            this.reassignConfirmationPrompt = true;
            this.reassignPreviousStation = res.previousStationId ?? '';
          } else {
            this.reassignConfirmationPrompt = false;
            this.assignRegionSuccess = `Przypisano rejon ${this.assignForm.regionId} do stanowiska ${this.assignForm.stationId}.`;
          }
        }
      });
  }

  generateReport(): void {
    this.facilityService.generateOperationalReport(this.reportReq).subscribe((res) => {
      this.generatedReport = res;
    });
  }
}
