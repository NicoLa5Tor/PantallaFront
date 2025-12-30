import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AlertPayload } from '../alert-view/alert-view.component';

export interface RecentAlert {
  alert: AlertPayload;
  receivedAt: string;
}

@Component({
  selector: 'app-recent-alerts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recent-alerts.component.html',
  styleUrl: './recent-alerts.component.scss'
})
export class RecentAlertsComponent {
  @Input() alerts: RecentAlert[] = [];
  @Input() collapsed = false;
  @Output() collapsedChange = new EventEmitter<boolean>();
  @Output() selectAlert = new EventEmitter<AlertPayload>();

  toggleCollapsed(): void {
    this.collapsedChange.emit(!this.collapsed);
  }

  chooseAlert(alert: AlertPayload): void {
    this.selectAlert.emit(alert);
  }
}
