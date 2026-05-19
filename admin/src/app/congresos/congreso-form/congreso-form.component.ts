import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { CongresoService } from '../congreso.service';
import { CreateCongresoDto, UpdateCongresoDto, OrganizadorDto, FechaImportanteDto, EjeTematicoDto, SeccionConfigDto } from '../congreso.model';
import { ImageUploadComponent } from '../../shared/image-upload/image-upload.component';
import { ToastService } from '../../core/toast.service';
import { TopbarComponent } from '../../shared/topbar/topbar.component';

interface ArancelFila { tempId: string; categoria: string; monto: string; }

/** Cross-field validator: fechaFin must be >= fechaInicio */
function fechasValidator(group: AbstractControl): ValidationErrors | null {
  const inicio = group.get('fechaInicio')?.value as string | null;
  const fin = group.get('fechaFin')?.value as string | null;
  if (inicio && fin && fin < inicio) {
    return { fechaFinAnterior: true };
  }
  return null;
}

/** Derive a URL-safe slug from a display name */
function slugFromNombre(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

@Component({
  selector: 'app-congreso-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ImageUploadComponent, TopbarComponent],
  template: `
    <div class="page-shell">
      <app-topbar>
        @if (id) {
          <span class="badge badge-{{ congresoEstado().toLowerCase() }}">{{ congresoEstado() }}</span>
        }
        <a [routerLink]="id ? ['/congreso', id] : ['/dashboard']" class="btn btn-secondary btn-sm">← Volver</a>
      </app-topbar>

      <div class="page-body">
        <div class="page-header">
          <div class="page-title">
            <h2>{{ id ? 'Configurar congreso' : 'Nuevo congreso' }}</h2>
            <p>{{ id ? 'Editá los datos de tu evento' : 'Completá la información para crear tu congreso' }}</p>
          </div>
        </div>

        @if (loadError()) {
          <div class="error-banner">
            No se pudo cargar el congreso. <a routerLink="/dashboard">Volver al dashboard</a>
          </div>
        } @else {
          <form [formGroup]="form" (ngSubmit)="onSubmit()">

            <!-- Información general -->
            <!-- Título / Hero -->
            <div class="card" style="margin-bottom:1.25rem">
              <h3 style="margin-bottom:1.25rem;padding-bottom:1rem;border-bottom:1px solid var(--border)">Título del congreso</h3>
              <div class="form-group" style="margin-bottom:1rem">
                <label for="nombre">Nombre <span class="required">*</span></label>
                <input id="nombre" type="text" formControlName="nombre" class="form-control" placeholder="Nombre del congreso" />
                @if (f['nombre'].touched && f['nombre'].errors?.['required']) {
                  <div class="error-msg">El nombre es requerido.</div>
                }
              </div>
              <div class="form-group" style="margin-bottom:1rem">
                <label for="subtitulo">Subtítulo <span style="font-size:.78rem;color:var(--muted);font-weight:400">(línea 2 del título, ej: "XLVI Reunión del Capítulo...")</span></label>
                <input id="subtitulo" type="text" formControlName="subtitulo" class="form-control" placeholder="Subtítulo que aparece bajo el nombre principal (opcional)" />
              </div>
              <div class="form-group" style="margin-bottom:1rem">
                <label for="lema">Lema <span style="font-size:.78rem;color:var(--muted);font-weight:400">(frase en cursiva bajo el subtítulo en el sitio)</span></label>
                <input id="lema" type="text" formControlName="lema" class="form-control" placeholder='"Composición de alimentos: clave para la seguridad alimentaria..."' />
              </div>
              <div class="form-group" style="margin-bottom:1rem">
                <label for="slug">Slug (subdominio) <span class="required">*</span></label>
                <input id="slug" type="text" formControlName="slug" class="form-control" placeholder="mi-congreso" (input)="onSlugInput()" />
                @if (f['slug'].touched && f['slug'].errors?.['required']) {
                  <div class="error-msg">El slug es requerido.</div>
                }
                @if (f['slug'].touched && f['slug'].errors?.['pattern']) {
                  <div class="error-msg">Solo letras minúsculas, números y guiones (3-50 caracteres).</div>
                }
                @if (slugConflict()) {
                  <div class="error-msg">Este slug ya está en uso. Elegí otro.</div>
                }
                @if (form.get('slug')?.disabled) {
                  <div class="hint" style="font-size:.8rem;color:var(--muted)">El slug no se puede cambiar en congresos publicados o finalizados.</div>
                }
              </div>
              <div class="form-row" style="margin-bottom:1rem">
                <div class="form-group">
                  <label for="fechaInicio">Fecha inicio <span class="required">*</span></label>
                  <input id="fechaInicio" type="date" formControlName="fechaInicio" class="form-control" />
                  @if (f['fechaInicio'].touched && f['fechaInicio'].errors?.['required']) {
                    <div class="error-msg">La fecha de inicio es requerida.</div>
                  }
                </div>
                <div class="form-group">
                  <label for="fechaFin">Fecha fin <span class="required">*</span></label>
                  <input id="fechaFin" type="date" formControlName="fechaFin" class="form-control" />
                  @if (f['fechaFin'].touched && f['fechaFin'].errors?.['required']) {
                    <div class="error-msg">La fecha de fin es requerida.</div>
                  }
                </div>
              </div>
              @if (form.errors?.['fechaFinAnterior'] && (f['fechaFin'].touched || f['fechaInicio'].touched)) {
                <div class="error-msg" style="margin-bottom:.75rem">La fecha de fin debe ser igual o posterior a la fecha de inicio.</div>
              }
              @if (fechasError()) {
                <div class="error-msg" style="margin-bottom:.75rem">{{ fechasError() }}</div>
              }
              @if (id) {
                <div style="margin-top:.75rem;display:flex;align-items:center;gap:.75rem;flex-wrap:wrap;padding:.5rem .875rem;background:var(--bg-alt);border-radius:8px;border:1px solid var(--border)">
                  <span style="font-size:.68rem;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;white-space:nowrap">Hero</span>
                  <div style="width:1px;height:14px;background:var(--border)"></div>
                  <label style="display:flex;align-items:center;gap:.35rem;font-size:.78rem;color:var(--muted);cursor:pointer">
                    Fondo
                    <input type="color" [value]="getSeccionBg('hero') || '#1a1a2e'" (change)="upsertSeccion('hero','bgColor',$any($event.target).value)" style="width:26px;height:22px;padding:1px;border:1px solid var(--border);border-radius:4px;cursor:pointer" />
                    @if (getSeccionBg('hero')) { <button type="button" (click)="upsertSeccion('hero','bgColor','')" style="background:none;border:none;font-size:.7rem;color:var(--muted);cursor:pointer;padding:0;line-height:1" title="Restablecer">✕</button> }
                  </label>
                  <label style="display:flex;align-items:center;gap:.35rem;font-size:.78rem;color:var(--muted);cursor:pointer">
                    Texto
                    <input type="color" [value]="getSeccionText('hero') || '#ffffff'" (change)="upsertSeccion('hero','textoColor',$any($event.target).value)" style="width:26px;height:22px;padding:1px;border:1px solid var(--border);border-radius:4px;cursor:pointer" />
                    @if (getSeccionText('hero')) { <button type="button" (click)="upsertSeccion('hero','textoColor','')" style="background:none;border:none;font-size:.7rem;color:var(--muted);cursor:pointer;padding:0;line-height:1" title="Restablecer">✕</button> }
                  </label>
                  <label style="display:flex;align-items:center;gap:.35rem;font-size:.78rem;color:var(--muted)">
                    Texto
                    <input type="number" min="8" max="72" [value]="getSeccionFontSizePx('hero')"
                      (change)="upsertSeccion('hero','fontSize',$any($event.target).value ? $any($event.target).value+'px' : null)"
                      placeholder="auto" style="width:52px;font-size:.78rem;padding:2px 5px;border:1px solid var(--border);border-radius:4px;height:22px;background:var(--surface2);color:var(--text)" /> px
                  </label>
                  <label style="display:flex;align-items:center;gap:.35rem;font-size:.78rem;color:var(--muted)">
                    Padding
                    <input type="number" min="0" max="200" [value]="getSeccionPaddingV('hero')"
                      (change)="upsertSeccion('hero','paddingV',+$any($event.target).value || null)"
                      placeholder="auto" style="width:52px;font-size:.78rem;padding:2px 5px;border:1px solid var(--border);border-radius:4px;height:22px;background:var(--surface2);color:var(--text)" /> px
                  </label>
                </div>
              }
            </div>

            <!-- Descripción -->
            <div class="card" style="margin-bottom:1.25rem">
              <h3 style="margin-bottom:1.25rem;padding-bottom:1rem;border-bottom:1px solid var(--border)">Descripción</h3>
              <div class="form-group" style="margin-bottom:1rem">
                <label for="descripcion">Texto de descripción</label>
                <textarea id="descripcion" formControlName="descripcion" class="form-control" rows="4" placeholder="Descripción del congreso (opcional)"></textarea>
              </div>
              @if (id) {
                <div style="margin-top:.75rem;display:flex;align-items:center;gap:.75rem;flex-wrap:wrap;padding:.5rem .875rem;background:var(--bg-alt);border-radius:8px;border:1px solid var(--border)">
                  <span style="font-size:.68rem;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;white-space:nowrap">Descripción</span>
                  <div style="width:1px;height:14px;background:var(--border)"></div>
                  <label style="display:flex;align-items:center;gap:.35rem;font-size:.78rem;color:var(--muted);cursor:pointer">
                    Fondo
                    <input type="color" [value]="getSeccionBg('descripcion') || '#f8fafc'" (change)="upsertSeccion('descripcion','bgColor',$any($event.target).value)" style="width:26px;height:22px;padding:1px;border:1px solid var(--border);border-radius:4px;cursor:pointer" />
                    @if (getSeccionBg('descripcion')) { <button type="button" (click)="upsertSeccion('descripcion','bgColor','')" style="background:none;border:none;font-size:.7rem;color:var(--muted);cursor:pointer;padding:0;line-height:1" title="Restablecer">✕</button> }
                  </label>
                  <label style="display:flex;align-items:center;gap:.35rem;font-size:.78rem;color:var(--muted);cursor:pointer">
                    Texto
                    <input type="color" [value]="getSeccionText('descripcion') || '#334155'" (change)="upsertSeccion('descripcion','textoColor',$any($event.target).value)" style="width:26px;height:22px;padding:1px;border:1px solid var(--border);border-radius:4px;cursor:pointer" />
                    @if (getSeccionText('descripcion')) { <button type="button" (click)="upsertSeccion('descripcion','textoColor','')" style="background:none;border:none;font-size:.7rem;color:var(--muted);cursor:pointer;padding:0;line-height:1" title="Restablecer">✕</button> }
                  </label>
                  <label style="display:flex;align-items:center;gap:.35rem;font-size:.78rem;color:var(--muted)">
                    Texto
                    <input type="number" min="8" max="72" [value]="getSeccionFontSizePx('descripcion')"
                      (change)="upsertSeccion('descripcion','fontSize',$any($event.target).value ? $any($event.target).value+'px' : null)"
                      placeholder="auto" style="width:52px;font-size:.78rem;padding:2px 5px;border:1px solid var(--border);border-radius:4px;height:22px;background:var(--surface2);color:var(--text)" /> px
                  </label>
                  <label style="display:flex;align-items:center;gap:.35rem;font-size:.78rem;color:var(--muted)">
                    Padding
                    <input type="number" min="0" max="200" [value]="getSeccionPaddingV('descripcion')"
                      (change)="upsertSeccion('descripcion','paddingV',+$any($event.target).value || null)"
                      placeholder="auto" style="width:52px;font-size:.78rem;padding:2px 5px;border:1px solid var(--border);border-radius:4px;height:22px;background:var(--surface2);color:var(--text)" /> px
                  </label>
                </div>
              }
            </div>

            <!-- Branding -->
            <div class="card" style="margin-bottom:1.25rem">
              <h3 style="margin-bottom:1.25rem;padding-bottom:1rem;border-bottom:1px solid var(--border)">Branding</h3>
              <div class="form-row" style="margin-bottom:1rem">
                <div class="form-group">
                  <label>Logo principal</label>
                  <app-image-upload
                    label="logo"
                    [currentUrl]="logoUrl()"
                    (urlChange)="logoUrl.set($event)" />
                </div>
                <div class="form-group">
                  <label>Logo secundario</label>
                  <app-image-upload
                    label="logo secundario"
                    [currentUrl]="logoSecundarioUrl()"
                    (urlChange)="logoSecundarioUrl.set($event)" />
                </div>
              </div>
              <div class="form-group" style="margin-bottom:1rem">
                <label>Banner</label>
                <app-image-upload
                  label="banner"
                  [currentUrl]="bannerUrl()"
                  (urlChange)="bannerUrl.set($event)" />
                <div style="margin-top:.5rem;display:flex;gap:1rem;align-items:center">
                  <label style="font-weight:600;font-size:.875rem;margin:0">Modo:</label>
                  <label style="display:flex;align-items:center;gap:.3rem;font-size:.875rem;cursor:pointer">
                    <input type="radio" name="bannerModo" value="fondo" [checked]="bannerModo()==='fondo'" (change)="bannerModo.set('fondo')" />
                    Fondo oscuro (con overlay)
                  </label>
                  <label style="display:flex;align-items:center;gap:.3rem;font-size:.875rem;cursor:pointer">
                    <input type="radio" name="bannerModo" value="decorativo" [checked]="bannerModo()==='decorativo'" (change)="bannerModo.set('decorativo')" />
                    Imagen decorativa (hero claro)
                  </label>
                </div>
              </div>
              <div class="form-group" style="margin-bottom:1rem">
                <label>Favicon</label>
                <app-image-upload
                  label="favicon"
                  accept="image/jpeg,image/png,image/webp,image/x-icon,image/vnd.microsoft.icon"
                  [currentUrl]="faviconUrl()"
                  (urlChange)="faviconUrl.set($event)" />
              </div>
              <div class="form-row" style="margin-bottom:1rem">
                <div class="form-group">
                  <label for="colorPrimario">Color primario</label>
                  <div style="display:flex;align-items:center;gap:.5rem">
                    <input type="color"
                      [value]="f['colorPrimario'].value || '#1a1a2e'"
                      (input)="f['colorPrimario'].setValue($any($event.target).value)"
                      style="width:42px;height:38px;padding:2px;border:1px solid var(--border);border-radius:6px;cursor:pointer;flex-shrink:0" />
                    <input id="colorPrimario" type="text" formControlName="colorPrimario" class="form-control" placeholder="#rrggbb" maxlength="7" />
                  </div>
                  @if (f['colorPrimario'].errors?.['maxlength']) {
                    <div class="error-msg">Máximo 7 caracteres.</div>
                  }
                </div>
                <div class="form-group">
                  <label for="colorSecundario">Color secundario</label>
                  <div style="display:flex;align-items:center;gap:.5rem">
                    <input type="color"
                      [value]="f['colorSecundario'].value || '#16213e'"
                      (input)="f['colorSecundario'].setValue($any($event.target).value)"
                      style="width:42px;height:38px;padding:2px;border:1px solid var(--border);border-radius:6px;cursor:pointer;flex-shrink:0" />
                    <input id="colorSecundario" type="text" formControlName="colorSecundario" class="form-control" placeholder="#rrggbb" maxlength="7" />
                  </div>
                  @if (f['colorSecundario'].errors?.['maxlength']) {
                    <div class="error-msg">Máximo 7 caracteres.</div>
                  }
                </div>
              </div>
              <div class="form-group">
                <label for="tipografia">Tipografía</label>
                <input id="tipografia" type="text" formControlName="tipografia" class="form-control" placeholder="Inter, Roboto..." maxlength="100" />
                @if (f['tipografia'].errors?.['maxlength']) {
                  <div class="error-msg">Máximo 100 caracteres.</div>
                }
              </div>
            </div>

            <!-- Sede -->
            <div class="card" style="margin-bottom:1.25rem">
              <h3 style="margin-bottom:1.25rem;padding-bottom:1rem;border-bottom:1px solid var(--border)">Sede del evento</h3>
              <div class="form-group" style="margin-bottom:1rem">
                <label for="venueNombre">Nombre del lugar</label>
                <input id="venueNombre" type="text" formControlName="venueNombre" class="form-control" placeholder="Ej. Centro de Convenciones" />
              </div>
              <div class="form-group" style="margin-bottom:1rem">
                <label for="venueDireccion">Dirección</label>
                <input id="venueDireccion" type="text" formControlName="venueDireccion" class="form-control" placeholder="Calle y número, ciudad" />
              </div>
              <div class="form-group">
                <label for="venueLinkMaps">Link de Google Maps</label>
                <input id="venueLinkMaps" type="url" formControlName="venueLinkMaps" class="form-control" placeholder="https://maps.google.com/..." />
              </div>
            </div>

            <!-- Sitio público -->
            @if (id) {
              <div class="card" style="margin-bottom:1.25rem">
                <h3 style="margin-bottom:1.25rem;padding-bottom:1rem;border-bottom:1px solid var(--border)">Sitio público</h3>

                <!-- Acordeón: Fechas importantes -->
                <div style="border:1px solid var(--border);border-radius:8px;overflow:hidden;margin-bottom:.625rem">
                  <div style="display:flex;align-items:center;gap:.75rem;padding:.75rem 1rem;background:var(--bg-alt);cursor:pointer;user-select:none" (click)="toggleSection('fechas')">
                    <input type="checkbox" formControlName="mostrarFechas" style="width:16px;height:16px;cursor:pointer;accent-color:var(--primary);flex-shrink:0" />
                    <span style="flex:1;font-weight:600">Fechas importantes</span>
                    <span style="color:var(--muted);font-size:1rem;pointer-events:none;line-height:1">{{ isSectionExpanded('fechas') ? '▴' : '▾' }}</span>
                  </div>
                  @if (isSectionExpanded('fechas')) {
                    <div style="padding:1rem">
                      @for (fecha of fechasImportantes(); track fecha.id) {
                        <div style="display:flex;gap:.5rem;align-items:center;margin-bottom:.5rem;flex-wrap:wrap">
                          <input type="text" [value]="fecha.descripcion" (blur)="updateFecha(fecha, 'descripcion', $any($event.target).value)" class="form-control" placeholder="Descripción" style="flex:2;min-width:160px" />
                          <input type="date" [value]="fecha.fecha" (blur)="updateFecha(fecha, 'fecha', $any($event.target).value)" class="form-control" style="flex:1;min-width:130px" />
                          <input type="date" [value]="fecha.fechaFin ?? ''" (blur)="updateFecha(fecha, 'fechaFin', $any($event.target).value || null)" class="form-control" placeholder="Fecha fin (opc.)" style="flex:1;min-width:130px" />
                          <button type="button" (click)="deleteFecha(fecha.id)" class="btn btn-secondary btn-sm" style="color:var(--danger);border-color:var(--danger);flex-shrink:0">✕</button>
                        </div>
                      }
                      @if (fechasImportantes().length === 0) {
                        <p style="color:var(--muted);font-size:.875rem;margin-bottom:.75rem">Sin fechas aún.</p>
                      }
                      <button type="button" class="btn btn-secondary btn-sm" (click)="addFecha()">+ Agregar fecha</button>
                      <div style="margin-top:1rem;display:flex;align-items:center;gap:.75rem;flex-wrap:wrap;padding:.5rem .875rem;background:var(--bg-alt);border-radius:8px;border:1px solid var(--border)">
                        <span style="font-size:.68rem;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;white-space:nowrap">Apariencia</span>
                        <div style="width:1px;height:14px;background:var(--border)"></div>
                        <label style="display:flex;align-items:center;gap:.35rem;font-size:.78rem;color:var(--muted);cursor:pointer">
                          Fondo
                          <input type="color" [value]="getSeccionBg('fechas') || '#16213e'" (change)="upsertSeccion('fechas','bgColor',$any($event.target).value)" style="width:26px;height:22px;padding:1px;border:1px solid var(--border);border-radius:4px;cursor:pointer" />
                          @if (getSeccionBg('fechas')) { <button type="button" (click)="upsertSeccion('fechas','bgColor','')" style="background:none;border:none;font-size:.7rem;color:var(--muted);cursor:pointer;padding:0;line-height:1" title="Restablecer">✕</button> }
                        </label>
                        <label style="display:flex;align-items:center;gap:.35rem;font-size:.78rem;color:var(--muted);cursor:pointer">
                          Texto
                          <input type="color" [value]="getSeccionText('fechas') || '#ffffff'" (change)="upsertSeccion('fechas','textoColor',$any($event.target).value)" style="width:26px;height:22px;padding:1px;border:1px solid var(--border);border-radius:4px;cursor:pointer" />
                          @if (getSeccionText('fechas')) { <button type="button" (click)="upsertSeccion('fechas','textoColor','')" style="background:none;border:none;font-size:.7rem;color:var(--muted);cursor:pointer;padding:0;line-height:1" title="Restablecer">✕</button> }
                        </label>
                        <label style="display:flex;align-items:center;gap:.35rem;font-size:.78rem;color:var(--muted)">
                          Texto
                          <input type="number" min="8" max="72" [value]="getSeccionFontSizePx('fechas')"
                            (change)="upsertSeccion('fechas','fontSize',$any($event.target).value ? $any($event.target).value+'px' : null)"
                            placeholder="auto" style="width:52px;font-size:.78rem;padding:2px 5px;border:1px solid var(--border);border-radius:4px;height:22px;background:var(--surface2);color:var(--text)" /> px
                        </label>
                        <label style="display:flex;align-items:center;gap:.35rem;font-size:.78rem;color:var(--muted)">
                          Padding
                          <input type="number" min="0" max="200" [value]="getSeccionPaddingV('fechas')"
                            (change)="upsertSeccion('fechas','paddingV',+$any($event.target).value || null)"
                            placeholder="auto" style="width:52px;font-size:.78rem;padding:2px 5px;border:1px solid var(--border);border-radius:4px;height:22px;background:var(--surface2);color:var(--text)" /> px
                        </label>
                      </div>
                    </div>
                  }
                </div>

                <!-- Acordeón: Organizado por -->
                <div style="border:1px solid var(--border);border-radius:8px;overflow:hidden;margin-bottom:.625rem">
                  <div style="display:flex;align-items:center;gap:.75rem;padding:.75rem 1rem;background:var(--bg-alt);cursor:pointer;user-select:none" (click)="toggleSection('organizadores')">
                    <input type="checkbox" formControlName="mostrarOrganizadores" style="width:16px;height:16px;cursor:pointer;accent-color:var(--primary);flex-shrink:0" />
                    <span style="flex:1;font-weight:600">Organizado por</span>
                    <span style="color:var(--muted);font-size:1rem;pointer-events:none;line-height:1">{{ isSectionExpanded('organizadores') ? '▴' : '▾' }}</span>
                  </div>
                  @if (isSectionExpanded('organizadores')) {
                    <div style="padding:1rem">
                      @for (org of organizadores(); track org.id) {
                        <div style="padding:.75rem;border:1px solid var(--border);border-radius:8px;margin-bottom:.625rem">
                          <div style="display:flex;gap:.5rem;align-items:center;margin-bottom:.75rem">
                            <input type="number" [value]="org.orden" (blur)="updateOrg(org, 'orden', +$any($event.target).value)" class="form-control" placeholder="#" style="width:60px;flex-shrink:0" title="Orden de aparición" />
                            <input type="text" [value]="org.nombre" (blur)="updateOrg(org, 'nombre', $any($event.target).value)" class="form-control" placeholder="Nombre del organizador" style="flex:1" />
                            <button type="button" (click)="deleteOrg(org.id)" class="btn btn-secondary btn-sm" style="color:var(--danger);border-color:var(--danger);flex-shrink:0">✕</button>
                          </div>
                          <div>
                            <p style="font-size:.8rem;color:var(--muted);margin-bottom:.35rem">Logo (se muestra 120×60px, object-contain)</p>
                            <app-image-upload
                              label="logo organizador"
                              [currentUrl]="org.logoUrl ?? null"
                              (urlChange)="updateOrg(org, 'logoUrl', $event)" />
                          </div>
                        </div>
                      }
                      @if (organizadores().length === 0) {
                        <p style="color:var(--muted);font-size:.875rem;margin-bottom:.75rem">Sin organizadores aún.</p>
                      }
                      <button type="button" class="btn btn-secondary btn-sm" (click)="addOrg()">+ Agregar organizador</button>
                      <div style="margin-top:1rem;display:flex;align-items:center;gap:.75rem;flex-wrap:wrap;padding:.5rem .875rem;background:var(--bg-alt);border-radius:8px;border:1px solid var(--border)">
                        <span style="font-size:.68rem;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;white-space:nowrap">Apariencia</span>
                        <div style="width:1px;height:14px;background:var(--border)"></div>
                        <label style="display:flex;align-items:center;gap:.35rem;font-size:.78rem;color:var(--muted);cursor:pointer">
                          Fondo
                          <input type="color" [value]="getSeccionBg('organizadores') || '#ffffff'" (change)="upsertSeccion('organizadores','bgColor',$any($event.target).value)" style="width:26px;height:22px;padding:1px;border:1px solid var(--border);border-radius:4px;cursor:pointer" />
                          @if (getSeccionBg('organizadores')) { <button type="button" (click)="upsertSeccion('organizadores','bgColor','')" style="background:none;border:none;font-size:.7rem;color:var(--muted);cursor:pointer;padding:0;line-height:1" title="Restablecer">✕</button> }
                        </label>
                        <label style="display:flex;align-items:center;gap:.35rem;font-size:.78rem;color:var(--muted);cursor:pointer">
                          Texto
                          <input type="color" [value]="getSeccionText('organizadores') || '#1e293b'" (change)="upsertSeccion('organizadores','textoColor',$any($event.target).value)" style="width:26px;height:22px;padding:1px;border:1px solid var(--border);border-radius:4px;cursor:pointer" />
                          @if (getSeccionText('organizadores')) { <button type="button" (click)="upsertSeccion('organizadores','textoColor','')" style="background:none;border:none;font-size:.7rem;color:var(--muted);cursor:pointer;padding:0;line-height:1" title="Restablecer">✕</button> }
                        </label>
                        <label style="display:flex;align-items:center;gap:.35rem;font-size:.78rem;color:var(--muted)">
                          Altura logos
                          <input type="number" min="24" max="160" [value]="getSeccionLogoAltura('organizadores')"
                            (change)="upsertSeccion('organizadores','logoAltura',+$any($event.target).value || null)"
                            style="width:54px;font-size:.78rem;padding:2px 5px;border:1px solid var(--border);border-radius:4px;height:22px;background:var(--surface2);color:var(--text)" /> px
                        </label>
                        <label style="display:flex;align-items:center;gap:.35rem;font-size:.78rem;color:var(--muted)">
                          Col/fila
                          <input type="number" min="1" max="8" [value]="getSeccionLogoColumnas('organizadores')"
                            (change)="upsertSeccion('organizadores','logoColumnas',+$any($event.target).value || null)"
                            placeholder="auto" style="width:44px;font-size:.78rem;padding:2px 5px;border:1px solid var(--border);border-radius:4px;height:22px;background:var(--surface2);color:var(--text)" />
                        </label>
                        <label style="display:flex;align-items:center;gap:.35rem;font-size:.78rem;color:var(--muted)">
                          Padding
                          <input type="number" min="0" max="200" [value]="getSeccionPaddingV('organizadores')"
                            (change)="upsertSeccion('organizadores','paddingV',+$any($event.target).value || null)"
                            placeholder="auto" style="width:52px;font-size:.78rem;padding:2px 5px;border:1px solid var(--border);border-radius:4px;height:22px;background:var(--surface2);color:var(--text)" /> px
                        </label>
                      </div>
                    </div>
                  }
                </div>

                <!-- Acordeón: Descripción y ejes -->
                <div style="border:1px solid var(--border);border-radius:8px;overflow:hidden;margin-bottom:.625rem">
                  <div style="display:flex;align-items:center;gap:.75rem;padding:.75rem 1rem;background:var(--bg-alt);cursor:pointer;user-select:none" (click)="toggleSection('descripcion')">
                    <input type="checkbox" formControlName="mostrarDescripcion" style="width:16px;height:16px;cursor:pointer;accent-color:var(--primary);flex-shrink:0" />
                    <span style="flex:1;font-weight:600">Descripción y ejes temáticos</span>
                    <span style="color:var(--muted);font-size:1rem;pointer-events:none;line-height:1">{{ isSectionExpanded('descripcion') ? '▴' : '▾' }}</span>
                  </div>
                  @if (isSectionExpanded('descripcion')) {
                    <div style="padding:1rem">
                      <p style="font-size:.8rem;color:var(--muted);margin-bottom:.75rem">La descripción y sus colores se configuran en la card "Descripción" de arriba.</p>
                      <div style="display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:.75rem">
                        @for (eje of ejesTematicos(); track eje.id) {
                          <span style="display:inline-flex;align-items:center;gap:.4rem;background:var(--primary);color:#fff;padding:4px 12px;border-radius:999px;font-size:.85rem">
                            {{ eje.nombre }}
                            <button type="button" (click)="deleteEje(eje.id)" style="background:none;border:none;color:#fff;cursor:pointer;padding:0;line-height:1;font-size:1rem;opacity:.8">&times;</button>
                          </span>
                        }
                        @if (ejesTematicos().length === 0) {
                          <span style="color:var(--muted);font-size:.875rem">Sin ejes temáticos.</span>
                        }
                      </div>
                      <div style="display:flex;gap:.5rem">
                        <input type="text" #nuevoEjeInput [value]="nuevoEje" (input)="nuevoEje=$any($event.target).value" class="form-control" placeholder="Ej. Nutrición y salud" (keydown.enter)="$event.preventDefault();addEje(nuevoEjeInput)" style="max-width:320px" />
                        <button type="button" class="btn btn-secondary btn-sm" (click)="addEje(nuevoEjeInput)">+ Agregar</button>
                      </div>
                    </div>
                  }
                </div>

                <!-- Acordeón: Contacto -->
                <div style="border:1px solid var(--border);border-radius:8px;overflow:hidden;margin-bottom:.625rem">
                  <div style="display:flex;align-items:center;gap:.75rem;padding:.75rem 1rem;background:var(--bg-alt);cursor:pointer;user-select:none" (click)="toggleSection('contacto')">
                    <input type="checkbox" formControlName="mostrarContacto" style="width:16px;height:16px;cursor:pointer;accent-color:var(--primary);flex-shrink:0" />
                    <span style="flex:1;font-weight:600">Contacto / Informes</span>
                    <span style="color:var(--muted);font-size:1rem;pointer-events:none;line-height:1">{{ isSectionExpanded('contacto') ? '▴' : '▾' }}</span>
                  </div>
                  @if (isSectionExpanded('contacto')) {
                    <div style="padding:1rem">
                      <div class="form-row" style="margin-bottom:1rem">
                        <div class="form-group">
                          <label for="emailContacto">Email de contacto</label>
                          <input id="emailContacto" type="email" formControlName="emailContacto" class="form-control" placeholder="info@congreso.com" />
                        </div>
                        <div class="form-group">
                          <label for="instagram">Instagram</label>
                          <div style="display:flex;align-items:center;border:1px solid var(--border);border-radius:8px;overflow:hidden">
                            <span style="padding:0 .75rem;background:var(--bg-alt);color:var(--muted);font-size:.9rem;border-right:1px solid var(--border);height:100%;display:flex;align-items:center">&#64;</span>
                            <input id="instagram" type="text" formControlName="instagram" class="form-control" placeholder="congreso_oficial" style="border:none;border-radius:0" />
                          </div>
                        </div>
                      </div>
                      <div class="form-group" style="margin-bottom:1rem">
                        <label for="contactoAdicional">Información adicional</label>
                        <textarea id="contactoAdicional" formControlName="contactoAdicional" class="form-control" rows="3"
                          placeholder="Ej. También podés consultar en Tesorería, Oficina 12, lunes a viernes 9-17hs"></textarea>
                      </div>
                      <div style="margin-top:1rem;display:flex;align-items:center;gap:.75rem;flex-wrap:wrap;padding:.5rem .875rem;background:var(--bg-alt);border-radius:8px;border:1px solid var(--border)">
                        <span style="font-size:.68rem;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;white-space:nowrap">Apariencia</span>
                        <div style="width:1px;height:14px;background:var(--border)"></div>
                        <label style="display:flex;align-items:center;gap:.35rem;font-size:.78rem;color:var(--muted);cursor:pointer">
                          Fondo
                          <input type="color" [value]="getSeccionBg('contacto') || '#1a1a2e'" (change)="upsertSeccion('contacto','bgColor',$any($event.target).value)" style="width:26px;height:22px;padding:1px;border:1px solid var(--border);border-radius:4px;cursor:pointer" />
                          @if (getSeccionBg('contacto')) { <button type="button" (click)="upsertSeccion('contacto','bgColor','')" style="background:none;border:none;font-size:.7rem;color:var(--muted);cursor:pointer;padding:0;line-height:1" title="Restablecer">✕</button> }
                        </label>
                        <label style="display:flex;align-items:center;gap:.35rem;font-size:.78rem;color:var(--muted);cursor:pointer">
                          Texto
                          <input type="color" [value]="getSeccionText('contacto') || '#ffffff'" (change)="upsertSeccion('contacto','textoColor',$any($event.target).value)" style="width:26px;height:22px;padding:1px;border:1px solid var(--border);border-radius:4px;cursor:pointer" />
                          @if (getSeccionText('contacto')) { <button type="button" (click)="upsertSeccion('contacto','textoColor','')" style="background:none;border:none;font-size:.7rem;color:var(--muted);cursor:pointer;padding:0;line-height:1" title="Restablecer">✕</button> }
                        </label>
                        <label style="display:flex;align-items:center;gap:.35rem;font-size:.78rem;color:var(--muted)">
                          Texto
                          <input type="number" min="8" max="72" [value]="getSeccionFontSizePx('contacto')"
                            (change)="upsertSeccion('contacto','fontSize',$any($event.target).value ? $any($event.target).value+'px' : null)"
                            placeholder="auto" style="width:52px;font-size:.78rem;padding:2px 5px;border:1px solid var(--border);border-radius:4px;height:22px;background:var(--surface2);color:var(--text)" /> px
                        </label>
                        <label style="display:flex;align-items:center;gap:.35rem;font-size:.78rem;color:var(--muted)">
                          Padding
                          <input type="number" min="0" max="200" [value]="getSeccionPaddingV('contacto')"
                            (change)="upsertSeccion('contacto','paddingV',+$any($event.target).value || null)"
                            placeholder="auto" style="width:52px;font-size:.78rem;padding:2px 5px;border:1px solid var(--border);border-radius:4px;height:22px;background:var(--surface2);color:var(--text)" /> px
                        </label>
                      </div>
                    </div>
                  }
                </div>

                <!-- Acordeón: Inscripciones -->
                <div style="border:1px solid var(--border);border-radius:8px;overflow:hidden;margin-bottom:.625rem">
                  <div style="display:flex;align-items:center;gap:.75rem;padding:.75rem 1rem;background:var(--bg-alt);cursor:pointer;user-select:none" (click)="toggleSection('inscripciones')">
                    <input type="checkbox" formControlName="mostrarInscripciones" style="width:16px;height:16px;cursor:pointer;accent-color:var(--primary);flex-shrink:0" />
                    <span style="flex:1;font-weight:600">Inscripciones <small style="font-weight:400;color:var(--muted);margin-left:.35rem">(tab en el sitio)</small></span>
                    <span style="color:var(--muted);font-size:1rem;pointer-events:none;line-height:1">{{ isSectionExpanded('inscripciones') ? '▴' : '▾' }}</span>
                  </div>
                  @if (isSectionExpanded('inscripciones')) {
                    <div style="padding:1rem">
                      <div class="form-group" style="margin-bottom:1.25rem">
                        <label for="formularioInscripcionUrl">Link de inscripción (formulario externo)</label>
                        <input id="formularioInscripcionUrl" type="url" formControlName="formularioInscripcionUrl" class="form-control" placeholder="https://forms.gle/..." />
                      </div>
                      <!-- Tabla de aranceles -->
                      <label style="font-size:.875rem;font-weight:600;display:block;margin-bottom:.5rem">Aranceles</label>
                      <div style="border:1px solid var(--border);border-radius:8px;overflow:hidden;margin-bottom:.75rem">
                        <div style="display:grid;grid-template-columns:1fr 140px 36px;background:var(--bg-alt);padding:.5rem .75rem;font-size:.78rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.04em">
                          <span>Categoría</span><span>Monto</span><span></span>
                        </div>
                        @for (fila of arancelesFilas(); track fila.tempId) {
                          <div style="display:grid;grid-template-columns:1fr 140px 36px;align-items:center;border-top:1px solid var(--border)">
                            <input type="text" [value]="fila.categoria" (input)="updateArancelFila(fila.tempId, 'categoria', $any($event.target).value)" class="form-control" placeholder="Ej. Socios CASLAN" style="border:none;border-radius:0;font-size:.9rem" />
                            <input type="text" [value]="fila.monto" (input)="updateArancelFila(fila.tempId, 'monto', $any($event.target).value)" class="form-control" placeholder="$0.000" style="border:none;border-left:1px solid var(--border);border-radius:0;font-size:.9rem" />
                            <button type="button" (click)="deleteArancelFila(fila.tempId)" style="background:none;border:none;border-left:1px solid var(--border);cursor:pointer;color:var(--muted);font-size:1rem;width:36px;height:100%;padding:0;line-height:1" title="Eliminar fila">✕</button>
                          </div>
                        }
                        @if (arancelesFilas().length === 0) {
                          <div style="padding:.75rem;color:var(--muted);font-size:.875rem;text-align:center;border-top:1px solid var(--border)">Sin filas aún. Hacé clic en "+ Agregar fila".</div>
                        }
                      </div>
                      <button type="button" class="btn btn-secondary btn-sm" style="margin-bottom:1rem" (click)="addArancelFila()">+ Agregar fila</button>

                      <!-- Nota bajo tabla -->
                      <div class="form-group" style="margin-bottom:1.5rem">
                        <label style="font-size:.8rem;color:var(--muted);display:block;margin-bottom:.35rem">Nota / condiciones especiales</label>
                        <textarea class="form-control" rows="3" [value]="arancelesNota" (input)="arancelesNota=$any($event.target).value"
                          placeholder="Ej. Grupos +10 personas: 10% de descuento. Estudiantes de grado acreditados: sin costo."></textarea>
                      </div>

                      <!-- Info de pago -->
                      <div class="form-group" style="margin-bottom:1.5rem">
                        <label for="informacionPago">Información de pago</label>
                        <textarea id="informacionPago" formControlName="informacionPago" class="form-control" rows="5"
                          placeholder="Transferencia bancaria&#10;CBU: 0110481720048110192668&#10;Alias: ALIAS.BANCO&#10;&#10;También podés pagar presencialmente en Tesorería"></textarea>
                      </div>

                      <!-- Apariencia sección inscripciones -->
                      <div style="display:flex;align-items:center;gap:.75rem;flex-wrap:wrap;padding:.5rem .875rem;background:var(--bg-alt);border-radius:8px;border:1px solid var(--border)">
                        <span style="font-size:.68rem;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;white-space:nowrap">Apariencia</span>
                        <div style="width:1px;height:14px;background:var(--border)"></div>
                        <label style="display:flex;align-items:center;gap:.35rem;font-size:.78rem;color:var(--muted);cursor:pointer">
                          Fondo
                          <input type="color" [value]="getSeccionBg('inscripciones') || '#ffffff'" (change)="upsertSeccion('inscripciones','bgColor',$any($event.target).value)" style="width:26px;height:22px;padding:1px;border:1px solid var(--border);border-radius:4px;cursor:pointer" />
                          @if (getSeccionBg('inscripciones')) { <button type="button" (click)="upsertSeccion('inscripciones','bgColor','')" style="background:none;border:none;font-size:.7rem;color:var(--muted);cursor:pointer;padding:0;line-height:1" title="Restablecer">✕</button> }
                        </label>
                        <label style="display:flex;align-items:center;gap:.35rem;font-size:.78rem;color:var(--muted);cursor:pointer">
                          Texto
                          <input type="color" [value]="getSeccionText('inscripciones') || '#1e293b'" (change)="upsertSeccion('inscripciones','textoColor',$any($event.target).value)" style="width:26px;height:22px;padding:1px;border:1px solid var(--border);border-radius:4px;cursor:pointer" />
                          @if (getSeccionText('inscripciones')) { <button type="button" (click)="upsertSeccion('inscripciones','textoColor','')" style="background:none;border:none;font-size:.7rem;color:var(--muted);cursor:pointer;padding:0;line-height:1" title="Restablecer">✕</button> }
                        </label>
                        <label style="display:flex;align-items:center;gap:.35rem;font-size:.78rem;color:var(--muted)">
                          Texto
                          <input type="number" min="8" max="72" [value]="getSeccionFontSizePx('inscripciones')"
                            (change)="upsertSeccion('inscripciones','fontSize',$any($event.target).value ? $any($event.target).value+'px' : null)"
                            placeholder="auto" style="width:52px;font-size:.78rem;padding:2px 5px;border:1px solid var(--border);border-radius:4px;height:22px;background:var(--surface2);color:var(--text)" /> px
                        </label>
                        <label style="display:flex;align-items:center;gap:.35rem;font-size:.78rem;color:var(--muted)">
                          Padding
                          <input type="number" min="0" max="200" [value]="getSeccionPaddingV('inscripciones')"
                            (change)="upsertSeccion('inscripciones','paddingV',+$any($event.target).value || null)"
                            placeholder="auto" style="width:52px;font-size:.78rem;padding:2px 5px;border:1px solid var(--border);border-radius:4px;height:22px;background:var(--surface2);color:var(--text)" /> px
                        </label>
                      </div>
                    </div>
                  }
                </div>

              </div>
            }

            @if (apiError()) {
              <div class="error-banner" style="margin-bottom:1.25rem">{{ apiError() }}</div>
            }

            <!-- Sticky footer actions -->
            <div style="position:sticky;bottom:0;background:var(--bg);border-top:1px solid var(--border);padding:1rem 0;display:flex;gap:.75rem;justify-content:flex-end;margin-top:1.5rem">
              <a [routerLink]="id ? ['/congreso', id] : ['/dashboard']" class="btn btn-secondary">Cancelar</a>
              @if (id && congresoEstado() === 'Borrador') {
                <button type="button" class="btn btn-secondary" style="border-color:var(--success);color:var(--success)" (click)="publicar()" [disabled]="publicando()">
                  @if (publicando()) { <span class="spinner"></span> }
                  Publicar
                </button>
              }
              <button type="submit" class="btn btn-primary" [disabled]="submitting()">
                @if (submitting()) { <span class="spinner"></span> }
                {{ id ? 'Guardar cambios' : 'Crear congreso' }}
              </button>
            </div>

          </form>
        }
      </div>
    </div>
  `
})
export class CongresoFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private congresoService = inject(CongresoService);
  private toast = inject(ToastService);

  id: string | null = null;
  slugManuallyEdited = false;

  loading = signal(false);
  loadError = signal(false);
  submitting = signal(false);
  publicando = signal(false);
  apiError = signal<string | null>(null);
  slugConflict = signal(false);
  fechasError = signal<string | null>(null);
  congresoEstado = signal<string>('Borrador');

  // Image URL signals
  logoUrl = signal<string | null>(null);
  logoSecundarioUrl = signal<string | null>(null);
  bannerUrl = signal<string | null>(null);
  bannerModo = signal<string>('fondo');
  faviconUrl = signal<string | null>(null);

  // Per-section style config (key → dto)
  seccionConfigs = signal<Record<string, SeccionConfigDto>>({});

  // US-11: sub-entity signals
  organizadores = signal<OrganizadorDto[]>([]);
  fechasImportantes = signal<FechaImportanteDto[]>([]);
  ejesTematicos = signal<EjeTematicoDto[]>([]);
  nuevoEje = '';
  arancelesFilas = signal<ArancelFila[]>([]);
  arancelesNota = '';
  expandedSections = signal<Set<string>>(new Set());

  toggleSection(key: string): void {
    const s = new Set(this.expandedSections());
    if (s.has(key)) s.delete(key); else s.add(key);
    this.expandedSections.set(s);
  }

  isSectionExpanded(key: string): boolean {
    return this.expandedSections().has(key);
  }

  form: FormGroup = this.fb.group(
    {
      nombre: ['', [Validators.required]],
      slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]{3,50}$/)]],
      fechaInicio: ['', [Validators.required]],
      fechaFin: ['', [Validators.required]],
      descripcion: [''],
      colorPrimario: ['', [Validators.maxLength(7)]],
      colorSecundario: ['', [Validators.maxLength(7)]],
      tipografia: ['', [Validators.maxLength(100)]],
      venueNombre: [''],
      venueDireccion: [''],
      venueLinkMaps: [''],
      // US-11
      subtitulo: [''],
      lema: [''],
      emailContacto: [''],
      instagram: [''],
      formularioInscripcionUrl: [''],
      arancelesTexto: [''],
      informacionPago: [''],
      contactoAdicional: [''],
      mostrarFechas: [true],
      mostrarDescripcion: [true],
      mostrarOrganizadores: [false],
      mostrarContacto: [true],
      mostrarInscripciones: [false],
    },
    { validators: fechasValidator }
  );

  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  private nombreSub: Subscription | null = null;

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');

    this.nombreSub = this.form.get('nombre')!.valueChanges.subscribe((value: string) => {
      if (!this.slugManuallyEdited) {
        const suggested = slugFromNombre(value ?? '');
        this.form.get('slug')!.setValue(suggested, { emitEvent: false });
      }
    });

    if (this.id) {
      this.loadCongresoData(this.id);
      this.loadSubEntities(this.id);
    }
  }

  ngOnDestroy(): void {
    this.nombreSub?.unsubscribe();
  }

  onSlugInput(): void {
    this.slugManuallyEdited = true;
    this.slugConflict.set(false);
  }

  private loadCongresoData(id: string): void {
    this.loading.set(true);
    this.congresoService.getById(id).subscribe({
      next: (congreso) => {
        this.form.patchValue({
          nombre: congreso.nombre,
          slug: congreso.slug,
          fechaInicio: congreso.fechaInicio,
          fechaFin: congreso.fechaFin,
          descripcion: congreso.descripcion ?? '',
          colorPrimario: congreso.colorPrimario ?? '',
          colorSecundario: congreso.colorSecundario ?? '',
          tipografia: congreso.tipografia ?? '',
          venueNombre: congreso.venueNombre ?? '',
          venueDireccion: congreso.venueDireccion ?? '',
          venueLinkMaps: congreso.venueLinkMaps ?? '',
          subtitulo: congreso.subtitulo ?? '',
          lema: congreso.lema ?? '',
          emailContacto: congreso.emailContacto ?? '',
          instagram: congreso.instagram ?? '',
          formularioInscripcionUrl: congreso.formularioInscripcionUrl ?? '',
          arancelesTexto: congreso.arancelesTexto ?? '',
          informacionPago: congreso.informacionPago ?? '',
          contactoAdicional: congreso.contactoAdicional ?? '',
          mostrarFechas: congreso.mostrarFechas ?? true,
          mostrarDescripcion: congreso.mostrarDescripcion ?? true,
          mostrarOrganizadores: congreso.mostrarOrganizadores ?? false,
          mostrarContacto: congreso.mostrarContacto ?? true,
          mostrarInscripciones: congreso.mostrarInscripciones ?? false,
        });
        this.logoUrl.set(congreso.logoUrl ?? null);
        this.logoSecundarioUrl.set(congreso.logoSecundarioUrl ?? null);
        this.bannerUrl.set(congreso.bannerUrl ?? null);
        this.bannerModo.set(congreso.bannerModo ?? 'fondo');
        this.faviconUrl.set(congreso.faviconUrl ?? null);

        // Parse aranceles JSON (array legacy or {filas, nota} new format)
        if (congreso.arancelesTexto) {
          try {
            const parsed = JSON.parse(congreso.arancelesTexto);
            const filas = Array.isArray(parsed) ? parsed : (parsed?.filas ?? []);
            this.arancelesFilas.set(filas.map((r: {categoria?: string; monto?: string}) => ({
              tempId: String(Date.now() + Math.random()),
              categoria: r.categoria ?? '',
              monto: r.monto ?? ''
            })));
            if (!Array.isArray(parsed) && parsed?.nota) {
              this.arancelesNota = parsed.nota;
            }
          } catch { /* not JSON, ignore */ }
        }

        if (congreso.estado !== 'Borrador') {
          this.form.get('slug')!.disable();
        }

        this.congresoEstado.set(congreso.estado);
        this.slugManuallyEdited = true;
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      }
    });
  }

  private loadSubEntities(id: string): void {
    this.congresoService.getOrganizadores(id).subscribe(list => this.organizadores.set(list));
    this.congresoService.getFechasImportantes(id).subscribe(list => this.fechasImportantes.set(list));
    this.congresoService.getEjesTematicos(id).subscribe(list => this.ejesTematicos.set(list));
    this.congresoService.getSeccionConfigs(id).subscribe(list => {
      const map: Record<string, SeccionConfigDto> = {};
      list.forEach(s => map[s.seccionKey] = s);
      this.seccionConfigs.set(map);
    });
  }

  getSeccionBg(key: string): string { return this.seccionConfigs()[key]?.bgColor ?? ''; }
  getSeccionText(key: string): string { return this.seccionConfigs()[key]?.textoColor ?? ''; }
  getSeccionFontSizePx(key: string): number | null {
    const v = this.seccionConfigs()[key]?.fontSize;
    if (!v) return null;
    const m = v.match(/^(\d+(?:\.\d+)?)px$/);
    return m ? +m[1] : null;
  }
  getSeccionLogoAltura(key: string): number { return this.seccionConfigs()[key]?.logoAltura ?? 44; }
  getSeccionLogoColumnas(key: string): number | null { return this.seccionConfigs()[key]?.logoColumnas ?? null; }
  getSeccionPaddingV(key: string): number | null { return this.seccionConfigs()[key]?.paddingV ?? null; }

  upsertSeccion(key: string, field: 'bgColor' | 'textoColor' | 'fontSize' | 'logoAltura' | 'logoColumnas' | 'paddingV', value: string | number | null): void {
    if (!this.id) return;
    const current = this.seccionConfigs()[key] ?? { seccionKey: key, bgColor: null, textoColor: null, fontSize: null, logoAltura: null, logoColumnas: null, paddingV: null };
    const dto = { bgColor: current.bgColor, textoColor: current.textoColor, fontSize: current.fontSize, logoAltura: current.logoAltura, logoColumnas: current.logoColumnas, paddingV: current.paddingV, [field]: value || null };
    this.congresoService.upsertSeccion(this.id, key, dto).subscribe(saved => {
      this.seccionConfigs.update(m => ({ ...m, [key]: saved }));
    });
  }

  // --- Ejes temáticos ---
  addEje(inputEl?: HTMLInputElement): void {
    const nombre = this.nuevoEje.trim();
    if (!nombre || !this.id) return;
    this.congresoService.addEjeTematico(this.id, { nombre }).subscribe(eje => {
      this.ejesTematicos.update(list => [...list, eje]);
      this.nuevoEje = '';
      if (inputEl) inputEl.value = '';
    });
  }

  deleteEje(id: string): void {
    if (!this.id) return;
    this.congresoService.deleteEjeTematico(this.id, id).subscribe(() => {
      this.ejesTematicos.update(list => list.filter(e => e.id !== id));
    });
  }

  // --- Fechas importantes ---
  addFecha(): void {
    if (!this.id) return;
    const hoy = new Date().toISOString().split('T')[0];
    this.congresoService.addFechaImportante(this.id, { descripcion: 'Nueva fecha', fecha: hoy }).subscribe(f => {
      this.fechasImportantes.update(list => [...list, f]);
    });
  }

  updateFecha(fecha: FechaImportanteDto, field: string, value: string | null): void {
    if (!this.id) return;
    const updated = { ...fecha, [field]: value };
    this.congresoService.updateFechaImportante(this.id, fecha.id, {
      descripcion: updated.descripcion,
      fecha: updated.fecha,
      fechaFin: updated.fechaFin ?? null
    }).subscribe(f => {
      this.fechasImportantes.update(list => list.map(x => x.id === f.id ? f : x));
    });
  }

  deleteFecha(id: string): void {
    if (!this.id) return;
    this.congresoService.deleteFechaImportante(this.id, id).subscribe(() => {
      this.fechasImportantes.update(list => list.filter(f => f.id !== id));
    });
  }

  // --- Organizadores ---
  addOrg(): void {
    if (!this.id) return;
    const orden = this.organizadores().length + 1;
    this.congresoService.addOrganizador(this.id, { nombre: 'Nuevo organizador', orden }).subscribe(org => {
      this.organizadores.update(list => [...list, org]);
    });
  }

  updateOrg(org: OrganizadorDto, field: string, value: string | number | null): void {
    if (!this.id) return;
    const updated = { ...org, [field]: value };
    this.congresoService.updateOrganizador(this.id, org.id, {
      nombre: updated.nombre,
      logoUrl: updated.logoUrl ?? null,
      orden: updated.orden
    }).subscribe(o => {
      this.organizadores.update(list => list.map(x => x.id === o.id ? o : x));
    });
  }

  deleteOrg(id: string): void {
    if (!this.id) return;
    this.congresoService.deleteOrganizador(this.id, id).subscribe(() => {
      this.organizadores.update(list => list.filter(o => o.id !== id));
    });
  }

  // --- Aranceles (local, serialized to JSON on save) ---
  addArancelFila(): void {
    this.arancelesFilas.update(list => [...list, { tempId: String(Date.now() + Math.random()), categoria: '', monto: '' }]);
  }

  updateArancelFila(tempId: string, field: 'categoria' | 'monto', value: string): void {
    this.arancelesFilas.update(list => list.map(f => f.tempId === tempId ? { ...f, [field]: value } : f));
  }

  deleteArancelFila(tempId: string): void {
    this.arancelesFilas.update(list => list.filter(f => f.tempId !== tempId));
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.apiError.set(null);
    this.slugConflict.set(false);
    this.fechasError.set(null);

    if (this.id) {
      this.update(this.id);
    } else {
      this.create();
    }
  }

  private create(): void {
    const raw = this.form.getRawValue();
    const dto: CreateCongresoDto = {
      nombre: raw['nombre'],
      slug: raw['slug'],
      fechaInicio: raw['fechaInicio'],
      fechaFin: raw['fechaFin'],
      descripcion: raw['descripcion'] || undefined,
      logoUrl: this.logoUrl() ?? '',
      logoSecundarioUrl: this.logoSecundarioUrl() ?? '',
      bannerUrl: this.bannerUrl() ?? '',
      bannerModo: this.bannerModo(),
      faviconUrl: this.faviconUrl() ?? '',
      colorPrimario: raw['colorPrimario'] || undefined,
      colorSecundario: raw['colorSecundario'] || undefined,
      tipografia: raw['tipografia'] || undefined,
      venueNombre: raw['venueNombre'] || undefined,
      venueDireccion: raw['venueDireccion'] || undefined,
      venueLinkMaps: raw['venueLinkMaps'] || undefined,
    };

    this.congresoService.create(dto).subscribe({
      next: () => { this.toast.success('Congreso creado.'); this.router.navigate(['/dashboard']); },
      error: (err) => this.handleApiError(err)
    });
  }

  private update(id: string): void {
    const raw = this.form.getRawValue();
    const dto: UpdateCongresoDto = {
      nombre: raw['nombre'],
      slug: this.form.get('slug')!.enabled ? raw['slug'] : undefined,
      fechaInicio: raw['fechaInicio'],
      fechaFin: raw['fechaFin'],
      descripcion: raw['descripcion'] || undefined,
      logoUrl: this.logoUrl() ?? '',
      logoSecundarioUrl: this.logoSecundarioUrl() ?? '',
      bannerUrl: this.bannerUrl() ?? '',
      bannerModo: this.bannerModo(),
      faviconUrl: this.faviconUrl() ?? '',
      colorPrimario: raw['colorPrimario'] || undefined,
      colorSecundario: raw['colorSecundario'] || undefined,
      tipografia: raw['tipografia'] || undefined,
      venueNombre: raw['venueNombre'] || undefined,
      venueDireccion: raw['venueDireccion'] || undefined,
      venueLinkMaps: raw['venueLinkMaps'] || undefined,
      subtitulo: raw['subtitulo'] || null,
      lema: raw['lema'] || null,
      emailContacto: raw['emailContacto'] || null,
      instagram: raw['instagram'] || null,
      formularioInscripcionUrl: raw['formularioInscripcionUrl'] || null,
      arancelesTexto: (this.arancelesFilas().length > 0 || this.arancelesNota.trim())
        ? JSON.stringify({
            filas: this.arancelesFilas().map(f => ({ categoria: f.categoria, monto: f.monto })),
            nota: this.arancelesNota.trim() || undefined
          })
        : null,
      informacionPago: raw['informacionPago'] || null,
      contactoAdicional: raw['contactoAdicional'] || null,
      mostrarFechas: raw['mostrarFechas'],
      mostrarDescripcion: raw['mostrarDescripcion'],
      mostrarOrganizadores: raw['mostrarOrganizadores'],
      mostrarContacto: raw['mostrarContacto'],
      mostrarInscripciones: raw['mostrarInscripciones'],
    };

    this.congresoService.update(id, dto).subscribe({
      next: () => { this.toast.success('Cambios guardados.'); this.router.navigate(['/congreso', id]); },
      error: (err) => this.handleApiError(err)
    });
  }

  private handleApiError(err: { status: number; error?: { error?: string; message?: string } }): void {
    this.submitting.set(false);
    const status = err.status;
    const code = err.error?.error;

    if (status === 409 && code === 'SLUG_ALREADY_EXISTS') {
      this.slugConflict.set(true);
      return;
    }

    if (status === 400) {
      if (code === 'FECHA_INICIO_AFTER_FECHA_FIN') {
        this.fechasError.set('La fecha de fin debe ser igual o posterior a la fecha de inicio.');
        return;
      }
      if (code === 'SLUG_INVALID_FORMAT') {
        this.form.get('slug')!.setErrors({ pattern: true });
        return;
      }
    }

    const msg = err.error?.message ?? 'Ocurrió un error inesperado. Intente nuevamente.';
    this.apiError.set(msg);
    this.toast.error(msg);
  }

  publicar(): void {
    if (!this.id) return;
    if (!confirm('¿Publicar este congreso? Será visible en el mini-sitio.')) return;

    this.publicando.set(true);
    this.apiError.set(null);

    this.congresoService.publicar(this.id).subscribe({
      next: (congreso) => {
        this.congresoEstado.set(congreso.estado);
        this.publicando.set(false);
      },
      error: (err) => {
        this.publicando.set(false);
        this.apiError.set(err.error?.message ?? 'Error publicando congreso.');
      }
    });
  }
}
