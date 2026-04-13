import {
  Component,
  inject,
  HostListener,
  ElementRef,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { NotificationService, AppNotification } from '../../services/notification.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.scss',
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  protected notifService = inject(NotificationService);
  private elRef = inject(ElementRef);

  open = false;

  ngOnInit(): void {
    this.notifService.init();
  }

  ngOnDestroy(): void {
    // Service teardown is handled by AuthService logout; bell just cleans up its own socket sub
  }

  toggle(): void {
    this.open = !this.open;
  }

  markRead(n: AppNotification): void {
    if (!n.isRead) {
      this.notifService.markRead(n.id);
    }
  }

  markAllRead(): void {
    this.notifService.markAllRead();
  }

  /** Close when clicking outside the component */
  @HostListener('document:click', ['$event'])
  onDocClick(event: MouseEvent): void {
    if (this.open && !this.elRef.nativeElement.contains(event.target)) {
      this.open = false;
    }
  }
}
