import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from './core/services/auth.service';
import { Employee } from './core/models/domain.models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatSnackBarModule
  ],
  template: `
    <mat-toolbar class="app-toolbar no-print">
      <div class="toolbar-inner">
        <a class="toolbar-brand" routerLink="/panel-klienta">
          <div class="brand-icon">
            <mat-icon>local_shipping</mat-icon>
          </div>
          <div class="brand-titles">
            <span class="main-title">Outpost</span>
            <span class="sub-title">System Logistyczny i Śledzenie Przesyłek</span>
          </div>
        </a>

        <nav class="module-nav">
          <a mat-button routerLink="/panel-klienta" routerLinkActive="active-link">
            <mat-icon>search</mat-icon>
            Śledzenie przesyłek
          </a>

          <button mat-button [matMenuTriggerFor]="adminMenu" [class.active-link]="isRouteActive('/administracja')">
            <mat-icon>admin_panel_settings</mat-icon>
            Administracja
            <mat-icon class="chevron">expand_more</mat-icon>
          </button>
          <mat-menu #adminMenu="matMenu">
            <a mat-menu-item routerLink="/administracja/konta">
              <mat-icon>manage_accounts</mat-icon>
              <span>Konta pracowników</span>
            </a>
            <a mat-menu-item routerLink="/administracja/kopia-zapasowa">
              <mat-icon>backup</mat-icon>
              <span>Kopia zapasowa bazy danych</span>
            </a>
            <mat-divider></mat-divider>
            <a mat-menu-item routerLink="/administracja/stanowiska">
              <mat-icon>add_business</mat-icon>
              <span>Nowe stanowisko wydawcze</span>
            </a>
            <a mat-menu-item routerLink="/administracja/przypisz-rejon">
              <mat-icon>link</mat-icon>
              <span>Przypisanie rejonów</span>
            </a>
            <a mat-menu-item routerLink="/administracja/raporty">
              <mat-icon>assessment</mat-icon>
              <span>Raporty operacyjne</span>
            </a>
          </mat-menu>

          <button mat-button [matMenuTriggerFor]="sortingMenu" [class.active-link]="isRouteActive('/sortownia')">
            <mat-icon>warehouse</mat-icon>
            Sortownia
            <mat-icon class="chevron">expand_more</mat-icon>
          </button>
          <mat-menu #sortingMenu="matMenu">
            <a mat-menu-item routerLink="/sortownia/wyszukiwanie">
              <mat-icon>manage_search</mat-icon>
              <span>Ewidencja przesyłek</span>
            </a>
            <a mat-menu-item routerLink="/sortownia/rejestracja">
              <mat-icon>add_box</mat-icon>
              <span>Rejestracja przesyłki</span>
            </a>
            <a mat-menu-item routerLink="/sortownia/tasma">
              <mat-icon>qr_code_scanner</mat-icon>
              <span>Taśma sortownicza</span>
            </a>
            <mat-divider></mat-divider>
            <a mat-menu-item routerLink="/sortownia/zestawienia">
              <mat-icon>analytics</mat-icon>
              <span>Wydajność sortowni</span>
            </a>
            <a mat-menu-item routerLink="/sortownia/rejony">
              <mat-icon>map</mat-icon>
              <span>Konfiguracja rejonów</span>
            </a>
            <a mat-menu-item routerLink="/sortownia/personel">
              <mat-icon>badge</mat-icon>
              <span>Personel oddziału</span>
            </a>
          </mat-menu>

          <button mat-button [matMenuTriggerFor]="stationMenu" [class.active-link]="isRouteActive('/stanowisko-wydawcze')">
            <mat-icon>dock</mat-icon>
            Stanowiska wydawcze
            <mat-icon class="chevron">expand_more</mat-icon>
          </button>
          <mat-menu #stationMenu="matMenu">
            <a mat-menu-item routerLink="/stanowisko-wydawcze/stan">
              <mat-icon>inventory</mat-icon>
              <span>Stan stanowiska i etykiety</span>
            </a>
            <a mat-menu-item routerLink="/stanowisko-wydawcze/umiesc">
              <mat-icon>move_to_inbox</mat-icon>
              <span>Umieść przesyłkę na stanowisku</span>
            </a>
            <a mat-menu-item routerLink="/stanowisko-wydawcze/zwroty-sortownia">
              <mat-icon>assignment_returned</mat-icon>
              <span>Przyjęcie zwrotu z trasy</span>
            </a>
          </mat-menu>

          <!-- DEDYKOWANY INTERFEJS KURIERA -->
          <button mat-button [matMenuTriggerFor]="courierMenu" [class.active-link]="isRouteActive('/kurier') || isRouteActive('/doreczenia')">
            <mat-icon>local_shipping</mat-icon>
            Panel kuriera
            <mat-icon class="chevron">expand_more</mat-icon>
          </button>
          <mat-menu #courierMenu="matMenu">
            <a mat-menu-item routerLink="/kurier/zaladunek">
              <mat-icon>shopping_cart_checkout</mat-icon>
              <span>Załadunek ze stanowiska</span>
            </a>
            <a mat-menu-item routerLink="/kurier/lista-przewozowa">
              <mat-icon>description</mat-icon>
              <span>Lista przewozowa</span>
            </a>
            <a mat-menu-item routerLink="/kurier/trasa">
              <mat-icon>alt_route</mat-icon>
              <span>Trasa doręczeń</span>
            </a>
            <a mat-menu-item routerLink="/kurier/doreczenie">
              <mat-icon>task_alt</mat-icon>
              <span>Wydanie przesyłki odbiorcy</span>
            </a>
            <mat-divider></mat-divider>
            <a mat-menu-item routerLink="/kurier/zwroty">
              <mat-icon>keyboard_return</mat-icon>
              <span>Zdanie niedoręczonych paczek</span>
            </a>
          </mat-menu>
        </nav>

        <div class="auth-controls">
          <ng-container *ngIf="currentEmployee; else notLoggedInBlock">
            <button mat-stroked-button [matMenuTriggerFor]="userMenu" class="user-menu-btn">
              <mat-icon>account_circle</mat-icon>
              <span>{{ currentEmployee.fullName }}</span>
              <mat-icon class="chevron">expand_more</mat-icon>
            </button>
            <mat-menu #userMenu="matMenu">
              <div class="user-menu-header">
                <strong>{{ currentEmployee.fullName }}</strong>
                <span>{{ currentEmployee.email }}</span>
              </div>
              <mat-divider></mat-divider>
              <a mat-menu-item routerLink="/logowanie">
                <mat-icon>swap_horiz</mat-icon>
                <span>Przełącz użytkownika</span>
              </a>
              <button mat-menu-item (click)="logoutEmployee()">
                <mat-icon color="warn">logout</mat-icon>
                <span>Wyloguj się</span>
              </button>
            </mat-menu>
          </ng-container>

          <ng-template #notLoggedInBlock>
            <a mat-flat-button color="primary" routerLink="/logowanie">
              <mat-icon>login</mat-icon>
              Strefa pracownika
            </a>
          </ng-template>
        </div>
      </div>
    </mat-toolbar>

    <main class="main-view">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .app-toolbar {
      background: #ffffff;
      color: #0f172a;
      border-bottom: 1px solid #e2e8f0;
      height: auto;
      min-height: 72px;
      padding: 0 24px;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .toolbar-inner {
      max-width: 1280px;
      width: 100%;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      padding: 10px 0;
    }
    .toolbar-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: inherit;

      .brand-icon {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        background: #2563eb;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .brand-titles {
        display: flex;
        flex-direction: column;
        line-height: 1.2;
        .main-title {
          font-weight: 700;
          font-size: 1.15rem;
          color: #0f172a;
        }
        .sub-title {
          font-size: 0.72rem;
          color: #64748b;
        }
      }
    }
    .module-nav {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      align-items: center;

      a, button {
        color: #334155;
        font-weight: 500;
        border-radius: 8px;
        padding: 0 14px;
        height: 40px;

        &.active-link {
          background: #eff6ff;
          color: #1d4ed8;
          font-weight: 600;
        }
      }

      .chevron {
        font-size: 18px;
        width: 18px;
        height: 18px;
        margin-left: 2px;
        opacity: 0.7;
      }
    }
    .user-menu-btn {
      border-radius: 999px !important;
      border-color: #cbd5e1 !important;
      color: #0f172a !important;
    }
    .user-menu-header {
      padding: 10px 16px;
      display: flex;
      flex-direction: column;
      font-size: 0.85rem;
      span {
        color: #64748b;
        font-size: 0.78rem;
      }
    }
    .main-view {
      min-height: calc(100vh - 73px);
    }
  `]
})
export class AppComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  currentEmployee: Employee | null = null;

  ngOnInit(): void {
    this.authService.currentEmployee$.subscribe((emp) => {
      this.currentEmployee = emp;
    });
  }

  isRouteActive(prefix: string): boolean {
    return this.router.url.startsWith(prefix);
  }

  logoutEmployee(): void {
    this.authService.logout().subscribe(() => {
      this.snackBar.open('Zostałeś pomyślnie wylogowany z systemu.', 'OK', {
        duration: 3500
      });
      this.router.navigate(['/logowanie']);
    });
  }
}
