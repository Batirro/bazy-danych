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
import { DispatchStation, Parcel } from '../../core/models/domain.models';
import { ParcelService } from '../../core/services/parcel.service';
import { SortingFacilityService } from '../../core/services/sorting-facility.service';

@Component({
  selector: 'app-dispatch-station',
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
    MatTableModule
  ],
  template: `
    <div class="page-container">
      <div class="module-header">
        <div>
          <h1>
            <mat-icon color="primary">dock</mat-icon>
            Stanowiska wydawcze
          </h1>
          <p>Obsługa fizycznego rozmieszczenia przesyłek na rampach oraz przyjmowanie zwrotów z tras</p>
        </div>
      </div>

      <div class="subpage-nav">
        <a mat-stroked-button routerLink="/stanowisko-wydawcze/stan" routerLinkActive="sub-active">
          <mat-icon>inventory</mat-icon>
          Stan stanowiska
        </a>
        <a mat-stroked-button routerLink="/stanowisko-wydawcze/umiesc" routerLinkActive="sub-active">
          <mat-icon>move_to_inbox</mat-icon>
          Umieść na stanowisku
        </a>
        <a mat-stroked-button routerLink="/stanowisko-wydawcze/zwroty-sortownia" routerLinkActive="sub-active">
          <mat-icon>assignment_returned</mat-icon>
          Przyjęcie zwrotu z trasy
        </a>
      </div>

      <!-- Stan stanowiska -->
      <ng-container *ngIf="activeSection === 'stan'">
        <mat-card class="clean-card">
          <mat-card-header>
            <mat-card-title>Stan stanowiska wydawczego</mat-card-title>
            <mat-card-subtitle>
              Wybierz stanowisko z listy, aby sprawdzić zgromadzone przesyłki lub wydrukować etykietę przewozową.
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="station-selector-row">
              <mat-form-field appearance="outline" class="station-field">
                <mat-label>Stanowisko wydawcze</mat-label>
                <mat-select [(ngModel)]="inspectedStationId">
                  <mat-option *ngFor="let st of stations" [value]="st.id">
                    {{ st.id }} – {{ st.name }}
                  </mat-option>
                </mat-select>
              </mat-form-field>

              <div class="capacity-pill" *ngIf="selectedStationObj">
                <span>Obłożenie stanowiska:</span>
                <strong>{{ parcelsAtInspectedStation.length }} / {{ selectedStationObj.maxCapacity }} paczek</strong>
              </div>
            </div>

            <div *ngIf="reprintMessage" class="alert-box alert-info">
              <mat-icon>print</mat-icon>
              <div>{{ reprintMessage }}</div>
            </div>

            <table mat-table [dataSource]="parcelsAtInspectedStation" class="full-width">
              <ng-container matColumnDef="trackingNumber">
                <th mat-header-cell *matHeaderCellDef>Kod przesyłki</th>
                <td mat-cell *matCellDef="let p">
                  <strong>{{ p.trackingNumber }}</strong>
                  <div class="cell-sub">Gabaryt {{ p.dimensions }} ({{ p.weightKg }} kg)</div>
                </td>
              </ng-container>

              <ng-container matColumnDef="recipient">
                <th mat-header-cell *matHeaderCellDef>Odbiorca i adres</th>
                <td mat-cell *matCellDef="let p">
                  <strong>{{ p.recipientName }}</strong>
                  <div class="cell-sub">{{ p.deliveryAddress }}</div>
                </td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let p">
                  <span class="status-badge status-station">{{ p.status }}</span>
                  <div class="cell-sub" *ngIf="p.damagedLabel" style="color: #b91c1c; font-weight: 600;">
                    Wymagany ponowny wydruk etykiety
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Etykieta</th>
                <td mat-cell *matCellDef="let p">
                  <button mat-stroked-button color="primary" (click)="reprintLabel(p)">
                    <mat-icon>print</mat-icon>
                    Drukuj etykietę
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="['trackingNumber', 'recipient', 'status', 'actions']"></tr>
              <tr mat-row *matRowDef="let row; columns: ['trackingNumber', 'recipient', 'status', 'actions']"></tr>
            </table>
          </mat-card-content>
        </mat-card>
      </ng-container>

      <!-- Umieść przesyłkę na stanowisku -->
      <ng-container *ngIf="activeSection === 'umiesc'">
        <mat-card class="clean-card">
          <mat-card-header>
            <mat-card-title>Rozmieszczenie przesyłki na stanowisku</mat-card-title>
            <mat-card-subtitle>
              Zeskanuj etykietę paczki i przypisz ją fizycznie do stanowiska wydawczego zgodnego z rejonem.
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="form-stack">
              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Przesyłka</mat-label>
                  <mat-select [(ngModel)]="placementForm.trackingNumber">
                    <mat-option *ngFor="let p of allParcels" [value]="p.trackingNumber">
                      {{ p.trackingNumber }} (Stanowisko docelowe: {{ p.assignedStationId || 'Brak' }}, Rejon: {{ p.assignedRegionId || 'Brak' }})
                    </mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Stanowisko wydawcze</mat-label>
                  <mat-select [(ngModel)]="placementForm.stationId">
                    <mat-option *ngFor="let st of stations" [value]="st.id">
                      {{ st.id }} – {{ st.name }} (Rejon: {{ st.assignedRegionId }})
                    </mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <div class="actions-bar">
                <button mat-flat-button color="primary" (click)="submitPlaceOnStation()">
                  <mat-icon>qr_code_scanner</mat-icon>
                  Zatwierdź umieszczenie na stanowisku
                </button>
              </div>

              <div *ngIf="placementSuccess" class="alert-box alert-success">
                <mat-icon>check_circle</mat-icon>
                <div>{{ placementSuccess }}</div>
              </div>
              <div *ngIf="placementError" class="alert-box alert-error">
                <mat-icon>campaign</mat-icon>
                <div>{{ placementError }}</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </ng-container>

      <!-- Przyjęcie niedoręczonej przesyłki z trasy -->
      <ng-container *ngIf="activeSection === 'zwroty-sortownia'">
        <mat-card class="clean-card">
          <mat-card-header>
            <mat-card-title>Przyjęcie zwrotu przesyłki z trasy</mat-card-title>
            <mat-card-subtitle>
              Zeskanuj zwracaną przez kuriera przesyłkę i zatwierdź powód niedoręczenia.
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="form-stack">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Zwracana przesyłka</mat-label>
                <mat-select [(ngModel)]="returnAcceptForm.trackingNumber" (selectionChange)="onSelectReturnParcel()">
                  <mat-option *ngFor="let p of allParcels" [value]="p.trackingNumber">
                    {{ p.trackingNumber }} – {{ p.status }} {{ p.nonDeliveryReason ? '(' + p.nonDeliveryReason + ')' : '' }}
                  </mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Przyczyna niedoręczenia</mat-label>
                <input matInput [(ngModel)]="returnAcceptForm.confirmedReason" />
              </mat-form-field>

              <div class="actions-bar">
                <button mat-flat-button color="primary" (click)="submitAcceptReturnedParcel()">
                  <mat-icon>assignment_returned</mat-icon>
                  Przyjmij zwrot na sortownię
                </button>
              </div>

              <div *ngIf="returnAcceptSuccess" class="alert-box alert-success">
                <mat-icon>check_circle</mat-icon>
                <div>{{ returnAcceptSuccess }}</div>
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
    .station-selector-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 16px;

      .station-field {
        min-width: 320px;
      }
      .capacity-pill {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        padding: 14px 20px;
        border-radius: 10px;
        display: flex;
        gap: 10px;
      }
    }
    .cell-sub {
      font-size: 0.8rem;
      color: #64748b;
      margin-top: 3px;
    }
  `]
})
export class DispatchStationComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly parcelService = inject(ParcelService);
  private readonly facilityService = inject(SortingFacilityService);

  activeSection = 'stan';

  allParcels: Parcel[] = [];
  stations: DispatchStation[] = [];

  inspectedStationId = 'ST-01';
  reprintMessage = '';

  placementForm = {
    trackingNumber: 'PL-2026-1003',
    stationId: 'ST-03'
  };
  placementSuccess = '';
  placementError = '';

  returnAcceptForm = {
    trackingNumber: 'PL-2026-1008',
    confirmedReason: 'Nieobecność odbiorcy pod wskazanym adresem (brak kontaktu telefonicznego)'
  };
  returnAcceptSuccess = '';

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.activeSection = params.get('section') ?? 'stan';
    });
    this.parcelService.parcels$.subscribe((p) => {
      this.allParcels = p;
      this.onSelectReturnParcel();
    });
    this.facilityService.stations$.subscribe((s) => (this.stations = s));
  }

  get selectedStationObj(): DispatchStation | undefined {
    return this.stations.find((s) => s.id === this.inspectedStationId);
  }

  get parcelsAtInspectedStation(): Parcel[] {
    return this.allParcels.filter((p) => p.assignedStationId === this.inspectedStationId);
  }

  reprintLabel(p: Parcel): void {
    this.reprintMessage = '';
    this.parcelService.reprintParcelLabel(p.trackingNumber).subscribe(() => {
      this.reprintMessage = `Wysłano zadanie wydruku etykiety dla przesyłki ${p.trackingNumber}.`;
    });
  }

  submitPlaceOnStation(): void {
    this.placementSuccess = '';
    this.placementError = '';

    this.parcelService
      .placeParcelOnStation(this.placementForm.trackingNumber, this.placementForm.stationId)
      .subscribe({
        next: (p) => {
          this.placementSuccess = `Umieszczono przesyłkę ${p.trackingNumber} na stanowisku ${p.assignedStationId}.`;
        },
        error: (err: Error) => {
          this.placementError = err.message;
        }
      });
  }

  onSelectReturnParcel(): void {
    const found = this.allParcels.find((p) => p.trackingNumber === this.returnAcceptForm.trackingNumber);
    if (found?.nonDeliveryReason) {
      this.returnAcceptForm.confirmedReason = found.nonDeliveryReason;
    }
  }

  submitAcceptReturnedParcel(): void {
    this.returnAcceptSuccess = '';
    this.parcelService
      .acceptUndeliveredParcelFromRoute(
        this.returnAcceptForm.trackingNumber,
        this.returnAcceptForm.confirmedReason
      )
      .subscribe((updated) => {
        this.returnAcceptSuccess = `Przyjęto zwrot przesyłki ${updated.trackingNumber} na stanowisko.`;
      });
  }
}
