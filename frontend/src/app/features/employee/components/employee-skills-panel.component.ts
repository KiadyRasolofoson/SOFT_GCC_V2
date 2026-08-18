import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { EmployeeFicheProfile, EmployeeSkillGapItem } from '../../../core/employee-fiche.models';
import {
  EmployeeSkillsProfileData,
  EmployeeSkillsProfileService,
} from '../../../core/employee-skills-profile.service';
import { GccEmptyState } from '../../../ui/gcc-empty-state';
import { GccSelect } from '../../../ui/gcc-select';
import { GccSkillGap } from '../../../ui/gcc-skill-gap';
import { GccStatusTag } from '../../../ui/gcc-status-tag';

@Component({
  selector: 'app-employee-skills-panel',
  imports: [
    GccSkillGap,
    GccEmptyState,
    MatTabsModule,
    MatProgressBarModule,
    GccSelect,
    GccStatusTag,
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
            <span class="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-accent">
              {{ totalItems() }} élément(s)
            </span>
          </div>

          @if (loading()) {
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
              Chargement des compétences…
            </div>
          } @else if (error()) {
            <gcc-empty-state variant="error" title="Erreur de chargement" [message]="error() ?? ''" />
          } @else {
            <mat-tab-group>
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
                          </tr>
                        </thead>
                        <tbody>
                          @for (row of data().skills; track $index) {
                            <tr class="border-b border-slate-100 text-sm text-slate-700">
                              <td class="px-2 py-2">{{ row['domainSkillName'] || '—' }}</td>
                              <td class="px-2 py-2 font-medium text-navy">{{ row['skillName'] || '—' }}</td>
                              <td class="px-2 py-2">{{ formatLevel(row['level']) }}</td>
                              <td class="px-2 py-2"><gcc-status-tag [status]="mapStatus(row['state'])" /></td>
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
                          </tr>
                        </thead>
                        <tbody>
                          @for (row of data().language; track $index) {
                            <tr class="border-b border-slate-100 text-sm text-slate-700">
                              <td class="px-2 py-2">{{ row['languageName'] || '—' }}</td>
                              <td class="px-2 py-2">{{ formatLevel(row['level']) }}</td>
                              <td class="px-2 py-2"><gcc-status-tag [status]="mapStatus(row['state'])" /></td>
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
                          </tr>
                        </thead>
                        <tbody>
                          @for (row of data().otherSkills; track $index) {
                            <tr class="border-b border-slate-100 text-sm text-slate-700">
                              <td class="px-2 py-2">{{ row['description'] || '—' }}</td>
                              <td class="px-2 py-2">{{ formatDate(row['startDate']) }}</td>
                              <td class="px-2 py-2">{{ formatDate(row['endDate']) }}</td>
                              <td class="px-2 py-2">{{ row['comment'] || '—' }}</td>
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

          @if (skillGaps().length) {
            <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 class="mb-3 text-base font-semibold text-navy">Synthèse des écarts</h2>
              <div class="space-y-3">
                @for (item of skillGaps(); track item.label) {
                  <gcc-skill-gap [skill]="item.label" [required]="item.required" [acquired]="item.acquired" />
                }
              </div>
            </article>
          }
        </aside>
      </section>
    }
  `,
})
export class EmployeeSkillsPanelComponent {
  private readonly service = inject(EmployeeSkillsProfileService);

  readonly employeeId = input<number | null>(null);
  readonly skillGaps = input<EmployeeSkillGapItem[]>([]);
  readonly profile = input<EmployeeFicheProfile | null>(null);

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

  mapStatus(state: unknown): 'pending' | 'gap' | 'ok' {
    const value = Number(state);
    if (value >= 10) return 'ok';
    if (value >= 5) return 'pending';
    return 'gap';
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
