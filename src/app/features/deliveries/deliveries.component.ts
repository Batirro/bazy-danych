import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatExpansionModule } from '@angular/material/expansion';
import { Employee, Parcel } from '../../core/models/domain.models';
import { ParcelService } from '../../core/services/parcel.service';
import { SortingFacilityService } from '../../core/services/sorting-facility.service';

@Component({
  selector: 'app-deliveries',
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
    MatRadioModule,
    MatExpansionModule
  ],
  template: `
    <div class="page-container narrow">
      <div class="module-header">
        <div>
          <h1>
            <mat-icon color="primary">route</mat-icon>
            Doręczenia kurierskie
          </h1>
          <p>Harmonogram trasy, dane adresowe odbiorców oraz potwierdzanie doręczeń</p>
        </div>

        <mat-form-field appearance="outline" class="courier-picker">
          <mat-label>Kurier</mat-label>
          <mat-select [(ngModel)]="activeCourierId" (selectionChange)="refreshRouteList()">
            <mat-option *ngFor="let c of couriers" [value]="c.id">
              {{ c.fullName }} ({{ c.assignedRegionId }})
            </mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div class="subpage-nav">
        <a mat-stroked-button routerLink="/doreczenia/trasa" routerLinkActive="sub-active">
          <mat-icon>alt_route</mat-icon>
          Trasa doręczeń
        </a>
        <a mat-stroked-button routerLink="/doreczenia/potwierdzenie" routerLinkActive="sub-active">
          <mat-icon>task_alt</mat-icon>
          Potwierdzenie doręczenia
        </a>
      </div>

      <!-- Trasa doręczeń -->
      <ng-container *ngIf="activeSection === 'trasa'">
        <mat-card class="clean-card">
          <div class="card-header-flex">
            <div>
              <mat-card-title>Lista punktów doręczeń na trasie</mat-card-title>
              <mat-card-subtitle>
                Kliknij wybraną przesyłkę, aby wyświetlić pełny adres, telefon oraz wskazówki dla kuriera.
              </mat-card-subtitle>
            </div>

            <button mat-flat-button color="primary" (click)="submitGenerateRoute()">
              <mat-icon>alt_route</mat-icon>
              Optymalizuj trasę
            </button>
          </div>

          <mat-card-content>
            <div *ngIf="routeGeneratedMessage" class="alert-box alert-info">
              <mat-icon>map</mat-icon>
              <div>{{ routeGeneratedMessage }}</div>
            </div>

            <mat-accordion class="stops-accordion">
              <mat-expansion-panel
                *ngFor="let p of courierTasks; let idx = index"
                [expanded]="idx === 0"
                (opened)="selectTaskForAddressInspection(p)"
              >
                <mat-expansion-panel-header>
                  <mat-panel-title>
                    <span class="stop-num">#{{ p.routeStopOrder || idx + 1 }}</span>
                    <strong>{{ p.trackingNumber }}</strong>
                    <span class="stop-city">· {{ p.postalCode }} {{ p.city }}</span>
                  </mat-panel-title>
                  <mat-panel-description>
                    <span
                      class="status-badge"
                      [ngClass]="p.status === 'Doręczona' ? 'status-delivered' : 'status-in-delivery'"
                    >
                      {{ p.status }}
                    </span>
                  </mat-panel-description>
                </mat-expansion-panel-header>

                <div class="expanded-address-details">
                  <div class="detail-grid">
                    <div class="d-item">
                      <span>Odbiorca</span>
                      <strong>{{ p.recipientName }}</strong>
                    </div>
                    <div class="d-item">
                      <span>Adres doręczenia</span>
                      <strong>{{ p.deliveryAddress }}</strong>
                    </div>
                    <div class="d-item">
                      <span>Telefon kontaktowy</span>
                      <strong>{{ p.recipientPhone }}</strong>
                    </div>
                    <div class="d-item">
                      <span>Planowane okno doręczenia</span>
                      <strong>{{ p.estimatedStopTime || '10:00 - 12:00' }}</strong>
                    </div>
                  </div>

                  <div class="notes-banner">
                    <mat-icon>info_outline</mat-icon>
                    <div>
                      <strong>Wskazówki doręczenia:</strong>
                      {{ p.deliveryNotes || 'Brak dodatkowych wskazówek.' }}
                    </div>
                  </div>

                  <div class="actions-bar">
                    <button
                      mat-flat-button
                      color="primary"
                      (click)="goToConfirmDelivery(p)"
                      [disabled]="p.status === 'Doręczona'"
                    >
                      <mat-icon>task_alt</mat-icon>
                      Wydaj przesyłkę odbiorcy
                    </button>
                  </div>
                </div>
              </mat-expansion-panel>
            </mat-accordion>
          </mat-card-content>
        </mat-card>
      </ng-container>

      <!-- Potwierdzenie doręczenia -->
      <ng-container *ngIf="activeSection === 'potwierdzenie'">
        <mat-card class="clean-card" *ngIf="selectedParcel">
          <mat-card-header>
            <mat-card-title>Potwierdzenie doręczenia przesyłki</mat-card-title>
            <mat-card-subtitle>
              Zarejestruj wydanie paczki poprzez podpis odbiorcy lub weryfikację kodu odbioru PIN.
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="form-stack">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Przesyłka</mat-label>
                <mat-select
                  [ngModel]="selectedParcel.trackingNumber"
                  (ngModelChange)="onChangeSelectedTracking($event)"
                >
                  <mat-option *ngFor="let p of courierTasks" [value]="p.trackingNumber">
                    {{ p.trackingNumber }} – {{ p.recipientName }} ({{ p.deliveryAddress }}) [{{ p.status }}]
                  </mat-option>
                </mat-select>
              </mat-form-field>

              <div class="mode-box">
                <mat-radio-group [(ngModel)]="confirmationMode" class="radio-col">
                  <mat-radio-button value="SIGNATURE">
                    Podpis odbiorcy na ekranie terminala
                  </mat-radio-button>
                  <mat-radio-button value="PICKUP_CODE">
                    Jednorazowy kod odbioru PIN
                  </mat-radio-button>
                </mat-radio-group>
              </div>

              <div *ngIf="confirmationMode === 'SIGNATURE'" class="form-stack">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Podpis odbiorcy</mat-label>
                  <input matInput [(ngModel)]="signatureInput" />
                  <mat-icon matSuffix>draw</mat-icon>
                </mat-form-field>

                <div class="sig-pad">
                  <span>Wzór podpisu elektronicznego:</span>
                  <div class="sig-script">{{ signatureInput || '...' }}</div>
                </div>
              </div>

              <div *ngIf="confirmationMode === 'PICKUP_CODE'" class="form-stack">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Kod odbioru PIN</mat-label>
                  <input matInput [(ngModel)]="pickupCodeInput" placeholder="Wpisz 6-cyfrowy kod PIN" />
                  <mat-icon matSuffix>pin</mat-icon>
                </mat-form-field>
              </div>

              <div class="actions-bar">
                <button mat-flat-button color="primary" (click)="submitConfirmDelivery()">
                  <mat-icon>task_alt</mat-icon>
                  Potwierdź doręczenie
                </button>
              </div>

              <div *ngIf="deliveryConfirmSuccess" class="alert-box alert-success">
                <mat-icon>check_circle</mat-icon>
                <div>{{ deliveryConfirmSuccess }}</div>
              </div>
              <div *ngIf="deliveryConfirmError" class="alert-box alert-error">
                <mat-icon>error</mat-icon>
                <div>{{ deliveryConfirmError }}</div>
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
    .courier-picker {
      min-width: 260px;
    }
    .card-header-flex {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 20px;
    }
    .stops-accordion {
      display: block;
      margin-top: 12px;
    }
    .stop-num {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #1d4ed8;
      color: white;
      font-weight: 700;
      font-size: 0.8rem;
      margin-right: 12px;
    }
    .stop-city {
      color: #64748b;
      margin-left: 8px;
      font-size: 0.9rem;
    }
    .expanded-address-details {
      padding-top: 12px;
    }
    .detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 16px;

      .d-item {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        padding: 14px 16px;
        border-radius: 10px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        span { font-size: 0.78rem; color: #64748b; }
      }
    }
    .notes-banner {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #fffbeb;
      border: 1px solid #fde68a;
      color: #92400e;
      padding: 14px 16px;
      border-radius: 10px;
      margin-bottom: 16px;
    }
    .mode-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 18px 20px;
      border-radius: 10px;
      .radio-col {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
    }
    .sig-pad {
      background: #f8fafc;
      border: 2px dashed #cbd5e1;
      border-radius: 10px;
      padding: 20px;
      text-align: center;
      span { font-size: 0.8rem; color: #64748b; }
      .sig-script {
        font-family: Georgia, serif;
        font-style: italic;
        font-size: 1.6rem;
        color: #1e3a8a;
        margin-top: 6px;
      }
    }
  `]
})
export class DeliveriesComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly parcelService = inject(ParcelService);
  private readonly facilityService = inject(SortingFacilityService);

  activeSection = 'trasa';

  couriers: Employee[] = [];
  activeCourierId = 'EMP-04';
  allParcels: Parcel[] = [];
  courierTasks: Parcel[] = [];
  selectedParcel: Parcel | null = null;

  routeGeneratedMessage = '';

  confirmationMode: 'SIGNATURE' | 'PICKUP_CODE' = 'SIGNATURE';
  signatureInput = 'Marek Lewandowski';
  pickupCodeInput = '482910';
  deliveryConfirmSuccess = '';
  deliveryConfirmError = '';

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.activeSection = params.get('section') ?? 'trasa';
    });
    this.facilityService.employees$.subscribe((emps) => {
      this.couriers = emps.filter((e) => e.role === 'COURIER');
    });
    this.parcelService.parcels$.subscribe((p) => {
      this.allParcels = p;
      this.refreshRouteList();
    });
  }

  refreshRouteList(): void {
    this.courierTasks = this.allParcels
      .filter((p) => p.assignedCourierId === this.activeCourierId)
      .sort((a, b) => (a.routeStopOrder ?? 99) - (b.routeStopOrder ?? 99));

    if (this.selectedParcel) {
      this.selectedParcel =
        this.courierTasks.find((t) => t.trackingNumber === this.selectedParcel?.trackingNumber) ??
        this.courierTasks[0] ??
        null;
    } else if (this.courierTasks.length > 0) {
      this.selectTaskForAddressInspection(this.courierTasks[0]);
    }
  }

  selectTaskForAddressInspection(p: Parcel): void {
    this.selectedParcel = p;
    this.signatureInput = p.recipientName;
    if (p.pickupCode) {
      this.pickupCodeInput = p.pickupCode;
    }
    this.deliveryConfirmSuccess = '';
    this.deliveryConfirmError = '';
  }

  onChangeSelectedTracking(trackingNumber: string): void {
    const found = this.courierTasks.find((t) => t.trackingNumber === trackingNumber);
    if (found) {
      this.selectTaskForAddressInspection(found);
    }
  }

  goToConfirmDelivery(p: Parcel): void {
    this.selectTaskForAddressInspection(p);
    this.router.navigate(['/doreczenia/potwierdzenie']);
  }

  submitGenerateRoute(): void {
    this.parcelService.optimizeAndGenerateCourierRoute(this.activeCourierId).subscribe((ordered) => {
      this.courierTasks = ordered;
      this.routeGeneratedMessage = `Zoptymalizowano trasę rozwożenia (${ordered.length} punktów doręczeń).`;
    });
  }

  submitConfirmDelivery(): void {
    if (!this.selectedParcel) return;
    this.deliveryConfirmSuccess = '';
    this.deliveryConfirmError = '';

    const value =
      this.confirmationMode === 'SIGNATURE' ? this.signatureInput : this.pickupCodeInput;

    this.parcelService
      .confirmParcelDelivery(this.selectedParcel.trackingNumber, this.confirmationMode, value)
      .subscribe({
        next: (updated) => {
          this.selectedParcel = updated;
          this.deliveryConfirmSuccess = `Przesyłka ${updated.trackingNumber} została oznaczona jako doręczona.`;
        },
        error: (err: Error) => {
          this.deliveryConfirmError = err.message;
        }
      });
  }
}
