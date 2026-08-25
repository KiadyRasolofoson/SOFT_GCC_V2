import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { environment } from '../../../environments/environment';
import { GccEmptyState } from '../../ui/gcc-empty-state';
import { GccFilterBar } from '../../ui/gcc-filter-bar';
import { GccPageHeader } from '../../ui/gcc-page-header';

interface PositionRow {
  positionId: number;
  positionName: string;
}

@Component({
  selector: 'app-skill-position-list-page',
  imports: [GccPageHeader, GccFilterBar, GccEmptyState, MatTableModule, MatPaginatorModule, MatIconModule],
  template: `
    <gcc-page-header
      title="Matrice emplois-compétences"
      subtitle="Choisissez un poste pour définir les compétences requises, le niveau attendu et la criticité."
      icon="work"
      [crumbs]="crumbs"
      secondaryLabel="Retour au catalogue"
      secondaryIcon="arrow_back"
      (secondaryAction)="router.navigate(['/soft-gcc/parametres/referentiel-competences'])"
    />
    <gcc-filter-bar
      placeholder="Rechercher un poste…"
      [query]="query()"
      (queryChange)="query.set($event)"
      (apply)="filter()"
      (reset)="query.set(''); filter()"
    />
    @if (!filtered().length) {
      <gcc-empty-state title="Aucun poste" message="Aucun poste ne correspond à la recherche." />
    } @else {
      <div class="gcc-table shadow-sm">
        <div class="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3.5">
          <h2 class="text-sm font-semibold text-navy">Postes</h2>
          <span class="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-accent">{{ filtered().length }}</span>
        </div>
        <table mat-table [dataSource]="pageRows()" class="w-full">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Poste</th>
            <td mat-cell *matCellDef="let row" class="font-semibold text-navy">{{ row.positionName }}</td>
          </ng-container>
          <ng-container matColumnDef="open">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let row" class="text-right">
              <mat-icon class="text-slate-300">chevron_right</mat-icon>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="['name', 'open']"></tr>
          <tr mat-row *matRowDef="let row; columns: ['name', 'open']" class="cursor-pointer hover:bg-slate-50" (click)="open(row)"></tr>
        </table>
        <mat-paginator [length]="filtered().length" [pageSize]="pageSize()" [pageIndex]="pageIndex()" (page)="onPage($event)" />
      </div>
    }
  `,
})
export class SkillPositionListPage {
  private readonly http = inject(HttpClient);
  readonly router = inject(Router);
  readonly crumbs = [{ label: 'Accueil' }, { label: 'Référentiel' }, { label: 'Postes' }];
  readonly rows = signal<PositionRow[]>([]);
  readonly filtered = signal<PositionRow[]>([]);
  readonly query = signal('');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly pageRows = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filtered().slice(start, start + this.pageSize());
  });

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    const response = await firstValueFrom(this.http.get<any>(`${environment.apiUrl}/Position`));
    const list = Array.isArray(response) ? response : [];
    const mapped = list.map((item: any) => ({
      positionId: Number(item.positionId ?? item.PositionId),
      positionName: String(item.positionName ?? item.PositionName ?? ''),
    }));
    this.rows.set(mapped);
    this.filtered.set(mapped);
  }

  filter(): void {
    const needle = this.query().trim().toLowerCase();
    this.filtered.set(this.rows().filter((row) => row.positionName.toLowerCase().includes(needle)));
    this.pageIndex.set(0);
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  open(row: PositionRow): void {
    void this.router.navigate(['/soft-gcc/parametres/referentiel-competences/postes', row.positionId]);
  }
}
