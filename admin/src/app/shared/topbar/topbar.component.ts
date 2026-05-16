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
    <nav class="topbar">
      <a routerLink="/dashboard" class="topbar-brand">
        <div class="brand-icon">🎪</div>
        <span class="brand-name">ConferenceManager</span>
      </a>

      <div class="topbar-right" [class.topbar-right--open]="menuOpen()" (click)="closeMenu()">
        <ng-content />
      </div>

      <button
        class="hamburger-btn"
        (click)="toggleMenu()"
        [class.hamburger-btn--open]="menuOpen()"
        aria-label="Menú">
        <span></span>
        <span></span>
        <span></span>
      </button>
    </nav>

    @if (menuOpen()) {
      <div class="mobile-backdrop" (click)="closeMenu()"></div>
    }
  `,
  styles: [`
    .hamburger-btn {
      display: none;
      flex-direction: column;
      justify-content: center;
      gap: 5px;
      width: 40px;
      height: 40px;
      padding: 8px;
      background: transparent;
      border: 1px solid var(--border);
      border-radius: var(--r-sm);
      cursor: pointer;
      flex-shrink: 0;
      transition: background var(--t);
    }
    .hamburger-btn:hover { background: var(--surface2); }
    .hamburger-btn span {
      display: block;
      width: 100%;
      height: 2px;
      background: var(--text);
      border-radius: 2px;
      transition: transform 0.2s ease, opacity 0.2s ease;
      transform-origin: center;
    }
    .hamburger-btn--open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
    .hamburger-btn--open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
    .hamburger-btn--open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

    .mobile-backdrop {
      position: fixed;
      inset: 0;
      z-index: 98;
    }

    @media (max-width: 640px) {
      .hamburger-btn { display: flex; }

      .topbar-right {
        display: none;
        position: fixed;
        top: 56px;
        left: 0;
        right: 0;
        flex-direction: column;
        align-items: stretch;
        gap: 0.375rem;
        padding: 0.625rem 1rem 0.875rem;
        background: var(--surface);
        border-bottom: 1px solid var(--border);
        box-shadow: 0 8px 24px rgba(0,0,0,.4);
        z-index: 99;
      }
      .topbar-right--open { display: flex; }

      /* Buttons inside dropdown */
      :host ::ng-deep .topbar-right--open .btn {
        width: 100%;
        justify-content: flex-start;
        min-height: 44px;
        padding: 0.625rem 0.875rem;
        font-size: .9rem;
      }
      :host ::ng-deep .topbar-right--open .badge {
        align-self: flex-start;
        margin-bottom: 0.25rem;
      }
    }
  `]
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
