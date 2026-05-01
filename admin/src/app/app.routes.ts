import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'registro',
    loadComponent: () => import('./auth/registro/registro.component').then(m => m.RegistroComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'congreso/nuevo',
    canActivate: [authGuard],
    loadComponent: () => import('./congresos/congreso-form/congreso-form.component').then(m => m.CongresoFormComponent)
  },
  {
    path: 'congreso/:id/configuracion',
    canActivate: [authGuard],
    loadComponent: () => import('./congresos/congreso-form/congreso-form.component').then(m => m.CongresoFormComponent)
  },
  {
    path: 'congreso/:id/salas',
    canActivate: [authGuard],
    loadComponent: () => import('./salas/salas.component').then(m => m.SalasComponent)
  },
  { path: '**', redirectTo: 'dashboard' }
];
