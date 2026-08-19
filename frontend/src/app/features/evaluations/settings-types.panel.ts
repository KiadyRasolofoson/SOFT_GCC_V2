import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { GccEmptyState } from '../../ui/gcc-empty-state';
import { GccKpiCard } from '../../ui/gcc-kpi-card';
import { SettingsEvalType } from './evaluation.models';
import { EvaluationSettingsService } from './evaluation-settings.service';
import { SettingsConfirmDialog } from './settings-confirm.dialog';
import { SettingsTypeDialog } from './settings-type.dialog';

@Component({
  selector: 'app-settings-types-panel',
  imports: [GccKpiCard, GccEmptyState, MatTableModule, MatButtonModule, MatIconModule],
  template: `
    <div class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <gcc-kpi-card label="Types" [value]="rows().length.toString()" hint="Campagnes et questionnaires" tone="neutral" icon="category" />
      <gcc-kpi-card
        label="Actifs"
        [value]="activeCount().toString()"
        hint="Disponibles pour une nouvelle évaluation"
        tone="up"
        icon="check_circle"
      />
      <gcc-kpi-card
        label="Inactifs"
        [value]="inactiveCount().toString()"
        hint="Conservés pour l’historique"
        tone="down"
        icon="pause_circle"
      />
    </div>

    @if (error()) {
      <gcc-empty-state
        variant="error"
        title="Impossible de charger les types"
        [message]="error()!"
        actionLabel="Réessayer"
        actionIcon="refresh"
        (action)="reload()"
      />
    } @else if (!loading() && !rows().length) {
      <gcc-empty-state
        title="Aucun type d’évaluation"
        message="Créez au moins un type (annuelle, trimestrielle, probatoire…) pour alimenter les questionnaires."
        actionLabel="Nouveau type"
        actionIcon="add"
        (action)="openDialog()"
      />
    } @else {
      <div class="gcc-table overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
        <table mat-table [dataSource]="rows()" class="w-full">
          <ng-container matColumnDef="designation">
            <th mat-header-cell *matHeaderCellDef>Désignation</th>
            <td mat-cell *matCellDef="let row">
              <div class="flex items-center gap-3 py-2">
                <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-accent">
                  <mat-icon class="!h-5 !w-5 !text-[20px]">label</mat-icon>
                </span>
                <p class="text-sm font-bold text-navy">{{ row.designation }}</p>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="action">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let row" class="text-right">
              <div class="inline-flex items-center justify-end gap-1">
                <button class="gcc-icon-btn" type="button" (click)="openDialog(row)" aria-label="Modifier">
                  <mat-icon>edit</mat-icon>
                </button>
                <button class="gcc-icon-btn" type="button" (click)="deleteOne(row)" aria-label="Supprimer">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns" class="transition-colors hover:bg-indigo-50/30"></tr>
        </table>
      </div>
    }
  `,
})
export class SettingsTypesPanel implements OnInit {
  private readonly settings = inject(EvaluationSettingsService);
  private readonly dialog = inject(MatDialog);

  readonly columns = ['designation', 'action'];
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly rows = signal<SettingsEvalType[]>([]);

  ngOnInit(): void {
    this.reload();
  }

  activeCount(): number {
    return this.rows().filter((row) => row.state == null || row.state === 1).length;
  }

  inactiveCount(): number {
    return this.rows().length - this.activeCount();
  }

  openDialog(row?: SettingsEvalType): void {
    this.dialog
      .open(SettingsTypeDialog, {
        width: '28rem',
        maxWidth: '95vw',
        data: { type: row ?? null },
      })
      .afterClosed()
      .subscribe((designation: string | undefined) => {
        if (!designation) return;
        const request = row
          ? this.settings.updateEvaluationType(row.evaluationTypeId, designation)
          : this.settings.createEvaluationType(designation);
        request.subscribe({
          next: () => this.reload(),
          error: () => this.error.set('L’enregistrement a échoué. Vérifiez que la désignation n’existe pas déjà.'),
        });
      });
  }

  deleteOne(row: SettingsEvalType): void {
    this.dialog
      .open(SettingsConfirmDialog, {
        width: '28rem',
        data: {
          title: 'Supprimer le type',
          message: `« ${row.designation } » ne pourra plus être utilisé pour de nouvelles campagnes.`,
          confirmLabel: 'Supprimer',
          icon: 'delete',
        },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (!ok) return;
        this.settings.deleteEvaluationType(row.evaluationTypeId).subscribe({
          next: () => this.reload(),
          error: () => this.error.set('La suppression a échoué. Le type est peut-être encore utilisé.'),
        });
      });
  }

  reload(): void {
    this.loading.set(true);
    this.error.set(null);
    this.settings.getEvaluationTypes().subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Vérifiez vos droits (paramétrage des évaluations) ou réessayez.');
        this.loading.set(false);
      },
    });
  }
}
