import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {
  EmployeeSyncService,
  SyncLogItem,
  SyncRunResult,
} from '../../core/employee-sync.service';
import { GccEmptyState } from '../../ui/gcc-empty-state';
import { GccKpiCard } from '../../ui/gcc-kpi-card';
import { GccPageHeader } from '../../ui/gcc-page-header';
import { GccStatusTag, StatusKind } from '../../ui/gcc-status-tag';

interface SyncSummary {
  status: string | null;
  recordsInserted: number;
  recordsUpdated: number;
  recordsFailed: number;
  syncDate: string | null;
  error: string | null;
}

/**
 * Synchronisation des employés depuis la base de paie Sage (miroir React EmployeeSyncPage.jsx).
 * Visualisation du flux p_sw → Soft GCC, lancement manuel, résumé et historique paginé.
 */
@Component({
  selector: 'app-employee-sync-page',
  imports: [
    GccPageHeader,
    GccKpiCard,
    GccStatusTag,
    GccEmptyState,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  template: `
    <gcc-page-header
      title="Synchronisation des employés"
      subtitle="Synchronisez les salariés et leur organisation depuis la base de paie Sage (p_sw) vers Soft GCC."
      icon="sync"
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

    <!-- Contrôle : visualisation du flux + lancement -->
    <div class="grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-[3fr_2fr]">
      <div>
        <h2 class="mb-3 flex items-center gap-2 text-base font-semibold text-navy">
          <mat-icon class="!text-[20px] text-accent">info</mat-icon>
          Visualisation du flux de données
        </h2>

        <div class="flex items-center justify-center gap-4 rounded-xl border border-slate-100 bg-canvas p-6">
          <div class="flex w-44 flex-col items-center rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
            <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-accent">
              <mat-icon class="!text-[22px]">storage</mat-icon>
            </span>
            <p class="mt-2 text-sm font-semibold text-navy">Base de paie p_sw</p>
            <p class="text-[11px] text-slate-500">T_SAL + T_HST_* (InfoEnCours = 1)</p>
          </div>

          <div class="flex w-16 items-center justify-center">
            <div class="h-0.5 w-full bg-gradient-to-r from-accent/40 to-accent"></div>
            <mat-icon class="-ml-2 !text-[16px] text-accent">arrow_forward</mat-icon>
          </div>

          <div class="flex w-44 flex-col items-center rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
            <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-accent">
              <mat-icon class="!text-[22px]">dns</mat-icon>
            </span>
            <p class="mt-2 text-sm font-semibold text-navy">Soft GCC Portal</p>
            <p class="text-[11px] text-slate-500">Employee, Career_plan, référentiels</p>
          </div>
        </div>

        <p class="mt-3 text-xs leading-relaxed text-slate-500">
          Identité (nom, prénom, email, civilité), département, poste, établissement, date d'embauche
          et manager. Les départements Soft GCC sont alignés uniquement sur T_DEPARTEMENT (p_sw) —
          les doublons legacy sont fusionnés. Les dates de naissance NULL ou placeholder (2000-01-01)
          dans p_sw ne remplacent pas les dates déjà présentes dans Soft GCC.
        </p>
      </div>

      <div class="flex flex-col justify-center rounded-xl border border-slate-100 bg-slate-50 p-6">
        <h2 class="mb-2 text-base font-semibold text-navy">Lancer une mise à jour</h2>
        <p class="mb-4 text-xs text-slate-500">
          Récupère les salariés et leur organisation courante depuis la paie (affectation, poste,
          établissement, contrat en cours).
        </p>
        <button
          mat-flat-button
          type="button"
          class="gcc-btn-primary !rounded-xl"
          (click)="runSync()"
          [disabled]="syncing()"
        >
          @if (syncing()) {
            <span class="flex items-center gap-2">
              <span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
              Synchronisation…
            </span>
          } @else {
            <span class="flex items-center gap-2">
              <mat-icon>play_arrow</mat-icon>
              Lancer la synchronisation
            </span>
          }
        </button>
        @if (syncing()) {
          <mat-progress-bar mode="indeterminate" class="mt-4 !h-1.5 !rounded-full" />
        }
      </div>
    </div>

    <!-- Résumé de la dernière activité -->
    @if (latestSync(); as summary) {
      <div class="mt-6">
        <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 class="flex items-center gap-2 text-base font-semibold text-navy">
            <mat-icon class="!text-[20px] text-emerald-600">check_circle</mat-icon>
            Résumé de la dernière activité
          </h2>
          @if (summary.syncDate) {
            <span class="text-xs text-slate-500">
              Exécuté le : <strong class="text-slate-700">{{ formatDateTime(summary.syncDate) }}</strong>
            </span>
          }
        </div>

        @if (lastResult()) {
          <div class="mb-4 flex items-start gap-3 rounded-xl border p-4 text-xs" [class]="alertClass(summary.status)">
            <mat-icon class="!h-5 !w-5 !text-[20px] shrink-0 mt-0.5">{{ alertIcon(summary.status) }}</mat-icon>
            <div>
              <p class="font-bold">{{ alertTitle(summary.status) }}</p>
              @if (summary.error) {
                <p class="mt-0.5">{{ summary.error }}</p>
              }
            </div>
          </div>
        }

        <div class="grid gap-4 sm:grid-cols-3">
          <gcc-kpi-card label="Nouveaux Employés" [value]="metricText(summary.recordsInserted)" hint="Ajoutés" tone="up" icon="person_add" />
          <gcc-kpi-card label="Mis à jour" [value]="metricText(summary.recordsUpdated)" hint="Employés actualisés" tone="neutral" icon="sync" />
          <gcc-kpi-card label="Échecs" [value]="metricText(summary.recordsFailed)" hint="Lignes en erreur" tone="down" icon="cancel" />
        </div>
      </div>
    }

    <!-- Historique -->
    <div class="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-5 py-4">
        <h2 class="flex items-center gap-2 text-base font-semibold text-navy">
          <mat-icon class="!text-[20px] text-accent">history</mat-icon>
          Historique des activités
        </h2>
        <button mat-stroked-button type="button" class="gcc-btn-secondary !rounded-xl" (click)="fetchLogs()" [disabled]="loadingLogs()">
          <span class="flex items-center gap-2">
            <mat-icon>refresh</mat-icon>
            Actualiser
          </span>
        </button>
      </div>

      <div>
        @if (loadingLogs()) {
          <div class="p-10 text-center text-sm text-slate-500">Récupération de l'historique…</div>
        } @else if (logs().length === 0) {
          <div class="p-10">
            <gcc-empty-state
              title="Aucun enregistrement trouvé"
              message="Lancez une synchronisation pour débuter l'historique."
            />
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full min-w-[720px]">
              <thead>
                <tr class="border-b border-slate-200 text-left text-xs uppercase tracking-[0.08em] text-slate-500">
                  <th class="px-5 py-3 font-semibold">Date & Heure</th>
                  <th class="px-3 py-3 font-semibold">Statut</th>
                  <th class="px-3 py-3 text-center font-semibold">Ajoutés</th>
                  <th class="px-3 py-3 text-center font-semibold">Mis à jour</th>
                  <th class="px-3 py-3 text-center font-semibold">Échecs</th>
                  <th class="px-5 py-3 text-right font-semibold">Action / Erreur</th>
                </tr>
              </thead>
              <tbody>
                @for (log of logs(); track log.syncLogId) {
                  <tr class="border-b border-slate-100 text-sm text-slate-700">
                    <td class="px-5 py-3 font-medium text-navy">{{ formatDateTime(log.syncDate) }}</td>
                    <td class="px-3 py-3">
                      @let st = syncStatus(log.status);
                      <gcc-status-tag [status]="st.status" [label]="st.label" />
                    </td>
                    <td class="px-3 py-3 text-center">
                      <span class="inline-flex min-w-[2rem] justify-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-accent">{{ log.recordsInserted }}</span>
                    </td>
                    <td class="px-3 py-3 text-center">
                      <span class="inline-flex min-w-[2rem] justify-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">{{ log.recordsUpdated }}</span>
                    </td>
                    <td class="px-3 py-3 text-center">
                      <span
                        class="inline-flex min-w-[2rem] justify-center rounded-full px-2 py-0.5 text-xs font-semibold"
                        [class]="log.recordsFailed > 0 ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-500'"
                      >
                        {{ log.recordsFailed }}
                      </span>
                    </td>
                    <td class="px-5 py-3 text-right">
                      @if (log.errorMessage) {
                        <button mat-button type="button" class="!h-8 !text-xs" (click)="toggleExpand(log.syncLogId)">
                          <span class="flex items-center gap-1">
                            {{ expandedLogId() === log.syncLogId ? 'Masquer' : 'Détails' }}
                            <mat-icon class="!h-4 !w-4 !text-[16px]">
                              {{ expandedLogId() === log.syncLogId ? 'expand_less' : 'expand_more' }}
                            </mat-icon>
                          </span>
                        </button>
                      } @else {
                        <span class="text-xs text-slate-400">—</span>
                      }
                    </td>
                  </tr>
                  @if (log.errorMessage && expandedLogId() === log.syncLogId) {
                    <tr>
                      <td colspan="6" class="border-b border-slate-100 bg-slate-50 p-4">
                        <div class="overflow-hidden rounded-xl border border-slate-700 bg-slate-900 font-mono text-xs text-slate-200 shadow-inner">
                          <div class="flex items-center gap-1.5 border-b border-slate-700 px-3 py-2">
                            <span class="h-2.5 w-2.5 rounded-full bg-red-500"></span>
                            <span class="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
                            <span class="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                            <span class="ml-2 text-[11px] text-slate-400">Rapport d'erreur système</span>
                          </div>
                          <div class="max-h-48 overflow-auto whitespace-pre-wrap p-3">{{ log.errorMessage }}</div>
                        </div>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      @if (logs().length > 0) {
        <div class="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
          <span class="text-xs font-semibold text-slate-500">Page {{ page() }}</span>
          <div class="flex gap-2">
            <button mat-stroked-button type="button" class="gcc-btn-secondary !h-9 !rounded-lg !px-3 !text-xs" [disabled]="page() <= 1" (click)="prevPage()">
              Précédent
            </button>
            <button mat-stroked-button type="button" class="gcc-btn-secondary !h-9 !rounded-lg !px-3 !text-xs" [disabled]="page() >= totalPages()" (click)="nextPage()">
              Suivant
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class EmployeeSyncPage {
  private readonly service = inject(EmployeeSyncService);

  readonly crumbs = [{ label: 'Accueil' }, { label: 'Paramètres' }, { label: 'Synchronisation' }];

  readonly syncing = signal(false);
  readonly logs = signal<SyncLogItem[]>([]);
  readonly loadingLogs = signal(false);
  readonly lastResult = signal<SyncRunResult | null>(null);
  readonly page = signal(1);
  readonly totalPages = signal(1);
  readonly expandedLogId = signal<number | null>(null);
  readonly error = signal<string | null>(null);
  readonly pageSize = 15;

  readonly latestSync = computed<SyncSummary | null>(() => {
    const live = this.lastResult();
    if (live) {
      return {
        status: live.status ?? null,
        recordsInserted: Number(live.recordsInserted) || 0,
        recordsUpdated: Number(live.recordsUpdated) || 0,
        recordsFailed: Number(live.recordsFailed) || 0,
        syncDate: live.syncDate ?? null,
        error: live.error ?? null,
      };
    }
    const logs = this.logs();
    if (logs.length > 0) {
      const first = logs[0];
      return {
        status: first.status ?? null,
        recordsInserted: Number(first.recordsInserted) || 0,
        recordsUpdated: Number(first.recordsUpdated) || 0,
        recordsFailed: Number(first.recordsFailed) || 0,
        syncDate: first.syncDate ?? null,
        error: first.errorMessage ?? null,
      };
    }
    return null;
  });

  constructor() {
    void this.fetchLogs();
  }

  async fetchLogs(): Promise<void> {
    this.loadingLogs.set(true);
    this.error.set(null);
    try {
      const data = await this.service.getSyncLogs(this.page(), this.pageSize);
      this.logs.set(data);
      this.totalPages.set(data.length < this.pageSize ? this.page() : this.page() + 1);
    } catch {
      this.error.set("Erreur lors du chargement de l'historique.");
    } finally {
      this.loadingLogs.set(false);
    }
  }

  async runSync(): Promise<void> {
    if (this.syncing()) return;
    this.syncing.set(true);
    this.lastResult.set(null);
    this.error.set(null);
    try {
      const result = await this.service.runSync();
      this.lastResult.set(result);
      await this.fetchLogs();
    } catch (err: any) {
      this.error.set(
        'Échec de la synchronisation : ' + (err?.error?.message || err?.message || 'erreur inconnue'),
      );
    } finally {
      this.syncing.set(false);
    }
  }

  prevPage(): void {
    if (this.page() <= 1) return;
    this.page.set(this.page() - 1);
    void this.fetchLogs();
  }

  nextPage(): void {
    if (this.page() >= this.totalPages()) return;
    this.page.set(this.page() + 1);
    void this.fetchLogs();
  }

  toggleExpand(id: number): void {
    this.expandedLogId.set(this.expandedLogId() === id ? null : id);
  }

  syncStatus(status: string | null | undefined): { status: StatusKind; label: string } {
    if (status === 'Success') return { status: 'ok', label: 'Succès' };
    if (status === 'Partial') return { status: 'gap', label: 'Partiel' };
    return { status: 'refused', label: 'Échec' };
  }

  alertClass(status: string | null | undefined): string {
    if (status === 'Success') return 'border-emerald-200 bg-emerald-50 text-emerald-900';
    if (status === 'Partial') return 'border-amber-200 bg-amber-50 text-amber-900';
    return 'border-red-200 bg-red-50 text-red-900';
  }

  alertIcon(status: string | null | undefined): string {
    if (status === 'Success') return 'check_circle';
    if (status === 'Partial') return 'warning';
    return 'cancel';
  }

  alertTitle(status: string | null | undefined): string {
    if (status === 'Success') return 'Synchronisation réussie';
    if (status === 'Partial') return 'Synchronisation partielle';
    return 'Échec de la synchronisation';
  }

  metricText(value: number | string | null | undefined): string {
    return String(value ?? 0);
  }

  formatDateTime(value: string | null | undefined): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  }
}
