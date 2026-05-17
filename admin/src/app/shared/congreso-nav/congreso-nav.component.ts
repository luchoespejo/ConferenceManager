import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-congreso-nav',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="congreso-nav">
      <a [routerLink]="['/congreso', id]" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" class="cnav-item">
        <span class="cnav-icon">🏠</span><span class="cnav-label">Resumen</span>
      </a>
      <a [routerLink]="['/congreso', id, 'sesiones']" routerLinkActive="active" class="cnav-item">
        <span class="cnav-icon">📋</span><span class="cnav-label">Sesiones</span>
      </a>
      <a [routerLink]="['/congreso', id, 'expositores']" routerLinkActive="active" class="cnav-item">
        <span class="cnav-icon">🎤</span><span class="cnav-label">Expositores</span>
      </a>
      <a [routerLink]="['/congreso', id, 'salas']" routerLinkActive="active" class="cnav-item">
        <span class="cnav-icon">🏛️</span><span class="cnav-label">Salas</span>
      </a>
      <a [routerLink]="['/congreso', id, 'participantes']" routerLinkActive="active" class="cnav-item">
        <span class="cnav-icon">👥</span><span class="cnav-label">Participantes</span>
      </a>
      <a [routerLink]="['/congreso', id, 'avisos']" routerLinkActive="active" class="cnav-item">
        <span class="cnav-icon">📢</span><span class="cnav-label">Avisos</span>
      </a>
      <a [routerLink]="['/congreso', id, 'programa']" routerLinkActive="active" class="cnav-item">
        <span class="cnav-icon">🗓️</span><span class="cnav-label">Programa</span>
      </a>
    </nav>
  `,
  styles: [`
    .congreso-nav {
      display: flex;
      gap: 2px;
      padding: 0 2rem;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      overflow-x: auto;
      scrollbar-width: none;
    }
    .congreso-nav::-webkit-scrollbar { display: none; }
    .cnav-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: .75rem 1rem;
      font-size: .875rem;
      font-weight: 500;
      color: var(--muted);
      text-decoration: none;
      white-space: nowrap;
      border-bottom: 2px solid transparent;
      transition: color var(--t), border-color var(--t);
      margin-bottom: -1px;
    }
    .cnav-item:hover { color: var(--text); }
    .cnav-item.active { color: var(--primary); border-bottom-color: var(--primary); }
    .cnav-icon { font-size: 1rem; }
    @media (max-width: 640px) {
      .congreso-nav { padding: 0 .75rem; }
      .cnav-item { padding: .625rem .75rem; font-size: .8125rem; }
      .cnav-label { display: none; }
      .cnav-icon { font-size: 1.25rem; }
    }
  `]
})
export class CongresoNavComponent {
  @Input({ required: true }) id!: string;
}
