import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SafeResourceUrl } from '@angular/platform-browser';

export interface AlertLocation {
  nombre: string;
  direccion: string;
  maps: string;
}

export interface AlertOrigin {
  tipo: string;
  nombre: string;
}

export interface AlertContact {
  nombre: string;
  rol: string;
  telefono: string;
}

export interface AlertTimestamps {
  creacion: string;
  actualizacion: string;
}

export interface AlertPayload {
  id: string;
  estado: string;
  nivel_alerta: string;
  prioridad: string;
  nombre: string;
  descripcion: string;
  imagen: string;
  ubicacion: AlertLocation;
  instrucciones: string[];
  elementos_necesarios: string[];
  origen: AlertOrigin;
  contactos: AlertContact[];
  timestamps: AlertTimestamps;
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
