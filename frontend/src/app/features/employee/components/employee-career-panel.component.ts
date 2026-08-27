import { Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { Router } from '@angular/router';
import { GccEmptyState } from '../../../ui/gcc-empty-state';
import { EmployeeAttestationHistoryComponent } from './employee-attestation-history.component';
import { EmployeeCertificateGeneratorComponent } from './employee-certificate-generator.component';

type JsonObject = Record<string, any>;

@Component({
  selector: 'app-employee-career-panel',
  imports: [
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    GccEmptyState,
    EmployeeCertificateGeneratorComponent,
    EmployeeAttestationHistoryComponent,
  ],
  template: `
    @if (registrationNumber()) {
      <section class="space-y-4">
        @if (careerSummary(); as career) {
          <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h3 class="flex items-center gap-2 text-sm font-semibold text-navy">
                <mat-icon class="!h-5 !w-5 !text-[20px] text-accent">badge</mat-icon>
                Situation actuelle
              </h3>
              <span class="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">Courant</span>
            </div>
            <div class="grid gap-4 md:grid-cols-4">
              <div class="rounded-xl bg-slate-50 p-4">
                <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">Poste</p>
                <p class="mt-2 text-lg font-semibold text-navy">{{ career['positionName'] || '—' }}</p>
              </div>
              <div class="rounded-xl bg-slate-50 p-4">
                <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">Département</p>
                <p class="mt-2 text-lg font-semibold text-navy">{{ career['departmentName'] || '—' }}</p>
              </div>
              <div class="rounded-xl bg-slate-50 p-4">
                <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">Salaire de base</p>
                <p class="mt-2 text-lg font-semibold text-navy">{{ formatCurrency(career['baseSalary']) }}</p>
              </div>
              <div class="rounded-xl bg-slate-50 p-4">
                <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">Dernière mise à jour</p>
                <p class="mt-2 text-lg font-semibold text-navy">{{ formatDate(career['updatedDate']) }}</p>
              </div>
            </div>
          </div>

          <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <mat-tab-group>
              <mat-tab label="Suivi carrière">
                <div class="pt-4">
                  @if (advancementRows().length || appointmentRows().length || availabilityRows().length) {
                    <div class="grid gap-4 lg:grid-cols-3">
                      <article class="rounded-xl border border-slate-200 p-3">
                        <h3 class="mb-3 text-sm font-semibold text-navy">Avancement</h3>
                        @if (advancementRows().length) {
                          <ul class="space-y-2 text-sm text-slate-700">
                            @for (row of sortedRows(advancementRows()); track $index) {
                              <li class="rounded-lg bg-slate-50 p-2">
                                <div class="flex items-start justify-between gap-2">
                                  <div class="min-w-0">
                                    <p class="truncate font-medium text-navy">{{ row['positionName'] || row['title'] || 'Affectation' }}</p>
                                    <p class="text-xs text-slate-500">{{ formatDate(row['assignmentDate'] || row['date']) }}</p>
                                  </div>
                                  @if (isCurrentRow(row)) {
                                    <span class="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">Courant</span>
                                  }
                                  @if (hasCareerPlanId(row)) {
                                    <div class="flex shrink-0 items-center gap-0.5">
                                      <button mat-icon-button type="button" class="!h-7 !w-7" title="Modifier" (click)="openEdit(row)">
                                        <mat-icon class="!h-4 !w-4 !text-[16px] text-accent">edit</mat-icon>
                                      </button>
                                      <button mat-icon-button type="button" class="!h-7 !w-7" title="Voir le détail" (click)="openDetail(row)">
                                        <mat-icon class="!h-4 !w-4 !text-[16px] text-slate-500">visibility</mat-icon>
                                      </button>
                                    </div>
                                  }
                                </div>
                              </li>
                            }
                          </ul>
                        } @else {
                          <p class="text-sm text-slate-500">Aucune donnée d'avancement.</p>
                        }
                      </article>

                      <article class="rounded-xl border border-slate-200 p-3">
                        <h3 class="mb-3 text-sm font-semibold text-navy">Nomination</h3>
                        @if (appointmentRows().length) {
                          <ul class="space-y-2 text-sm text-slate-700">
                            @for (row of sortedRows(appointmentRows()); track $index) {
                              <li class="rounded-lg bg-slate-50 p-2">
                                <div class="flex items-start justify-between gap-2">
                                  <div class="min-w-0">
                                    <p class="truncate font-medium text-navy">{{ row['positionName'] || row['title'] || 'Nomination' }}</p>
                                    <p class="text-xs text-slate-500">{{ formatDate(row['assignmentDate'] || row['date']) }}</p>
                                  </div>
                                  @if (isCurrentRow(row)) {
                                    <span class="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">Courant</span>
                                  }
                                  @if (hasCareerPlanId(row)) {
                                    <div class="flex shrink-0 items-center gap-0.5">
                                      <button mat-icon-button type="button" class="!h-7 !w-7" title="Modifier" (click)="openEdit(row)">
                                        <mat-icon class="!h-4 !w-4 !text-[16px] text-accent">edit</mat-icon>
                                      </button>
                                      <button mat-icon-button type="button" class="!h-7 !w-7" title="Voir le détail" (click)="openDetail(row)">
                                        <mat-icon class="!h-4 !w-4 !text-[16px] text-slate-500">visibility</mat-icon>
                                      </button>
                                    </div>
                                  }
                                </div>
                              </li>
                            }
                          </ul>
                        } @else {
                          <p class="text-sm text-slate-500">Aucune donnée de nomination.</p>
                        }
                      </article>

                      <article class="rounded-xl border border-slate-200 p-3">
                        <h3 class="mb-3 text-sm font-semibold text-navy">Disponibilité</h3>
                        @if (availabilityRows().length) {
                          <ul class="space-y-2 text-sm text-slate-700">
                            @for (row of sortedRows(availabilityRows()); track $index) {
                              <li class="rounded-lg bg-slate-50 p-2">
                                <div class="flex items-start justify-between gap-2">
                                  <div class="min-w-0">
                                    <p class="truncate font-medium text-navy">{{ row['reason'] || row['status'] || 'Disponibilité' }}</p>
                                    <p class="text-xs text-slate-500">{{ formatDate(row['assignmentDate'] || row['date']) }}</p>
                                  </div>
                                  @if (isCurrentRow(row)) {
                                    <span class="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">Courant</span>
                                  }
                                  @if (hasCareerPlanId(row)) {
                                    <div class="flex shrink-0 items-center gap-0.5">
                                      <button mat-icon-button type="button" class="!h-7 !w-7" title="Modifier" (click)="openEdit(row)">
                                        <mat-icon class="!h-4 !w-4 !text-[16px] text-accent">edit</mat-icon>
                                      </button>
                                      <button mat-icon-button type="button" class="!h-7 !w-7" title="Voir le détail" (click)="openDetail(row)">
                                        <mat-icon class="!h-4 !w-4 !text-[16px] text-slate-500">visibility</mat-icon>
                                      </button>
                                    </div>
                                  }
                                </div>
                              </li>
                            }
                          </ul>
                        } @else {
                          <p class="text-sm text-slate-500">Aucune donnée de disponibilité.</p>
                        }
                      </article>
                    </div>
                  } @else {
                    <gcc-empty-state
                      title="Aucun suivi de carrière"
                      message="Les affectations de carrière ne sont pas encore disponibles."
                    />
                  }
                </div>
              </mat-tab>

              <mat-tab label="Génération d'attestation">
                <div class="pt-4">
                  <app-employee-certificate-generator
                    [registrationNumber]="registrationNumber()"
                    [careerSummary]="careerSummary()"
                  />
                </div>
              </mat-tab>

              <mat-tab label="Historiques d'attestation">
                <div class="pt-4">
                  <app-employee-attestation-history [registrationNumber]="registrationNumber()" />
                </div>
              </mat-tab>
            </mat-tab-group>
          </section>
        } @else {
          <gcc-empty-state
            title="Aucun parcours de carrière"
            message="Les données de carrière ne sont pas disponibles pour cet employé pour le moment."
          />
        }
      </section>
    } @else {
      <gcc-empty-state
        title="Matricule introuvable"
        message="Impossible de charger l’espace carrières : matricule introuvable."
      />
    }
  `,
})
export class EmployeeCareerPanelComponent {
  private readonly router = inject(Router);

  readonly registrationNumber = input<string | null>(null);
  readonly careerSummary = input<JsonObject | null>(null);
  readonly advancementRows = input<JsonObject[]>([]);
  readonly appointmentRows = input<JsonObject[]>([]);
  readonly availabilityRows = input<JsonObject[]>([]);

  hasCareerPlanId(row: JsonObject): boolean {
    return Number(row['careerPlanId']) > 0;
  }

  openEdit(row: JsonObject): void {
    const id = Number(row['careerPlanId']);
    if (!id) return;
    void this.router.navigate(['/soft-gcc/carrieres/fiche/modifier', id]);
  }

  openDetail(row: JsonObject): void {
    const id = Number(row['careerPlanId']);
    if (!id) return;
    void this.router.navigate(['/soft-gcc/carrieres/fiche/detail', id]);
  }

  /** FP-05 : une ligne est « courante » si son career_state est 'en cours' ou si elle est active sans date de fin. */
  isCurrentRow(row: JsonObject): boolean {
    if (row['careerState'] === 'en cours') return true;
    if (Number(row['state']) <= 0) return false;
    const ending = row['endingContract'];
    return ending == null || ending === '' || ending === '—';
  }

  /** FP-05 : trie les lignes pour placer le plan courant en tête de liste. */
  sortedRows(rows: JsonObject[]): JsonObject[] {
    return [...rows.filter((r) => this.isCurrentRow(r)), ...rows.filter((r) => !this.isCurrentRow(r))];
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  formatCurrency(value: number | string | null | undefined): string {
    if (value == null || value === '') return '—';
    const amount = Number(value);
    if (!Number.isFinite(amount)) return String(value);
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(amount);
  }
}
