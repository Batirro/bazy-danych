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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule } from '@angular/material/table';
import { MatRadioModule } from '@angular/material/radio';
import { MatMenuModule } from '@angular/material/menu';
import { MatExpansionModule } from '@angular/material/expansion';
import { Employee, Parcel } from '../../core/models/domain.models';
import { ParcelService } from '../../core/services/parcel.service';
import { SortingFacilityService } from '../../core/services/sorting-facility.service';

@Component({
  selector: 'app-courier-panel',
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
    MatRadioModule,
    MatMenuModule,
    MatExpansionModule
  ],
  template: `
    <div class="page-container">
      <div class="module-header">
        <div>
          <h1>
            <mat-icon color="primary">local_shipping</mat-icon>
            Panel kuriera
          </h1>
          <p>Dzienny plan pracy: załadunek ze stanowiska, lista przewozowa, trasa doręczeń i rozliczenie</p>
        </div>

        <mat-form-field appearance="outline" class="courier-picker">
          <mat-label>Profil kuriera</mat-label>
          <mat-select [(ngModel)]="activeCourierId" (selectionChange)="onCourierChanged()">
            <mat-option *ngFor="let c of couriers" [value]="c.id">
              {{ c.fullName }} (Rejon: {{ c.assignedRegionId }})
            </mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Pasek zakładek/podstron kuriera -->
      <div class="subpage-nav">
        <a mat-stroked-button routerLink="/kurier/zaladunek" routerLinkActive="sub-active">
          <mat-icon>shopping_cart_checkout</mat-icon>
          1. Załadunek ze stanowiska
        </a>
        <a mat-stroked-button routerLink="/kurier/lista-przewozowa" routerLinkActive="sub-active">
          <mat-icon>description</mat-icon>
          2. Lista przewozowa
        </a>
        <a mat-stroked-button routerLink="/kurier/trasa" routerLinkActive="sub-active">
          <mat-icon>alt_route</mat-icon>
          3. Trasa doręczeń
        </a>
        <a mat-stroked-button routerLink="/kurier/doreczenie" routerLinkActive="sub-active">
          <mat-icon>task_alt</mat-icon>
          4. Wydanie przesyłki
        </a>
        <a mat-stroked-button routerLink="/kurier/zwroty" routerLinkActive="sub-active">
          <mat-icon>keyboard_return</mat-icon>
          5. Rozliczenie zwrotów
        </a>
      </div>

      <!-- 1. ZAŁADUNEK ZE STANOWISKA -->
      <ng-container *ngIf="activeSection === 'zaladunek'">
        <mat-card class="clean-card">
          <div class="card-header-flex">
            <div>
              <mat-card-title>Załadunek przesyłek na stanowisku wydawczym</mat-card-title>
              <mat-card-subtitle>
                Pobierz paczki ze stanowiska do swojego pojazdu. Wybierz paczki z listy lub skorzystaj ze skanera etykiet.
              </mat-card-subtitle>
            </div>

            <button mat-stroked-button [matMenuTriggerFor]="pickupModeMenu">
              Tryb: {{ pickupScanMode ? 'Skanowanie etykiety' : 'Wybór z listy' }}
              <mat-icon>expand_more</mat-icon>
            </button>
            <mat-menu #pickupModeMenu="matMenu">
              <button mat-menu-item (click)="pickupScanMode = false">
                <span>Wybór z listy gotowych paczek</span>
              </button>
              <button mat-menu-item (click)="pickupScanMode = true">
                <span>Skaner kodów kreskowych</span>
              </button>
            </mat-menu>
          </div>

          <mat-card-content>
            <div class="form-stack">
              <ng-container *ngIf="!pickupScanMode">
                <div class="checkbox-list-box" *ngIf="parcelsAvailableForPickup.length > 0; else noPickupParcels">
                  <div *ngFor="let p of parcelsAvailableForPickup" class="check-item">
                    <mat-checkbox [(ngModel)]="selectedForPickup[p.trackingNumber]">
                      <strong>{{ p.trackingNumber }}</strong> – {{ p.deliveryAddress }} (Gabaryt {{ p.dimensions }}, {{ p.weightKg }} kg)
                    </mat-checkbox>
                  </div>
                </div>
                <ng-template #noPickupParcels>
                  <div class="alert-box alert-info">
                    <mat-icon>info</mat-icon>
                    <div>Brak nowych przesyłek oczekujących na stanowiskach wydawczych do pobrania.</div>
                  </div>
                </ng-template>

                <div class="actions-bar" *ngIf="parcelsAvailableForPickup.length > 0">
                  <button mat-flat-button color="primary" (click)="submitBulkPickup()">
                    <mat-icon>shopping_cart_checkout</mat-icon>
                    Załaduj zaznaczone przesyłki
                  </button>
                </div>
              </ng-container>

              <ng-container *ngIf="pickupScanMode">
                <div class="form-row">
                  <mat-form-field appearance="outline">
                    <mat-label>Zeskanuj kod etykiety paczki</mat-label>
                    <input
                      matInput
                      [(ngModel)]="singleScanPickupInput"
                      placeholder="np. PL-2026-1004"
                      (keyup.enter)="submitSingleScanPickup()"
                    />
                    <mat-icon matSuffix>qr_code_scanner</mat-icon>
                  </mat-form-field>
                </div>
                <div class="actions-bar">
                  <button mat-flat-button color="primary" (click)="submitSingleScanPickup()">
                    <mat-icon>qr_code_scanner</mat-icon>
                    Zatwierdź skanowanie i pobierz
                  </button>
                </div>
              </ng-container>

              <div *ngIf="pickupSuccessMsg" class="alert-box alert-success">
                <mat-icon>check_circle</mat-icon>
                <div>{{ pickupSuccessMsg }}</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </ng-container>

      <!-- 2. LISTA PRZEWOZOWA -->
      <ng-container *ngIf="activeSection === 'lista-przewozowa'">
        <mat-card class="clean-card">
          <div class="card-header-flex">
            <div>
              <mat-card-title>Lista przewozowa kuriera</mat-card-title>
              <mat-card-subtitle>
                Wykaz przesyłek przypisanych do kuriera <strong>{{ activeCourierName }}</strong> na dany dzień ({{ waybillDate }}).
              </mat-card-subtitle>
            </div>

            <div class="actions-bar" style="margin-top: 0;">
              <button mat-flat-button color="primary" (click)="generateWaybill()">
                <mat-icon>refresh</mat-icon>
                Odśwież
              </button>
              <button mat-stroked-button (click)="printWaybill()">
                <mat-icon>print</mat-icon>
                Drukuj listę przewozową
              </button>
            </div>
          </div>

          <mat-card-content>
            <div *ngIf="courierAssignedParcels.length === 0" class="alert-box alert-info">
              <mat-icon>info</mat-icon>
              <div>Nie masz jeszcze przypisanych paczek na ten dzień. Przejdź do zakładki Załadunek, aby pobrać paczki ze stanowiska.</div>
            </div>

            <table mat-table [dataSource]="courierAssignedParcels" class="full-width" *ngIf="courierAssignedParcels.length > 0">
              <ng-container matColumnDef="trackingNumber">
                <th mat-header-cell *matHeaderCellDef>Nr przesyłki</th>
                <td mat-cell *matCellDef="let p"><strong>{{ p.trackingNumber }}</strong></td>
              </ng-container>

              <ng-container matColumnDef="recipient">
                <th mat-header-cell *matHeaderCellDef>Odbiorca</th>
                <td mat-cell *matCellDef="let p">{{ p.recipientName }} ({{ p.recipientPhone }})</td>
              </ng-container>

              <ng-container matColumnDef="address">
                <th mat-header-cell *matHeaderCellDef>Adres doręczenia</th>
                <td mat-cell *matCellDef="let p">{{ p.deliveryAddress }}</td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let p">
                  <span
                    class="status-badge"
                    [ngClass]="p.status === 'Doręczona' ? 'status-delivered' : 'status-in-delivery'"
                  >
                    {{ p.status }}
                  </span>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="['trackingNumber', 'recipient', 'address', 'status']"></tr>
              <tr mat-row *matRowDef="let row; columns: ['trackingNumber', 'recipient', 'address', 'status']"></tr>
            </table>
          </mat-card-content>
        </mat-card>
      </ng-container>

      <!-- 3. TRASA DORĘCZEŃ -->
      <ng-container *ngIf="activeSection === 'trasa'">
        <mat-card class="clean-card">
          <div class="card-header-flex">
            <div>
              <mat-card-title>Zoptymalizowana trasa doręczeń</mat-card-title>
              <mat-card-subtitle>
                Przeglądaj harmonogram punktów stopu. Rozwiń punkt, aby zobaczyć dokładny adres, telefon i wskazówki dojazdu.
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

            <div *ngIf="courierTasks.length === 0" class="alert-box alert-info">
              <mat-icon>info</mat-icon>
              <div>Brak zadań doręczeniowych dla wybranego kuriera. Pobierz paczki w zakładce Załadunek.</div>
            </div>

            <mat-accordion class="stops-accordion" *ngIf="courierTasks.length > 0">
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

                  <div class="notes-banner" *ngIf="p.deliveryNotes">
                    <mat-icon>info_outline</mat-icon>
                    <div>
                      <strong>Wskazówki doręczenia:</strong> {{ p.deliveryNotes }}
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
                    <button
                      mat-stroked-button
                      color="warn"
                      (click)="goToReturnParcel(p)"
                      [disabled]="p.status === 'Doręczona'"
                    >
                      <mat-icon>keyboard_return</mat-icon>
                      Zgłoś brak doręczenia
                    </button>
                  </div>
                </div>
              </mat-expansion-panel>
            </mat-accordion>
          </mat-card-content>
        </mat-card>
      </ng-container>

      <!-- 4. WYDANIE PRZESYŁKI / POTWIERDZENIE DORĘCZENIA -->
      <ng-container *ngIf="activeSection === 'doreczenie'">
        <mat-card class="clean-card" *ngIf="selectedParcel; else selectParcelPrompt">
          <mat-card-header>
            <mat-card-title>Wydanie przesyłki odbiorcy</mat-card-title>
            <mat-card-subtitle>
              Potwierdź odbiór przesyłki <strong>{{ selectedParcel.trackingNumber }}</strong> podpisem odbiorcy na ekranie lub jednorazowym kodem PIN.
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="form-stack">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Wybierz doręczaną przesyłkę</mat-label>
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
                  <mat-label>Imię i nazwisko osoby odbierającej</mat-label>
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
                  <mat-label>Wpisz kod odbioru PIN</mat-label>
                  <input matInput [(ngModel)]="pickupCodeInput" placeholder="6-cyfrowy kod PIN" />
                  <mat-icon matSuffix>pin</mat-icon>
                </mat-form-field>
              </div>

              <div class="actions-bar">
                <button mat-flat-button color="primary" (click)="submitConfirmDelivery()">
                  <mat-icon>task_alt</mat-icon>
                  Zatwierdź doręczenie
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

        <ng-template #selectParcelPrompt>
          <mat-card class="clean-card">
            <mat-card-content>
              <div class="alert-box alert-info">
                <mat-icon>info</mat-icon>
                <div>Wybierz przesyłkę z trasy, aby zarejestrować jej doręczenie.</div>
              </div>
            </mat-card-content>
          </mat-card>
        </ng-template>
      </ng-container>

      <!-- 5. ROZLICZENIE / ZDAWANIE NIEDORĘCZONYCH PACZEK -->
      <ng-container *ngIf="activeSection === 'zwroty'">
        <mat-card class="clean-card">
          <mat-card-header>
            <mat-card-title>Zdanie niedoręczonych przesyłek na sortowni</mat-card-title>
            <mat-card-subtitle>
              Po powrocie z trasy wskaż przesyłki, których nie udało się doręczyć, i podaj powód braku odbioru.
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="form-stack">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Wybierz niedoręczoną przesyłkę z trasy</mat-label>
                <mat-select [(ngModel)]="courierReturnForm.trackingNumber">
                  <mat-option *ngFor="let p of undeliveredCourierParcels" [value]="p.trackingNumber">
                    {{ p.trackingNumber }} – {{ p.recipientName }} ({{ p.deliveryAddress }}) [{{ p.status }}]
                  </mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Powód braku doręczenia</mat-label>
                <mat-select [(ngModel)]="courierReturnForm.reason">
                  <mat-option value="Nieobecność odbiorcy pod wskazanym adresem">
                    Nieobecność odbiorcy pod wskazanym adresem
                  </mat-option>
                  <mat-option value="Odmowa przyjęcia przesyłki przez odbiorcę">
                    Odmowa przyjęcia przesyłki przez odbiorcę
                  </mat-option>
                  <mat-option value="Błędny adres doręczenia / brak dostępu do posesji">
                    Błędny adres doręczenia / brak dostępu do posesji
                  </mat-option>
                </mat-select>
              </mat-form-field>

              <div class="actions-bar">
                <button mat-flat-button color="warn" (click)="submitCourierReturnParcel()">
                  <mat-icon>keyboard_return</mat-icon>
                  Zgłoś paczkę do zdania na sortowni
                </button>
              </div>

              <div *ngIf="courierReturnMsg" class="alert-box alert-success">
                <mat-icon>check_circle</mat-icon>
                <div>{{ courierReturnMsg }}</div>
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
      min-width: 280px;
    }
    .card-header-flex {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 20px;
    }
    .checkbox-list-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
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
export class CourierPanelComponent implements OnInit {
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

  // 1. Załadunek
  pickupScanMode = false;
  selectedForPickup: Record<string, boolean> = { 'PL-2026-1004': true };
  singleScanPickupInput = 'PL-2026-1004';
  pickupSuccessMsg = '';

  // 2. Lista przewozowa
  waybillDate = new Date().toLocaleString('pl-PL');

  // 3. Trasa
  routeGeneratedMessage = '';

  // 4. Doręczenie
  confirmationMode: 'SIGNATURE' | 'PICKUP_CODE' = 'SIGNATURE';
  signatureInput = 'Marek Lewandowski';
  pickupCodeInput = '482910';
  deliveryConfirmSuccess = '';
  deliveryConfirmError = '';

  // 5. Zwroty
  courierReturnForm = {
    trackingNumber: 'PL-2026-1005',
    reason: 'Nieobecność odbiorcy pod wskazanym adresem'
  };
  courierReturnMsg = '';

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

  get activeCourierName(): string {
    return this.couriers.find((c) => c.id === this.activeCourierId)?.fullName ?? 'Kurier';
  }

  get parcelsAvailableForPickup(): Parcel[] {
    return this.allParcels.filter(
      (p) =>
        p.status === 'Oczekuje na stanowisku wydawczym' ||
        p.status === 'Posortowano' ||
        p.status === 'Przyjęto w sortowni'
    );
  }

  get courierAssignedParcels(): Parcel[] {
    return this.allParcels.filter((p) => p.assignedCourierId === this.activeCourierId);
  }

  get undeliveredCourierParcels(): Parcel[] {
    return this.courierAssignedParcels.filter((p) => p.status !== 'Doręczona');
  }

  onCourierChanged(): void {
    this.refreshRouteList();
    this.deliveryConfirmSuccess = '';
    this.deliveryConfirmError = '';
    this.pickupSuccessMsg = '';
    this.courierReturnMsg = '';
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

  // 1. Załadunek
  submitBulkPickup(): void {
    this.pickupSuccessMsg = '';
    const chosen = Object.keys(this.selectedForPickup).filter((k) => this.selectedForPickup[k]);
    if (chosen.length === 0) return;

    this.parcelService
      .pickupParcelsFromStationByCourier(chosen, this.activeCourierId, this.activeCourierName, false)
      .subscribe((list) => {
        this.pickupSuccessMsg = `Pobrano ze stanowiska ${list.length} przesyłek (${this.activeCourierName}).`;
      });
  }

  submitSingleScanPickup(): void {
    this.pickupSuccessMsg = '';
    if (!this.singleScanPickupInput.trim()) return;

    this.parcelService
      .pickupParcelsFromStationByCourier(
        [this.singleScanPickupInput],
        this.activeCourierId,
        this.activeCourierName,
        true
      )
      .subscribe((list) => {
        this.pickupSuccessMsg = `Zeskanowano etykietę i pobrano przesyłkę ${list[0].trackingNumber}.`;
        this.singleScanPickupInput = '';
      });
  }

  // 2. Lista przewozowa
  generateWaybill(): void {
    this.waybillDate = new Date().toLocaleString('pl-PL');
  }

  printWaybill(): void {
    window.print();
  }

  // 3. Trasa
  selectTaskForAddressInspection(p: Parcel): void {
    this.selectedParcel = p;
    this.signatureInput = p.recipientName;
    if (p.pickupCode) {
      this.pickupCodeInput = p.pickupCode;
    }
    this.deliveryConfirmSuccess = '';
    this.deliveryConfirmError = '';
  }

  submitGenerateRoute(): void {
    this.parcelService.optimizeAndGenerateCourierRoute(this.activeCourierId).subscribe((ordered) => {
      this.courierTasks = ordered;
      this.routeGeneratedMessage = `Zoptymalizowano trasę rozwożenia (${ordered.length} punktów doręczeń).`;
    });
  }

  goToConfirmDelivery(p: Parcel): void {
    this.selectTaskForAddressInspection(p);
    this.router.navigate(['/kurier/doreczenie']);
  }

  goToReturnParcel(p: Parcel): void {
    this.courierReturnForm.trackingNumber = p.trackingNumber;
    this.router.navigate(['/kurier/zwroty']);
  }

  // 4. Doręczenie
  onChangeSelectedTracking(trackingNumber: string): void {
    const found = this.courierTasks.find((t) => t.trackingNumber === trackingNumber);
    if (found) {
      this.selectTaskForAddressInspection(found);
    }
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

  // 5. Zwroty
  submitCourierReturnParcel(): void {
    this.courierReturnMsg = '';
    this.parcelService
      .reportUndeliveredParcelByCourier(this.courierReturnForm.trackingNumber, this.courierReturnForm.reason)
      .subscribe((p) => {
        this.courierReturnMsg = `Zgłoszono zwrot przesyłki ${p.trackingNumber} na sortownię.`;
      });
  }
}
