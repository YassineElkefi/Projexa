import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ActivityItem {
  id: number;
  type:
    | 'user_registered'
    | 'user_banned'
    | 'user_unbanned'
    | 'user_activated'
    | 'role_changed'
    | 'project_created'
    | 'settings_changed';
  message: string;
  actor: string;
  timestamp: Date;
}

@Component({
  selector: 'app-activity-feed',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './activity-feed.component.html',
  styleUrl: './activity-feed.component.scss',
})
export class ActivityFeedComponent {
  items   = input.required<ActivityItem[]>();
  loading = input<boolean>(false);

  iconFor(type: ActivityItem['type']): string {
    const map: Record<ActivityItem['type'], string> = {
      user_registered:  'person_add',
      user_banned:        'block',
      user_unbanned:      'lock_open',
      user_activated:    'verified_user',
      role_changed:      'manage_accounts',
      project_created:   'folder_open',
      settings_changed:  'settings',
    };
    return map[type];
  }

  colorFor(type: ActivityItem['type']): string {
    const map: Record<ActivityItem['type'], string> = {
      user_registered:  'emerald',
      user_banned:        'rose',
      user_unbanned:      'emerald',
      user_activated:     'emerald',
      role_changed:       'amber',
      project_created:    'indigo',
      settings_changed:   'slate',
    };
    return map[type];
  }
}