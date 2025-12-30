import { Routes } from '@angular/router';

import { SetupComponent } from './features/setup/setup.component';
import { DisplayComponent } from './features/display/display.component';

export const routes: Routes = [
  {
    path: '',
    component: SetupComponent
  },
  {
    path: 'display',
    component: DisplayComponent
  }
];
