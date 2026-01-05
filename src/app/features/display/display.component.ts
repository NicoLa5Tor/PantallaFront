import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';

import { ThemeService } from '../../core/services/theme.service';
import { WebsocketMessage, WebsocketService } from '../../core/services/websocket.service';
import {
  AlertContact,
  AlertPayload,
  AlertLocation,
  AlertOrigin,
  AlertTimestamps
} from './components/alert-view/alert-view.component';
import { RecentAlert } from './components/recent-alerts/recent-alerts.component';
import { AlertViewComponent } from './components/alert-view/alert-view.component';
import { RecentAlertsComponent } from './components/recent-alerts/recent-alerts.component';
import { ConnectionPipComponent } from './components/connection-pip/connection-pip.component';
import { NormalNoticeComponent } from './components/normal-notice/normal-notice.component';

const LAST_ALERT_STORAGE_KEY = 'rescue-last-alert';

@Component({
  selector: 'app-display',
  standalone: true,
  imports: [
    CommonModule,
    AlertViewComponent,
    RecentAlertsComponent,
    ConnectionPipComponent,
    NormalNoticeComponent
  ],
  templateUrl: './display.component.html',
  styleUrl: './display.component.scss'
})
export class DisplayComponent implements OnInit, OnDestroy {
  readonly empresa$;
  readonly sede$;
  readonly status$;
  logs: WebsocketMessage[] = [];
  activeTopic = '';
  activeAlert: AlertPayload | null = null;
  lastAlert: AlertPayload | null = null;
  recentAlerts: RecentAlert[] = [];
  mapUrl: SafeResourceUrl | null = null;
  recentCollapsed = false;
  normalNotice = false;
  showHeader = true;
  private normalTimer: ReturnType<typeof setTimeout> | null = null;
  pipVisible = true;
  pipSize: 'sm' | 'md' = 'sm';
  pipPosition = { x: 0, y: 0 };
  pipDimensions = { width: 280, height: 220 };
  private dragging = false;
  private dragOffset = { x: 0, y: 0 };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public themeService: ThemeService,
    private websocketService: WebsocketService,
    private sanitizer: DomSanitizer
  ) {
    this.empresa$ = this.route.queryParamMap.pipe(map((params) => params.get('empresa') ?? ''));
    this.sede$ = this.route.queryParamMap.pipe(map((params) => params.get('sede') ?? ''));
    this.status$ = this.websocketService.status$;
  }

  ngOnInit(): void {
    const empresa = this.route.snapshot.queryParamMap.get('empresa') ?? localStorage.getItem('rescue-empresa') ?? '';
    const sede = this.route.snapshot.queryParamMap.get('sede') ?? localStorage.getItem('rescue-sede') ?? '';

    if (!empresa || !sede) {
      this.router.navigate(['/']);
      return;
    }

    const savedAlert = localStorage.getItem(LAST_ALERT_STORAGE_KEY);
    if (savedAlert) {
      const parsed = this.parsePayload(savedAlert);
      const alert = this.extractAlert(parsed);
      if (alert) {
        this.activeAlert = alert;
        this.lastAlert = alert;
        this.mapUrl = this.buildMapUrl(alert);
        this.showHeader = false;
      }
    }

    this.activeTopic = `empresas/${empresa}/${sede}/PANTALLA`;
    this.websocketService.connect(this.activeTopic);
    this.websocketService.getMessages().subscribe((message) => {
      this.logs = [message, ...this.logs].slice(0, 100);
      if (this.isNormalPayload(message.payload)) {
        this.activeAlert = null;
        this.lastAlert = null;
        this.mapUrl = null;
        this.recentCollapsed = false;
        this.recentAlerts = [];
        this.showHeader = true;
        localStorage.removeItem(LAST_ALERT_STORAGE_KEY);
        this.showNormalNotice();
        return;
      }
      const alert = this.extractAlert(message.payload);
      if (alert) {
        this.activeAlert = alert;
        this.lastAlert = alert;
        const receivedAt = message.timestamp ?? new Date().toISOString();
        this.recentAlerts = [{ alert, receivedAt }, ...this.recentAlerts].slice(0, 20);
        this.mapUrl = this.buildMapUrl(alert);
        localStorage.setItem(LAST_ALERT_STORAGE_KEY, JSON.stringify(alert));
        this.recentCollapsed = true;
        this.showHeader = false;
        this.ensurePipVisible();
      }
    });

    this.setPipDefaultPosition();
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('resize', this.onResize);
  }

  ngOnDestroy(): void {
    this.websocketService.disconnect();
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('resize', this.onResize);
    if (this.normalTimer) {
      clearTimeout(this.normalTimer);
      this.normalTimer = null;
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  toggleHeader(): void {
    this.showHeader = !this.showHeader;
  }

  dismissAlert(): void {
    this.activeAlert = null;
    this.mapUrl = null;
    this.showHeader = true;
  }

  restoreAlert(): void {
    if (!this.lastAlert) {
      return;
    }
    this.activeAlert = this.lastAlert;
    this.mapUrl = this.buildMapUrl(this.lastAlert);
    this.showHeader = false;
  }

  showAlert(alert: AlertPayload): void {
    this.activeAlert = alert;
    this.lastAlert = alert;
    this.mapUrl = this.buildMapUrl(alert);
    this.showHeader = false;
  }

  toggleRecentCollapsed(): void {
    this.recentCollapsed = !this.recentCollapsed;
  }

  togglePipVisibility(): void {
    this.pipVisible = !this.pipVisible;
    if (this.pipVisible) {
      this.setPipDefaultPosition();
    }
  }

  togglePipSize(): void {
    this.pipSize = this.pipSize === 'sm' ? 'md' : 'sm';
    this.setPipDefaultPosition();
  }

  startDrag(event: PointerEvent): void {
    if (!this.activeAlert || !this.pipVisible) {
      return;
    }
    this.dragging = true;
    this.dragOffset = {
      x: event.clientX - this.pipPosition.x,
      y: event.clientY - this.pipPosition.y
    };
  }

  private onPointerMove = (event: PointerEvent): void => {
    if (!this.dragging) {
      return;
    }
    const { width, height } = this.pipDimensions;
    const maxX = Math.max(0, window.innerWidth - width - 16);
    const maxY = Math.max(0, window.innerHeight - height - 16);

    const nextX = event.clientX - this.dragOffset.x;
    const nextY = event.clientY - this.dragOffset.y;
    this.pipPosition = {
      x: Math.min(Math.max(16, nextX), maxX),
      y: Math.min(Math.max(16, nextY), maxY)
    };
  };

  private onPointerUp = (): void => {
    this.dragging = false;
  };

  private setPipDefaultPosition(): void {
    this.updatePipDimensions();
    const { width, height } = this.pipDimensions;
    this.pipPosition = {
      x: Math.max(16, window.innerWidth - width - 24),
      y: Math.max(16, window.innerHeight - height - 24)
    };
  }

  private ensurePipVisible(): void {
    if (!this.pipVisible) {
      this.pipVisible = true;
    }
  }

  private showNormalNotice(): void {
    this.normalNotice = true;
    if (this.normalTimer) {
      clearTimeout(this.normalTimer);
    }
    this.normalTimer = setTimeout(() => {
      this.normalNotice = false;
    }, 5000);
  }

  private updatePipDimensions(): void {
    const baseWidth = this.pipSize === 'sm' ? 280 : 360;
    const baseHeight = this.pipSize === 'sm' ? 220 : 280;
    const maxWidth = Math.max(240, window.innerWidth - 32);
    const maxHeight = Math.max(200, window.innerHeight - 160);
    this.pipDimensions = {
      width: Math.min(baseWidth, maxWidth),
      height: Math.min(baseHeight, maxHeight)
    };
  }

  private onResize = (): void => {
    if (!this.activeAlert || !this.pipVisible) {
      return;
    }
    this.setPipDefaultPosition();
  };

  private extractAlert(payload: unknown): AlertPayload | null {
    const parsed = this.unwrapPayload(this.parsePayload(payload));
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    const data = this.unwrapAlert(parsed as Record<string, unknown>);
    const nombre = this.pickString(data, ['nombre', 'nombre_alerta', 'tipo_alerta', 'tipo_alarma', 'data.tipo_alarma_detalle.nombre']);
    const prioridad = this.pickString(data, ['prioridad']);
    const nivelAlerta = this.pickString(data, ['nivel_alerta', 'tipo_alerta', 'data.tipo_alarma_detalle.tipo_alerta']);
    const estado = this.pickString(data, ['estado']);
    const descripcion = this.pickString(data, ['descripcion']);
    const imagen = this.pickString(data, ['imagen', 'image_alert', 'data.image_alert', 'data.tipo_alarma_detalle.imagen_base64']);
    const id = this.pickString(data, ['id', '_id']);

    const ubicacionRaw = this.getPathValue(data, 'ubicacion');
    const ubicacionData = this.asRecord(ubicacionRaw);
    const ubicacionNombre = ubicacionData ? this.pickString(ubicacionData, ['nombre']) : '';
    let ubicacionDireccion = '';
    if (typeof ubicacionRaw === 'string') {
      ubicacionDireccion = ubicacionRaw;
    } else if (ubicacionData) {
      ubicacionDireccion = this.pickString(ubicacionData, ['direccion']);
    }
    if (!ubicacionDireccion) {
      ubicacionDireccion = this.pickString(data, ['ubicacion', 'sede']);
    }
    let ubicacionMaps = '';
    if (ubicacionData) {
      ubicacionMaps = this.pickString(ubicacionData, ['maps', 'url_maps', 'url']);
    }
    if (!ubicacionMaps) {
      ubicacionMaps = this.pickString(data, ['url_maps', 'url', 'data.ubicacion.url_maps', 'data.ubicacion.maps']);
    }
    const ubicacion: AlertLocation = {
      nombre: ubicacionNombre,
      direccion: ubicacionDireccion,
      maps: ubicacionMaps
    };

    const origenData = this.asRecord(this.getPathValue(data, 'origen'));
    const activacionData = this.asRecord(this.getPathValue(data, 'activacion_alerta'));
    const origen: AlertOrigin = {
      tipo: origenData
        ? this.pickString(origenData, ['tipo'])
        : activacionData
          ? this.pickString(activacionData, ['tipo_activacion'])
          : this.pickString(data, ['data.creador_tipo', 'data.origen']),
      nombre: origenData
        ? this.pickString(origenData, ['nombre'])
        : activacionData
          ? this.pickString(activacionData, ['nombre'])
          : this.pickString(data, ['empresa_nombre', 'data.creador_id'])
    };

    const contactos = this.parseContacts(data['contactos'] ?? this.getPathValue(data, 'numeros_telefonicos'));
    const elementos = this.pickStringArray(data, ['elementos_necesarios', 'data.elementos_necesarios', 'data.tipo_alarma_detalle.implementos_necesarios']);
    const instrucciones = this.pickStringArray(data, ['instrucciones', 'data.instrucciones', 'data.tipo_alarma_detalle.recomendaciones']);

    const timestampsData = this.asRecord(this.getPathValue(data, 'timestamps'));
    const timestamps: AlertTimestamps = {
      creacion: timestampsData
        ? this.pickString(timestampsData, ['creacion'])
        : this.pickString(data, ['fecha_creacion', 'data.timestamp_creacion']),
      actualizacion: timestampsData
        ? this.pickString(timestampsData, ['actualizacion'])
        : this.pickString(data, ['fecha_actualizacion'])
    };

    if (nombre && prioridad && (ubicacion.direccion || ubicacion.nombre)) {
      return {
        id,
        estado,
        nivel_alerta: nivelAlerta,
        prioridad,
        nombre,
        descripcion,
        imagen,
        ubicacion,
        instrucciones,
        elementos_necesarios: elementos,
        origen,
        contactos,
        timestamps
      };
    }
    return null;
  }

  private isNormalPayload(payload: unknown): boolean {
    const parsed = this.unwrapPayload(this.parsePayload(payload));
    if (!parsed || typeof parsed !== 'object') {
      return false;
    }
    const data = this.unwrapAlert(parsed as Record<string, unknown>);
    const estado = this.pickString(data, ['estado']);
    if (estado) {
      return estado.toUpperCase() !== 'ACTIVA';
    }
    const activo = this.getPathValue(data, 'activo');
    if (typeof activo === 'boolean') {
      return !activo;
    }
    const fechaDesactivacion = this.pickString(data, ['fecha_desactivacion']);
    if (fechaDesactivacion) {
      return true;
    }
    const tipo = this.pickString(data, ['tipo_alarma', 'tipo_alerta', 'nivel_alerta', 'estado']);
    return tipo.toUpperCase() === 'NORMAL';
  }

  private pickString(data: Record<string, unknown>, paths: string[]): string {
    for (const path of paths) {
      const value = this.getPathValue(data, path);
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
    }
    return '';
  }

  private getPathValue(data: Record<string, unknown>, path: string): unknown {
    const parts = path.split('.');
    let current: unknown = data;
    for (const part of parts) {
      if (!current || typeof current !== 'object') {
        return undefined;
      }
      current = (current as Record<string, unknown>)[part];
    }
    return current;
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object') {
      return null;
    }
    return value as Record<string, unknown>;
  }

  private pickStringArray(data: Record<string, unknown>, paths: string[]): string[] {
    for (const path of paths) {
      const value = this.getPathValue(data, path);
      if (Array.isArray(value)) {
        return value.filter((item) => typeof item === 'string') as string[];
      }
    }
    return [];
  }

  private parseContacts(value: unknown): AlertContact[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .map((item) => {
        if (typeof item === 'string') {
          return {
            nombre: '',
            rol: '',
            telefono: item
          };
        }
        if (!item || typeof item !== 'object') {
          return null;
        }
        const record = item as Record<string, unknown>;
        return {
          nombre: this.pickString(record, ['nombre']),
          rol: this.pickString(record, ['rol']),
          telefono: this.pickString(record, ['telefono'])
        };
      })
      .filter((item): item is AlertContact => item !== null);
  }

  private parsePayload(payload: unknown): unknown {
    if (typeof payload === 'string') {
      try {
        return JSON.parse(payload);
      } catch {
        return null;
      }
    }
    return payload;
  }

  private unwrapPayload(parsed: unknown): unknown {
    if (!parsed || typeof parsed !== 'object') {
      return parsed;
    }
    const data = parsed as Record<string, unknown>;
    if ('payload' in data && typeof data['payload'] === 'object') {
      return data['payload'];
    }
    return parsed;
  }

  private unwrapAlert(data: Record<string, unknown>): Record<string, unknown> {
    if ('alert' in data && data['alert'] && typeof data['alert'] === 'object') {
      return data['alert'] as Record<string, unknown>;
    }
    return data;
  }

  private toEmbedUrl(url: string): string {
    const trimmed = url.trim();
    if (!trimmed) {
      return '';
    }

    const hasEmbed = trimmed.includes('output=embed') || trimmed.includes('/maps/embed');
    if (hasEmbed) {
      return trimmed;
    }

    const queryIndex = trimmed.indexOf('?q=');
    if (queryIndex !== -1) {
      const query = trimmed.slice(queryIndex + 3);
      return `https://www.google.com/maps?q=${query}&output=embed`;
    }

    const placeMatch = trimmed.match(/\/maps\/place\/([^/?#]+)/i);
    if (placeMatch && placeMatch[1]) {
      return `https://www.google.com/maps?q=${placeMatch[1]}&output=embed`;
    }

    return `https://www.google.com/maps?q=${encodeURIComponent(trimmed)}&output=embed`;
  }

  private buildMapUrl(alert: AlertPayload): SafeResourceUrl | null {
    if (!alert.ubicacion.maps) {
      return null;
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      this.toEmbedUrl(alert.ubicacion.maps)
    );
  }
}
