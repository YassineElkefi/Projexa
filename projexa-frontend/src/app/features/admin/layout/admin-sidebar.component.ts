import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.scss',
})
export class AdminSidebarComponent {
  collapsed = signal(false);

  navItems: NavItem[] = [
    { label: 'Dashboard',  icon: 'grid_view',       route: '/admin/dashboard' },
    { label: 'Users',      icon: 'group',            route: '/admin/users'     },
    { label: 'Projects',   icon: 'folder_open',      route: '/admin/projects'  },
    { label: 'Settings',   icon: 'settings',         route: '/admin/settings'  },
  ];

  toggle(): void {
    this.collapsed.update(v => !v);
  }
}