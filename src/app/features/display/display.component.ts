import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';

import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './display.component.html',
  styleUrl: './display.component.scss'
})
export class DisplayComponent {
  readonly empresa$;
  readonly sede$;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public themeService: ThemeService
  ) {
    this.empresa$ = this.route.queryParamMap.pipe(map((params) => params.get('empresa') ?? ''));
    this.sede$ = this.route.queryParamMap.pipe(map((params) => params.get('sede') ?? ''));
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
