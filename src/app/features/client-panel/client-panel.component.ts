import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Parcel, PickupPoint } from '../../core/models/domain.models';
import { ParcelService } from '../../core/services/parcel.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-client-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatCheckboxModule,
    MatMenuModule,
    MatExpansionModule,
    MatDividerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="page-container narrow">
      <div class="module-header">
        <div>
          <h1>
            <mat-icon color="primary">local_shipping</mat-icon>
            Śledzenie przesyłek
          </h1>
          <p>Sprawdź status paczki lub zarządzaj doręczeniem</p>
        </div>

        <div class="header-tools">
          <button mat-stroked-button [matMenuTriggerFor]="quickParcelsMenu">
            <mat-icon>inventory_2</mat-icon>
            Ostatnie przesyłki
            <mat-icon>expand_more</mat-icon>
          </button>
          <mat-menu #quickParcelsMenu="matMenu">
            <button mat-menu-item (click)="prefillDemo('PL-2026-1001')">
              <span>PL-2026-1001 – Wrocław (W sortowni)</span>
            </button>
            <button mat-menu-item (click)="prefillDemo('PL-2026-1002')">
              <span>PL-2026-1002 – Wrocław (W doręczeniu)</span>
            </button>
            <button mat-menu-item (click)="prefillDemo('PL-2026-1003')">
              <span>PL-2026-1003 – Wrocław (Przesyłka dłużycowa 34 kg)</span>
            </button>
          </mat-menu>
        </div>
      </div>

      <!-- Karta 1: Wyszukiwanie przesyłki -->
      <mat-card class="clean-card">
        <mat-card-header>
          <mat-card-title>Gdzie jest moja przesyłka?</mat-card-title>
          <mat-card-subtitle>
            Wprowadź numer przewozowy paczki, aby wyświetlić jej aktualny status.
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <div class="search-bar-row">
            <mat-form-field appearance="outline" class="search-input">
              <mat-label>Numer przesyłki</mat-label>
              <input
                matInput
                [(ngModel)]="trackingInput"
                placeholder="np. PL-2026-1001"
                (keyup.enter)="searchParcel()"
              />
              <mat-icon matSuffix>qr_code_scanner</mat-icon>
            </mat-form-field>

            <button mat-flat-button color="primary" class="search-btn" (click)="searchParcel()">
              <mat-icon>search</mat-icon>
              Szukaj
            </button>
          </div>

          <div *ngIf="searchError" class="alert-box alert-error">
            <mat-icon>error_outline</mat-icon>
            <div>{{ searchError }}</div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Karta 2: Wynik wyszukiwania i akcje -->
      <mat-card *ngIf="currentParcel" class="clean-card">
        <div class="card-top-bar">
          <div>
            <h2 class="parcel-title">Przesyłka {{ currentParcel.trackingNumber }}</h2>
          </div>

          <div class="top-actions">
            <span class="status-badge status-in-delivery">{{ currentParcel.status }}</span>

            <ng-container *ngIf="isCurrentParcelVerified">
              <button mat-flat-button color="primary" [matMenuTriggerFor]="manageParcelMenu">
                <mat-icon>tune</mat-icon>
                Zarządzaj doręczeniem
                <mat-icon>expand_more</mat-icon>
              </button>
              <mat-menu #manageParcelMenu="matMenu">
                <button mat-menu-item (click)="activeClientAction = 'ADDRESS'">
                  <mat-icon>edit_location_alt</mat-icon>
                  <span>Zmień adres doręczenia</span>
                </button>
                <button mat-menu-item (click)="activeClientAction = 'REDIRECT'">
                  <mat-icon>alt_route</mat-icon>
                  <span>Przekieruj do punktu odbioru / automatu</span>
                </button>
                <button mat-menu-item (click)="activeClientAction = 'PICKUP_CODE'">
                  <mat-icon>qr_code_2</mat-icon>
                  <span>Kod odbioru (PIN / QR)</span>
                </button>
                <mat-divider></mat-divider>
                <button mat-menu-item (click)="resetToGuest()">
                  <mat-icon color="warn">lock</mat-icon>
                  <span>Zakończ autoryzację</span>
                </button>
              </mat-menu>
            </ng-container>
          </div>
        </div>

        <mat-card-content>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Aktualna lokalizacja</span>
              <strong>{{ currentParcel.currentLocation }}</strong>
            </div>
            <div class="info-item">
              <span class="info-label">Miejscowość docelowa</span>
              <strong>{{ currentParcel.postalCode }} {{ currentParcel.city }}</strong>
            </div>
            <div class="info-item">
              <span class="info-label">Parametry paczki</span>
              <strong>Gabaryt {{ currentParcel.dimensions }} ({{ currentParcel.weightKg }} kg)</strong>
            </div>
          </div>

          <!-- Autoryzacja odbiorcy -->
          <div *ngIf="!isCurrentParcelVerified" class="guest-prompt-box">
            <div class="guest-prompt-header">
              <div>
                <strong>Zarządzanie przesyłką i pełne dane adresowe</strong>
                <p>Potwierdź tożsamość jednorazowym kodem wysłanym na adres e-mail odbiorcy, aby zmienić adres, przekierować paczkę lub pobrać kod odbioru.</p>
              </div>
              <button
                mat-flat-button
                color="primary"
                (click)="showVerificationPanel = !showVerificationPanel"
              >
                <mat-icon>verified_user</mat-icon>
                {{ showVerificationPanel ? 'Zwiń' : 'Autoryzuj dostęp' }}
              </button>
            </div>

            <div *ngIf="showVerificationPanel" class="verification-panel">
              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Adres e-mail odbiorcy</mat-label>
                  <input matInput [(ngModel)]="verificationEmail" />
                </mat-form-field>
                <div class="step-btn-col">
                  <button mat-stroked-button color="primary" (click)="sendVerificationCode()">
                    <mat-icon>mail</mat-icon>
                    Wyślij kod weryfikacyjny
                  </button>
                </div>
              </div>

              <div *ngIf="otpSentInfo" class="alert-box alert-info">
                <mat-icon>mark_email_read</mat-icon>
                <div>
                  Kod weryfikacyjny został wysłany na adres <strong>{{ otpSentInfo.email }}</strong> (Kod: <strong>{{ otpSentInfo.codeDemo }}</strong>).
                </div>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Jednorazowy kod weryfikacyjny</mat-label>
                  <input matInput [(ngModel)]="verificationCodeInput" placeholder="Wpisz 6-cyfrowy kod" />
                </mat-form-field>
                <div class="step-btn-col">
                  <button mat-flat-button color="primary" (click)="confirmVerificationCode()">
                    <mat-icon>check</mat-icon>
                    Potwierdź kod
                  </button>
                </div>
              </div>

              <div *ngIf="verificationError" class="alert-box alert-error">
                <mat-icon>warning</mat-icon>
                <div>{{ verificationError }}</div>
              </div>
            </div>
          </div>

          <!-- Widok autoryzowanego odbiorcy -->
          <ng-container *ngIf="isCurrentParcelVerified">
            <div class="verified-section">
              <div class="info-grid verified-grid">
                <div class="info-item">
                  <span class="info-label">Nadawca</span>
                  <strong>{{ currentParcel.senderName }} ({{ currentParcel.senderPhone }})</strong>
                </div>
                <div class="info-item">
                  <span class="info-label">Odbiorca</span>
                  <strong>{{ currentParcel.recipientName }} ({{ currentParcel.recipientPhone }})</strong>
                </div>
                <div class="info-item">
                  <span class="info-label">Adres doręczenia</span>
                  <strong>{{ currentParcel.deliveryAddress }}</strong>
                </div>
              </div>

              <div *ngIf="activeClientAction === 'ADDRESS'" class="focused-action-panel">
                <div class="panel-header">
                  <h3>Zmiana adresu doręczenia</h3>
                  <button mat-icon-button (click)="activeClientAction = null">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>

                <div class="form-stack">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Ulica i numer budynku / lokalu</mat-label>
                    <input matInput [(ngModel)]="newAddressStreet" />
                  </mat-form-field>
                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Kod pocztowy</mat-label>
                      <input matInput [(ngModel)]="newAddressPostal" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Miejscowość</mat-label>
                      <input matInput [(ngModel)]="newAddressCity" />
                    </mat-form-field>
                  </div>
                  <div class="actions-bar">
                    <button mat-flat-button color="primary" (click)="submitAddressChange()">
                      <mat-icon>save</mat-icon>
                      Zapisz nowy adres
                    </button>
                  </div>
                </div>

                <div *ngIf="addressChangeError" class="alert-box alert-error">
                  <mat-icon>block</mat-icon>
                  <div>{{ addressChangeError }}</div>
                </div>
                <div *ngIf="addressChangeSuccess" class="alert-box alert-success">
                  <mat-icon>check_circle</mat-icon>
                  <div>{{ addressChangeSuccess }}</div>
                </div>
              </div>

              <div *ngIf="activeClientAction === 'REDIRECT'" class="focused-action-panel">
                <div class="panel-header">
                  <h3>Przekierowanie do punktu odbioru lub automatu paczkowego</h3>
                  <button mat-icon-button (click)="activeClientAction = null">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>

                <div class="form-stack">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Punkt odbioru / Automat paczkowy</mat-label>
                    <mat-select [(ngModel)]="selectedPickupPointId">
                      <mat-option *ngFor="let pt of pickupPoints" [value]="pt.id">
                        {{ pt.name }} – {{ pt.address }} (Maks. gabaryty: {{ pt.maxDimensions.join(', ') }})
                      </mat-option>
                    </mat-select>
                  </mat-form-field>
                  <div class="actions-bar">
                    <button mat-flat-button color="primary" (click)="submitRedirectParcel()">
                      <mat-icon>alt_route</mat-icon>
                      Przekieruj przesyłkę
                    </button>
                  </div>
                </div>

                <div *ngIf="redirectError" class="alert-box alert-error">
                  <mat-icon>error</mat-icon>
                  <div>{{ redirectError }}</div>
                </div>
                <div *ngIf="redirectSuccess" class="alert-box alert-success">
                  <mat-icon>check_circle</mat-icon>
                  <div>{{ redirectSuccess }}</div>
                </div>
              </div>

              <div *ngIf="activeClientAction === 'PICKUP_CODE'" class="focused-action-panel">
                <div class="panel-header">
                  <h3>Jednorazowy kod odbioru (PIN / QR)</h3>
                  <button mat-icon-button (click)="activeClientAction = null">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>

                <div class="form-stack">
                  <mat-checkbox [(ngModel)]="sendPickupCodeSms">
                    Wyślij kod również wiadomością SMS na numer {{ currentParcel.recipientPhone }}
                  </mat-checkbox>
                  <div class="actions-bar">
                    <button mat-flat-button color="primary" (click)="submitGeneratePickupCode()">
                      <mat-icon>qr_code_2</mat-icon>
                      Wygeneruj kod odbioru
                    </button>
                  </div>
                </div>

                <div *ngIf="pickupCodeError" class="alert-box alert-error">
                  <mat-icon>info</mat-icon>
                  <div>{{ pickupCodeError }}</div>
                </div>

                <div *ngIf="currentParcel.pickupCode" class="qr-box-clean">
                  <mat-icon class="qr-icon">qr_code_2</mat-icon>
                  <div>
                    <div class="pin-caption">Twój kod PIN odbioru:</div>
                    <div class="pin-large">{{ currentParcel.pickupCode }}</div>
                    <div class="pin-sub" *ngIf="pickupCodeSmsMessage">{{ pickupCodeSmsMessage }}</div>
                  </div>
                </div>
              </div>

              <mat-accordion class="history-accordion">
                <mat-expansion-panel>
                  <mat-expansion-panel-header>
                    <mat-panel-title>
                      <mat-icon class="panel-icon">history</mat-icon>
                      Historia przesyłki ({{ currentParcel.history.length }})
                    </mat-panel-title>
                  </mat-expansion-panel-header>

                  <div class="timeline">
                    <div class="timeline-item" *ngFor="let item of currentParcel.history">
                      <div class="timeline-dot"></div>
                      <div class="timeline-content">
                        <div class="timeline-header">
                          <strong>{{ item.status }}</strong>
                          <span class="time">{{ item.timestamp }}</span>
                        </div>
                        <div class="timeline-loc">{{ item.location }}</div>
                        <div class="timeline-desc">{{ item.description }}</div>
                      </div>
                    </div>
                  </div>
                </mat-expansion-panel>
              </mat-accordion>
            </div>
          </ng-container>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .search-bar-row {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      flex-wrap: wrap;
      margin-top: 8px;

      .search-input {
        flex: 1;
        min-width: 260px;
      }
      .search-btn {
        height: 56px;
        padding: 0 28px;
        font-size: 0.98rem;
      }
    }
    .card-top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 24px;
      padding-bottom: 20px;
      border-bottom: 1px solid #f1f5f9;

      .parcel-title {
        margin: 0;
        font-size: 1.4rem;
        font-weight: 700;
      }
      .top-actions {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 24px;

      .info-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
        background: #f8fafc;
        padding: 16px 20px;
        border-radius: 10px;
        border: 1px solid #e2e8f0;

        .info-label {
          font-size: 0.8rem;
          color: #64748b;
        }
        strong {
          font-size: 0.96rem;
          color: #0f172a;
        }
      }
    }
    .verified-grid .info-item {
      background: #f0fdf4;
      border-color: #bbf7d0;
    }
    .guest-prompt-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 24px;
      margin-top: 12px;

      .guest-prompt-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;
        flex-wrap: wrap;

        p {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 0.9rem;
        }
      }
    }
    .verification-panel {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #e2e8f0;

      .step-btn-col {
        display: flex;
        align-items: center;
        gap: 10px;
        padding-bottom: 18px;
      }
    }
    .focused-action-panel {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;

      .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        h3 {
          margin: 0;
          font-size: 1.15rem;
        }
      }
    }
    .qr-box-clean {
      display: flex;
      align-items: center;
      gap: 20px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 20px;
      border-radius: 12px;
      margin-top: 20px;

      .qr-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: #0f172a;
      }
      .pin-caption {
        font-size: 0.85rem;
        color: #64748b;
      }
      .pin-large {
        font-size: 1.9rem;
        font-weight: 700;
        letter-spacing: 4px;
        color: #1d4ed8;
      }
      .pin-sub {
        font-size: 0.85rem;
        color: #15803d;
        margin-top: 4px;
      }
    }
    .history-accordion {
      display: block;
      margin-top: 20px;

      .panel-icon {
        margin-right: 10px;
        color: #64748b;
      }
    }
    .timeline {
      border-left: 2px solid #cbd5e1;
      margin: 12px 0 8px 12px;
      padding-left: 20px;
    }
    .timeline-item {
      position: relative;
      margin-bottom: 18px;
      .timeline-dot {
        position: absolute;
        left: -26px;
        top: 5px;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #2563eb;
      }
      .timeline-header {
        display: flex;
        justify-content: space-between;
        font-size: 0.92rem;
        .time {
          color: #64748b;
          font-size: 0.82rem;
        }
      }
      .timeline-loc {
        font-size: 0.82rem;
        color: #475569;
        margin: 2px 0;
      }
      .timeline-desc {
        font-size: 0.88rem;
        color: #334155;
      }
    }
  `]
})
export class ClientPanelComponent implements OnInit {
  private readonly parcelService = inject(ParcelService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  trackingInput = 'PL-2026-1001';
  currentParcel: Parcel | null = null;
  searchError = '';

  showVerificationPanel = false;
  verificationEmail = '';
  verificationCodeInput = '';
  otpSentInfo: { codeDemo: string; email: string } | null = null;
  verificationError = '';

  activeClientAction: 'ADDRESS' | 'REDIRECT' | 'PICKUP_CODE' | null = null;

  newAddressStreet = 'ul. Kościuszki 15/4';
  newAddressPostal = '50-011';
  newAddressCity = 'Wrocław';
  addressChangeError = '';
  addressChangeSuccess = '';

  pickupPoints: PickupPoint[] = [];
  selectedPickupPointId = 'PKT-01';
  redirectError = '';
  redirectSuccess = '';

  sendPickupCodeSms = true;
  pickupCodeError = '';
  pickupCodeSmsMessage = '';

  ngOnInit(): void {
    this.parcelService.pickupPoints$.subscribe((pts) => (this.pickupPoints = pts));
    this.searchParcel();
  }

  get isCurrentParcelVerified(): boolean {
    if (!this.currentParcel) return false;
    return this.authService.isClientVerifiedForParcel(this.currentParcel.trackingNumber);
  }

  prefillDemo(trackingNumber: string): void {
    this.trackingInput = trackingNumber;
    this.searchParcel();
  }

  searchParcel(): void {
    this.searchError = '';
    this.addressChangeError = '';
    this.addressChangeSuccess = '';
    this.redirectError = '';
    this.redirectSuccess = '';
    this.pickupCodeError = '';
    this.verificationError = '';
    this.otpSentInfo = null;
    this.activeClientAction = null;

    this.parcelService.getParcelByTrackingNumber(this.trackingInput).subscribe({
      next: (parcel) => {
        this.currentParcel = parcel;
        this.verificationEmail = parcel.recipientEmail;
      },
      error: (err: Error) => {
        this.currentParcel = null;
        this.searchError = err.message;
      }
    });
  }

  sendVerificationCode(): void {
    if (!this.currentParcel) return;
    this.verificationError = '';
    this.authService
      .requestClientVerificationCode(this.currentParcel.trackingNumber, this.verificationEmail)
      .subscribe({
        next: (info) => {
          this.otpSentInfo = info;
          this.verificationCodeInput = info.codeDemo;
        },
        error: (err: Error) => {
          this.verificationError = err.message;
        }
      });
  }

  confirmVerificationCode(): void {
    if (!this.currentParcel) return;
    this.verificationError = '';

    this.authService
      .verifyClientOtpCode(this.currentParcel.trackingNumber, this.verificationCodeInput)
      .subscribe({
        next: () => {
          this.showVerificationPanel = false;
          this.snackBar.open('Tożsamość została pomyślnie potwierdzona.', 'OK', { duration: 3500 });
        },
        error: (err: Error) => {
          this.verificationError = err.message;
        }
      });
  }

  resetToGuest(): void {
    if (!this.currentParcel) return;
    this.authService.revokeClientVerification(this.currentParcel.trackingNumber);
    this.activeClientAction = null;
  }

  submitAddressChange(): void {
    if (!this.currentParcel) return;
    this.addressChangeError = '';
    this.addressChangeSuccess = '';

    this.parcelService
      .changeDeliveryAddress(
        this.currentParcel.trackingNumber,
        this.newAddressStreet,
        this.newAddressPostal,
        this.newAddressCity
      )
      .subscribe({
        next: (updated) => {
          this.currentParcel = updated;
          this.addressChangeSuccess = 'Adres doręczenia został zaktualizowany.';
        },
        error: (err: Error) => {
          this.addressChangeError = err.message;
        }
      });
  }

  submitRedirectParcel(): void {
    if (!this.currentParcel) return;
    this.redirectError = '';
    this.redirectSuccess = '';

    this.parcelService
      .redirectParcelToPoint(this.currentParcel.trackingNumber, this.selectedPickupPointId)
      .subscribe({
        next: (updated) => {
          this.currentParcel = updated;
          this.redirectSuccess = `Przekierowano paczkę do punktu: ${updated.redirectedPointName}.`;
        },
        error: (err: Error) => {
          this.redirectError = err.message;
        }
      });
  }

  submitGeneratePickupCode(): void {
    if (!this.currentParcel) return;
    this.pickupCodeError = '';
    this.pickupCodeSmsMessage = '';

    this.parcelService
      .generatePickupCode(this.currentParcel.trackingNumber, this.sendPickupCodeSms)
      .subscribe({
        next: (res) => {
          if (this.currentParcel) {
            this.currentParcel.pickupCode = res.pickupCode;
          }
          if (res.smsSent) {
            this.pickupCodeSmsMessage = `Kod został wysłany SMS-em na numer ${this.currentParcel?.recipientPhone}.`;
          }
        },
        error: (err: Error) => {
          this.pickupCodeError = err.message;
        }
      });
  }
}
