import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message: string;
  type: 'danger' | 'primary';
  confirmLabel?: string;
}

@Injectable({ providedIn: 'root' })
export class ConfirmModalService {
  isOpen = signal(false);
  options = signal<ConfirmOptions>({ title: '', message: '', type: 'primary' });
  private resolveFn: ((v: boolean) => void) | null = null;

  ask(opts: ConfirmOptions): Promise<boolean> {
    this.options.set(opts);
    this.isOpen.set(true);
    return new Promise(res => { this.resolveFn = res; });
  }

  resolve(value: boolean): void {
    this.isOpen.set(false);
    this.resolveFn?.(value);
    this.resolveFn = null;
  }
}
