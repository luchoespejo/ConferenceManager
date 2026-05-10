import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SitePreviewComponent } from '../site-preview/site-preview.component';

@Component({
  selector: 'app-demo-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SitePreviewComponent],
  template: `
    <div class="demo-container">
      <div class="demo-topbar">
        <button class="demo-back-btn" (click)="goBack()">← Volver</button>
        <span class="demo-title">Vista previa en vivo</span>
        <div></div>
      </div>
      <div class="demo-content">
        <app-site-preview [conferenciaId]="conferenciaId"></app-site-preview>
      </div>
    </div>
  `,
  styles: [`
    .demo-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: var(--background);
    }

    .demo-topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.5rem;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      gap: 1rem;
    }

    .demo-back-btn {
      padding: 0.5rem 1rem;
      background: var(--primary);
      color: white;
      border: none;
      border-radius: var(--r-sm);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: opacity var(--t);
      flex-shrink: 0;
    }

    .demo-back-btn:hover {
      opacity: 0.9;
    }

    .demo-title {
      font-weight: 600;
      color: var(--text);
      flex: 1;
      text-align: center;
    }

    .demo-content {
      flex: 1;
      overflow: hidden;
      padding: 1.5rem;
    }
  `]
})
export class DemoViewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  conferenciaId = '';

  ngOnInit(): void {
    this.conferenciaId = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.conferenciaId) {
      this.router.navigate(['/dashboard']);
    }
  }

  goBack(): void {
    this.router.navigate(['/congreso', this.conferenciaId]);
  }
}
