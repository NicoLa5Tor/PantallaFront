import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SafeResourceUrl } from '@angular/platform-browser';

export interface AlertPayload {
  tipo_alerta: string;
  prioridad: string;
  ubicacion: string;
  url_maps: string;
  elementos_necesarios: string[];
  instrucciones: string[];
}

@Component({
  selector: 'app-alert-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert-view.component.html',
  styleUrl: './alert-view.component.scss'
})
export class AlertViewComponent {
  @Input({ required: true }) alert!: AlertPayload;
  @Input() mapUrl: SafeResourceUrl | null = null;
  @Input() show = false;
}
