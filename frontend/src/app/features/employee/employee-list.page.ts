import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, Subject } from 'rxjs';
import { EmployeeListItem, EmployeeListService } from '../../core/employee-list.service';
import { GccEmptyState } from '../../ui/gcc-empty-state';
import { GccPageHeader } from '../../ui/gcc-page-header';
import { GccSelect } from '../../ui/gcc-select';
import { GccSelectOption } from '../../ui/gcc.types';

interface EmployeeRow {
  [key: string]: any;
}

@Component({
  selector: 'app-employee-list-page',
  imports: [
    FormsModule,
    GccPageHeader,
    GccEmptyState,
    GccSelect,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <gcc-page-header
      title="Liste des employés"
      subtitle="Consultez et gérez les informations de chaque employé."
      icon="group"
      [crumbs]="crumbs"
      actionLabel="Ajouter"
      actionIcon="add"
      (action)="openCreate()"
      secondaryLabel="Import employés"
      secondaryIcon="upload_file"
      (secondaryAction)="openImport()"
    />

    <div class="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="mb-3 flex items-center gap-2 text-sm font-semibold text-navy">
        <mat-icon class="!h-4 !w-4 !text-[18px] text-slate-500">search</mat-icon>
        <span>Filtre de recherche</span>
      </div>

      <div class="grid gap-3 lg:grid-cols-4">
        <label class="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm text-navy">
          <mat-icon class="!h-5 !w-5 !text-[20px] text-slate-400">search</mat-icon>
          <input
            class="w-full border-0 bg-transparent text-sm text-navy outline-none placeholder:text-slate-400"
            placeholder="Nom, prénom, matricule ou responsable"
            [(ngModel)]="filters.keyWord"
            (ngModelChange)="onFilterChange()"
          />
        </label>

        <div class="min-w-0">
          <gcc-select [options]="departmentOptions()" [(value)]="filters.departmentId" placeholder="Département" />
        </div>

        <label class="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm text-navy">
          <input
            type="date"
            class="w-full border-0 bg-transparent text-sm text-navy outline-none"
            [(ngModel)]="filters.hiringDate1"
            (ngModelChange)="onFilterChange()"
          />
        </label>

        <label class="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm text-navy">
          <input
            type="date"
            class="w-full border-0 bg-transparent text-sm text-navy outline-none"
            [(ngModel)]="filters.hiringDate2"
            (ngModelChange)="onFilterChange()"
          />
        </label>
      </div>
    </div>

    @if (error()) {
      <gcc-empty-state
        variant="error"
        title="Impossible de charger les employés"
        [message]="error() ?? 'Une erreur est survenue.'"
      />
    } @else if (loading()) {
      <div class="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Chargement des employés…
      </div>
    } @else if (rows().length === 0) {
      <gcc-empty-state
        title="Aucun employé trouvé"
        message="Ajustez les filtres pour afficher des résultats."
      />
    } @else {
      <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div class="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div>
            <h2 class="text-base font-semibold text-navy">Liste des employés</h2>
            <p class="text-xs text-slate-500">{{ totalCount() }} résultat(s)</p>
          </div>
          <span class="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-accent">
            {{ totalCount() }} employé(s)
          </span>
        </div>

        <div class="overflow-x-auto">
          <table mat-table [dataSource]="sortedRows()" class="w-full min-w-[1040px]">
            <ng-container matColumnDef="photo">
              <th mat-header-cell *matHeaderCellDef class="!text-slate-500 !font-semibold !text-[11px] !uppercase !tracking-[0.08em]"></th>
              <td mat-cell *matCellDef="let row" class="py-4">
                @if (row.photo) {
                  <img [src]="photoUrl(row)" [alt]="row.registrationNumber || 'Employé'" class="h-10 w-10 rounded-full object-cover" />
                } @else {
                  <div class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-slate-200 text-xs font-bold text-navy">
                    {{ initials(row) }}
                  </div>
                }
              </td>
            </ng-container>

            <ng-container matColumnDef="fullName">
              <th mat-header-cell *matHeaderCellDef class="!text-slate-500 !font-semibold !text-[11px] !uppercase !tracking-[0.08em]">
                <button type="button" class="inline-flex items-center gap-1" (click)="handleSort('firstName')">
                  Nom complet
                  <mat-icon class="!h-4 !w-4 !text-[16px]">{{ sortIndicator('firstName') }}</mat-icon>
                </button>
              </th>
              <td mat-cell *matCellDef="let row" class="py-4">
                <span class="font-semibold text-navy">{{ fullName(row) }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="registrationNumber">
              <th mat-header-cell *matHeaderCellDef class="!text-slate-500 !font-semibold !text-[11px] !uppercase !tracking-[0.08em]">
                <button type="button" class="inline-flex items-center gap-1" (click)="handleSort('registrationNumber')">
                  Matricule
                  <mat-icon class="!h-4 !w-4 !text-[16px]">{{ sortIndicator('registrationNumber') }}</mat-icon>
                </button>
              </th>
              <td mat-cell *matCellDef="let row" class="py-4 text-sm font-medium text-navy">{{ row.registrationNumber || '—' }}</td>
            </ng-container>

            <ng-container matColumnDef="birthday">
              <th mat-header-cell *matHeaderCellDef class="!text-slate-500 !font-semibold !text-[11px] !uppercase !tracking-[0.08em]">
                <button type="button" class="inline-flex items-center gap-1" (click)="handleSort('birthday')">
                  Naissance
                  <mat-icon class="!h-4 !w-4 !text-[16px]">{{ sortIndicator('birthday') }}</mat-icon>
                </button>
              </th>
              <td mat-cell *matCellDef="let row" class="py-4 text-sm text-slate-600">{{ formatDate(row.birthday) }}</td>
            </ng-container>

            <ng-container matColumnDef="departmentName">
              <th mat-header-cell *matHeaderCellDef class="!text-slate-500 !font-semibold !text-[11px] !uppercase !tracking-[0.08em]">
                <button type="button" class="inline-flex items-center gap-1" (click)="handleSort('departmentName')">
                  Département
                  <mat-icon class="!h-4 !w-4 !text-[16px]">{{ sortIndicator('departmentName') }}</mat-icon>
                </button>
              </th>
              <td mat-cell *matCellDef="let row" class="py-4 text-sm text-slate-600">{{ row.departmentName || '—' }}</td>
            </ng-container>

            <ng-container matColumnDef="hiringDate">
              <th mat-header-cell *matHeaderCellDef class="!text-slate-500 !font-semibold !text-[11px] !uppercase !tracking-[0.08em]">
                <button type="button" class="inline-flex items-center gap-1" (click)="handleSort('hiringDate')">
                  Date d'embauche
                  <mat-icon class="!h-4 !w-4 !text-[16px]">{{ sortIndicator('hiringDate') }}</mat-icon>
                </button>
              </th>
              <td mat-cell *matCellDef="let row" class="py-4 text-sm text-slate-600">{{ formatDate(row.hiringDate) }}</td>
            </ng-container>

            <ng-container matColumnDef="managerName">
              <th mat-header-cell *matHeaderCellDef class="!text-slate-500 !font-semibold !text-[11px] !uppercase !tracking-[0.08em]">
                <button type="button" class="inline-flex items-center gap-1" (click)="handleSort('managerName')">
                  Responsable
                  <mat-icon class="!h-4 !w-4 !text-[16px]">{{ sortIndicator('managerName') }}</mat-icon>
                </button>
              </th>
              <td mat-cell *matCellDef="let row" class="py-4 text-sm text-slate-600">{{ managerName(row) }}</td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef class="!text-slate-500 !font-semibold !text-[11px] !uppercase !tracking-[0.08em]"></th>
              <td mat-cell *matCellDef="let row" class="py-4">
                <button mat-stroked-button type="button" class="gcc-btn-secondary !rounded-xl" (click)="openFiche(row)">
                  <mat-icon class="!mr-1.5 !text-[18px]">visibility</mat-icon>
                  Voir fiche
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayColumns;" class="cursor-pointer transition-colors hover:bg-slate-50" (click)="openFiche(row)"></tr>
          </table>
        </div>

        <mat-paginator
          [length]="totalCount()"
          [pageSize]="pageSize"
          [pageIndex]="pageIndex()"
          [pageSizeOptions]="[5, 10, 25]"
          showFirstLastButtons
          (page)="onPageChange($event)"
        />
      </div>
    }

    @if (importModalOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-[1px]">
        <div class="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
          <div class="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3 class="text-lg font-semibold text-navy">Import CSV des employés</h3>
              <p class="text-sm text-slate-500">Sélectionnez un fichier CSV à importer</p>
            </div>
            <button mat-icon-button type="button" (click)="closeImport()" aria-label="Fermer">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <div class="grid gap-4">
            <label class="block">
              <span class="mb-1.5 block text-xs font-medium uppercase tracking-[0.08em] text-slate-500">Fichier CSV</span>
              <input
                type="file"
                accept=".csv,text/csv"
                class="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-navy outline-none transition focus:border-accent focus:bg-white"
                (change)="onCsvSelected($event)"
              />
            </label>

            @if (importError()) {
              <div class="rounded-xl border border-red-200/80 bg-red-50/80 p-3 text-xs text-red-900">
                <p class="font-bold whitespace-pre-line">{{ importError() }}</p>
              </div>
            }
            @if (importSuccess()) {
              <div class="rounded-xl border border-emerald-200/80 bg-emerald-50/80 p-3 text-xs text-emerald-900">
                <p class="font-bold">{{ importSuccess() }}</p>
              </div>
            }
          </div>

          <div class="mt-6 flex justify-end gap-2">
            <button mat-stroked-button type="button" class="gcc-btn-secondary !rounded-xl" (click)="closeImport()">
              Fermer
            </button>
            <button mat-flat-button type="button" class="gcc-btn-primary !rounded-xl" (click)="submitImport()" [disabled]="importing() || csvData.length === 0">
              @if (importing()) {
                <span class="flex items-center gap-2">
                  <span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Importation…
                </span>
              } @else {
                <span class="flex items-center gap-2">
                  <mat-icon>file_upload</mat-icon>
                  Importer
                </span>
              }
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class EmployeeListPage {
  private readonly router = inject(Router);
  private readonly service = inject(EmployeeListService);
  private readonly filterDebouncer = new Subject<void>();

  readonly crumbs = [{ label: 'Accueil' }, { label: 'Gestion employés' }, { label: 'Liste' }];
  readonly displayColumns = [
    'photo',
    'fullName',
    'registrationNumber',
    'birthday',
    'departmentName',
    'hiringDate',
    'managerName',
    'actions',
  ];
  readonly pageSize = 10;

  readonly rows = signal<EmployeeListItem[]>([]);
  readonly sortedRows = signal<EmployeeListItem[]>([]);
  readonly totalCount = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly pageIndex = signal(0);
  readonly departmentOptions = signal<GccSelectOption[]>([]);

  readonly sortColumn = signal<keyof EmployeeRow>('birthday');
  readonly sortDirection = signal<'asc' | 'desc'>('asc');

  readonly importModalOpen = signal(false);
  readonly importing = signal(false);
  readonly importError = signal<string | null>(null);
  readonly importSuccess = signal<string | null>(null);

  readonly filters = {
    keyWord: '',
    departmentId: '',
    hiringDate1: '',
    hiringDate2: '',
  };

  csvData: Record<string, any>[] = [];

  constructor() {
    this.filterDebouncer
      .pipe(debounceTime(300), takeUntilDestroyed())
      .subscribe(() => {
        this.pageIndex.set(0);
        void this.loadPage();
      });

    void this.initLookups();
  }

  ngOnInit(): void {
    void this.loadPage();
  }

  async initLookups(): Promise<void> {
    try {
      const departments = await this.service.loadDepartments();
      this.departmentOptions.set([
        { label: 'Tous les départements', value: '' },
        ...departments.map((item) => ({ label: item.name, value: String(item.departmentId) })),
      ]);
    } catch {
      this.departmentOptions.set([{ label: 'Tous les départements', value: '' }]);
    }
  }

  onFilterChange(): void {
    this.filterDebouncer.next();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    void this.loadPage();
  }

  async loadPage(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const result = await this.service.filter(this.filters, this.pageIndex() + 1, this.pageSize);
      this.rows.set(result.data ?? []);
      this.totalCount.set(result.totalCount ?? 0);
      this.applySorting();
      if (!result.success && result.message) {
        this.error.set(result.message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inattendue.';
      this.error.set(`Erreur inattendue : ${message}`);
      this.rows.set([]);
      this.sortedRows.set([]);
      this.totalCount.set(0);
    } finally {
      this.loading.set(false);
    }
  }

  handleSort(column: keyof EmployeeRow): void {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
    this.applySorting();
  }

  sortIndicator(column: keyof EmployeeRow): string {
    if (this.sortColumn() !== column) return 'unfold_more';
    return this.sortDirection() === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  private applySorting(): void {
    const column = this.sortColumn();
    const direction = this.sortDirection();
    const sorted = [...this.rows()].sort((a, b) => {
      const left = this.getComparableValue(a, column);
      const right = this.getComparableValue(b, column);

      if (left == null && right == null) return 0;
      if (left == null) return 1;
      if (right == null) return -1;

      if (typeof left === 'number' && typeof right === 'number') {
        return direction === 'asc' ? left - right : right - left;
      }

      const textLeft = String(left).toLowerCase();
      const textRight = String(right).toLowerCase();
      if (textLeft < textRight) return direction === 'asc' ? -1 : 1;
      if (textLeft > textRight) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    this.sortedRows.set(sorted);
  }

  private getComparableValue(row: EmployeeRow, column: keyof EmployeeRow): string | number | null {
    if (column === 'birthday' || column === 'hiringDate') {
      return row[column] ? new Date(row[column]).getTime() : null;
    }
    const value = row[column];
    return value == null ? null : String(value);
  }

  fullName(row: EmployeeListItem): string {
    const parts = [row.firstName, row.name].filter(Boolean);
    return parts.join(' ').trim() || row.registrationNumber || 'Employé';
  }

  initials(row: EmployeeListItem): string {
    const parts = [row.firstName, row.name].filter(Boolean);
    if (!parts.length) return 'E';
    return parts
      .slice(0, 2)
      .map((part) => String(part).charAt(0).toUpperCase())
      .join('');
  }

  managerName(row: EmployeeListItem): string {
    const parts = [row.managerName, row.managerFirstName].filter(Boolean);
    return parts.join(' ').trim() || '—';
  }

  photoUrl(row: EmployeeListItem): string {
    return this.service.photoUrl(row.employeeId);
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
  }

  openFiche(row: EmployeeListItem): void {
    if (row.employeeId == null) return;
    void this.router.navigate(['/soft-gcc/employes/fiche', row.employeeId], {
      queryParams: { espace: 'infos' },
    });
  }

  openCreate(): void {
    void this.router.navigate(['/soft-gcc/parametres/employes/creer']);
  }

  openImport(): void {
    this.importModalOpen.set(true);
    this.importError.set(null);
    this.importSuccess.set(null);
    this.csvData = [];
  }

  closeImport(): void {
    this.importModalOpen.set(false);
  }

  onCsvSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.importError.set(null);
    this.importSuccess.set(null);

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      try {
        this.csvData = this.parseCsv(text);
        if (this.csvData.length === 0) {
          this.importError.set('Le fichier CSV est vide ou illisible.');
        }
      } catch {
        this.csvData = [];
        this.importError.set('Erreur lors de la lecture du fichier CSV.');
      }
    };
    reader.onerror = () => {
      this.importError.set('Erreur lors de la lecture du fichier CSV.');
    };
    reader.readAsText(file);
  }

  private parseCsv(text: string): Record<string, any>[] {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length < 2) return [];

    const headers = this.splitCsvLine(lines[0]).map((h) => h.trim());
    const rows: Record<string, any>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.splitCsvLine(lines[i]);
      if (values.length === 0) continue;
      const row: Record<string, any> = {};
      headers.forEach((header, index) => {
        row[header] = values[index]?.trim() ?? '';
      });
      rows.push(row);
    }
    return rows;
  }

  private splitCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }

  private transformData(data: Record<string, any>[]): Record<string, any>[] {
    return data.map((item) => ({
      employeeId: 0,
      registrationNumber: item['registrationNumber'] || '',
      name: item['name'] || '',
      firstName: item['firstName'] || '',
      birthday: this.toIsoDate(item['birthday']),
      department_id: parseInt(item['department_id'] ?? '0', 10) || 0,
      hiring_date: this.toIsoDate(item['hiring_date']),
      civiliteId: parseInt(item['civiliteId'] ?? '0', 10) || 0,
      managerId: parseInt(item['managerId'] ?? '0', 10) || 0,
    }));
  }

  private toIsoDate(value: string | undefined | null): string | null {
    if (!value) return null;
    const date = new Date(String(value).split('/').reverse().join('-'));
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0];
  }

  async submitImport(): Promise<void> {
    if (this.importing() || this.csvData.length === 0) return;
    this.importing.set(true);
    this.importError.set(null);
    this.importSuccess.set(null);

    try {
      const formatted = this.transformData(this.csvData);
      const result = await this.service.importEmployees(formatted);
      if (result.success) {
        this.importSuccess.set(result.message || 'Données importées avec succès !');
        this.csvData = [];
        this.closeImport();
        void this.loadPage();
      } else {
        this.importError.set(result.errors?.join('\n') || result.message || 'Erreur lors de l\'importation des données.');
      }
    } finally {
      this.importing.set(false);
    }
  }
}
