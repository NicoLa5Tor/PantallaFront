import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-normal-notice',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './normal-notice.component.html',
  styleUrl: './normal-notice.component.scss'
})
export class NormalNoticeComponent {
  @Input() show = false;
}
