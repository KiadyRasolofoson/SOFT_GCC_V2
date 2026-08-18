import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { Router } from '@angular/router';
import { EmployeeSkillListItem, EmployeeSkillListService } from '../../core/employee-skill-list.service';
import { GccEmptyState } from '../../ui/gcc-empty-state';
import { GccFilterBar } from '../../ui/gcc-filter-bar';
import { GccPageHeader } from '../../ui/gcc-page-header';

@Component({
    selector: 'app-employee-skill-list-page',
    imports: [
        GccPageHeader,
        GccFilterBar,
        GccEmptyState,
        MatTableModule,
        MatPaginatorModule,
        MatButtonModule,
        MatIconModule,
    ],
    template: `
    <gcc-page-header
      title="Compétences des salariés"
      subtitle="Consultez et gérez les compétences de chaque employé."
      icon="school"
      [crumbs]="crumbs"
    />

    <gcc-filter-bar [query]="searchTerm()" (queryChange)="onQueryChange($event)" />

    @if (error()) {
      <gcc-empty-state
        variant="error"
        title="Impossible de charger la liste"
        [message]="error() ?? 'Une erreur est survenue.'"
      />
    } @else if (loading()) {
      <div class="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Chargement des compétences…
      </div>
    } @else if (rows().length === 0) {
      <gcc-empty-state
        title="Aucune compétence trouvée"
        message="Ajustez les filtres ou revenez plus tard pour mettre à jour les données."
      />
    } @else {
      <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div class="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div>
            <h2 class="text-base font-semibold text-navy">Nombre de compétences par employé</h2>
            <p class="text-xs text-slate-500">{{ totalRecords() }} résultats</p>
          </div>
          <span class="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-accent">
            {{ totalRecords() }} employé(s)
          </span>
        </div>

        <div class="overflow-x-auto">
          <table mat-table [dataSource]="rows()" class="w-full min-w-[980px]">
            <ng-container matColumnDef="avatar">
              <th mat-header-cell *matHeaderCellDef class="!text-slate-500 !font-semibold !text-[11px] !uppercase !tracking-[0.08em]"></th>
              <td mat-cell *matCellDef="let row" class="py-4">
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-slate-200 text-xs font-bold text-navy">
                  {{ initials(row) }}
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="fullName">
              <th mat-header-cell *matHeaderCellDef class="!text-slate-500 !font-semibold !text-[11px] !uppercase !tracking-[0.08em]">Nom complet</th>
              <td mat-cell *matCellDef="let row" class="py-4">
                <div class="flex flex-col">
                  <span class="font-semibold text-navy">{{ fullName(row) }}</span>
                  <span class="text-xs text-slate-500">{{ row.registrationNumber || '—' }}</span>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="updatedDate">
              <th mat-header-cell *matHeaderCellDef class="!text-slate-500 !font-semibold !text-[11px] !uppercase !tracking-[0.08em]">Dernière modification</th>
              <td mat-cell *matCellDef="let row" class="py-4 text-sm text-slate-600">
                {{ formatDate(row.updatedDate) }}
              </td>
            </ng-container>

            <ng-container matColumnDef="educationNumber">
              <th mat-header-cell *matHeaderCellDef class="!text-slate-500 !font-semibold !text-[11px] !uppercase !tracking-[0.08em]">Diplômes & formations</th>
              <td mat-cell *matCellDef="let row" class="py-4">
                <span class="inline-flex min-w-[2.2rem] justify-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {{ row.educationNumber ?? 0 }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="skillNumber">
              <th mat-header-cell *matHeaderCellDef class="!text-slate-500 !font-semibold !text-[11px] !uppercase !tracking-[0.08em]">Compétences</th>
              <td mat-cell *matCellDef="let row" class="py-4">
                <span class="inline-flex min-w-[2.2rem] justify-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {{ row.skillNumber ?? 0 }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="languageNumber">
              <th mat-header-cell *matHeaderCellDef class="!text-slate-500 !font-semibold !text-[11px] !uppercase !tracking-[0.08em]">Langues</th>
              <td mat-cell *matCellDef="let row" class="py-4">
                <span class="inline-flex min-w-[2.2rem] justify-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {{ row.languageNumber ?? 0 }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="otherFormationNumber">
              <th mat-header-cell *matHeaderCellDef class="!text-slate-500 !font-semibold !text-[11px] !uppercase !tracking-[0.08em]">Autres</th>
              <td mat-cell *matCellDef="let row" class="py-4">
                <span class="inline-flex min-w-[2.2rem] justify-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {{ row.otherFormationNumber ?? 0 }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef class="!text-slate-500 !font-semibold !text-[11px] !uppercase !tracking-[0.08em]"></th>
              <td mat-cell *matCellDef="let row" class="py-4">
                <button mat-stroked-button type="button" class="gcc-btn-secondary !rounded-xl" (click)="openProfile(row)">
                  <mat-icon class="!mr-1.5 !text-[18px]">visibility</mat-icon>
                  Voir profil
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayColumns;" class="cursor-pointer transition-colors hover:bg-slate-50" (click)="openProfile(row)"></tr>
          </table>
        </div>

        <mat-paginator
          [length]="totalRecords()"
          [pageSize]="pageSize"
          [pageIndex]="pageIndex()"
          [pageSizeOptions]="[5, 10, 25]"
          showFirstLastButtons
          (page)="onPageChange($event)"
        />
      </div>
    }
  `,
})
export class EmployeeSkillListPage {
    private readonly service = inject(EmployeeSkillListService);
    private readonly router = inject(Router);
    private readonly queryDebouncer = new Subject<string>();

    readonly crumbs = [
        { label: 'Accueil' },
        { label: 'Compétences' },
        { label: 'Liste des compétences' },
    ];

    readonly displayColumns = [
        'avatar',
        'fullName',
        'updatedDate',
        'educationNumber',
        'skillNumber',
        'languageNumber',
        'otherFormationNumber',
        'actions',
    ];

    readonly pageSize = 10;
    readonly rows = signal<EmployeeSkillListItem[]>([]);
    readonly totalRecords = signal(0);
    readonly loading = signal(false);
    readonly error = signal<string | null>(null);
    readonly pageIndex = signal(0);
    readonly searchTerm = signal('');

    constructor() {
        this.queryDebouncer
            .pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed())
            .subscribe((value) => {
                this.pageIndex.set(0);
                void this.loadPage(value, 0, this.pageSize);
            });
    }

    ngOnInit(): void {
        void this.loadPage('', 0, this.pageSize);
    }

    onQueryChange(value: string): void {
        this.searchTerm.set(value);
        this.queryDebouncer.next(value.trim());
    }

    onPageChange(event: PageEvent): void {
        this.pageIndex.set(event.pageIndex);
        void this.loadPage(this.searchTerm(), event.pageIndex, event.pageSize);
    }

    async loadPage(keyword: string, pageIndex: number, pageSize: number): Promise<void> {
        this.loading.set(true);
        this.error.set(null);

        try {
            const result = await this.service.getPage(keyword, pageIndex + 1, pageSize);
            this.rows.set(result.data);
            this.totalRecords.set(result.totalRecords);
            this.pageIndex.set(pageIndex);
        } catch {
            this.rows.set([]);
            this.totalRecords.set(0);
            this.error.set('Erreur lors de la récupération des données.');
        } finally {
            this.loading.set(false);
        }
    }

    fullName(row: EmployeeSkillListItem): string {
        const parts = [row.firstName, row.name].filter(Boolean);
        return parts.join(' ').trim() || row.registrationNumber || 'Employé';
    }

    initials(row: EmployeeSkillListItem): string {
        const parts = [row.firstName, row.name].filter(Boolean);
        if (!parts.length) return 'E';
        return parts
            .filter((part): part is string => Boolean(part))
            .slice(0, 2)
            .map((part) => part.charAt(0).toUpperCase())
            .join('');
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

    openProfile(row: EmployeeSkillListItem): void {
        if (!row.employeeId) {
            return;
        }
        void this.router.navigate(['/soft-gcc/employes/fiche', row.employeeId], {
            queryParams: { espace: 'competences' },
        });
    }
}
