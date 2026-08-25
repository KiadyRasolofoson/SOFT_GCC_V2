import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import {
  SkillNecessaryItem,
  SuggestionPositionItem,
  WishEvolutionDetails,
} from '../../core/wish-evolution.models';
import { WishEvolutionService } from '../../core/wish-evolution.service';
import { SkillReferentialService } from '../skill-referential/skill-referential.service';
import { GccEmptyState } from '../../ui/gcc-empty-state';
import { GccPageHeader } from '../../ui/gcc-page-header';
import { GccStatusTag, StatusKind } from '../../ui/gcc-status-tag';

@Component({
  selector: 'app-wish-evolution-detail-page',
  imports: [GccPageHeader, GccEmptyState, GccStatusTag, MatButtonModule, MatIconModule],
  template: `
    <gcc-page-header
      title="Détails de la demande"
      [subtitle]="subtitle()"
      icon="assignment"
      [crumbs]="crumbs()"
    />

    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap gap-2">
        <button mat-stroked-button type="button" class="gcc-btn-secondary" (click)="openSkills()">
          <mat-icon>school</mat-icon>
          Compétences
        </button>
        <button mat-stroked-button type="button" class="gcc-btn-secondary" (click)="openCareer()">
          <mat-icon>map</mat-icon>
          Carrières
        </button>
        <button mat-stroked-button type="button" class="gcc-btn-secondary">
          <mat-icon>fact_check</mat-icon>
          Évaluer
        </button>
      </div>
      <button mat-stroked-button type="button" class="gcc-btn-secondary" (click)="goBack()">
        <mat-icon>arrow_back</mat-icon>
        Retour
      </button>
    </div>

    @if (loading()) {
      <div class="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Chargement de la demande…
      </div>
    } @else if (error()) {
      <gcc-empty-state variant="error" title="Impossible de charger la demande" [message]="error() ?? ''" />
    } @else if (details(); as details) {
      <!-- Cartes description -->
      <div class="grid gap-4 lg:grid-cols-2">
        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
            <mat-icon class="!text-[22px] text-amber-700">description</mat-icon>
            <h2 class="text-base font-semibold text-amber-700">Description</h2>
          </div>
          <dl class="grid gap-3 text-sm">
            <div class="flex justify-between gap-3">
              <dt class="text-slate-500">Référence employé</dt>
              <dd class="font-medium text-navy">{{ details.registrationNumber || '—' }}</dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-slate-500">Employé demandant</dt>
              <dd class="font-medium text-navy">{{ fullName(details) }}</dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-slate-500">Type de souhait</dt>
              <dd class="font-medium text-navy">{{ details.wishTypeName || '—' }}</dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-slate-500">Département</dt>
              <dd class="font-medium text-navy">{{ details.actualDepartmentName || '—' }}</dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-slate-500">Poste actuel</dt>
              <dd class="font-medium text-navy">{{ details.actualPositionName || '—' }}</dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-slate-500">Poste souhaité</dt>
              <dd class="font-medium text-amber-700">{{ details.wishPositionName || '—' }}</dd>
            </div>
          </dl>
        </article>

        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
            <mat-icon class="!text-[22px] text-amber-700">description</mat-icon>
            <h2 class="text-base font-semibold text-amber-700">Description</h2>
          </div>
          <dl class="grid gap-3 text-sm">
            <div class="flex justify-between gap-3">
              <dt class="text-slate-500">Création de la demande</dt>
              <dd class="font-medium text-navy">{{ formatDate(details.creationDate) }}</dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-slate-500">Dernière modification</dt>
              <dd class="font-medium text-navy">{{ formatDate(details.updatedDate) }}</dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-slate-500">Disponibilité</dt>
              <dd class="font-medium text-navy">{{ formatDate(details.disponibility) }}</dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-slate-500">Statut</dt>
              <dd><gcc-status-tag [status]="mapState(details.state)" /></dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-slate-500">Priorité</dt>
              <dd>
                <span class="inline-flex min-w-[2rem] justify-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {{ details.priorityLetter || '—' }}
                </span>
              </dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-slate-500">Motivation</dt>
              <dd class="max-w-[60%] text-right font-medium text-navy">{{ details.motivation || '—' }}</dd>
            </div>
          </dl>
        </article>
      </div>

      <!-- Compétences nécessaires + postes suggérés -->
      <div class="mt-6 grid gap-4 lg:grid-cols-[2fr_1fr]">
        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
            <mat-icon class="!text-[22px] text-amber-700">check_circle_outline</mat-icon>
            <h2 class="text-base font-semibold text-amber-700">Vérification des compétences nécessaires</h2>
          </div>
          @if (skillNecessary().length === 0) {
            <gcc-empty-state
              title="Aucune compétence requise"
              message="Les compétences nécessaires pour ce poste ne sont pas renseignées."
            />
          } @else {
            <div class="overflow-x-auto">
              <table class="w-full min-w-[420px]">
                <thead>
                  <tr class="border-b border-slate-200 text-left text-xs uppercase tracking-[0.08em] text-slate-500">
                    <th class="px-2 py-2 font-semibold">ID</th>
                    <th class="px-2 py-2 font-semibold">Compétence</th>
                    <th class="px-2 py-2 font-semibold">Attendu</th>
                    <th class="px-2 py-2 font-semibold">Acquis</th>
                    <th class="px-2 py-2 font-semibold">État</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of skillNecessary(); track item.skillId) {
                    <tr class="border-b border-slate-100 text-sm text-slate-700">
                      <td class="px-2 py-2">{{ item.skillId }}</td>
                      <td class="px-2 py-2 font-medium text-navy">{{ item.skillName }}</td>
                      <td class="px-2 py-2">{{ item.expectedRank }}/4</td>
                      <td class="px-2 py-2">{{ item.acquiredRank == null ? '—' : item.acquiredRank + '/4' }}</td>
                      <td class="px-2 py-2">
                        <gcc-status-tag [status]="skillStateStatus(item.state)" [label]="skillStateLabel(item.state)" />
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </article>

        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
            <mat-icon class="!text-[22px] text-amber-700">work_search</mat-icon>
            <h2 class="text-base font-semibold text-amber-700">Postes suggérés</h2>
          </div>
          @if (suggestions().length === 0) {
            <gcc-empty-state title="Aucun poste suggéré" message="Aucune suggestion pour cet employé." />
          } @else {
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-slate-200 text-left text-xs uppercase tracking-[0.08em] text-slate-500">
                    <th class="px-2 py-2 font-semibold">#</th>
                    <th class="px-2 py-2 font-semibold">Poste</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of suggestions(); track item.positionId) {
                    <tr class="border-b border-slate-100 text-sm text-slate-700">
                      <td class="px-2 py-2">{{ item.positionId }}</td>
                      <td class="px-2 py-2 font-medium text-navy">{{ item.positionName }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </article>
      </div>

      <!-- Actions d'état -->
      <div class="mt-6 flex flex-wrap justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        @if (details.state === 1 || details.state === 5) {
          <button mat-flat-button type="button" class="!bg-red-600 !text-white" (click)="setState(0)">
            Refuser
          </button>
          <button mat-stroked-button type="button" class="gcc-btn-secondary" (click)="openEdit(details)">
            Modifier
          </button>
          <button
            mat-flat-button
            type="button"
            class="!bg-amber-500 !text-white"
            [disabled]="details.state === 5"
            (click)="setState(5)"
          >
            Traiter
          </button>
          <button mat-flat-button type="button" class="gcc-btn-primary" (click)="setState(10)">
            Valider
          </button>
        } @else if (details.state === 0) {
          <button mat-flat-button type="button" class="!bg-red-600 !text-white" (click)="deleteWish(details)">
            Supprimer
          </button>
          <button mat-flat-button type="button" class="gcc-btn-primary" (click)="setState(1)">
            Restaurer
          </button>
        } @else {
          <div class="flex flex-wrap justify-center gap-2">
            <button mat-flat-button type="button" class="!bg-red-600 !text-white" disabled>Refuser</button>
            <button mat-stroked-button type="button" class="gcc-btn-secondary" disabled>Modifier</button>
            <button mat-flat-button type="button" class="!bg-amber-500 !text-white" disabled>Traiter</button>
            <button mat-flat-button type="button" class="gcc-btn-primary" disabled>Valider</button>
          </div>
        }
      </div>
    }
  `,
})
export class WishEvolutionDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(WishEvolutionService);
  private readonly skillApi = inject(SkillReferentialService);

  private readonly routeId = Number(this.route.snapshot.paramMap.get('wishEvolutionId')) || 0;

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly details = signal<WishEvolutionDetails | null>(null);
  readonly skillNecessary = signal<SkillNecessaryItem[]>([]);
  readonly suggestions = signal<SuggestionPositionItem[]>([]);

  readonly crumbs = computed(() => [
    { label: 'Accueil' },
    { label: 'Souhait évolution' },
    { label: 'Détails' },
  ]);

  readonly subtitle = computed(() => {
    const current = this.details();
    if (!current) return 'Chargement de la demande…';
    return [current.name, current.firstName].filter(Boolean).join(' ').trim() || 'Demande d\'évolution';
  });

  constructor() {
    void this.loadPage();
  }

  async loadPage(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      if (!this.routeId) {
        throw new Error('Identifiant de la demande manquant.');
      }

      const details = await this.service.getDetails(this.routeId);
      if (!details) {
        throw new Error('Aucune donnée disponible pour ce souhait d\'évolution.');
      }

      this.details.set(details);

      const [gaps, suggestions] = await Promise.all([
        details.employeeId
          ? this.skillApi.getEmployeeGaps(details.employeeId, details.wishPositionId)
          : Promise.resolve({ items: [] }),
        details.employeeId ? this.service.getSuggestions(details.employeeId) : Promise.resolve([]),
      ]);

      this.suggestions.set(suggestions);
      this.skillNecessary.set(this.buildSkillNecessary(gaps.items ?? []));
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Erreur lors du chargement de la demande.');
      this.details.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  async setState(state: number): Promise<void> {
    const current = this.details();
    if (!current?.wishEvolutionCareerId) return;

    this.error.set(null);
    try {
      await this.service.updateState(state, current.wishEvolutionCareerId);
      await this.loadPage();
    } catch (error) {
      this.error.set(
        `Erreur lors de la mise à jour de l'état du souhait d'évolution : ${
          error instanceof Error ? error.message : 'erreur inconnue'
        }`,
      );
    }
  }

  async deleteWish(details: WishEvolutionDetails): Promise<void> {
    if (!details.wishEvolutionCareerId) return;

    const confirmed = confirm('Voulez-vous vraiment supprimer cette demande d\'évolution ?');
    if (!confirmed) return;

    this.error.set(null);
    try {
      await this.service.delete(details.wishEvolutionCareerId);
      void this.router.navigate(['/soft-gcc/souhaits-evolution']);
    } catch (error) {
      this.error.set(
        `Erreur lors de la suppression du souhait d'évolution : ${
          error instanceof Error ? error.message : 'erreur inconnue'
        }`,
      );
    }
  }

  goBack(): void {
    void this.router.navigate(['/soft-gcc/souhaits-evolution']);
  }

  openSkills(): void {
    const current = this.details();
    if (!current?.employeeId) return;
    void this.router.navigate(['/soft-gcc/employes/fiche', current.employeeId], {
      queryParams: { espace: 'competences' },
    });
  }

  openCareer(): void {
    const current = this.details();
    if (!current) return;
    const key = current.registrationNumber || current.employeeId;
    if (!key) return;
    void this.router.navigate(['/soft-gcc/employes/fiche', key], {
      queryParams: { espace: 'carrieres' },
    });
  }

  openEdit(details: WishEvolutionDetails): void {
    if (!details.wishEvolutionCareerId) return;
    void this.router.navigate(['/soft-gcc/souhaits-evolution/edit', details.wishEvolutionCareerId]);
  }

  fullName(details: WishEvolutionDetails): string {
    return [details.name, details.firstName].filter(Boolean).join(' ').trim() || 'Employé';
  }

  mapState(state: number | null): StatusKind {
    if (state === 10) return 'validated';
    if (state === 0) return 'refused';
    return 'pending';
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

  skillStateStatus(state: SkillNecessaryItem['state']): StatusKind {
    if (state === 'ok') return 'ok';
    if (state === 'missing') return 'refused';
    return 'gap';
  }

  skillStateLabel(state: SkillNecessaryItem['state']): string {
    if (state === 'ok') return 'À niveau';
    if (state === 'missing') return 'Manquant';
    return 'Écart';
  }

  private buildSkillNecessary(
    items: { skillId: number; skillName: string; expectedRank: number; acquiredRank: number | null; status: string }[],
  ): SkillNecessaryItem[] {
    return items.map((row) => ({
      skillId: row.skillId,
      skillName: row.skillName,
      expectedRank: row.expectedRank,
      acquiredRank: row.acquiredRank,
      state: row.status === 'ok' || row.status === 'gap' || row.status === 'missing' ? row.status : row.acquiredRank == null ? 'missing' : row.acquiredRank >= row.expectedRank ? 'ok' : 'gap',
    }));
  }
}
