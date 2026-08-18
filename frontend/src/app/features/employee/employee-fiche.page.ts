import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GccEmptyState } from '../../ui/gcc-empty-state';
import { GccIdentityCard } from '../../ui/gcc-identity-card';
import { GccPageHeader } from '../../ui/gcc-page-header';
import { GccSkillGap } from '../../ui/gcc-skill-gap';
import { EmployeeFicheProfile, EmployeeSkillGapItem, EmployeeTabKey } from './employee-fiche.models';
import { EmployeeFicheService } from './employee-fiche.service';

type JsonObject = Record<string, any>;

@Component({
  selector: 'app-employee-fiche-page',
  imports: [GccPageHeader, GccIdentityCard, GccEmptyState, GccSkillGap, MatTabsModule, MatButtonModule, MatIconModule],
  template: `
    <gcc-page-header
      title="Fiche employé"
      [subtitle]="subtitle()"
      icon="person"
      [crumbs]="crumbs()"
    />

    <div class="mb-6 flex justify-end">
      <button mat-stroked-button type="button" class="gcc-btn-secondary" (click)="goBack()">
        <mat-icon>arrow_back</mat-icon>
        Retour
      </button>
    </div>

    @if (loading()) {
      <div class="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Chargement de la fiche employé…
      </div>
    } @else if (error()) {
      <gcc-empty-state
        variant="error"
        title="Impossible de charger la fiche"
        [message]="error() ?? 'Une erreur est survenue.'"
      />
    } @else if (profile(); as profile) {
      <div class="mb-6">
        <gcc-identity-card
          [name]="displayName(profile)"
          [role]="profile.positionName || 'Employé'"
          [department]="profile.departmentName || 'Service non renseigné'"
          [matricule]="profile.registrationNumber || '—'"
          [seniority]="seniorityLabel(profile)"
          [initials]="initials(profile)"
        />
      </div>

      <mat-tab-group
        class="gcc-tabs"
        [selectedIndex]="selectedTabIndex"
        (selectedTabChange)="onTabChange($event.index)"
      >
        <mat-tab label="Infos" />
        <mat-tab label="Compétences" />
        <mat-tab label="Carrières" />
      </mat-tab-group>

      @switch (selectedTab()) {
        @case ('infos') {
          <section class="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="mb-4 flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <h2 class="text-lg font-semibold text-navy">Informations principales</h2>
              <span class="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-accent">
                {{ profile.positionName || 'Profil RH' }}
              </span>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">Nom</p>
                <p class="mt-2 text-base font-semibold text-navy">{{ displayName(profile) || '—' }}</p>
              </div>
              <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">Matricule</p>
                <p class="mt-2 text-base font-semibold text-navy">{{ profile.registrationNumber || '—' }}</p>
              </div>
              <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">Email</p>
                <p class="mt-2 text-base font-semibold text-navy">{{ profile.email || '—' }}</p>
              </div>
              <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">Département</p>
                <p class="mt-2 text-base font-semibold text-navy">{{ profile.departmentName || '—' }}</p>
              </div>
              <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">Date d’embauche</p>
                <p class="mt-2 text-base font-semibold text-navy">{{ formatDate(profile.hiringDate) }}</p>
              </div>
              <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">Salaire net</p>
                <p class="mt-2 text-base font-semibold text-navy">{{ formatCurrency(profile.netSalary) }}</p>
              </div>
            </div>
          </section>
        }
        @case ('competences') {
          <section class="mt-6 space-y-4">
            @if (skillGaps().length) {
              @for (item of skillGaps(); track item.label) {
                <gcc-skill-gap [skill]="item.label" [required]="item.required" [acquired]="item.acquired" />
              }
            } @else {
              <gcc-empty-state
                title="Aucune compétence renseignée"
                message="Le référentiel de compétences n’est pas encore disponible pour ce profil."
              />
            }
          </section>
        }
        @case ('carrieres') {
          <section class="mt-6 space-y-4">
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
            } @else {
              <gcc-empty-state
                title="Aucun parcours de carrière"
                message="Les données de carrière ne sont pas disponibles pour cet employé pour le moment."
              />
            }
          </section>
        }
      }
    }
  `,
})
export class EmployeeFichePage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(EmployeeFicheService);

  private readonly routeParamKey = this.route.snapshot.paramMap.get('employeeKey') ?? '';
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly profile = signal<EmployeeFicheProfile | null>(null);
  readonly careerSummary = signal<JsonObject | null>(null);
  readonly selectedTab = signal<EmployeeTabKey>('infos');
  selectedTabIndex = 0;

  readonly crumbs = computed(() => [
    { label: 'Accueil' },
    { label: 'Employés' },
    { label: 'Fiche employé' },
  ]);

  readonly subtitle = computed(() => {
    const current = this.profile();
    if (!current) return 'Chargement du profil…';
    const label = [current.name, current.firstName].filter(Boolean).join(' ');
    return label || current.registrationNumber || 'Profil employé';
  });

  readonly skillGaps = computed<EmployeeSkillGapItem[]>(() => {
    const current = this.profile();
    if (!current) return [];

    return [
      { label: 'Gestion RH', required: 'expert', acquired: current.skillNumber ? 'intermediate' : 'beginner' },
      { label: 'Formation', required: 'expert', acquired: current.educationNumber ? 'intermediate' : 'beginner' },
      { label: 'Langues', required: 'intermediate', acquired: current.languageNumber ? 'intermediate' : 'beginner' },
    ];
  });

  constructor() {
    const requestedTab = this.route.snapshot.queryParamMap.get('espace') as EmployeeTabKey | null;
    this.setTab(requestedTab ?? 'infos', false);
    void this.loadPage();

    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const next = (params.get('espace') ?? 'infos') as EmployeeTabKey;
      this.setTab(next, false);
    });
  }

  async loadPage(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const resolved = await this.service.resolveEmployeeIds(this.routeParamKey);
      const [skillsData, careerData] = await Promise.all([
        this.service.getSkillsDescription(resolved.employeeId),
        this.service.getCareerData(resolved.registrationNumber),
      ]);

      const merged: EmployeeFicheProfile = {
        ...(resolved.baseEmployee ?? {}),
        ...(careerData ?? {}),
        ...(skillsData ?? {}),
        employeeId: resolved.employeeId ?? skillsData?.['employeeId'] ?? null,
        registrationNumber:
          resolved.registrationNumber ||
          skillsData?.['registrationNumber'] ||
          careerData?.['registrationNumber'] ||
          null,
        name: skillsData?.['name'] || careerData?.['name'] || resolved.baseEmployee?.['name'] || null,
        firstName:
          skillsData?.['firstName'] ||
          careerData?.['firstName'] ||
          resolved.baseEmployee?.['firstName'] ||
          null,
        birthday: skillsData?.['birthday'] || careerData?.['birthday'] || resolved.baseEmployee?.['birthday'] || null,
        departmentName: skillsData?.['departmentName'] || careerData?.['departmentName'] || resolved.baseEmployee?.['departmentName'] || null,
        hiringDate:
          skillsData?.['hiringDate'] ||
          careerData?.['hiringDate'] ||
          careerData?.['assignmentDate'] ||
          resolved.baseEmployee?.['hiring_date'] ||
          resolved.baseEmployee?.['hiringDate'] ||
          null,
        photo: skillsData?.['photo'] || resolved.baseEmployee?.['photo'] || null,
        email: careerData?.['email'] || resolved.baseEmployee?.['email'] || null,
        positionName: careerData?.['positionName'] || resolved.baseEmployee?.['positionName'] || null,
        baseSalary: careerData?.['baseSalary'] ?? resolved.baseEmployee?.['baseSalary'] ?? null,
        netSalary: careerData?.['netSalary'] ?? resolved.baseEmployee?.['netSalary'] ?? null,
        skillNumber: skillsData?.['skillNumber'] ?? resolved.baseEmployee?.['skillNumber'] ?? null,
        educationNumber: skillsData?.['educationNumber'] ?? resolved.baseEmployee?.['educationNumber'] ?? null,
        languageNumber: skillsData?.['languageNumber'] ?? resolved.baseEmployee?.['languageNumber'] ?? null,
        otherFormationNumber:
          skillsData?.['otherFormationNumber'] ?? resolved.baseEmployee?.['otherFormationNumber'] ?? null,
        updatedDate: skillsData?.['updatedDate'] ?? careerData?.['updatedDate'] ?? null,
      };

      this.profile.set(merged);
      this.careerSummary.set(careerData ?? null);

      if (!merged.employeeId && !merged.registrationNumber) {
        this.error.set('Aucune donnée trouvée pour cet employé.');
      }
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Erreur lors du chargement de la fiche employé.');
      this.profile.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  goBack(): void {
    if (this.selectedTab() === 'carrieres') {
      void this.router.navigate(['/soft-gcc/carrieres']);
      return;
    }
    if (this.selectedTab() === 'competences') {
      void this.router.navigate(['/soft-gcc/competences']);
      return;
    }
    void this.router.navigate(['/soft-gcc/parametres/employes/liste']);
  }

  onTabChange(index: number): void {
    const tabs: EmployeeTabKey[] = ['infos', 'competences', 'carrieres'];
    this.setTab(tabs[index] ?? 'infos', true);
  }

  displayName(profile: EmployeeFicheProfile): string {
    return [profile.name, profile.firstName].filter(Boolean).join(' ').trim() || 'Employé';
  }

  initials(profile: EmployeeFicheProfile): string {
    const parts = [profile.name, profile.firstName].filter(Boolean);
    return parts.slice(0, 2).map((part) => part?.[0]?.toUpperCase() ?? '').join('') || 'E';
  }

  seniorityLabel(profile: EmployeeFicheProfile): string {
    if (!profile.hiringDate) return '—';
    const start = new Date(profile.hiringDate);
    if (Number.isNaN(start.getTime())) return '—';
    const diff = Date.now() - start.getTime();
    const years = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25)));
    return years > 0 ? `${years} an${years > 1 ? 's' : ''}` : 'Nouveau';
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
  }

  formatCurrency(value: number | string | null | undefined): string {
    if (value == null || value === '') return '—';
    const amount = Number(value);
    if (!Number.isFinite(amount)) return String(value);
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
  }

  private setTab(nextTab: EmployeeTabKey, shouldNavigate: boolean): void {
    const safeTab = ['infos', 'competences', 'carrieres'].includes(nextTab) ? nextTab : 'infos';
    this.selectedTab.set(safeTab);
    this.selectedTabIndex = ['infos', 'competences', 'carrieres'].indexOf(safeTab);

    if (shouldNavigate) {
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { espace: safeTab },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }
  }
}
