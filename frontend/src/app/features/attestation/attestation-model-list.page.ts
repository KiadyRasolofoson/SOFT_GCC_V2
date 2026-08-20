import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  CertificateModel,
  CertificateModelService,
} from '../../core/certificate-model.service';
import { GccEmptyState } from '../../ui/gcc-empty-state';
import { GccPageHeader } from '../../ui/gcc-page-header';

/**
 * Gestion des modèles d'attestation (miroir React ModelList.jsx — rendu fonctionnel).
 * Liste des types de certificat (/CertificateType) avec recherche + CRUD (ajout/édition/suppression).
 */
@Component({
  selector: 'app-attestation-model-list-page',
  imports: [FormsModule, GccPageHeader, GccEmptyState, MatButtonModule, MatIconModule],
  template: `
    <gcc-page-header
      title="Gestion des modèles d'attestation"
      subtitle="Consultez et gérez les types d'attestation disponibles."
      icon="description"
      [crumbs]="crumbs"
      actionLabel="Nouveau modèle"
      actionIcon="add"
      (action)="openAdd()"
    />

    @if (error(); as message) {
      <div class="mb-6 rounded-xl border border-red-200/80 bg-red-50/80 p-4 text-xs text-red-900 shadow-xs">
        <div class="flex items-start gap-3">
          <mat-icon class="!h-5 !w-5 !text-[20px] shrink-0 text-red-600 mt-0.5">error_outline</mat-icon>
          <p class="font-bold text-red-900">{{ message }}</p>
        </div>
      </div>
    }

    @if (actionError(); as message) {
      <div class="mb-6 rounded-xl border border-red-200/80 bg-red-50/80 p-4 text-xs text-red-900 shadow-xs">
        <div class="flex items-start gap-3">
          <mat-icon class="!h-5 !w-5 !text-[20px] shrink-0 text-red-600 mt-0.5">error_outline</mat-icon>
          <p class="font-bold text-red-900">{{ message }}</p>
        </div>
      </div>
    }

    <!-- Filtre de recherche -->
    <div class="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="mb-3 flex items-center gap-2 text-sm font-semibold text-navy">
        <mat-icon class="!h-4 !w-4 !text-[18px] text-slate-500">search</mat-icon>
        <span>Filtre de recherche</span>
      </div>
      <label class="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm text-navy">
        <mat-icon class="!h-5 !w-5 !text-[20px] text-slate-400">search</mat-icon>
        <input
          class="w-full border-0 bg-transparent text-sm text-navy outline-none placeholder:text-slate-400"
          placeholder="Rechercher un modèle…"
          [ngModel]="search()"
          (ngModelChange)="search.set($event)"
        />
      </label>
    </div>

    @if (loading()) {
      <div class="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Chargement des modèles d'attestation…
      </div>
    } @else if (filtered().length === 0) {
      <gcc-empty-state
        title="Aucun modèle d'attestation"
        message="Aucun type d'attestation enregistré pour le moment."
      />
    } @else {
      <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div class="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
          <h2 class="text-base font-semibold text-navy">Modèles d'attestation</h2>
          <span class="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-accent">
            {{ filtered().length }} modèle(s)
          </span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[480px]">
            <thead>
              <tr class="border-b border-slate-200 text-left text-xs uppercase tracking-[0.08em] text-slate-500">
                <th class="px-5 py-3 font-semibold">Type d'attestation</th>
                <th class="px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (row of filtered(); track row.certificateTypeId) {
                <tr class="border-b border-slate-100 text-sm text-slate-700">
                  <td class="px-5 py-3 font-medium text-navy">{{ row.certificateTypeName || '—' }}</td>
                  <td class="px-5 py-3">
                    <div class="flex items-center gap-1">
                      <button mat-icon-button type="button" class="!h-8 !w-8" title="Modifier" (click)="openEdit(row)">
                        <mat-icon class="!h-4 !w-4 !text-[16px] text-accent">edit</mat-icon>
                      </button>
                      <button mat-icon-button type="button" class="!h-8 !w-8" title="Supprimer" (click)="deleteModel(row)">
                        <mat-icon class="!h-4 !w-4 !text-[16px] text-red-500">delete</mat-icon>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }

    <!-- Modal Ajouter / Modifier -->
    @if (modalOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-[1px]">
        <div class="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
          <div class="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3 class="text-lg font-semibold text-navy">
                {{ editingId() == null ? 'Nouveau modèle' : "Modifier le modèle" }}
              </h3>
              <p class="text-sm text-slate-500">Type d'attestation</p>
            </div>
            <button mat-icon-button type="button" (click)="closeModal()" aria-label="Fermer">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <label class="block">
            <span class="mb-1.5 block text-xs font-medium uppercase tracking-[0.08em] text-slate-500">
              Nom du modèle *
            </span>
            <input
              type="text"
              class="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-navy outline-none transition focus:border-accent"
              placeholder="Ex. Attestation de travail"
              [ngModel]="formName()"
              (ngModelChange)="formName.set($event)"
              (keydown.enter)="save()"
            />
            @if (formError()) {
              <p class="mt-1 text-xs text-red-600">{{ formError() }}</p>
            }
          </label>

          <div class="mt-6 flex justify-end gap-2">
            <button mat-stroked-button type="button" class="gcc-btn-secondary" (click)="closeModal()">
              Annuler
            </button>
            <button mat-flat-button type="button" class="gcc-btn-primary" (click)="save()" [disabled]="submitting()">
              @if (submitting()) {
                <span class="flex items-center gap-2">
                  <span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Enregistrement…
                </span>
              } @else {
                <span class="flex items-center gap-2">
                  <mat-icon>save</mat-icon>
                  Enregistrer
                </span>
              }
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class AttestationModelListPage {
  private readonly service = inject(CertificateModelService);

  readonly crumbs = [{ label: 'Accueil' }, { label: 'Attestations' }, { label: 'Modèles' }];

  readonly rows = signal<CertificateModel[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly search = signal('');

  readonly modalOpen = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly formName = signal('');
  readonly formError = signal<string | null>(null);
  readonly submitting = signal(false);

  readonly filtered = computed(() => {
    const query = this.search().trim().toLowerCase();
    const rows = this.rows();
    if (!query) return rows;
    return rows.filter((row) => (row.certificateTypeName ?? '').toLowerCase().includes(query));
  });

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.rows.set(await this.service.loadModels());
    } catch {
      this.rows.set([]);
      this.error.set("Erreur lors du chargement des modèles d'attestation.");
    } finally {
      this.loading.set(false);
    }
  }

  openAdd(): void {
    this.editingId.set(null);
    this.formName.set('');
    this.formError.set(null);
    this.modalOpen.set(true);
  }

  openEdit(row: CertificateModel): void {
    this.editingId.set(row.certificateTypeId);
    this.formName.set(row.certificateTypeName ?? '');
    this.formError.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.formName.set('');
    this.formError.set(null);
  }

  async save(): Promise<void> {
    const name = this.formName().trim();
    if (!name) {
      this.formError.set('Le nom du modèle est obligatoire.');
      return;
    }
    if (this.submitting()) return;

    this.submitting.set(true);
    this.formError.set(null);
    this.actionError.set(null);
    try {
      const editing = this.editingId();
      if (editing != null) {
        await this.service.updateModel(editing, name);
      } else {
        await this.service.createModel(name);
      }
      this.closeModal();
      await this.load();
    } catch (err) {
      this.formError.set(this.errorMessage(err));
    } finally {
      this.submitting.set(false);
    }
  }

  async deleteModel(row: CertificateModel): Promise<void> {
    const confirmed = confirm(`Voulez-vous vraiment supprimer le modèle « ${row.certificateTypeName} » ?`);
    if (!confirmed) return;

    this.actionError.set(null);
    try {
      await this.service.deleteModel(row.certificateTypeId);
      await this.load();
    } catch (err) {
      this.actionError.set(this.errorMessage(err));
    }
  }

  private errorMessage(err: any): string {
    const status = err?.status;
    if (status === 401 || status === 403) {
      return 'Action non autorisée. Vérifiez vos permissions.';
    }
    const body = err?.error;
    if (typeof body === 'string' && body.trim()) return body.trim();
    if (body && typeof body === 'object') {
      const msg = body.message ?? body.Message ?? body.title ?? body.detail;
      if (typeof msg === 'string' && msg.trim()) return msg.trim();
    }
    return "Erreur lors de l'opération.";
  }
}
