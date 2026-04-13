import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AlertService } from '../../../core/services/alert.service';

function passwordMatchValidator(control: AbstractControl) {
  const password = control.get('password');
  const confirm = control.get('confirmPassword');
  if (!password || !confirm) return null;
  return password.value === confirm.value ? null : { mismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  form: FormGroup;
  step = signal(1);
  loading = signal(false);
  serverError = signal('');
  showPassword = signal(false);
  registered = signal(false);

  strengthPct = computed(() => {
    const pw: string = this.form.get('password')?.value || '';
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score * 25;
  });

  strengthClass = computed(() => {
    const pct = this.strengthPct();
    if (pct <= 25) return 'weak';
    if (pct <= 50) return 'fair';
    if (pct <= 75) return 'good';
    return 'strong';
  });

  strengthLabel = computed(() => {
    const map: Record<string, string> = {
      weak: 'Weak',
      fair: 'Fair',
      good: 'Good',
      strong: 'Strong',
    };
    return map[this.strengthClass()];
  });

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private alert: AlertService,
  ) {
    this.form = this.fb.group(
      {
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: passwordMatchValidator },
    );
  }

  isFieldInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control?.invalid && (control.dirty || control.touched));
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

  goBack(): void {
    this.step.set(1);
  }

  nextStep(): void {
    ['firstName', 'lastName', 'email'].forEach(f =>
      this.form.get(f)?.markAsTouched(),
    );
    const step1Valid =
      !this.form.get('firstName')?.invalid &&
      !this.form.get('lastName')?.invalid &&
      !this.form.get('email')?.invalid;

    if (step1Valid) this.step.set(2);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.serverError.set('');

    const { confirmPassword, ...payload } = this.form.value;
    this.authService.register(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.registered.set(true);
        this.alert.success('Registration successful! Please check your email.', 'Check email');
      },
      error: (err: any) => {
        this.loading.set(false);
        const msg = err?.error?.message || 'Registration failed. Please try again.';
        this.serverError.set(msg);
        this.alert.error(msg, 'Registration Failed');
      },
    });
  }
}