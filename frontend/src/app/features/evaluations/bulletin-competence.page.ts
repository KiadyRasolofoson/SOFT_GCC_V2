import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {
  BulletinCompetenceService,
  BulletinEmployeeOption,
  BulletinResponse,
} from '../../core/bulletin-competence.service';
import { GccEmptyState } from '../../ui/gcc-empty-state';
import { GccKpiCard } from '../../ui/gcc-kpi-card';
import { GccPageHeader } from '../../ui/gcc-page-header';
import { GccSearchableSelect } from '../../ui/gcc-searchable-select';
import { GccStatusTag, StatusKind } from '../../ui/gcc-status-tag';
import { GccSelectOption } from '../../ui/gcc.types';
import { downloadBulletinPdf, previewBulletinPdf } from './bulletin-pdf.util';

/**
 * Bulletin de compétences individuel (miroir React BulletinCompetencesPage.jsx).
 * Sélection d'un employé → GET /BulletinCompetence/employee/{id} → KPIs + domaines + PDF (aperçu/téléchargement).
 */
@Component({
  selector: 'app-bulletin-competence-page',
  imports: [
    GccPageHeader,
    GccSearchableSelect,
    GccKpiCard,
    GccStatusTag,
    GccEmptyState,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  template: `
    <gcc-page-header
      title="Bulletin de compétences"
      subtitle="Générez le bulletin de compétences individuel d'un collaborateur."
      icon="fact_check"
      [crumbs]="crumbs"
    />

    @if (error(); as message) {
      <div class="mb-6 rounded-xl border border-red-200/80 bg-red-50/80 p-4 text-xs text-red-900 shadow-xs">
        <div class="flex items-start gap-3">
          <mat-icon class="!h-5 !w-5 !text-[20px] shrink-0 text-red-600 mt-0.5">error_outline</mat-icon>
          <p class="font-bold text-red-900">{{ message }}</p>
        </div>
      </div>
    }

    <!-- Sélection employé -->
    <article class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
        <mat-icon class="!text-[22px] text-accent">person_search</mat-icon>
        <h2 class="text-base font-semibold text-navy">Sélectionner un employé</h2>
      </div>

      <div class="grid gap-4 lg:grid-cols-[1fr_auto_auto] lg:items-end">
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-600">Employé</label>
          <gcc-searchable-select
            [options]="employeeOptions()"
            [value]="selectedValue()"
            (valueChange)="onEmployeeChange($event)"
            placeholder="Rechercher par nom ou matricule…"
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-600">Employé sélectionné</label>
          <div class="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700">
            {{ selectedEmployeeLabel() || 'Aucun' }}
          </div>
        </div>
        <div class="flex flex-wrap gap-2.5">
          <button
            mat-flat-button
            type="button"
            class="gcc-btn-primary !rounded-xl"
            (click)="preview()"
            [disabled]="!selectedEmployeeId() || generating()"
          >
            <span class="flex items-center gap-2">
              <mat-icon>visibility</mat-icon>
              Aperçu PDF
            </span>
          </button>
          <button
            mat-stroked-button
            type="button"
            class="gcc-btn-secondary !rounded-xl"
            (click)="download()"
            [disabled]="!selectedEmployeeId() || generating()"
          >
            <span class="flex items-center gap-2">
              <mat-icon>download</mat-icon>
              Télécharger
            </span>
          </button>
        </div>
      </div>

      @if (generating()) {
        <div class="mt-5">
          <mat-progress-bar mode="determinate" [value]="progress()" class="!h-2 !rounded-full" />
          <span class="mt-2 block text-xs text-slate-500">{{ progressText() }}</span>
        </div>
      }
    </article>

    @if (loading()) {
      <div class="mt-6 rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
        Chargement des données de compétences…
      </div>
    }

    @if (bulletin(); as data) {
      <!-- KPIs -->
      <div class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <gcc-kpi-card label="Maîtrisées" [value]="kpiText(data.masteredCount)" hint="Acquis ≥ attendu du poste" tone="up" icon="check_circle" />
        <gcc-kpi-card label="En cours d'acquisition" [value]="kpiText(data.inProgressCount)" hint="Un rang sous l’attendu" tone="neutral" icon="schedule" />
        <gcc-kpi-card label="Non acquises" [value]="kpiText(data.notAcquiredCount)" hint="Écart plus large ou non renseigné" tone="down" icon="cancel" />
        <gcc-kpi-card label="Total compétences" [value]="kpiText(data.totalSkills)" hint="Toutes classifications" tone="accent" icon="school" />
      </div>

      <!-- Domaines -->
      @if (data.domains.length === 0) {
        <div class="mt-6">
          <gcc-empty-state
            title="Aucune compétence"
            message="Aucune compétence enregistrée pour cet employé."
          />
        </div>
      } @else {
        @for (domain of data.domains; track $index) {
          <div class="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div class="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
              <h3 class="text-sm font-semibold text-navy">{{ domain.domainName }}</h3>
              <span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {{ domain.skills.length }} compétence{{ domain.skills.length > 1 ? 's' : '' }}
              </span>
            </div>
            <div class="overflow-x-auto p-4">
              <table class="w-full min-w-[640px]">
                <thead>
                  <tr class="border-b border-slate-200 text-left text-xs uppercase tracking-[0.08em] text-slate-500">
                    <th class="px-2 py-2 font-semibold">Compétence</th>
                    <th class="px-2 py-2 font-semibold">Niveau</th>
                    <th class="px-2 py-2 font-semibold">Attendu</th>
                    <th class="px-2 py-2 font-semibold">Statut</th>
                    <th class="px-2 py-2 font-semibold">Dernière MAJ</th>
                  </tr>
                </thead>
                <tbody>
                  @for (skill of domain.skills; track $index) {
                    <tr class="border-b border-slate-100 text-sm text-slate-700">
                      <td class="px-2 py-2 font-medium text-navy">{{ skill.skillName }}</td>
                      <td class="px-2 py-2">
                        <div class="flex items-center gap-2">
                          <div class="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                            <div
                              class="h-full rounded-full"
                              [style.width.%]="levelWidth(skill.level)"
                              [style.background]="levelColor(skill.level)"
                            ></div>
                          </div>
                          <span class="text-xs font-semibold text-navy">{{ roundedLevel(skill.level) }}/4</span>
                        </div>
                      </td>
                      <td class="px-2 py-2 text-slate-500">{{ skill.expectedLevel || '—' }}/4</td>
                      <td class="px-2 py-2">
                        @let tag = skillStatus(skill.classification);
                        <gcc-status-tag [status]="tag.status" [label]="tag.label" />
                      </td>
                      <td class="px-2 py-2 text-slate-500">{{ formatDate(skill.lastUpdated) }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      }
    }

    @if (!selectedEmployeeId() && !loading() && !bulletin()) {
      <div class="mt-10 text-center">
        <mat-icon class="!h-16 !w-16 !text-[64px] text-slate-300">fact_check</mat-icon>
        <h3 class="mt-3 text-base font-semibold text-slate-600">Sélectionnez un employé</h3>
        <p class="mx-auto mt-1 max-w-md text-sm text-slate-500">
          Le bulletin présente la liste structurée des compétences maîtrisées, en cours d'acquisition et non acquises.
        </p>
      </div>
    }
  `,
})
export class BulletinCompetencePage {
  private readonly service = inject(BulletinCompetenceService);
  private readonly dialog = inject(MatDialog);

  readonly crumbs = [{ label: 'Accueil' }, { label: 'Évaluations' }, { label: 'Bulletin de compétences' }];

  readonly employeeOptions = signal<GccSelectOption[]>([]);
  readonly employees = signal<BulletinEmployeeOption[]>([]);
  readonly selectedValue = signal<string | null>(null);
  readonly selectedEmployeeId = signal<number | null>(null);
  readonly selectedEmployeeLabel = signal('');
  readonly loading = signal(false);
  readonly generating = signal(false);
  readonly progress = signal(0);
  readonly error = signal<string | null>(null);
  readonly bulletin = signal<BulletinResponse | null>(null);

  readonly progressText = computed(() => {
    const p = this.progress();
    if (p < 25) return 'Préparation des données…';
    if (p < 50) return 'Génération du bulletin…';
    if (p < 75) return 'Mise en page…';
    if (p < 100) return 'Finalisation…';
    return 'Terminé ✓';
  });

  constructor() {
    void this.loadEmployees();
  }

  async loadEmployees(): Promise<void> {
    this.error.set(null);
    try {
      const list = await this.service.loadEmployees();
      this.employees.set(list);
      this.employeeOptions.set(
        list.map((item) => ({
          label: `${item.firstName ?? ''} ${item.name ?? ''} (${item.registrationNumber ?? 'N/A'})`.trim(),
          value: String(item.employeeId),
        })),
      );
    } catch {
      this.error.set('Impossible de charger la liste des employés.');
    }
  }

  onEmployeeChange(value: string | null): void {
    this.selectedValue.set(value);
    this.error.set(null);
    this.bulletin.set(null);

    if (!value) {
      this.selectedEmployeeId.set(null);
      this.selectedEmployeeLabel.set('');
      return;
    }

    const id = Number(value);
    this.selectedEmployeeId.set(Number.isFinite(id) ? id : null);
    const employee = this.employees().find((item) => String(item.employeeId) === value);
    this.selectedEmployeeLabel.set(
      employee ? `${employee.firstName ?? ''} ${employee.name ?? ''} (${employee.registrationNumber ?? 'N/A'})`.trim() : '',
    );
  }

  async loadBulletinData(): Promise<BulletinResponse | null> {
    const id = this.selectedEmployeeId();
    if (!id) {
      this.error.set('Veuillez sélectionner un employé.');
      return null;
    }

    this.loading.set(true);
    this.error.set(null);
    this.bulletin.set(null);
    try {
      const data = await this.service.loadBulletin(id);
      if (data) {
        this.bulletin.set(data);
        return data;
      }
      this.error.set('Aucune donnée de compétences disponible pour cet employé.');
      return null;
    } catch {
      this.error.set('Erreur lors du chargement des données du bulletin.');
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  async preview(): Promise<void> {
    const data = this.bulletin() ?? (await this.loadBulletinData());
    if (!data) return;

    this.generating.set(true);
    this.error.set(null);
    this.progress.set(0);
    try {
      const url = previewBulletinPdf(data, (pct) => this.progress.set(pct));
      const { PdfPreviewDialog } = await import('./pdf-preview.dialog');
      this.dialog.open(PdfPreviewDialog, {
        data: { url },
        width: 'min(1100px, 92vw)',
      });
    } catch {
      this.error.set('Erreur lors de la génération du PDF.');
    } finally {
      this.generating.set(false);
    }
  }

  async download(): Promise<void> {
    const data = this.bulletin() ?? (await this.loadBulletinData());
    if (!data) return;

    this.generating.set(true);
    this.error.set(null);
    this.progress.set(0);
    try {
      downloadBulletinPdf(data, (pct) => this.progress.set(pct));
    } catch {
      this.error.set('Erreur lors du téléchargement du PDF.');
    } finally {
      this.generating.set(false);
    }
  }

  kpiText(value: number): string {
    return String(value ?? 0);
  }

  roundedLevel(level: number): number {
    return Math.round(level || 0);
  }

  levelWidth(level: number): number {
    return Math.min((level || 0) * 25, 100);
  }

  levelColor(level: number): string {
    if (level >= 4) return '#27ae60';
    if (level >= 3) return '#047857';
    if (level >= 2) return '#f39c12';
    return '#c0392b';
  }

  skillStatus(classification: string | null | undefined): { status: StatusKind; label: string } {
    switch (classification) {
      case 'maitrisee':
        return { status: 'ok', label: 'Maîtrisée' };
      case 'en_cours':
        return { status: 'gap', label: 'En cours' };
      case 'non_acquise':
        return { status: 'refused', label: 'Non acquise' };
      default:
        return { status: 'pending', label: '—' };
    }
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }
}
