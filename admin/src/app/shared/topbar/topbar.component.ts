import {
  Component,
  ChangeDetectionStrategy,
  OnDestroy,
  inject,
  signal
} from '@angular/core';
import { RouterLink, Router, NavigationStart } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-topbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <nav class="topbar" [class.topbar--open]="menuOpen()">
      <a routerLink="/dashboard" class="topbar-brand">
        <div class="brand-icon">🎪</div>
        <span class="brand-name">ConferenceManager</span>
      </a>
      <button
        class="hamburger-btn"
        (click)="toggleMenu()"
        [attr.aria-label]="menuOpen() ? 'Cerrar menú' : 'Abrir menú'">
        {{ menuOpen() ? '✕' : '☰' }}
      </button>
      <div class="topbar-right" [class.topbar-right--open]="menuOpen()" (click)="closeMenu()">
        <ng-content />
      </div>
    </nav>
  `
})
export class TopbarComponent implements OnDestroy {
  private router = inject(Router);
  menuOpen = signal(false);
  private sub: Subscription;

  constructor() {
    this.sub = this.router.events
      .pipe(filter(e => e instanceof NavigationStart))
      .subscribe(() => this.menuOpen.set(false));
  }

  toggleMenu(): void { this.menuOpen.update(v => !v); }
  closeMenu(): void { this.menuOpen.set(false); }

  ngOnDestroy(): void { this.sub.unsubscribe(); }
}
