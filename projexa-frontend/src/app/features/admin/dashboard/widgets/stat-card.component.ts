import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.scss',
})
export class StatCardComponent {
  label   = input.required<string>();
  value   = input.required<string | number>();
  icon    = input.required<string>();
  trend   = input<number>(0);       // positive = up, negative = down
  color   = input<'indigo' | 'emerald' | 'amber' | 'rose'>('indigo');
  loading = input<boolean>(false);
}