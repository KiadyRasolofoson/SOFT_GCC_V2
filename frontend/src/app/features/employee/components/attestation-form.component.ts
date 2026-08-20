import { Component, EventEmitter, Input, Output, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CertificateTypeItem } from '../../../core/employee-attestation.service';
import { GccRichEditor } from '../../../ui/gcc-rich-editor';
import { GccSelect } from '../../../ui/gcc-select';
import { AttestationFormModel } from './attestation.constants';

/**
 * Formulaire de génération d'attestation (composant présentationnel).
 * Le modèle `form` est mutable et partagé avec le parent (qui alimente l'aperçu).
 * Les actions métier (export, envoi, reset, aperçu) sont émises au parent.
 */
@Component({
  selector: 'app-attestation-form',
  imports: [FormsModule, MatButtonModule, MatIconModule, GccSelect, GccRichEditor],
  host: { class: 'block' },
  template: `
    <div class="space-y-4">
      @if (error()) {
        <div class="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{{ error() }}</div>
      }

      <!-- 1. Identité du document -->
      <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div class="mb-4 flex items-center gap-3">
          <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-accent">
            <mat-icon class="!h-5 !w-5 !text-[20px]">description</mat-icon>
          </div>
          <div>
            <h3 class="text-sm font-semibold text-navy">Identité du document</h3>
            <p class="text-xs text-slate-500">Type d'attestation et référence unique</p>
          </div>
        </div>
        <div class="grid gap-3 md:grid-cols-2">
          <label class="flex flex-col gap-1">
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Type d'attestation <span class="text-red-500">*</span>
            </span>
            <gcc-select
              [options]="certificateTypeOptions()"
              [value]="form.certificateTypeId"
              (valueChange)="onTypeChange($event)"
              placeholder="Sélectionner le type"
            />
          </label>
          <label class="flex flex-col gap-1">
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Référence <span class="text-red-500">*</span>
            </span>
            <div class="flex gap-2">
              <input
                type="text"
                class="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-navy outline-none transition focus:border-accent"
                [(ngModel)]="form.reference"
                placeholder="ATT-…"
              />
              <button
                mat-stroked-button
                type="button"
                class="gcc-btn-secondary !h-10 !min-w-10 !px-3"
                (click)="regenerateReference.emit()"
                title="Nouvelle référence"
              >
                <mat-icon class="!h-5 !w-5 !text-[20px]">autorenew</mat-icon>
              </button>
            </div>
          </label>
        </div>
      </section>

      <!-- 2. Informations d'émission -->
      <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div class="mb-4 flex items-center gap-3">
          <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-accent">
            <mat-icon class="!h-5 !w-5 !text-[20px]">info</mat-icon>
          </div>
          <div>
            <h3 class="text-sm font-semibold text-navy">Informations d'émission</h3>
            <p class="text-xs text-slate-500">Lieu, date et motif figurant sur le document</p>
          </div>
        </div>
        <div class="grid gap-3 md:grid-cols-3">
          <label class="flex flex-col gap-1">
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Fait à</span>
            <input
              type="text"
              class="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-navy outline-none transition focus:border-accent"
              [(ngModel)]="form.place"
              placeholder="Antananarivo"
            />
          </label>
          <label class="flex flex-col gap-1">
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Date</span>
            <input
              type="date"
              class="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-navy outline-none transition focus:border-accent"
              [(ngModel)]="form.date"
            />
          </label>
          <label class="flex flex-col gap-1">
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Motif</span>
            <input
              type="text"
              class="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-navy outline-none transition focus:border-accent"
              [(ngModel)]="form.reason"
              placeholder="Administratif"
            />
          </label>
        </div>
      </section>

      <!-- 3. Signataire & logo -->
      <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div class="mb-4 flex items-center gap-3">
          <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-accent">
            <mat-icon class="!h-5 !w-5 !text-[20px]">business</mat-icon>
          </div>
          <div>
            <h3 class="text-sm font-semibold text-navy">Signataire &amp; logo</h3>
            <p class="text-xs text-slate-500">Mention de signature et identité visuelle</p>
          </div>
        </div>
        <div class="grid gap-3 md:grid-cols-2">
          <label class="flex flex-col gap-1">
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Fonction du signataire</span>
            <input
              type="text"
              class="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-navy outline-none transition focus:border-accent"
              [(ngModel)]="form.signatoryPosition"
              placeholder="Le Directeur général"
            />
          </label>
          <label class="flex flex-col gap-1">
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Nom du signataire</span>
            <input
              type="text"
              class="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-navy outline-none transition focus:border-accent"
              [(ngModel)]="form.signatoryName"
              placeholder="Nom complet"
            />
          </label>
          <label class="flex flex-col gap-2 md:col-span-2">
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Logo de l'entreprise</span>
            <div class="flex flex-wrap items-center gap-4">
              <input
                type="file"
                accept="image/*"
                class="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-navy"
                (change)="handleLogoChange($event)"
              />
              @if (form.logoPreview) {
                <div class="flex items-center gap-3">
                  <img [src]="form.logoPreview" alt="Logo" class="h-12 w-12 rounded-lg object-contain" />
                  <button mat-stroked-button type="button" class="gcc-btn-secondary !h-9 !px-3 !text-xs" (click)="removeLogo()">
                    <mat-icon class="!h-4 !w-4 !text-[16px]">delete</mat-icon>
                    Retirer
                  </button>
                </div>
              }
            </div>
          </label>
        </div>
      </section>

      <!-- 4. Contenu du document -->
      <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div class="mb-4 flex items-center gap-3">
          <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-accent">
            <mat-icon class="!h-5 !w-5 !text-[20px]">format_list_bulleted</mat-icon>
          </div>
          <div>
            <h3 class="text-sm font-semibold text-navy">Contenu du document</h3>
            <p class="text-xs text-slate-500">Rédigez le texte et insérez des champs dynamiques (Nom, Poste, etc.)</p>
          </div>
        </div>
        <div class="space-y-4">
          @for (section of form.sections; track section.id) {
            <div>
              <div class="mb-2 flex items-center justify-between gap-2">
                <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Paragraphe {{ sectionIndex(section.id) }}
                </p>
                <div class="flex items-center gap-2">
                  <div class="relative">
                    <button
                      mat-stroked-button
                      type="button"
                      class="gcc-btn-secondary !h-8 !px-3 !text-xs"
                      (click)="toggleVariableMenu(section.id)"
                    >
                      <mat-icon class="!h-4 !w-4 !text-[16px]">add</mat-icon>
                      Insérer un champ
                    </button>
                    @if (form.variableMenuFor === section.id) {
                      <div class="absolute right-0 top-full z-20 mt-1 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                        @for (variable of variables(); track variable) {
                          <button
                            type="button"
                            class="block w-full px-3 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                            (click)="insertVariable(section.id, variable)"
                          >
                            {{ variable }}
                          </button>
                        }
                      </div>
                    }
                  </div>
                  <button
                    mat-icon-button
                    type="button"
                    class="!h-8 !w-8"
                    (click)="removeSection(section.id)"
                    title="Supprimer ce paragraphe"
                  >
                    <mat-icon class="!h-4 !w-4 !text-[16px] text-red-500">delete</mat-icon>
                  </button>
                </div>
              </div>
              <gcc-rich-editor [content]="section.content" (contentChange)="updateSection(section.id, $event)" />
            </div>
          }

          <button mat-stroked-button type="button" class="gcc-btn-secondary" (click)="addSection()">
            <mat-icon>add</mat-icon>
            Ajouter un paragraphe
          </button>
        </div>
      </section>

      <!-- Actions -->
      <div class="flex flex-wrap gap-2">
        <button mat-stroked-button type="button" class="gcc-btn-secondary" (click)="previewToggle.emit()">
          <mat-icon>visibility</mat-icon>
          {{ showPreview() ? "Masquer l'aperçu" : "Voir l'aperçu" }}
        </button>
        <button mat-flat-button type="button" class="gcc-btn-primary !bg-emerald-600" (click)="exportPdf.emit()" [disabled]="uploading()">
          <mat-icon>file_download</mat-icon>
          {{ uploading() ? 'Export en cours…' : 'Exporter PDF' }}
        </button>
        <button mat-stroked-button type="button" class="gcc-btn-secondary" (click)="send.emit()" [disabled]="sending()">
          <mat-icon>send</mat-icon>
          {{ sending() ? 'Envoi…' : 'Envoyer par e-mail' }}
        </button>
        <button mat-stroked-button type="button" class="gcc-btn-secondary" (click)="reset.emit()">
          <mat-icon>close</mat-icon>
          Réinitialiser
        </button>
      </div>

      <!-- Feedback -->
      <div class="space-y-2">
        @if (errorUpload()) {
          <p class="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{{ errorUpload() }}</p>
        }
        @if (uploadSuccess()) {
          <p class="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{{ uploadSuccess() }}</p>
        }
        @if (uploading()) {
          <p class="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-700">Export PDF en cours…</p>
        }
        @if (sending()) {
          <p class="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-700">Envoi en cours…</p>
        }
        @if (sendSuccess()) {
          <p class="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            L'attestation a été envoyée avec succès !
          </p>
        }
        @if (sendError()) {
          <p class="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{{ sendError() }}</p>
        }
        @if (info()) {
          <p class="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-700">{{ info() }}</p>
        }
      </div>
    </div>
  `,
})
export class AttestationFormComponent {
  /** Modèle mutable du document (partagé avec le parent, qui alimente l'aperçu). */
  @Input() form!: AttestationFormModel;

  certificateTypes = input<CertificateTypeItem[]>([]);
  variables = input<string[]>([]);
  error = input<string | null>(null);
  uploading = input(false);
  sending = input(false);
  errorUpload = input<string | null>(null);
  uploadSuccess = input<string | null>(null);
  sendError = input<string | null>(null);
  sendSuccess = input(false);
  info = input<string | null>(null);
  showPreview = input(false);

  regenerateReference = output<void>();
  previewToggle = output<void>();
  exportPdf = output<void>();
  send = output<void>();
  reset = output<void>();

  readonly certificateTypeOptions = computed(() =>
    this.certificateTypes().map((item) => ({
      label: item.certificateTypeName,
      value: String(item.certificateTypeId),
    })),
  );

  onTypeChange(value: string | null): void {
    this.form.certificateTypeId = value;
    const found = this.certificateTypes().find((item) => String(item.certificateTypeId) === value);
    this.form.certificateTypeName = found?.certificateTypeName ?? '';
  }

  sectionIndex(id: number): number {
    const found = this.form.sections.findIndex((section) => section.id === id);
    return found >= 0 ? found + 1 : id;
  }

  toggleVariableMenu(id: number): void {
    this.form.variableMenuFor = this.form.variableMenuFor === id ? null : id;
  }

  addSection(): void {
    const nextId = this.form.sections.length ? Math.max(...this.form.sections.map((s) => s.id)) + 1 : 1;
    this.form.sections = [...this.form.sections, { id: nextId, content: '' }];
  }

  removeSection(id: number): void {
    this.form.sections = this.form.sections.filter((section) => section.id !== id);
    if (this.form.variableMenuFor === id) {
      this.form.variableMenuFor = null;
    }
  }

  updateSection(id: number, content: string): void {
    this.form.sections = this.form.sections.map((section) =>
      section.id === id ? { ...section, content } : section,
    );
  }

  insertVariable(id: number, variable: string): void {
    this.form.sections = this.form.sections.map((section) =>
      section.id === id ? { ...section, content: section.content + ` {{${variable}}}` } : section,
    );
    this.form.variableMenuFor = null;
  }

  handleLogoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.form.logoPreview = URL.createObjectURL(file);
    }
  }

  removeLogo(): void {
    this.form.logoPreview = null;
  }
}
