import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminUserService, AdminUser, UserRole } from '../services/admin-user.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './user-detail.component.html',
  styleUrl: './user-detail.component.scss',
})
export class UserDetailComponent implements OnInit {
  private route       = inject(ActivatedRoute);
  private userService = inject(AdminUserService);

  user      = signal<AdminUser | null>(null);
  loading   = signal(true);
  saving    = signal(false);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.userService.getUser(id).subscribe({
      next: u => { this.user.set(u); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  toggleBan(): void {
    const u = this.user();
    if (!u) return;
    this.saving.set(true);
    const action = u.status === 'BANNED'
      ? this.userService.unbanUser(u.id)
      : this.userService.banUser(u.id);

    action.subscribe({
      next: updated => { this.user.set(updated); this.saving.set(false); },
      error: () => this.saving.set(false),
    });
  }

  approveAccount(): void {
    const u = this.user();
    if (!u || u.status !== 'PENDING') return;
    this.saving.set(true);
    this.userService.activateUser(u.id).subscribe({
      next: updated => {
        this.user.set(updated);
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }

  changeRole(role: UserRole): void {
    const u = this.user();
    if (!u) return;
    this.saving.set(true);
    this.userService.updateRole(u.id, role).subscribe({
      next: updated => { this.user.set(updated); this.saving.set(false); },
      error: () => this.saving.set(false),
    });
  }
}