import { Component, input } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { GccEmptyState } from '../../../ui/gcc-empty-state';

type JsonObject = Record<string, any>;

@Component({
  selector: 'app-employee-career-panel',
  imports: [MatTabsModule, GccEmptyState],
  template: `
    @if (registrationNumber()) {
      <section class="space-y-4">
        @if (careerSummary(); as career) {
          <div class="grid gap-4 md:grid-cols-3">
            <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">Poste</p>
              <p class="mt-2 text-lg font-semibold text-navy">{{ career['positionName'] || '—' }}</p>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">Salaire de base</p>
              <p class="mt-2 text-lg font-semibold text-navy">{{ formatCurrency(career['baseSalary']) }}</p>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">Dernière mise à jour</p>
              <p class="mt-2 text-lg font-semibold text-navy">{{ formatDate(career['updatedDate']) }}</p>
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
                            @for (row of advancementRows(); track $index) {
                              <li class="rounded-lg bg-slate-50 p-2">
                                <p class="font-medium text-navy">{{ row['positionName'] || row['title'] || 'Affectation' }}</p>
                                <p class="text-xs text-slate-500">{{ formatDate(row['assignmentDate'] || row['date']) }}</p>
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
                            @for (row of appointmentRows(); track $index) {
                              <li class="rounded-lg bg-slate-50 p-2">
                                <p class="font-medium text-navy">{{ row['positionName'] || row['title'] || 'Nomination' }}</p>
                                <p class="text-xs text-slate-500">{{ formatDate(row['assignmentDate'] || row['date']) }}</p>
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
                            @for (row of availabilityRows(); track $index) {
                              <li class="rounded-lg bg-slate-50 p-2">
                                <p class="font-medium text-navy">{{ row['reason'] || row['status'] || 'Disponibilité' }}</p>
                                <p class="text-xs text-slate-500">{{ formatDate(row['assignmentDate'] || row['date']) }}</p>
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
                  <gcc-empty-state
                    title="Espace attestation"
                    message="La génération d'attestation sera connectée sur cette section."
                  />
                </div>
              </mat-tab>

              <mat-tab label="Historiques d'attestation">
                <div class="pt-4">
                  <gcc-empty-state
                    title="Historique d'attestation"
                    message="L'historique sera affiché ici dès disponibilité des données."
                  />
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
  readonly registrationNumber = input<string | null>(null);
  readonly careerSummary = input<JsonObject | null>(null);
  readonly advancementRows = input<JsonObject[]>([]);
  readonly appointmentRows = input<JsonObject[]>([]);
  readonly availabilityRows = input<JsonObject[]>([]);

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
