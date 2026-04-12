import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['../login/login.component.scss', './forgot-password.component.scss'],
})
export class ForgotPasswordComponent {
  form: FormGroup;
  loading = signal(false);
  serverError = signal('');
  successMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  isFieldInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.serverError.set('');
    this.successMessage.set('');

    this.authService.forgotPassword(this.form.value.email.trim()).subscribe({
      next: res => {
        this.loading.set(false);
        this.successMessage.set(res.message);
      },
      error: err => {
        this.loading.set(false);
        this.serverError.set(
          err?.error?.message || 'Something went wrong. Please try again.',
        );
      },
    });
  }
}
