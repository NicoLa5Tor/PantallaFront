import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ThemeService } from '../../core/services/theme.service';

const EMPRESA_STORAGE_KEY = 'rescue-empresa';
const SEDE_STORAGE_KEY = 'rescue-sede';

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './setup.component.html',
  styleUrl: './setup.component.scss'
})
export class SetupComponent implements OnInit {
  empresa = '';
  sede = '';
  error = '';

  constructor(private router: Router, public themeService: ThemeService) {}

  get topicPreview(): string {
    const empresa = this.empresa.trim() || '{empresa}';
    const sede = this.sede.trim() || '{sede}';
    return `empresas/${empresa}/${sede}/PANTALLA`;
  }

  ngOnInit(): void {
    const savedEmpresa = localStorage.getItem(EMPRESA_STORAGE_KEY);
    const savedSede = localStorage.getItem(SEDE_STORAGE_KEY);

    if (savedEmpresa) {
      this.empresa = savedEmpresa;
    }
    if (savedSede) {
      this.sede = savedSede;
    }
  }

  onSubmit(): void {
    const empresa = this.empresa.trim();
    const sede = this.sede.trim();

    if (!empresa || !sede) {
      this.error = 'Ingresa empresa y sede para continuar.';
      return;
    }

    this.error = '';
    localStorage.setItem(EMPRESA_STORAGE_KEY, empresa);
    localStorage.setItem(SEDE_STORAGE_KEY, sede);
    this.router.navigate(['/display'], {
      queryParams: { empresa, sede }
    });
  }
}
