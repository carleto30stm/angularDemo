import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(4)]]
  });

  submit(): void {
    if (this.form.invalid || this.loading()) return;

    this.loading.set(true);
    this.error.set(null);

    const { username, password } = this.form.getRawValue();
    this.authService.login({ username, password }).subscribe({
      next: () => this.router.navigate(['/productos']),
      error: (err) => {
        this.error.set(
          err.status === 401 ? 'Usuario o contraseña incorrectos' : 'Error al iniciar sesión'
        );
        this.loading.set(false);
      }
    });
  }
}
