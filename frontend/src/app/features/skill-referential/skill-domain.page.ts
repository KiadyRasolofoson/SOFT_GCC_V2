import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { AuthService } from '../../core/auth.service';
import { hasAnyPermission } from '../users/user.models';
import { GccEmptyState } from '../../ui/gcc-empty-state';
import { GccPageHeader } from '../../ui/gcc-page-header';
import { GccStatusTag } from '../../ui/gcc-status-tag';
import { skillStateStatus, stateLabel, TaxonomyItem } from './skill-referential.models';
import { SkillReferentialService } from './skill-referential.service';
import { CODE_HINT } from './referential-code';

@Component({
  selector: 'app-skill-domain-page',
  imports: [FormsModule, GccPageHeader, GccEmptyState, GccStatusTag, MatTableModule, MatButtonModule, MatIconModule],
  template: `
    <gcc-page-header
      title="Domaines de compétences"
      subtitle="Premier niveau du catalogue : chaque domaine accueille des familles."
      icon="folder"
      [crumbs]="crumbs"
      secondaryLabel="Retour au catalogue"
      secondaryIcon="arrow_back"
      (secondaryAction)="router.navigate(['/soft-gcc/parametres/referentiel-competences'])"
    />

    @if (error()) {
      <p class="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{{ error() }}</p>
    }

    <div class="grid gap-6 lg:grid-cols-3">
      @if (canManage()) {
        <div class="lg:col-span-1">
          <div class="sticky top-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 class="text-sm font-semibold text-navy">{{ editingId() ? 'Modifier le domaine' : 'Nouveau domaine' }}</h2>
                <p class="mt-1 text-xs text-slate-500">Code proposé automatiquement, modifiable à la création.</p>
              </div>
              @if (editingId()) {
                <button mat-stroked-button type="button" class="gcc-btn-secondary !rounded-xl" (click)="resetForm()">
                  <mat-icon>add</mat-icon>
                  Nouveau
                </button>
              }
            </div>
            <div class="flex flex-col gap-4">
              <label class="block">
                <span class="mb-1 block text-sm font-medium text-slate-600">Code</span>
            <input
              class="gcc-input disabled:bg-slate-50 disabled:text-slate-500"
              placeholder="DOMAIN-00001"
              [ngModel]="code()"
              [disabled]="!!editingId()"
              (ngModelChange)="onCodeEdit($event)"
            />
                @if (!editingId()) {
                  <span class="mt-1 block text-[11px] text-slate-400">{{ codeHint }}</span>
                }
              </label>
              <label class="block">
                <span class="mb-1 block text-sm font-medium text-slate-600">Nom</span>
                <input class="gcc-input" placeholder="Ex. Finance" [(ngModel)]="name" />
              </label>
              <label class="block">
                <span class="mb-1 block text-sm font-medium text-slate-600">Ordre</span>
                <input class="gcc-input" placeholder="0" type="number" [(ngModel)]="sortOrder" />
              </label>
              <label class="block">
                <span class="mb-1 block text-sm font-medium text-slate-600">Description</span>
                <textarea class="gcc-input min-h-20" rows="2" placeholder="Périmètre métier du domaine" [(ngModel)]="description"></textarea>
              </label>
            </div>
            <div class="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button mat-stroked-button type="button" class="gcc-btn-secondary" (click)="resetForm()">Annuler</button>
              <button mat-flat-button type="button" class="gcc-btn-primary" (click)="save()">
                <mat-icon>check</mat-icon>
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      }

      <div [class]="canManage() ? 'lg:col-span-2' : 'lg:col-span-3'">
        @if (!rows().length) {
          <gcc-empty-state title="Aucun domaine" message="Créez le premier domaine du référentiel." />
        } @else {
          <div class="gcc-table shadow-sm">
            <div class="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3.5">
              <h2 class="text-sm font-semibold text-navy">Domaines</h2>
              <span class="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-accent">{{ rows().length }}</span>
            </div>
            <table mat-table [dataSource]="rows()" class="w-full">
              <ng-container matColumnDef="code">
                <th mat-header-cell *matHeaderCellDef>Code</th>
                <td mat-cell *matCellDef="let row">
                  <span class="inline-flex rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] tabular-nums text-slate-500">{{ row.code }}</span>
                </td>
              </ng-container>
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Nom</th>
                <td mat-cell *matCellDef="let row" class="font-semibold text-navy">{{ row.name }}</td>
              </ng-container>
              <ng-container matColumnDef="state">
                <th mat-header-cell *matHeaderCellDef>État</th>
                <td mat-cell *matCellDef="let row">
                  <gcc-status-tag [status]="skillStateStatus(row.state)" [label]="stateLabel(row.state)" />
                </td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let row" class="text-right">
                  @if (canManage()) {
                    <button mat-icon-button type="button" (click)="edit(row)" aria-label="Modifier"><mat-icon>edit</mat-icon></button>
                    <button mat-icon-button type="button" (click)="archive(row)" aria-label="Archiver"><mat-icon>inventory_2</mat-icon></button>
                  }
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns"></tr>
            </table>
          </div>
        }
      </div>
    </div>
  `,
})
export class SkillDomainPage {
  readonly router = inject(Router);
  private readonly api = inject(SkillReferentialService);
  private readonly auth = inject(AuthService);
  readonly crumbs = [{ label: 'Accueil' }, { label: 'Référentiel' }, { label: 'Domaines' }];
  readonly columns = ['code', 'name', 'state', 'actions'];
  readonly rows = signal<TaxonomyItem[]>([]);
  readonly error = signal<string | null>(null);
  readonly editingId = signal<number | null>(null);
  readonly skillStateStatus = skillStateStatus;
  readonly stateLabel = stateLabel;
  readonly canManage = computed(() =>
    hasAnyPermission(this.auth.user()?.permissions, ['MANAGE_SKILL_SETTINGS', 'PUBLISH_SKILL_REFERENTIAL']),
  );
  readonly code = signal('');
  name = '';
  description = '';
  sortOrder = 0;
  readonly codeHint = CODE_HINT;
  private codeTouched = false;
  private suggestSeq = 0;

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.rows.set(await this.api.getDomains());
    if (!this.editingId()) {
      await this.refreshSuggestedCode();
    }
  }

  edit(row: TaxonomyItem): void {
    this.editingId.set(row.id);
    this.codeTouched = true;
    this.code.set(row.code);
    this.name = row.name;
    this.description = row.description ?? '';
    this.sortOrder = row.sortOrder;
  }

  resetForm(): void {
    this.editingId.set(null);
    this.codeTouched = false;
    this.code.set('');
    this.name = this.description = '';
    this.sortOrder = 0;
    this.error.set(null);
    void this.refreshSuggestedCode();
  }

  onCodeEdit(value: string): void {
    this.code.set(value);
    this.codeTouched = value.trim().length > 0;
    if (!this.codeTouched && !this.editingId()) {
      void this.refreshSuggestedCode();
    }
  }

  private async refreshSuggestedCode(): Promise<void> {
    if (this.editingId() || this.codeTouched) return;
    const seq = ++this.suggestSeq;
    try {
      const next = await this.api.suggestCode('domain');
      if (seq !== this.suggestSeq || this.editingId() || this.codeTouched) return;
      this.code.set(next);
    } catch {
      /* saisie manuelle toujours possible */
    }
  }

  async save(): Promise<void> {
    this.error.set(null);
    try {
      const payload = { code: this.code(), name: this.name, description: this.description, sortOrder: Number(this.sortOrder) };
      if (this.editingId()) await this.api.updateDomain(this.editingId()!, payload);
      else await this.api.createDomain(payload);
      this.resetForm();
      await this.load();
    } catch (err: any) {
      this.error.set(err?.error?.message || 'Enregistrement impossible.');
    }
  }

  async archive(row: TaxonomyItem): Promise<void> {
    try {
      await this.api.archiveDomain(row.id);
      await this.load();
    } catch (err: any) {
      this.error.set(err?.error?.message || 'Archivage bloqué.');
    }
  }
}
