import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, tap, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthUser, LoginRequest } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly base = `${environment.apiUrl}/auth`;

  readonly currentUser = signal<AuthUser | null>(null);

  login(credentials: LoginRequest): Observable<AuthUser> {
    return this.http
      .post<AuthUser>(`${this.base}/login`, credentials, { withCredentials: true })
      .pipe(tap(user => this.currentUser.set(user)));
  }

  logout(): void {
    this.http
      .post<void>(`${this.base}/logout`, {}, { withCredentials: true })
      .subscribe({
        complete: () => {
          this.currentUser.set(null);
          this.router.navigate(['/login']);
        }
      });
  }

  /** Restaura la sesión desde la cookie HttpOnly al cargar la app */
  restoreSession(): Observable<AuthUser | null> {
    return this.http
      .get<AuthUser>(`${this.base}/me`, { withCredentials: true })
      .pipe(
        tap(user => this.currentUser.set(user)),
        catchError(() => {
          this.currentUser.set(null);
          return of(null);
        })
      );
  }

  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }
}
