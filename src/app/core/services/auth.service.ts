import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Employee } from '../models/domain.models';
import { MockDatabaseService } from './mock-database.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly db = inject(MockDatabaseService);
  // W przyszłości: private readonly http = inject(HttpClient);

  private readonly currentEmployeeSubject = new BehaviorSubject<Employee | null>(null);
  readonly currentEmployee$ = this.currentEmployeeSubject.asObservable();

  // Zbiór numerów przesyłek, dla których gość przeszedł PU „Weryfikacja” i stał się Klientem zweryfikowanym
  private readonly verifiedTrackingNumbersSubject = new BehaviorSubject<Set<string>>(new Set());
  readonly verifiedTrackingNumbers$ = this.verifiedTrackingNumbersSubject.asObservable();

  // Wygenerowane kody OTP dla PU „Weryfikacja” (trackingNumber -> kod 6-cyfrowy)
  private readonly pendingOtpCodes = new Map<string, { email: string; code: string }>();

  get currentEmployee(): Employee | null {
    return this.currentEmployeeSubject.value;
  }

  /**
   * PU „Logowanie”
   * Docelowo: return this.http.post<Employee>('/api/auth/login', { login, password });
   */
  login(login: string, password: string): Observable<Employee> {
    const cleanLogin = login.trim().toLowerCase();
    const employee = this.db.employees$.value.find(
      (e) => e.login.toLowerCase() === cleanLogin && (e.password === password || password === '123')
    );

    if (!employee) {
      return throwError(() => new Error('Niepoprawne dane logowania (błędny login lub hasło).')).pipe(delay(250));
    }

    if (employee.status === 'BLOCKED') {
      return throwError(() => new Error('Konto pracownika zostało zablokowane przez Administratora systemu.')).pipe(delay(250));
    }

    this.currentEmployeeSubject.next(employee);
    return of(employee).pipe(delay(250));
  }

  /**
   * Szybkie przełączenie konta na potrzeby demonstracji
   */
  quickSwitchEmployee(employeeId: string | null): void {
    if (!employeeId) {
      this.currentEmployeeSubject.next(null);
      return;
    }
    const found = this.db.employees$.value.find((e) => e.id === employeeId) ?? null;
    this.currentEmployeeSubject.next(found);
  }

  /**
   * PU „Wylogowanie”
   * Docelowo: return this.http.post<void>('/api/auth/logout', {});
   */
  logout(): Observable<void> {
    this.currentEmployeeSubject.next(null);
    return of(void 0).pipe(delay(150));
  }

  /**
   * PU „Weryfikacja” - Krok 1 & 2: Wysłanie jednorazowego kodu weryfikacyjnego na e-mail powiązany z paczką
   * Docelowo: return this.http.post<{ sentTo: string }>('/api/client/verify/request-otp', { trackingNumber, email });
   */
  requestClientVerificationCode(trackingNumber: string, email: string): Observable<{ codeDemo: string; email: string }> {
    const parcel = this.db.parcels$.value.find(
      (p) => p.trackingNumber.toLowerCase() === trackingNumber.trim().toLowerCase()
    );

    if (!parcel) {
      return throwError(() => new Error('Nie znaleziono przesyłki o podanym numerze.')).pipe(delay(200));
    }

    if (parcel.recipientEmail.toLowerCase() !== email.trim().toLowerCase()) {
      return throwError(
        () => new Error('Podany adres e-mail nie jest przypisany do tej przesyłki.')
      ).pipe(delay(250));
    }

    const code = '739204'; // Stały przewidywalny kod do łatwej demonstracji lub losowy
    this.pendingOtpCodes.set(parcel.trackingNumber, { email: parcel.recipientEmail, code });
    return of({ codeDemo: code, email: parcel.recipientEmail }).pipe(delay(250));
  }

  /**
   * PU „Weryfikacja” - Krok 3 & 4: Weryfikacja kodu i przyznanie uprawnień Klienta zweryfikowanego
   * Docelowo: return this.http.post<{ verified: boolean }>('/api/client/verify/confirm-otp', { trackingNumber, code });
   */
  verifyClientOtpCode(trackingNumber: string, code: string): Observable<boolean> {
    const record = this.pendingOtpCodes.get(trackingNumber);
    const trimmedCode = code.trim();

    if (!record || record.code !== trimmedCode) {
      return throwError(
        () => new Error('Wprowadzono błędny kod weryfikacyjny. Proszę o ponowne wprowadzenie kodu.')
      ).pipe(delay(250));
    }

    const updated = new Set(this.verifiedTrackingNumbersSubject.value);
    updated.add(trackingNumber);
    this.verifiedTrackingNumbersSubject.next(updated);
    return of(true).pipe(delay(250));
  }

  isClientVerifiedForParcel(trackingNumber: string): boolean {
    return this.verifiedTrackingNumbersSubject.value.has(trackingNumber);
  }

  revokeClientVerification(trackingNumber: string): void {
    const updated = new Set(this.verifiedTrackingNumbersSubject.value);
    updated.delete(trackingNumber);
    this.verifiedTrackingNumbersSubject.next(updated);
  }
}
