import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface SettingsConfirmData {
  title: string;
  message: string;
  confirmLabel?: string;
  icon?: string;
}

@Component({
  selector: 'app-settings-confirm-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="p-1">
      <h2 mat-dialog-title class="!mb-1 !flex !items-center !gap-2 !font-sans !text-lg !font-bold !text-navy">
        <mat-icon class="!text-[22px] text-amber-600">{{ data.icon || 'warning' }}</mat-icon>
        {{ data.title }}
      </h2>
      <mat-dialog-content>
        <p class="text-sm leading-relaxed text-slate-600">{{ data.message }}</p>
      </mat-dialog-content>
      <mat-dialog-actions align="end" class="!gap-2 !px-6 !pb-5">
        <button mat-stroked-button class="gcc-btn-secondary !rounded-xl" type="button" mat-dialog-close>
          Annuler
        </button>
        <button
          mat-flat-button
          class="gcc-btn-primary !rounded-xl"
          type="button"
          (click)="dialogRef.close(true)"
        >
          {{ data.confirmLabel || 'Confirmer' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
})
export class SettingsConfirmDialog {
  readonly data = inject<SettingsConfirmData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<SettingsConfirmDialog, boolean>);
}
