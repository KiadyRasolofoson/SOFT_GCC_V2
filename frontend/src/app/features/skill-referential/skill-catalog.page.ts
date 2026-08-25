import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { AuthService } from '../../core/auth.service';
import { hasAnyPermission } from '../users/user.models';
import { GccEmptyState } from '../../ui/gcc-empty-state';
import { GccFilterBar } from '../../ui/gcc-filter-bar';
import { GccKpiCard } from '../../ui/gcc-kpi-card';
import { GccPageHeader } from '../../ui/gcc-page-header';
import { GccSelect } from '../../ui/gcc-select';
import { GccStatusTag } from '../../ui/gcc-status-tag';
import {
  categoryLabel,
  flattenCatalog,
  SKILL_CATEGORY_OPTIONS,
  SKILL_STATE_OPTIONS,
  SkillListItem,
  skillStateStatus,
  stateLabel,
  TaxonomyItem,
} from './skill-referential.models';
import { SkillReferentialService } from './skill-referential.service';

@Component({
  selector: 'app-skill-catalog-page',
  imports: [
    GccPageHeader,
    GccFilterBar,
    GccKpiCard,
    GccSelect,
    GccEmptyState,
    GccStatusTag,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <gcc-page-header
      title="Référentiel de compétences"
      subtitle="Bibliothèque normalisée : domaine, famille, définition et niveaux 1 à 4."
      icon="star"
      [crumbs]="crumbs"
      [actionLabel]="canManage() ? 'Nouvelle compétence' : ''"
      actionIcon="add"
      (action)="go(['/soft-gcc/parametres/referentiel-competences/competences/nouveau'])"
    />

    <div class="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <gcc-kpi-card label="Compétences" [value]="kpiTotal()" hint="Entrées du catalogue" tone="accent" icon="star" />
      <gcc-kpi-card label="Actives" [value]="kpiActive()" hint="Publiées et utilisables" tone="up" icon="verified" />
      <gcc-kpi-card label="Brouillons" [value]="kpiDraft()" hint="À compléter puis publier" tone="down" icon="edit_note" />
      <gcc-kpi-card label="Domaines" [value]="kpiDomains()" hint="Nomenclature active" icon="folder" />
    </div>

    <div class="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      @for (item of navCards(); track item.route) {
        <button
          type="button"
          class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
          (click)="go([item.route])"
        >
          <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-accent">
            <mat-icon>{{ item.icon }}</mat-icon>
          </span>
          <span class="min-w-0">
            <span class="block text-sm font-semibold text-navy">{{ item.title }}</span>
            <span class="mt-0.5 block text-xs text-slate-500">{{ item.hint }}</span>
          </span>
          <mat-icon class="ml-auto shrink-0 text-slate-300">chevron_right</mat-icon>
        </button>
      }
    </div>

    <gcc-filter-bar
      placeholder="Rechercher un nom ou un code…"
      [query]="query()"
      (queryChange)="query.set($event)"
      (apply)="load()"
      (reset)="reset()"
    >
      <div class="w-full min-w-[180px] lg:w-52">
        <gcc-select [options]="domainOptions()" [value]="domainId()" (valueChange)="onDomainChange($event)" placeholder="Domaine" />
      </div>
      <div class="w-full min-w-[180px] lg:w-52">
        <gcc-select [options]="familyOptions()" [value]="familyId()" (valueChange)="familyId.set($event)" placeholder="Famille" />
      </div>
      <div class="w-full min-w-[180px] lg:w-52">
        <gcc-select [options]="categoryOptions" [value]="category()" (valueChange)="category.set($event)" placeholder="Catégorie" />
      </div>
      <div class="w-full min-w-[180px] lg:w-52">
        <gcc-select [options]="stateOptions" [value]="state()" (valueChange)="state.set($event)" placeholder="État" />
      </div>
    </gcc-filter-bar>

    @if (error()) {
      <gcc-empty-state variant="error" title="Chargement impossible" [message]="error() ?? ''" />
    } @else if (loading()) {
      <div class="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Chargement du catalogue…</div>
    } @else if (pageRows().length === 0) {
      <gcc-empty-state
        title="Aucune compétence"
        message="Créez un domaine, une famille, puis une compétence avec ses 4 descripteurs."
        [actionLabel]="canManage() ? 'Nouvelle compétence' : ''"
        (action)="go(['/soft-gcc/parametres/referentiel-competences/competences/nouveau'])"
      />
    } @else {
      <div class="gcc-table shadow-sm">
        <div class="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3.5">
          <div>
            <h2 class="text-sm font-semibold text-navy">Catalogue</h2>
            <p class="text-xs text-slate-500">{{ rows().length }} résultat(s)</p>
          </div>
          <span class="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-accent">
            {{ rows().length }} compétence(s)
          </span>
        </div>
        <div class="overflow-x-auto">
          <table mat-table [dataSource]="pageRows()" class="w-full min-w-[960px]">
            <ng-container matColumnDef="code">
              <th mat-header-cell *matHeaderCellDef>Code</th>
              <td mat-cell *matCellDef="let row">
                <span class="inline-flex rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] tabular-nums text-slate-500">{{ row.code }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Compétence</th>
              <td mat-cell *matCellDef="let row">
                <p class="font-semibold text-navy">{{ row.name }}</p>
                <p class="text-xs text-slate-400">{{ row.domainName }} · {{ row.familyName }}</p>
              </td>
            </ng-container>
            <ng-container matColumnDef="category">
              <th mat-header-cell *matHeaderCellDef>Catégorie</th>
              <td mat-cell *matCellDef="let row">
                <span class="inline-flex rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700">
                  {{ categoryLabel(row.category) }}
                </span>
              </td>
            </ng-container>
            <ng-container matColumnDef="state">
              <th mat-header-cell *matHeaderCellDef>État</th>
              <td mat-cell *matCellDef="let row">
                <gcc-status-tag [status]="skillStateStatus(row.state)" [label]="stateLabel(row.state)" />
              </td>
            </ng-container>
            <ng-container matColumnDef="open">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let row" class="text-right">
                <button mat-icon-button type="button" (click)="open(row); $event.stopPropagation()">
                  <mat-icon>chevron_right</mat-icon>
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns" class="cursor-pointer hover:bg-slate-50" (click)="open(row)"></tr>
          </table>
        </div>
        <mat-paginator [length]="rows().length" [pageSize]="pageSize()" [pageIndex]="pageIndex()" (page)="onPage($event)" />
      </div>
    }
  `,
})
export class SkillCatalogPage {
  readonly router = inject(Router);
  private readonly api = inject(SkillReferentialService);
  private readonly auth = inject(AuthService);

  readonly crumbs = [{ label: 'Accueil' }, { label: 'Paramètres' }, { label: 'Référentiel' }];
  readonly columns = ['code', 'name', 'category', 'state', 'open'];
  readonly categoryOptions = [{ label: 'Toutes', value: '' }, ...SKILL_CATEGORY_OPTIONS];
  readonly stateOptions = SKILL_STATE_OPTIONS;
  readonly categoryLabel = categoryLabel;
  readonly stateLabel = stateLabel;
  readonly skillStateStatus = skillStateStatus;

  readonly query = signal('');
  readonly category = signal<string | null>('');
  readonly state = signal<string | null>('');
  readonly domainId = signal<string | null>('');
  readonly familyId = signal<string | null>('');
  readonly domains = signal<TaxonomyItem[]>([]);
  readonly families = signal<TaxonomyItem[]>([]);
  readonly allSkills = signal<SkillListItem[]>([]);
  readonly rows = signal<SkillListItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly canManage = computed(() =>
    hasAnyPermission(this.auth.user()?.permissions, ['MANAGE_SKILL_SETTINGS', 'PUBLISH_SKILL_REFERENTIAL']),
  );
  readonly stats = computed(() => {
    const skills = this.allSkills();
    return {
      total: skills.length,
      active: skills.filter((item) => item.state === 'Active').length,
      draft: skills.filter((item) => item.state === 'Draft').length,
      families: this.families().filter((item) => item.state !== 'Archived').length,
      domains: this.domains().filter((item) => item.state !== 'Archived').length,
    };
  });
  readonly kpiTotal = computed(() => `${this.stats().total}`);
  readonly kpiActive = computed(() => `${this.stats().active}`);
  readonly kpiDraft = computed(() => `${this.stats().draft}`);
  readonly kpiDomains = computed(() => `${this.stats().domains}`);
  readonly navCards = computed(() => [
    {
      title: 'Domaines',
      hint: `${this.stats().domains} domaine(s)`,
      icon: 'folder',
      route: '/soft-gcc/parametres/referentiel-competences/domaines',
    },
    {
      title: 'Familles',
      hint: `${this.stats().families} famille(s)`,
      icon: 'account_tree',
      route: '/soft-gcc/parametres/referentiel-competences/familles',
    },
    {
      title: 'Matrice emplois',
      hint: 'Niveaux attendus par poste',
      icon: 'work',
      route: '/soft-gcc/parametres/referentiel-competences/postes',
    },
    {
      title: 'Nomenclatures',
      hint: 'Écoles, langues, diplômes, filières',
      icon: 'menu_book',
      route: '/soft-gcc/parametres/competences',
    },
  ]);
  readonly domainOptions = computed(() => [
    { label: 'Tous', value: '' },
    ...this.domains()
      .filter((item) => item.state !== 'Archived')
      .map((item) => ({ label: item.name, value: String(item.id) })),
  ]);
  readonly familyOptions = computed(() => {
    const domainId = this.domainId();
    return [
      { label: 'Toutes', value: '' },
      ...this.families()
        .filter((item) => item.state !== 'Archived' && (!domainId || String(item.domainId) === domainId))
        .map((item) => ({ label: item.name, value: String(item.id) })),
    ];
  });
  readonly pageRows = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.rows().slice(start, start + this.pageSize());
  });

  constructor() {
    void this.load();
  }

  go(commands: string[]): void {
    void this.router.navigate(commands);
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const needMeta = !this.domains().length;
      const filters = {
        q: this.query(),
        category: this.category() || undefined,
        domainId: this.domainId() ? Number(this.domainId()) : null,
        familyId: this.familyId() ? Number(this.familyId()) : null,
        state: this.state() || undefined,
      };
      const unfiltered = !filters.q && !filters.category && !filters.domainId && !filters.familyId && !filters.state;
      const [catalog, domains, families, full] = await Promise.all([
        this.api.getCatalog(filters),
        needMeta ? this.api.getDomains() : Promise.resolve(this.domains()),
        needMeta ? this.api.getFamilies() : Promise.resolve(this.families()),
        unfiltered ? Promise.resolve(null) : this.api.getCatalog({}),
      ]);
      this.domains.set(domains);
      this.families.set(families);
      this.allSkills.set(flattenCatalog(full ?? catalog));
      this.rows.set(flattenCatalog(catalog));
      this.pageIndex.set(0);
    } catch {
      this.error.set('Impossible de charger le référentiel.');
    } finally {
      this.loading.set(false);
    }
  }

  onDomainChange(value: string | null): void {
    this.domainId.set(value);
    this.familyId.set('');
  }

  reset(): void {
    this.query.set('');
    this.category.set('');
    this.state.set('');
    this.domainId.set('');
    this.familyId.set('');
    void this.load();
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  open(row: SkillListItem): void {
    void this.router.navigate(['/soft-gcc/parametres/referentiel-competences/competences', row.skillId]);
  }
}
