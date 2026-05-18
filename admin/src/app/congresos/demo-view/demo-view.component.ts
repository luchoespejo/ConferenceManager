import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  signal,
  ViewChild
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
        <button class="btn btn-secondary btn-sm" (click)="goBack()">← Volver</button>
        <span class="demo-title">Vista previa</span>
        <button class="btn btn-primary btn-sm" (click)="preview?.load()">↺ Recargar</button>
      </div>
      <div class="demo-body">
        <app-site-preview #preview [conferenciaId]="conferenciaId()"></app-site-preview>
      </div>
    </div>
  `,
  styles: [`
    .demo-container { display:flex;flex-direction:column;height:100vh; }
    .demo-topbar { display:flex;align-items:center;justify-content:space-between;padding:.75rem 1.5rem;background:var(--bg);border-bottom:1px solid var(--border);flex-shrink:0; }
    .demo-title { font-weight:600;color:var(--text);font-size:.9rem; }
    .demo-body { flex:1;overflow-y:auto; }
  `]
})
export class DemoViewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  @ViewChild('preview') preview?: SitePreviewComponent;

  conferenciaId = signal('');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    if (!id) { this.router.navigate(['/dashboard']); return; }
    this.conferenciaId.set(id);
  }

  goBack(): void {
    this.router.navigate(['/congreso', this.conferenciaId()]);
  }
}
