import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

function passwordMatchValidator(control: AbstractControl) {
  const password = control.get('password');
  const confirm = control.get('confirmPassword');
  if (!password || !confirm) return null;
  return password.value === confirm.value ? null : { mismatch: true };
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['../login/login.component.scss', './reset-password.component.scss'],
})
export class ResetPasswordComponent implements OnInit {
  form: FormGroup;
  loading = signal(false);
  serverError = signal('');
  successMessage = signal('');
  showPassword = signal(false);
  /** Missing or invalid query token before submit */
  missingToken = signal(false);

  private resetToken = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.form = this.fb.group(
      {
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: passwordMatchValidator },
    );
  }

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token')?.trim() ?? '';
    this.resetToken = token;
    if (!token) {
      this.missingToken.set(true);
    }
  }

  isFieldInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  isPasswordMismatch(): boolean {
    return !!(
      this.form.hasError('mismatch') &&
      this.form.get('confirmPassword')?.touched
    );
  }

  togglePassword(): void {
    this.showPassword.set(!this.showPassword());
  }

  onSubmit(): void {
    if (this.missingToken() || !this.resetToken) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.serverError.set('');
    this.successMessage.set('');

    const password = this.form.value.password as string;
    this.authService.resetPassword(this.resetToken, password).subscribe({
      next: res => {
        this.loading.set(false);
        this.successMessage.set(res.message);
      },
      error: err => {
        this.loading.set(false);
        this.serverError.set(
          err?.error?.message || 'Could not reset password. Try requesting a new link.',
        );
      },
    });
  }

  goToForgot(): void {
    void this.router.navigate(['/forgot-password']);
  }
}
