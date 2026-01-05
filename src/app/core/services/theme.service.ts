import { inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

export type ThemeMode = 'light' | 'dark';

const THEME_STORAGE_KEY = 'rescue-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private document = inject(DOCUMENT);
  private themeSubject = new BehaviorSubject<ThemeMode>('dark');
  readonly theme$ = this.themeSubject.asObservable();

  constructor() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'light' || savedTheme === 'dark') {
      this.setTheme(savedTheme);
      return;
    }
    this.setTheme('dark');
  }

  get theme(): ThemeMode {
    return this.themeSubject.value;
  }

  toggle(): void {
    this.setTheme(this.theme === 'light' ? 'dark' : 'light');
  }

  setTheme(theme: ThemeMode): void {
    this.themeSubject.next(theme);
    this.document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }
}
