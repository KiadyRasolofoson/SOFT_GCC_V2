import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/auth.service';
import { hasAnyPermission } from '../users/user.models';
import { GccEmptyState } from '../../ui/gcc-empty-state';
import { GccPageHeader } from '../../ui/gcc-page-header';
import { GccSelect } from '../../ui/gcc-select';
import { GccSkillBadge, skillLevelFromRank } from '../../ui/gcc-skill-badge';
import { GccStatusTag } from '../../ui/gcc-status-tag';
import {
  flattenCatalog,
  PositionDetail,
  PositionSkillItem,
  REQUIREMENT_KIND_OPTIONS,
  requirementKindLabel,
  requirementKindStatus,
  SKILL_RANK_OPTIONS,
  SkillListItem,
} from './skill-referential.models';
import { SkillReferentialService } from './skill-referential.service';

@Component({
  selector: 'app-skill-matrix-page',
  imports: [FormsModule, GccPageHeader, GccSelect, GccSkillBadge, GccStatusTag, GccEmptyState, MatButtonModule, MatIconModule],
  template: `
    <gcc-page-header
      [title]="headerTitle()"
      [subtitle]="headerSubtitle()"
      icon="work"
      [crumbs]="crumbs()"
      secondaryLabel="Tous les postes"
      secondaryIcon="arrow_back"
      (secondaryAction)="router.navigate(['/soft-gcc/parametres/referentiel-competences/postes'])"
      [actionLabel]="canManage() ? 'Enregistrer la matrice' : ''"
      actionIcon="save"
      (action)="save()"
    />

    @if (error()) {
      <p class="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{{ error() }}</p>
    }

    @if (position(); as p) {
      <div class="mb-4 flex flex-wrap items-center gap-x-8 gap-y-2 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div class="min-w-0">
          <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Poste</p>
          <p class="mt-0.5 text-lg font-semibold text-navy">{{ p.positionName || '—' }}</p>
        </div>
        @if (p.departmentName) {
          <div class="min-w-0">
            <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Département</p>
            <p class="mt-0.5 text-sm font-medium text-slate-600">{{ p.departmentName }}</p>
          </div>
        }
        @if (canManage()) {
          <p class="ml-auto max-w-xs text-right text-xs leading-relaxed text-slate-400">
            Vous corrigez ici les niveaux attendus (1–4) utilisés par l'évaluation.
          </p>
        }
      </div>
    }

    @if (canManage()) {
      <div class="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p class="mb-3 text-sm font-semibold text-navy">Ajouter une compétence</p>
        <div class="flex flex-wrap items-end gap-3">
          <div class="min-w-[240px] flex-1">
            <gcc-select [options]="skillOptions()" [(value)]="pickedSkill" placeholder="Compétence active ou brouillon" />
          </div>
          <button mat-flat-button type="button" class="gcc-btn-primary" (click)="add()">
            <mat-icon>add</mat-icon>
            Ajouter
          </button>
        </div>
      </div>
    }

    @if (!rows().length) {
      <gcc-empty-state title="Aucune compétence rattachée" message="Ajoutez les compétences critiques et requises de ce poste." />
    } @else {
      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="mb-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Compétences requises ({{ rows().length }})
        </p>
        <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          @for (row of rows(); track row.skillId) {
            <div class="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
              <div class="mb-3 flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="line-clamp-2 text-sm font-semibold text-navy">{{ row.skillName }}</p>
                  <span class="mt-1 inline-flex rounded-md bg-white px-2 py-0.5 font-mono text-[11px] tabular-nums text-slate-400">{{ row.skillCode }}</span>
                </div>
                <gcc-skill-badge [level]="skillLevelFromRank(row.expectedLevel)" />
              </div>
              @if (canManage()) {
                <div class="grid gap-2">
                  <label class="block">
                    <span class="mb-1 block text-[11px] font-medium text-slate-500">Niveau attendu</span>
                    <gcc-select [options]="rankOptions" [value]="rankValue(row)" (valueChange)="setRank(row, $event)" />
                  </label>
                  <label class="block">
                    <span class="mb-1 block text-[11px] font-medium text-slate-500">Criticité</span>
                    <gcc-select [options]="kindOptions" [value]="row.requirementKind" (valueChange)="setKind(row, $event)" />
                  </label>
                  <div class="flex items-end gap-2">
                    <label class="block min-w-0 flex-1">
                      <span class="mb-1 block text-[11px] font-medium text-slate-500">Poids</span>
                      <input class="gcc-input" type="number" min="0.1" step="0.1" [ngModel]="row.weight" (ngModelChange)="setWeight(row, $event)" />
                    </label>
                    <button mat-icon-button type="button" (click)="remove(row.skillId)" aria-label="Retirer">
                      <mat-icon>close</mat-icon>
                    </button>
                  </div>
                </div>
              } @else {
                <div class="mt-2 flex items-center justify-between gap-2">
                  <gcc-status-tag [status]="requirementKindStatus(row.requirementKind)" [label]="requirementKindLabel(row.requirementKind)" />
                  <p class="text-sm tabular-nums text-slate-600">Poids {{ row.weight }}</p>
                </div>
              }
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class SkillMatrixPage {
  readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(SkillReferentialService);
  private readonly auth = inject(AuthService);
  readonly crumbs = computed(() => [
    { label: 'Accueil' },
    { label: 'Référentiel' },
    { label: 'Postes' },
    { label: this.position()?.positionName || 'Fiche poste' },
  ]);
  readonly headerTitle = computed(() => this.position()?.positionName || 'Compétences du poste');
  readonly headerSubtitle = computed(() => {
    const dept = this.position()?.departmentName;
    const base = 'Niveau attendu 1–4, criticité et poids. Les lignes retirées sont archivées, pas supprimées.';
    return dept ? `Fiche poste · ${dept}. ${base}` : base;
  });
  readonly rankOptions = SKILL_RANK_OPTIONS;
  readonly kindOptions = REQUIREMENT_KIND_OPTIONS;
  readonly skillLevelFromRank = skillLevelFromRank;
  readonly requirementKindLabel = requirementKindLabel;
  readonly requirementKindStatus = requirementKindStatus;
  readonly rows = signal<PositionSkillItem[]>([]);
  readonly catalog = signal<SkillListItem[]>([]);
  readonly position = signal<PositionDetail | null>(null);
  readonly pickedSkill = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly positionId = Number(this.route.snapshot.paramMap.get('positionId'));
  readonly canManage = computed(() =>
    hasAnyPermission(this.auth.user()?.permissions, ['MANAGE_SKILL_SETTINGS', 'PUBLISH_SKILL_REFERENTIAL']),
  );

  constructor() {
    void this.load();
  }

  skillOptions() {
    const used = new Set(this.rows().map((row) => row.skillId));
    return this.catalog()
      .filter((item) => item.state !== 'Archived' && !used.has(item.skillId))
      .map((item) => ({ label: `${item.name} (${item.code})`, value: String(item.skillId) }));
  }

  async load(): Promise<void> {
    const [matrix, catalog] = await Promise.all([
      this.api.getPositionSkills(this.positionId),
      this.api.getCatalog({}),
    ]);
    this.rows.set(matrix);
    this.catalog.set(flattenCatalog(catalog));
    await this.loadIdentity();
  }

  private async loadIdentity(): Promise<void> {
    try {
      this.position.set(await this.api.getPositionDetail(this.positionId));
    } catch {
      // La matrice reste accessible même si la fiche poste (identité) ne charge pas.
    }
  }

  add(): void {
    const skillId = Number(this.pickedSkill());
    const skill = this.catalog().find((item) => item.skillId === skillId);
    if (!skill) return;
    this.rows.update((rows) => [
      ...rows,
      {
        skillPositionId: 0,
        skillId,
        skillName: skill.name,
        skillCode: skill.code,
        expectedLevel: 2,
        requirementKind: 'Required',
        weight: 1,
        state: 1,
      },
    ]);
    this.pickedSkill.set(null);
  }

  remove(skillId: number): void {
    this.rows.update((rows) => rows.filter((row) => row.skillId !== skillId));
  }

  setRank(row: PositionSkillItem, value: string | null): void {
    const expectedLevel = Number(value);
    this.rows.update((rows) =>
      rows.map((item) => (item.skillId === row.skillId ? { ...item, expectedLevel } : item)),
    );
  }

  rankValue(row: PositionSkillItem): string {
    return String(row.expectedLevel);
  }

  setWeight(row: PositionSkillItem, value: number | string): void {
    const weight = Number(value) || 1;
    this.rows.update((rows) =>
      rows.map((item) => (item.skillId === row.skillId ? { ...item, weight } : item)),
    );
  }

  setKind(row: PositionSkillItem, value: string | null): void {
    const requirementKind = value || 'Required';
    this.rows.update((rows) =>
      rows.map((item) => (item.skillId === row.skillId ? { ...item, requirementKind } : item)),
    );
  }

  async save(): Promise<void> {
    this.error.set(null);
    try {
      const saved = await this.api.upsertPositionSkills(
        this.positionId,
        this.rows().map((row) => ({
          skillId: row.skillId,
          expectedLevel: row.expectedLevel,
          requirementKind: row.requirementKind,
          weight: Number(row.weight) || 1,
        })),
      );
      this.rows.set(saved);
    } catch (err: any) {
      this.error.set(err?.error?.message || 'Enregistrement de la matrice impossible.');
    }
  }
}
