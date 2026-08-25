import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/auth.service';
import { hasAnyPermission } from '../users/user.models';
import { GccPageHeader } from '../../ui/gcc-page-header';
import { GccSelect } from '../../ui/gcc-select';
import { GccSelectOption } from '../../ui/gcc.types';
import { GccSkillBadge, skillLevelFromRank } from '../../ui/gcc-skill-badge';
import { GccStatusTag } from '../../ui/gcc-status-tag';
import {
  categoryLabel,
  emptyDescriptors,
  SKILL_CATEGORY_OPTIONS,
  SkillDetail,
  SkillDraft,
  SkillLevelDescriptor,
  requirementKindLabel,
  skillStateStatus,
  stateLabel,
  TaxonomyItem,
} from './skill-referential.models';
import { SkillReferentialService } from './skill-referential.service';
import { CODE_HINT } from './referential-code';

@Component({
  selector: 'app-skill-form-page',
  imports: [FormsModule, GccPageHeader, GccSelect, GccSkillBadge, GccStatusTag, MatButtonModule, MatIconModule],
  template: `
    <gcc-page-header
      [title]="isNew() ? 'Nouvelle compétence' : 'Fiche compétence'"
      subtitle="Identité, définition métier et descripteurs comportementaux des 4 niveaux."
      icon="star"
      [crumbs]="crumbs"
      secondaryLabel="Retour au catalogue"
      secondaryIcon="arrow_back"
      (secondaryAction)="router.navigate(['/soft-gcc/parametres/referentiel-competences'])"
    />

    @if (error()) {
      <p class="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{{ error() }}</p>
    }

    @if (loading()) {
      <div class="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Chargement…</div>
    } @else {
      <div class="grid gap-6 lg:grid-cols-3">
        <div class="flex flex-col gap-6 lg:col-span-2">
          <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 class="mb-4 border-b border-slate-100 pb-2 text-sm font-semibold text-navy">Identité</h2>
            <div class="grid gap-4 md:grid-cols-2">
              <label class="block">
                <span class="mb-1 block text-sm font-medium text-slate-600">Code</span>
                <input
                  class="gcc-input disabled:bg-slate-50 disabled:text-slate-500"
                  placeholder="SKILL-00001"
                  [(ngModel)]="code"
                  [disabled]="!isNew()"
                  (ngModelChange)="onCodeEdit($event)"
                />
                @if (isNew()) {
                  <span class="mt-1 block text-[11px] text-slate-400">{{ codeHint }}</span>
                }
              </label>
              <label class="block">
                <span class="mb-1 block text-sm font-medium text-slate-600">Nom *</span>
                <input class="gcc-input" placeholder="Ex. Communication orale" [(ngModel)]="name" (ngModelChange)="onNameChange($event)" />
              </label>
              <label class="block">
                <span class="mb-1 block text-sm font-medium text-slate-600">Catégorie *</span>
                <gcc-select [options]="categoryOptions" [(value)]="category" />
              </label>
              <label class="block">
                <span class="mb-1 block text-sm font-medium text-slate-600">Famille *</span>
                <gcc-select [options]="familyOptions()" [(value)]="familyId" placeholder="Choisir une famille" />
              </label>
              <label class="block md:col-span-2">
                <span class="mb-1 block text-sm font-medium text-slate-600">Définition *</span>
                <textarea class="gcc-input min-h-24" rows="4" placeholder="Définition métier, observable et non ambiguë" [(ngModel)]="definition"></textarea>
              </label>
            </div>
            @if (similar().length) {
              <div class="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                <mat-icon class="!h-4 !w-4 !text-[16px]">info</mat-icon>
                <span>Compétences proches : {{ similar().join(', ') }}</span>
              </div>
            }
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 class="text-sm font-semibold text-navy">Paliers d’évaluation</h2>
            <p class="mt-1 text-xs text-slate-500">Un comportement observable par rang, de Notions à Expert.</p>
            <div class="mt-4 grid gap-3 md:grid-cols-2">
              @for (item of descriptors(); track item.rank) {
                <div class="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                  <div class="mb-1 flex items-center justify-between gap-2">
                    <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Niveau {{ item.rank }}</p>
                    <gcc-skill-badge [level]="skillLevelFromRank(item.rank)" />
                  </div>
                  <textarea
                    class="gcc-input min-h-24 bg-white"
                    rows="3"
                    [ngModel]="item.behavioralDefinition"
                    (ngModelChange)="patchDescriptor(item.rank, $event)"
                    placeholder="Comportement observable à ce niveau"
                  ></textarea>
                </div>
              }
            </div>
          </div>

          <div class="flex flex-wrap justify-end gap-2">
            <button mat-stroked-button type="button" class="gcc-btn-secondary" (click)="router.navigate(['/soft-gcc/parametres/referentiel-competences'])">Annuler</button>
            @if (canManage()) {
              <button mat-flat-button type="button" class="gcc-btn-primary" (click)="save()" [disabled]="saving()">
                <mat-icon>save</mat-icon>
                Enregistrer brouillon
              </button>
            }
            @if (canPublish()) {
              <button mat-flat-button type="button" class="gcc-btn-primary" (click)="publish()" [disabled]="saving()">
                <mat-icon>publish</mat-icon>
                Publier
              </button>
              @if (!isNew()) {
                <button mat-stroked-button type="button" class="gcc-btn-secondary" (click)="archive()" [disabled]="saving()">Archiver</button>
              }
            }
          </div>
        </div>

        <aside class="lg:col-span-1">
          <div class="sticky top-6 space-y-4">
            <div class="rounded-2xl border border-slate-200 bg-canvas p-5">
              <h3 class="mb-3 flex items-center gap-2 text-sm font-semibold text-indigo-pro">
                <mat-icon class="!h-4 !w-4 !text-[16px] text-accent">info</mat-icon>
                Informations
              </h3>
              <div class="flex items-center justify-between border-b border-slate-200 py-2 text-sm">
                <span class="text-slate-500">Statut</span>
                @if (detail(); as current) {
                  <gcc-status-tag [status]="skillStateStatus(current.state)" [label]="stateLabel(current.state)" />
                } @else {
                  <gcc-status-tag status="pending" label="Brouillon" />
                }
              </div>
              <div class="flex items-center justify-between py-2 text-sm">
                <span class="text-slate-500">Version</span>
                <span class="font-mono text-navy">{{ detail()?.currentVersion ?? '—' }}</span>
              </div>
            </div>

            @if (detail()?.versions?.length) {
              <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 class="mb-3 text-sm font-semibold text-navy">Historique des versions</h3>
                <ul class="divide-y divide-slate-100">
                  @for (version of detail()!.versions; track version.skillVersionId) {
                    <li class="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                      <span class="font-medium text-navy">v{{ version.version }}</span>
                      <span class="text-xs text-slate-500">{{ categoryLabel(version.category) }}</span>
                    </li>
                  }
                </ul>
              </div>
            }

            <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 class="mb-3 text-sm font-semibold text-navy">Métiers rattachés</h3>
              @if (detail()?.positions?.length) {
                <ul class="space-y-3">
                  @for (position of detail()!.positions; track position.skillPositionId) {
                    <li class="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3">
                      <p class="font-medium text-navy">{{ position.positionName }}</p>
                      <div class="mt-2 flex flex-wrap items-center gap-2">
                        <gcc-skill-badge [level]="skillLevelFromRank(position.expectedLevel)" />
                        <span class="text-xs text-slate-500">{{ requirementKindLabel(position.requirementKind) }}</span>
                      </div>
                    </li>
                  }
                </ul>
              } @else {
                <p class="text-xs italic text-slate-400">Sauvegardez pour rattacher des métiers via la matrice emplois.</p>
              }
            </div>
          </div>
        </aside>
      </div>
    }
  `,
})
export class SkillFormPage {
  readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(SkillReferentialService);
  private readonly auth = inject(AuthService);

  readonly crumbs = [{ label: 'Accueil' }, { label: 'Paramètres' }, { label: 'Référentiel' }, { label: 'Fiche' }];
  readonly categoryOptions = SKILL_CATEGORY_OPTIONS;
  readonly categoryLabel = categoryLabel;
  readonly stateLabel = stateLabel;
  readonly skillStateStatus = skillStateStatus;
  readonly skillLevelFromRank = skillLevelFromRank;
  readonly requirementKindLabel = requirementKindLabel;

  readonly isNew = signal(true);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly detail = signal<SkillDetail | null>(null);
  readonly families = signal<TaxonomyItem[]>([]);
  readonly similar = signal<string[]>([]);
  readonly descriptors = signal<SkillLevelDescriptor[]>(emptyDescriptors());

  code = '';
  name = '';
  definition = '';
  category = signal<string | null>('Transversal');
  familyId = signal<string | null>(null);
  readonly codeHint = CODE_HINT;
  private codeTouched = false;
  private suggestSeq = 0;

  readonly familyOptions = computed<GccSelectOption[]>(() =>
    this.families()
      .filter((item) => item.state !== 'Archived')
      .map((item) => ({ label: `${item.domainName ?? ''} · ${item.name}`, value: String(item.id) })),
  );
  readonly canManage = computed(() =>
    hasAnyPermission(this.auth.user()?.permissions, ['MANAGE_SKILL_SETTINGS', 'PUBLISH_SKILL_REFERENTIAL']),
  );
  readonly canPublish = computed(() =>
    hasAnyPermission(this.auth.user()?.permissions, ['PUBLISH_SKILL_REFERENTIAL']),
  );

  constructor() {
    void this.bootstrap();
  }

  async bootstrap(): Promise<void> {
    this.loading.set(true);
    try {
      this.families.set(await this.api.getFamilies());
      const id = this.route.snapshot.paramMap.get('skillId');
      if (!id || id === 'nouveau') {
        this.isNew.set(true);
        this.codeTouched = false;
        await this.refreshSuggestedCode();
        return;
      }
      this.isNew.set(false);
      const detail = await this.api.getSkill(Number(id));
      this.hydrate(detail);
    } catch {
      this.error.set('Impossible de charger la compétence.');
    } finally {
      this.loading.set(false);
    }
  }

  async onNameChange(value: string): Promise<void> {
    this.name = value;
    if (value.trim().length < 3) {
      this.similar.set([]);
      return;
    }
    try {
      const rows = await this.api.findSimilar(value);
      this.similar.set(rows.filter((row) => row.skillId !== this.detail()?.skillId).map((row) => row.name));
    } catch {
      this.similar.set([]);
    }
  }

  onCodeEdit(value: string): void {
    this.code = value;
    this.codeTouched = value.trim().length > 0;
    if (!this.codeTouched) {
      void this.refreshSuggestedCode();
    }
  }

  private async refreshSuggestedCode(): Promise<void> {
    if (!this.isNew() || this.codeTouched) return;
    const seq = ++this.suggestSeq;
    try {
      const next = await this.api.suggestCode('skill');
      if (seq !== this.suggestSeq || !this.isNew() || this.codeTouched) return;
      this.code = next;
    } catch {
      /* l'utilisateur peut encore saisir le code à la main */
    }
  }

  patchDescriptor(rank: number, value: string): void {
    this.descriptors.update((rows) =>
      rows.map((row) => (row.rank === rank ? { ...row, behavioralDefinition: value } : row)),
    );
  }

  async save(): Promise<void> {
    this.saving.set(true);
    this.error.set(null);
    try {
      const draft = this.toDraft();
      const saved = this.isNew()
        ? await this.api.createDraft(draft)
        : await this.api.updateDraft(this.detail()!.skillId, draft);
      this.hydrate(saved);
      this.isNew.set(false);
      void this.router.navigate(['/soft-gcc/parametres/referentiel-competences/competences', saved.skillId]);
    } catch (err: any) {
      this.error.set(err?.error?.message || err?.error?.title || "Enregistrement impossible.");
    } finally {
      this.saving.set(false);
    }
  }

  async publish(): Promise<void> {
    this.saving.set(true);
    this.error.set(null);
    try {
      if (!this.detail()) {
        const created = await this.api.createDraft(this.toDraft());
        this.hydrate(created);
        this.isNew.set(false);
      } else {
        await this.saveQuiet();
      }
      const published = await this.api.publish(this.detail()!.skillId);
      this.hydrate(published);
      void this.router.navigate(['/soft-gcc/parametres/referentiel-competences/competences', published.skillId]);
    } catch (err: any) {
      this.error.set(err?.error?.message || err?.error?.title || 'Publication refusée.');
    } finally {
      this.saving.set(false);
    }
  }

  async archive(): Promise<void> {
    if (!this.detail()) return;
    this.saving.set(true);
    try {
      await this.api.archive(this.detail()!.skillId);
      void this.router.navigate(['/soft-gcc/parametres/referentiel-competences']);
    } catch (err: any) {
      this.error.set(err?.error?.message || 'Archivage impossible.');
    } finally {
      this.saving.set(false);
    }
  }

  private async saveQuiet(): Promise<void> {
    if (!this.detail()) return;
    const saved = await this.api.updateDraft(this.detail()!.skillId, this.toDraft());
    this.hydrate(saved);
  }

  private toDraft(): SkillDraft {
    return {
      code: this.code || undefined,
      name: this.name,
      definition: this.definition,
      category: this.category() ?? 'Transversal',
      familyId: Number(this.familyId()),
      descriptors: this.descriptors(),
    };
  }

  private hydrate(detail: SkillDetail): void {
    this.detail.set(detail);
    this.code = detail.code;
    this.name = detail.name;
    this.definition = detail.definition;
    this.category.set(detail.category);
    this.familyId.set(String(detail.familyId));
    this.codeTouched = true;
    const merged = emptyDescriptors().map((base) => {
      const found = detail.descriptors.find((item) => item.rank === base.rank);
      return found ?? base;
    });
    this.descriptors.set(merged);
  }
}
