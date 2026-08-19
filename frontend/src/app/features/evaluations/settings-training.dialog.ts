import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { GccSelect } from '../../ui/gcc-select';
import { GccSelectOption } from '../../ui/gcc.types';
import {
  SettingsEvalType,
  SettingsQuestion,
  SettingsTraining,
  SettingsTrainingPayload,
} from './evaluation.models';

export interface SettingsTrainingDialogData {
  training: SettingsTraining | null;
  types: SettingsEvalType[];
  questions: SettingsQuestion[];
}

@Component({
  selector: 'app-settings-training-dialog',
  imports: [FormsModule, MatDialogModule, MatButtonModule, GccSelect],
  template: `
    <div class="p-1">
      <h2 mat-dialog-title class="!mb-1 !font-sans !text-lg !font-bold !text-navy">
        {{ data.training ? 'Modifier la suggestion' : 'Nouvelle suggestion' }}
      </h2>
      <p class="px-6 text-xs font-medium text-slate-500">
        Proposez une formation lorsque le score d’une question reste sous le seuil.
      </p>

      <mat-dialog-content class="!mt-4 !space-y-4">
        <label class="block">
          <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Intitulé de la formation
          </span>
          <input class="gcc-input" type="text" [(ngModel)]="training" placeholder="Ex. Communication d’équipe" />
        </label>

        <label class="block">
          <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Détails</span>
          <textarea
            class="gcc-input min-h-24 leading-relaxed"
            [(ngModel)]="details"
            placeholder="Objectifs, format, durée indicative…"
          ></textarea>
        </label>

        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Type d’évaluation
            </span>
            <gcc-select [options]="typeOptions" [(value)]="evaluationTypeId" placeholder="Choisir un type" />
          </label>
          <label class="block">
            <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Seuil de score
            </span>
            <gcc-select [options]="thresholdOptions" [(value)]="scoreThreshold" placeholder="Score max" />
          </label>
        </div>

        <label class="block">
          <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Question déclencheur
          </span>
          <gcc-select
            [options]="questionOptions()"
            [(value)]="questionId"
            placeholder="Choisir une question"
            [searchable]="true"
            searchPlaceholder="Rechercher une question…"
          />
        </label>

        @if (error()) {
          <p class="text-xs font-semibold text-red-600">{{ error() }}</p>
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
export class SettingsTrainingDialog {
  readonly data = inject<SettingsTrainingDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<SettingsTrainingDialog, SettingsTrainingPayload>);

  readonly training = signal(this.data.training?.training ?? '');
  readonly details = signal(this.data.training?.details ?? '');
  readonly evaluationTypeId = signal(this.toValue(this.data.training?.evaluationTypeId));
  readonly questionId = signal(this.toValue(this.data.training?.questionId));
  readonly scoreThreshold = signal(String(this.data.training?.scoreThreshold ?? 3));
  readonly error = signal<string | null>(null);

  readonly typeOptions: GccSelectOption[] = this.data.types.map((item) => ({
    label: item.designation,
    value: String(item.evaluationTypeId),
  }));
  readonly thresholdOptions: GccSelectOption[] = [1, 2, 3, 4, 5].map((value) => ({
    label: `≤ ${value} / 5`,
    value: String(value),
  }));

  readonly questionOptions = computed<GccSelectOption[]>(() => {
    const typeId = Number(this.evaluationTypeId());
    const rows = this.data.questions.filter((item) => !typeId || item.evaluationTypeId === typeId);
    return rows.map((item) => ({
      label: item.question.length > 90 ? `${item.question.slice(0, 90)}…` : item.question,
      value: String(item.questionId),
    }));
  });

  submit(): void {
    const training = this.training().trim();
    const evaluationTypeId = Number(this.evaluationTypeId());
    const questionId = Number(this.questionId());
    const scoreThreshold = Number(this.scoreThreshold());
    if (!training || !evaluationTypeId || !questionId) {
      this.error.set('Renseignez la formation, le type d’évaluation et la question.');
      return;
    }
    this.dialogRef.close({
      training,
      details: this.details().trim(),
      evaluationTypeId,
      questionId,
      scoreThreshold,
      state: this.data.training?.state || 1,
    });
  }

  private toValue(value: number | null | undefined): string | null {
    return value ? String(value) : null;
  }
}
