import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';

import { ThemeService } from '../../core/services/theme.service';
import { WebsocketMessage, WebsocketService } from '../../core/services/websocket.service';

@Component({
  selector: 'app-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './display.component.html',
  styleUrl: './display.component.scss'
})
export class DisplayComponent implements OnInit, OnDestroy {
  readonly empresa$;
  readonly sede$;
  readonly status$;
  logs: WebsocketMessage[] = [];
  activeTopic = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public themeService: ThemeService,
    private websocketService: WebsocketService
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

    this.activeTopic = `empresas/${empresa}/${sede}/PANTALLA`;
    this.websocketService.connect(this.activeTopic);
    this.websocketService.getMessages().subscribe((message) => {
      this.logs = [message, ...this.logs].slice(0, 100);
    });
  }

  ngOnDestroy(): void {
    this.websocketService.disconnect();
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
