import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { BackupResult, Employee, EmployeeRole } from '../models/domain.models';
import { MockDatabaseService } from './mock-database.service';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly db = inject(MockDatabaseService);
  // W przyszłości: private readonly http = inject(HttpClient);

  readonly employees$ = this.db.employees$.asObservable();

  /**
   * PU „Wykonaj kopię zapasową bazy danych”
   * Docelowo: return this.http.post<BackupResult>('/api/admin/database/backup', { simulateDiskError });
   */
  createDatabaseBackup(simulateDiskError = false): Observable<BackupResult> {
    const now = new Date();
    const ts = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);

    if (simulateDiskError) {
      // Przebieg alternatywny: Błąd zapisu lub brak miejsca na dysku
      return throwError(
        () =>
          new Error(
            'Błąd zapisu kopii zapasowej: Brak wolnego miejsca na dysku macierzy archiwizacyjnej (/var/backups/db). Proces został przerwany.'
          )
      ).pipe(delay(500));
    }

    const result: BackupResult = {
      success: true,
      timestamp: now.toLocaleString('pl-PL'),
      fileName: `outpost_db_backup_${ts}.sql.gz`,
      sizeMb: 142.8,
      integrityVerified: true
    };
    return of(result).pipe(delay(500));
  }

  /**
   * PU „Modyfikuj konto pracownika” (przebieg podstawowy)
   * Docelowo: return this.http.put<Employee>(`/api/admin/employees/${updated.id}`, updated);
   */
  updateEmployeeAccount(updated: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    role: EmployeeRole;
    permissions: string[];
    assignedRegionId?: string;
  }): Observable<Employee> {
    const employees = [...this.db.employees$.value];
    const index = employees.findIndex((e) => e.id === updated.id);
    if (index === -1) {
      return throwError(() => new Error('Nie znaleziono konta pracownika w bazie danych.')).pipe(delay(200));
    }

    if (!updated.fullName.trim() || !updated.email.includes('@')) {
      return throwError(() => new Error('Błąd weryfikacji: Imię i nazwisko oraz poprawny e-mail są wymagane.')).pipe(
        delay(200)
      );
    }

    const modified: Employee = {
      ...employees[index],
      fullName: updated.fullName.trim(),
      email: updated.email.trim(),
      phone: updated.phone.trim(),
      role: updated.role,
      permissions: [...updated.permissions],
      assignedRegionId: updated.assignedRegionId
    };

    employees[index] = modified;
    this.db.employees$.next(employees);
    return of(structuredClone(modified)).pipe(delay(250));
  }

  /**
   * PU „Modyfikuj konto pracownika” -> Przebieg alternatywny 1: „Dodaj konto pracownika”
   * Docelowo: return this.http.post<Employee>('/api/admin/employees', payload);
   */
  addEmployeeAccount(payload: {
    fullName: string;
    login: string;
    email: string;
    phone: string;
    role: EmployeeRole;
    permissions: string[];
    assignedRegionId?: string;
  }): Observable<Employee> {
    const employees = [...this.db.employees$.value];
    const cleanLogin = payload.login.trim().toLowerCase();

    if (!payload.fullName.trim() || !cleanLogin || !payload.email.includes('@')) {
      return throwError(() => new Error('Wypełnij wszystkie wymagane pola nowego konta pracownika.')).pipe(delay(200));
    }

    if (employees.some((e) => e.login.toLowerCase() === cleanLogin)) {
      return throwError(() => new Error(`Konto o loginie "${cleanLogin}" już istnieje w systemie.`)).pipe(delay(200));
    }

    const newEmployee: Employee = {
      id: `EMP-0${employees.length + 1}`,
      fullName: payload.fullName.trim(),
      login: cleanLogin,
      password: '123',
      email: payload.email.trim(),
      phone: payload.phone.trim(),
      role: payload.role,
      status: 'ACTIVE',
      permissions: [...payload.permissions],
      assignedRegionId: payload.assignedRegionId
    };

    this.db.employees$.next([...employees, newEmployee]);
    return of(structuredClone(newEmployee)).pipe(delay(250));
  }

  /**
   * PU „Modyfikuj konto pracownika” -> Przebieg alternatywny 2: „Zablokuj konto pracownika”
   * Docelowo: return this.http.patch<Employee>(`/api/admin/employees/${employeeId}/block`, {});
   */
  toggleBlockEmployeeAccount(employeeId: string, block = true): Observable<Employee> {
    const employees = [...this.db.employees$.value];
    const index = employees.findIndex((e) => e.id === employeeId);
    if (index === -1) {
      return throwError(() => new Error('Nie znaleziono konta pracownika.')).pipe(delay(200));
    }

    const updated: Employee = {
      ...employees[index],
      status: block ? 'BLOCKED' : 'ACTIVE'
    };

    employees[index] = updated;
    this.db.employees$.next(employees);
    return of(structuredClone(updated)).pipe(delay(250));
  }
}
