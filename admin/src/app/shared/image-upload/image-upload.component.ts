import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="image-upload-wrap">
      @if (currentUrl()) {
        <div class="image-preview">
          <img [src]="currentUrl()!" [alt]="label()" style="max-height:80px;max-width:200px;object-fit:contain;border-radius:4px;border:1px solid var(--border)" />
          <button type="button" class="btn-remove" (click)="quitar()" title="Quitar imagen">×</button>
        </div>
      }
      <div class="upload-row">
        <label class="btn btn-secondary btn-sm upload-label">
          @if (uploading()) { <span class="spinner"></span> Subiendo... }
          @else { 📎 {{ currentUrl() ? 'Cambiar' : 'Subir ' + label() }} }
          <input
            type="file"
            [accept]="accept()"
            style="display:none"
            (change)="onFile($event)"
            [disabled]="uploading()"
          />
        </label>
        @if (error()) {
          <span class="error-msg" style="font-size:.8rem">{{ error() }}</span>
        }
      </div>
      <div style="font-size:.75rem;color:var(--muted);margin-top:.25rem">
        Máx. 500 KB · JPG, PNG, WebP{{ isFavicon() ? ', ICO' : '' }}
      </div>
    </div>
  `,
  styles: [`
    .image-upload-wrap { display: flex; flex-direction: column; gap: .5rem; }
    .image-preview { display: flex; align-items: center; gap: .75rem; }
    .btn-remove {
      background: none; border: 1px solid var(--border); border-radius: 50%;
      width: 22px; height: 22px; cursor: pointer; font-size: 1rem; line-height: 1;
      color: var(--muted); display: flex; align-items: center; justify-content: center;
      padding: 0;
    }
    .btn-remove:hover { border-color: #dc3545; color: #dc3545; }
    .upload-row { display: flex; align-items: center; gap: .75rem; flex-wrap: wrap; }
    .upload-label { cursor: pointer; display: inline-flex; align-items: center; gap: .4rem; }
  `]
})
export class ImageUploadComponent {
  label = input<string>('imagen');
  accept = input<string>('image/jpeg,image/png,image/webp,image/gif');
  currentUrl = input<string | null>(null);
  urlChange = output<string | null>();

  private http = inject(HttpClient);
  uploading = signal(false);
  error = signal<string | null>(null);

  isFavicon = () => this.accept().includes('icon');

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.error.set(null);

    if (file.size > 512 * 1024) {
      this.error.set(`Archivo demasiado grande (${Math.round(file.size / 1024)} KB). Máx 500 KB.`);
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.uploading.set(true);
      this.http.post<{ url: string }>(`${environment.apiUrl}/api/dashboard/upload`, {
        base64,
        contentType: file.type
      }).subscribe({
        next: (res) => {
          this.uploading.set(false);
          this.urlChange.emit(res.url);
          input.value = '';
        },
        error: (err) => {
          this.uploading.set(false);
          const msg = err.error?.message ?? 'Error al subir la imagen.';
          this.error.set(msg);
          input.value = '';
        }
      });
    };
    reader.readAsDataURL(file);
  }

  quitar(): void {
    this.urlChange.emit(null);
  }
}
