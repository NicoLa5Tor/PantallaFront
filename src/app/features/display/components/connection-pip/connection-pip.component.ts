import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-connection-pip',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './connection-pip.component.html',
  styleUrl: './connection-pip.component.scss'
})
export class ConnectionPipComponent {
  @Input() active = false;
  @Input() visible = true;
  @Input() status: string | null = null;
  @Input() topic = '';
  @Input() position = { x: 0, y: 0 };
  @Input() width = 280;
  @Output() dragStart = new EventEmitter<PointerEvent>();
  @Output() toggleVisible = new EventEmitter<void>();

  onDragStart(event: PointerEvent): void {
    this.dragStart.emit(event);
  }

  toggle(): void {
    this.toggleVisible.emit();
  }
}
