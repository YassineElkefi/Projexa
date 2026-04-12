import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

export interface SystemSettings {
  appName: string;
  allowRegistration: boolean;
  maintenanceMode: boolean;
  defaultUserRole: 'MEMBER' | 'TEAM_LEAD';
  maxProjectsPerTeam: number;
  emailNotificationsEnabled: boolean;
  supportEmail: string;
}

@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './system-settings.component.html',
  styleUrl: './system-settings.component.scss',
})
export class SystemSettingsComponent implements OnInit {
  private http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/admin/settings`;

  settings = signal<SystemSettings>({
    appName: '',
    allowRegistration: true,
    maintenanceMode: false,
    defaultUserRole: 'MEMBER',
    maxProjectsPerTeam: 10,
    emailNotificationsEnabled: true,
    supportEmail: '',
  });

  loading  = signal(true);
  saving   = signal(false);
  saved    = signal(false);

  ngOnInit(): void {
    this.http.get<SystemSettings>(this.API).subscribe({
      next: s => { this.settings.set(s); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  save(): void {
    this.saving.set(true);
    this.saved.set(false);
    this.http.put<SystemSettings>(this.API, this.settings()).subscribe({
      next: s => {
        this.settings.set(s);
        this.saving.set(false);
        this.saved.set(true);
        setTimeout(() => this.saved.set(false), 3000);
      },
      error: () => this.saving.set(false),
    });
  }

  updateField<K extends keyof SystemSettings>(key: K, value: SystemSettings[K]): void {
    this.settings.update(s => ({ ...s, [key]: value }));
  }
}