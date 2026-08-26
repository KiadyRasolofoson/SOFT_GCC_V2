import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface EvaluationSubmitDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
}

@Component({
  selector: 'app-evaluation-submit-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="p-1">
      <h2 mat-dialog-title class="!mb-1 !flex !items-center !gap-2 !font-sans !text-lg !font-bold !text-navy">
        <mat-icon class="!text-[22px] text-accent">task_alt</mat-icon>
        {{ data.title }}
      </h2>
      <mat-dialog-content>
        <p class="text-sm leading-relaxed text-slate-600">{{ data.message }}</p>
      </mat-dialog-content>
      <mat-dialog-actions
        class="!flex !flex-col-reverse !gap-2 !px-4 !pb-4 sm:!flex-row sm:!justify-end sm:!px-6 sm:!pb-5"
      >
        <button
          mat-stroked-button
          class="gcc-btn-secondary !min-h-11 !w-full !rounded-xl sm:!w-auto"
          type="button"
          mat-dialog-close
        >
          Annuler
        </button>
        <button
          mat-flat-button
          class="gcc-btn-primary !min-h-11 !w-full !rounded-xl sm:!w-auto"
          type="button"
          (click)="dialogRef.close(true)"
        >
          {{ data.confirmLabel || 'Soumettre' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
})
export class EvaluationSubmitDialog {
  readonly data = inject<EvaluationSubmitDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject<MatDialogRef<EvaluationSubmitDialog, boolean>>(MatDialogRef);
}
