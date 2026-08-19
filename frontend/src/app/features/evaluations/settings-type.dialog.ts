import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { SettingsEvalType } from './evaluation.models';

export interface SettingsTypeDialogData {
  type: SettingsEvalType | null;
}

@Component({
  selector: 'app-settings-type-dialog',
  imports: [FormsModule, MatDialogModule, MatButtonModule],
  template: `
    <div class="p-1">
      <h2 mat-dialog-title class="!mb-1 !font-sans !text-lg !font-bold !text-navy">
        {{ data.type ? 'Modifier le type' : 'Nouveau type d’évaluation' }}
      </h2>
      <p class="px-6 text-xs font-medium text-slate-500">
        Le type sert à classer les questionnaires, campagnes et suggestions de formation.
      </p>

      <mat-dialog-content class="!mt-4">
        <label class="block">
          <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Désignation
          </span>
          <input
            class="gcc-input"
            type="text"
            [(ngModel)]="designation"
            placeholder="Ex. Annuelle, Probatoire, Promotion…"
          />
        </label>
        @if (error()) {
          <p class="mt-2 text-xs font-semibold text-red-600">{{ error() }}</p>
        }
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="!gap-2 !px-6 !pb-5">
        <button mat-stroked-button class="gcc-btn-secondary !rounded-xl" type="button" mat-dialog-close>
          Annuler
        </button>
        <button mat-flat-button class="gcc-btn-primary !rounded-xl" type="button" (click)="submit()">
          Enregistrer
        </button>
      </mat-dialog-actions>
    </div>
  `,
})
export class SettingsTypeDialog {
  readonly data = inject<SettingsTypeDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<SettingsTypeDialog, string>);

  readonly designation = signal(this.data.type?.designation ?? '');
  readonly error = signal<string | null>(null);

  submit(): void {
    const value = this.designation().trim();
    if (!value) {
      this.error.set('La désignation est obligatoire.');
      return;
    }
    this.dialogRef.close(value);
  }
}
