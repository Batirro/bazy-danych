import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/services/auth.service';
import { Employee } from '../../core/models/domain.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule
  ],
  template: `
    <div class="page-container narrow login-wrapper">
      <mat-card class="clean-card login-card">
        <div class="card-header-flex">
          <div>
            <mat-card-title>Logowanie pracownika</mat-card-title>
            <mat-card-subtitle>
              Zaloguj się, aby uzyskać dostęp do panelu operacyjnego oddziału.
            </mat-card-subtitle>
          </div>

          <button mat-stroked-button [matMenuTriggerFor]="demoAccountsMenu">
            <mat-icon>person</mat-icon>
            Wybierz profil
            <mat-icon>expand_more</mat-icon>
          </button>
          <mat-menu #demoAccountsMenu="matMenu">
            <button mat-menu-item (click)="fillCredentials('admin', '123')">
              <span>Bartłomiej Rutkowski (Administrator)</span>
            </button>
            <button mat-menu-item (click)="fillCredentials('kierownik', '123')">
              <span>Jonasz Przybylski (Kierownik sortowni)</span>
            </button>
            <button mat-menu-item (click)="fillCredentials('sortownia', '123')">
              <span>Mateusz Janowicz (Pracownik sortowni)</span>
            </button>
            <button mat-menu-item (click)="fillCredentials('kurier', '123')">
              <span>Piotr Kowalczyk (Kurier)</span>
            </button>
            <mat-divider></mat-divider>
            <button mat-menu-item (click)="fillCredentials('zablokowany', '123')">
              <span>Tomasz Wiśniewski (Konto zablokowane)</span>
            </button>
          </mat-menu>
        </div>

        <mat-card-content>
          <div class="form-stack">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Identyfikator / Login</mat-label>
              <input matInput [(ngModel)]="loginInput" />
              <mat-icon matSuffix>badge</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Hasło</mat-label>
              <input matInput type="password" [(ngModel)]="passwordInput" (keyup.enter)="submitLogin()" />
              <mat-icon matSuffix>key</mat-icon>
            </mat-form-field>

            <button mat-flat-button color="primary" class="full-width login-btn" (click)="submitLogin()">
              <mat-icon>login</mat-icon>
              Zaloguj się
            </button>
          </div>

          <div *ngIf="loginError" class="alert-box alert-error">
            <mat-icon>error</mat-icon>
            <div>{{ loginError }}</div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-wrapper {
      display: flex;
      justify-content: center;
      padding-top: 64px;
    }
    .login-card {
      max-width: 520px;
      width: 100%;
    }
    .card-header-flex {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 24px;
    }
    .login-btn {
      height: 48px;
      font-size: 1rem;
      margin-top: 8px;
    }
  `]
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  loginInput = 'admin';
  passwordInput = '123';
  loginError = '';

  get currentEmployee(): Employee | null {
    return this.authService.currentEmployee;
  }

  fillCredentials(login: string, password: string): void {
    this.loginInput = login;
    this.passwordInput = password;
    this.loginError = '';
  }

  submitLogin(): void {
    this.loginError = '';
    this.authService.login(this.loginInput, this.passwordInput).subscribe({
      next: (emp) => {
        switch (emp.role) {
          case 'ADMIN':
            this.router.navigate(['/administracja/konta']);
            break;
          case 'MANAGER':
            this.router.navigate(['/administracja/raporty']);
            break;
          case 'SORTER':
            this.router.navigate(['/sortownia/wyszukiwanie']);
            break;
          case 'COURIER':
            this.router.navigate(['/kurier/trasa']);
            break;
        }
      },
      error: (err: Error) => {
        this.loginError = err.message;
      }
    });
  }
}
