import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { EmployeeFicheProfile, EmployeeSkillGapItem } from '../../../core/employee-fiche.models';
import {
  EmployeeSkillsProfileData,
  EmployeeSkillsProfileService,
} from '../../../core/employee-skills-profile.service';
import { GccEmptyState } from '../../../ui/gcc-empty-state';
import { GccSelect } from '../../../ui/gcc-select';
import { GccSkillBadge, skillLevelFromRank } from '../../../ui/gcc-skill-badge';
import { GccSkillGap } from '../../../ui/gcc-skill-gap';
import { GccStatusTag, StatusKind } from '../../../ui/gcc-status-tag';
import { CrudKind, EmployeeSkillsCrudDialogComponent } from './employee-skills-crud-dialog.component';

@Component({
  selector: 'app-employee-skills-panel',
  imports: [
    GccSkillGap,
    GccSkillBadge,
    GccEmptyState,
    MatTabsModule,
    MatProgressBarModule,
    GccSelect,
    GccStatusTag,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    EmployeeSkillsCrudDialogComponent,
  ],
  template: `
    @if (!employeeId()) {
      <gcc-empty-state
        title="Compétences indisponibles"
        message="Impossible de charger les compétences : identifiant employé introuvable."
      />
    } @else {
      <section class="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div class="mb-4 flex items-center justify-between gap-3">
            <h2 class="text-base font-semibold text-navy">Compétences détaillées</h2>
            <div class="flex items-center gap-2">
              <span class="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-accent">
                {{ totalItems() }} élément(s)
              </span>
              <button mat-flat-button type="button" class="gcc-btn-primary !h-9 !px-3 !text-xs" (click)="openAdd()">
                <mat-icon class="!h-4 !w-4 !text-[16px]">add</mat-icon>
                Ajouter
              </button>
            </div>
          </div>

          @if (actionError()) {
            <p class="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{{ actionError() }}</p>
          }

          @if (loading()) {
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
              Chargement des compétences…
            </div>
          } @else if (error()) {
            <gcc-empty-state variant="error" title="Erreur de chargement" [message]="error() ?? ''" />
          } @else {
            <mat-tab-group (selectedIndexChange)="onTabChange($event)">
              <mat-tab [label]="'Compétences (' + data().skills.length + ')'">
                <div class="pt-4">
                  @if (data().skills.length) {
                    <div class="overflow-x-auto">
                      <table class="w-full min-w-[680px]">
                        <thead>
                          <tr class="border-b border-slate-200 text-left text-xs uppercase tracking-[0.08em] text-slate-500">
                            <th class="px-2 py-2 font-semibold">Domaine</th>
                            <th class="px-2 py-2 font-semibold">Compétence</th>
                            <th class="px-2 py-2 font-semibold">Niveau</th>
                            <th class="px-2 py-2 font-semibold">État</th>
                            <th class="px-2 py-2 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (row of data().skills; track $index) {
                            <tr class="border-b border-slate-100 text-sm text-slate-700">
                              <td class="px-2 py-2">{{ row['domainSkillName'] || '—' }}</td>
                              <td class="px-2 py-2 font-medium text-navy">{{ row['skillName'] || '—' }}</td>
                              <td class="px-2 py-2">
                                @if (row['acquiredLevel']) {
                                  <gcc-skill-badge [level]="skillLevelFromRank(row['acquiredLevel'])" />
                                } @else {
                                  {{ formatLevel(row['level']) }}
                                }
                              </td>
                              @let skillTag = skillStatus(row['state']);
                              <td class="px-2 py-2"><gcc-status-tag [status]="skillTag.status" [label]="skillTag.label" /></td>
                              <td class="px-2 py-2">
                                <div class="flex items-center gap-1">
                                  <button mat-icon-button type="button" class="!h-8 !w-8" (click)="openEditSkill(row)" title="Modifier">
                                    <mat-icon class="!h-4 !w-4 !text-[16px] text-accent">edit</mat-icon>
                                  </button>
                                  <button mat-icon-button type="button" class="!h-8 !w-8" (click)="deleteSkill(row)" title="Supprimer">
                                    <mat-icon class="!h-4 !w-4 !text-[16px] text-red-500">delete</mat-icon>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  } @else {
                    <gcc-empty-state title="Aucune compétence" message="Aucune compétence enregistrée." />
                  }
                </div>
              </mat-tab>

              <mat-tab [label]="'Diplômes & formations (' + data().education.length + ')'">
                <div class="pt-4">
                  @if (data().education.length) {
                    <div class="overflow-x-auto">
                      <table class="w-full min-w-[680px]">
                        <thead>
                          <tr class="border-b border-slate-200 text-left text-xs uppercase tracking-[0.08em] text-slate-500">
                            <th class="px-2 py-2 font-semibold">Filière</th>
                            <th class="px-2 py-2 font-semibold">Niveau</th>
                            <th class="px-2 py-2 font-semibold">École</th>
                            <th class="px-2 py-2 font-semibold">Début</th>
                            <th class="px-2 py-2 font-semibold">Fin</th>
                            <th class="px-2 py-2 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (row of data().education; track $index) {
                            <tr class="border-b border-slate-100 text-sm text-slate-700">
                              <td class="px-2 py-2">{{ row['studyPathName'] || '—' }}</td>
                              <td class="px-2 py-2">{{ row['degreeName'] || '—' }}</td>
                              <td class="px-2 py-2">{{ row['schoolName'] || '—' }}</td>
                              <td class="px-2 py-2">{{ formatDate(row['startDate']) }}</td>
                              <td class="px-2 py-2">{{ formatDate(row['endingDate']) }}</td>
                              <td class="px-2 py-2">
                                <div class="flex items-center gap-1">
                                  <button mat-icon-button type="button" class="!h-8 !w-8" (click)="openEditEducation(row)" title="Modifier">
                                    <mat-icon class="!h-4 !w-4 !text-[16px] text-accent">edit</mat-icon>
                                  </button>
                                  <button mat-icon-button type="button" class="!h-8 !w-8" (click)="deleteEducation(row)" title="Supprimer">
                                    <mat-icon class="!h-4 !w-4 !text-[16px] text-red-500">delete</mat-icon>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  } @else {
                    <gcc-empty-state title="Aucun diplôme" message="Aucun diplôme ou formation enregistré." />
                  }
                </div>
              </mat-tab>

              <mat-tab [label]="'Langues (' + data().language.length + ')'">
                <div class="pt-4">
                  @if (data().language.length) {
                    <div class="overflow-x-auto">
                      <table class="w-full min-w-[680px]">
                        <thead>
                          <tr class="border-b border-slate-200 text-left text-xs uppercase tracking-[0.08em] text-slate-500">
                            <th class="px-2 py-2 font-semibold">Langue</th>
                            <th class="px-2 py-2 font-semibold">Niveau</th>
                            <th class="px-2 py-2 font-semibold">État</th>
                            <th class="px-2 py-2 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (row of data().language; track $index) {
                            <tr class="border-b border-slate-100 text-sm text-slate-700">
                              <td class="px-2 py-2">{{ row['languageName'] || '—' }}</td>
                              <td class="px-2 py-2">{{ formatLevel(row['level']) }}</td>
                              @let langTag = skillStatus(row['state']);
                              <td class="px-2 py-2"><gcc-status-tag [status]="langTag.status" [label]="langTag.label" /></td>
                              <td class="px-2 py-2">
                                <div class="flex items-center gap-1">
                                  <button mat-icon-button type="button" class="!h-8 !w-8" (click)="openEditLanguage(row)" title="Modifier">
                                    <mat-icon class="!h-4 !w-4 !text-[16px] text-accent">edit</mat-icon>
                                  </button>
                                  <button mat-icon-button type="button" class="!h-8 !w-8" (click)="deleteLanguage(row)" title="Supprimer">
                                    <mat-icon class="!h-4 !w-4 !text-[16px] text-red-500">delete</mat-icon>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  } @else {
                    <gcc-empty-state title="Aucune langue" message="Aucune langue enregistrée." />
                  }
                </div>
              </mat-tab>

              <mat-tab [label]="'Autres (' + data().otherSkills.length + ')'">
                <div class="pt-4">
                  @if (data().otherSkills.length) {
                    <div class="overflow-x-auto">
                      <table class="w-full min-w-[680px]">
                        <thead>
                          <tr class="border-b border-slate-200 text-left text-xs uppercase tracking-[0.08em] text-slate-500">
                            <th class="px-2 py-2 font-semibold">Description</th>
                            <th class="px-2 py-2 font-semibold">Début</th>
                            <th class="px-2 py-2 font-semibold">Fin</th>
                            <th class="px-2 py-2 font-semibold">Commentaire</th>
                            <th class="px-2 py-2 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (row of data().otherSkills; track $index) {
                            <tr class="border-b border-slate-100 text-sm text-slate-700">
                              <td class="px-2 py-2">{{ row['description'] || '—' }}</td>
                              <td class="px-2 py-2">{{ formatDate(row['startDate']) }}</td>
                              <td class="px-2 py-2">{{ formatDate(row['endDate']) }}</td>
                              <td class="px-2 py-2">{{ row['comment'] || '—' }}</td>
                              <td class="px-2 py-2">
                                <div class="flex items-center gap-1">
                                  <button mat-icon-button type="button" class="!h-8 !w-8" (click)="openEditOther(row)" title="Modifier">
                                    <mat-icon class="!h-4 !w-4 !text-[16px] text-accent">edit</mat-icon>
                                  </button>
                                  <button mat-icon-button type="button" class="!h-8 !w-8" (click)="deleteOther(row)" title="Supprimer">
                                    <mat-icon class="!h-4 !w-4 !text-[16px] text-red-500">delete</mat-icon>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  } @else {
                    <gcc-empty-state title="Aucune autre formation" message="Aucune autre formation enregistrée." />
                  }
                </div>
              </mat-tab>
            </mat-tab-group>
          }
        </article>

        <aside class="space-y-4">
          <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 class="mb-2 text-base font-semibold text-navy">Analyse des compétences</h2>
            <p class="mb-3 text-xs text-slate-500">Niveaux des compétences obtenues</p>

            <gcc-select
              [options]="stateOptions"
              [value]="stateFilter()"
              (valueChange)="onStateFilterChange($event)"
              placeholder="Filtrer par état"
            />

            @if (chartLoading()) {
              <div class="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
                Chargement de l’analyse…
              </div>
            } @else if (chartRows().length === 0) {
              <div class="mt-4">
                <gcc-empty-state title="Aucune donnée" message="Pas de données d'analyse pour ce filtre." />
              </div>
            } @else {
              <div class="mt-4 space-y-3">
                @for (row of chartRows(); track $index) {
                  <div>
                    <div class="mb-1 flex items-center justify-between gap-2 text-xs">
                      <span class="truncate text-slate-600">{{ row.label }}</span>
                      <span class="font-semibold text-navy">{{ row.value }}</span>
                    </div>
                    <mat-progress-bar mode="determinate" [value]="row.percent" />
                  </div>
                }
              </div>
            }
          </article>

          <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 class="mb-1 text-base font-semibold text-navy">Synthèse des écarts</h2>
            @if (profile()?.positionName) {
              <p class="mb-3 text-xs text-slate-500">Poste actuel · {{ profile()?.positionName }}</p>
            }
            @if (sortedSkillGaps().length) {
              <div class="max-h-96 space-y-3 overflow-y-auto overscroll-contain pr-1">
                @for (item of sortedSkillGaps(); track item.label) {
                  <gcc-skill-gap
                    [skill]="item.label"
                    [required]="item.required"
                    [acquired]="item.acquired"
                    [missing]="item.missing === true"
                    [critical]="item.critical === true"
                  />
                }
              </div>
            } @else {
              <gcc-empty-state
                title="Aucun écart"
                message="Aucun écart à afficher : pas de poste actuel avec matrice, ou acquis au niveau attendu."
              />
            }
          </article>
        </aside>
      </section>

      <!-- Dialog CRUD compétences / diplômes / langues / autres -->
      <app-employee-skills-crud-dialog
        [kind]="dialogKind()"
        [employeeId]="employeeId()"
        [item]="dialogItem()"
        [open]="dialogOpen()"
        (saved)="onDialogSaved()"
        (closed)="dialogOpen.set(false)"
      />
    }
  `,
})
export class EmployeeSkillsPanelComponent {
  private readonly service = inject(EmployeeSkillsProfileService);

  readonly employeeId = input<number | null>(null);
  readonly skillGaps = input<EmployeeSkillGapItem[]>([]);
  readonly profile = input<EmployeeFicheProfile | null>(null);
  readonly skillsChanged = output<void>();
  readonly skillLevelFromRank = skillLevelFromRank;

  /** Écarts triés : compétences critiques en premier, puis par nom. */
  readonly sortedSkillGaps = computed(() =>
    [...this.skillGaps()].sort((a, b) => {
      if (a.critical !== b.critical) return a.critical ? -1 : 1;
      return a.label.localeCompare(b.label);
    }),
  );

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly data = signal<EmployeeSkillsProfileData>({
    skills: [],
    education: [],
    language: [],
    otherSkills: [],
  });

  readonly stateFilter = signal('0');
  readonly chartLoading = signal(false);
  readonly chartData = signal<Record<string, any>[]>([]);

  readonly stateOptions = [
    { label: 'Tous', value: '0' },
    { label: 'Non validé', value: '1' },
    { label: 'Validé par évaluation', value: '5' },
  ];

  readonly activeTab = signal(0);
  readonly dialogKind = signal<CrudKind>('skill');
  readonly dialogOpen = signal(false);
  readonly dialogItem = signal<Record<string, any> | null>(null);
  readonly actionError = signal<string | null>(null);

  readonly totalItems = computed(
    () =>
      this.data().skills.length +
      this.data().education.length +
      this.data().language.length +
      this.data().otherSkills.length,
  );

  readonly chartRows = computed(() => {
    const rows = this.chartData();
    const max = Math.max(...rows.map((item) => Number(item['value']) || 0), 1);
    return rows.map((item) => ({
      label: String(item['label'] ?? '—'),
      value: Number(item['value']) || 0,
      percent: Math.round(((Number(item['value']) || 0) / max) * 100),
    }));
  });

  constructor() {
    effect(() => {
      const id = this.employeeId();
      if (!id) {
        this.data.set({ skills: [], education: [], language: [], otherSkills: [] });
        this.chartData.set([]);
        this.error.set(null);
        return;
      }
      void this.loadData(id);
      void this.loadChart(id, Number(this.stateFilter()));
    });
  }

  onStateFilterChange(value: string | null): void {
    const next = value ?? '0';
    this.stateFilter.set(next);

    const id = this.employeeId();
    if (!id) return;
    void this.loadChart(id, Number(next));
  }

  skillStatus(state: unknown): { status: StatusKind; label: string } {
    const value = Number(state);
    if (value >= 10) return { status: 'ok', label: 'Confirmé' };
    if (value >= 5) return { status: 'gap', label: 'Validé par évaluation' };
    return { status: 'refused', label: 'Non validé' };
  }

  formatLevel(level: unknown): string {
    const value = Number(level);
    return Number.isFinite(value) && value > 0 ? `${value} %` : '—';
  }

  formatDate(value: unknown): string {
    if (!value) return '—';
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  openAdd(): void {
    const kinds: CrudKind[] = ['skill', 'education', 'language', 'other'];
    this.dialogKind.set(kinds[this.activeTab()] ?? 'skill');
    this.dialogItem.set(null);
    this.actionError.set(null);
    this.dialogOpen.set(true);
  }

  onTabChange(index: number): void {
    this.activeTab.set(index);
  }

  openEditSkill(row: Record<string, any>): void {
    this.dialogKind.set('skill');
    this.dialogItem.set(row);
    this.dialogOpen.set(true);
  }

  openEditEducation(row: Record<string, any>): void {
    this.dialogKind.set('education');
    this.dialogItem.set(row);
    this.dialogOpen.set(true);
  }

  openEditLanguage(row: Record<string, any>): void {
    this.dialogKind.set('language');
    this.dialogItem.set(row);
    this.dialogOpen.set(true);
  }

  openEditOther(row: Record<string, any>): void {
    this.dialogKind.set('other');
    this.dialogItem.set(row);
    this.dialogOpen.set(true);
  }

  onDialogSaved(): void {
    this.dialogOpen.set(false);
    this.dialogItem.set(null);
    const employeeId = this.employeeId();
    if (employeeId) {
      void this.loadData(employeeId);
    }
    this.skillsChanged.emit();
  }

  async deleteSkill(row: Record<string, any>): Promise<void> {
    await this.deleteRow(
      Number(row['employeeSkillId']),
      `la compétence ${row['skillName'] ?? ''}`,
      (id) => this.service.deleteSkill(id),
    );
  }

  async deleteEducation(row: Record<string, any>): Promise<void> {
    await this.deleteRow(
      Number(row['employeeEducationId']),
      `le diplôme & formation ${row['studyPathName'] ?? ''}`,
      (id) => this.service.deleteEducation(id),
    );
  }

  async deleteLanguage(row: Record<string, any>): Promise<void> {
    await this.deleteRow(
      Number(row['employeeLanguageId']),
      `la compétence linguistique ${row['languageName'] ?? ''}`,
      (id) => this.service.deleteLanguage(id),
    );
  }

  async deleteOther(row: Record<string, any>): Promise<void> {
    await this.deleteRow(
      Number(row['employeeOtherFormationId']),
      `la formation ${row['description'] ?? ''}`,
      (id) => this.service.deleteOtherSkill(id),
    );
  }

  private async deleteRow(
    id: number,
    label: string,
    remove: (id: number) => Promise<void>,
  ): Promise<void> {
    const employeeId = this.employeeId();
    if (!employeeId || !id) return;

    const confirmed = confirm(`Voulez-vous vraiment supprimer ${label} ?`);
    if (!confirmed) return;

    this.actionError.set(null);
    try {
      await remove(id);
      await this.loadData(employeeId);
      this.skillsChanged.emit();
    } catch (err: any) {
      this.actionError.set(this.crudErrorMessage(err));
    }
  }

  private crudErrorMessage(err: any): string {
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

  private async loadData(employeeId: number): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const profile = await this.service.getProfileData(employeeId);
      this.data.set(profile);
    } catch {
      this.data.set({ skills: [], education: [], language: [], otherSkills: [] });
      this.error.set('Erreur lors de la récupération des compétences détaillées.');
    } finally {
      this.loading.set(false);
    }
  }

  private async loadChart(employeeId: number, state: number): Promise<void> {
    this.chartLoading.set(true);

    try {
      const response = await this.service.getSkillLevel(employeeId, state);
      const normalized = response.map((item) => ({
        label: state === 0 ? item['stateLetter'] : item['skillName'],
        value: state === 0 ? item['number'] : item['level'],
      }));
      this.chartData.set(normalized.filter((item) => item.label != null));
    } finally {
      this.chartLoading.set(false);
    }
  }
}
