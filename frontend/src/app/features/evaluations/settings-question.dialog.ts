import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { GccSelect } from '../../ui/gcc-select';
import { GccSelectOption } from '../../ui/gcc.types';
import {
  PositionOption,
  ResponseTypeOption,
  SettingsCompetenceLine,
  SettingsEvalType,
  SettingsQuestion,
  SettingsQuestionPayload,
} from './evaluation.models';

export interface SettingsQuestionDialogData {
  question: SettingsQuestion | null;
  types: SettingsEvalType[];
  positions: PositionOption[];
  competenceLines: SettingsCompetenceLine[];
  responseTypes: ResponseTypeOption[];
}

@Component({
  selector: 'app-settings-question-dialog',
  imports: [FormsModule, MatDialogModule, MatButtonModule, GccSelect],
  template: `
    <div class="p-1">
      <h2 mat-dialog-title class="!mb-1 !font-sans !text-lg !font-bold !text-navy">
        {{ data.question ? 'Modifier la question' : 'Nouvelle question' }}
      </h2>
      <p class="px-6 text-xs font-medium text-slate-500">
        Reliez la question à un type, un poste et un mode de réponse.
      </p>

      <mat-dialog-content class="!mt-4 !space-y-4">
        <label class="block">
          <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Intitulé
          </span>
          <textarea
            class="gcc-input min-h-28 leading-relaxed"
            [(ngModel)]="question"
            placeholder="Ex. Décrivez une situation où vous avez résolu un incident critique…"
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
            <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Poste</span>
            <gcc-select
              [options]="positionOptions"
              [(value)]="positionId"
              placeholder="Choisir un poste"
              [searchable]="true"
              searchPlaceholder="Rechercher un poste…"
            />
          </label>
          <label class="block">
            <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Ligne de compétence
            </span>
            <gcc-select
              [options]="competenceOptions()"
              [(value)]="competenceLineId"
              [placeholder]="isScore() ? 'Obligatoire pour SCORE' : 'Optionnel'"
              [searchable]="true"
              searchPlaceholder="Rechercher une compétence…"
            />
          </label>
          <label class="block">
            <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Type de réponse
            </span>
            <gcc-select [options]="responseOptions" [(value)]="responseTypeId" placeholder="Choisir un type" />
          </label>
        </div>

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
export class SettingsQuestionDialog {
  readonly data = inject<SettingsQuestionDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<SettingsQuestionDialog, SettingsQuestionPayload>);

  readonly question = signal(this.data.question?.question ?? '');
  readonly evaluationTypeId = signal(this.toValue(this.data.question?.evaluationTypeId));
  readonly positionId = signal(this.toValue(this.data.question?.positionId));
  readonly competenceLineId = signal(
    this.data.question?.competenceLineId ? String(this.data.question.competenceLineId) : 'none',
  );
  readonly responseTypeId = signal(
    this.toValue(this.data.question?.responseTypeId ?? this.data.responseTypes[0]?.responseTypeId ?? 1),
  );
  readonly error = signal<string | null>(null);

  readonly typeOptions: GccSelectOption[] = this.data.types.map((item) => ({
    label: item.designation,
    value: String(item.evaluationTypeId),
  }));
  readonly positionOptions: GccSelectOption[] = this.data.positions.map((item) => ({
    label: item.positionName,
    value: String(item.positionId),
  }));
  readonly responseOptions: GccSelectOption[] = this.data.responseTypes.map((item) => ({
    label: item.typeName,
    value: String(item.responseTypeId),
  }));

  readonly competenceOptions = computed<GccSelectOption[]>(() => {
    const positionId = Number(this.positionId());
    const lines = this.data.competenceLines.filter(
      (item) => !positionId || !item.positionId || item.positionId === positionId,
    );
    const mapped = lines.map((item) => ({
      label: item.skillName + (item.positionName ? ` · ${item.positionName}` : ''),
      value: String(item.competenceLineId),
    }));
    if (this.isScore()) {
      return mapped;
    }
    return [{ label: 'Aucune ligne de compétence', value: 'none' }, ...mapped];
  });

  isScore(): boolean {
    return Number(this.responseTypeId()) === 3;
  }

  submit(): void {
    const text = this.question().trim();
    const evaluationTypeId = Number(this.evaluationTypeId());
    const positionId = Number(this.positionId());
    const responseTypeId = Number(this.responseTypeId());
    if (!text || !evaluationTypeId || !positionId || !responseTypeId) {
      this.error.set('Renseignez l’intitulé, le type, le poste et le mode de réponse.');
      return;
    }
    const competence = this.competenceLineId();
    if (responseTypeId === 3 && (!competence || competence === 'none')) {
      this.error.set('Une ligne de compétence est obligatoire pour une question SCORE.');
      return;
    }
    this.dialogRef.close({
      questionId: this.data.question?.questionId ?? null,
      question: text,
      evaluationTypeId,
      positionId,
      competenceLineId: competence && competence !== 'none' ? Number(competence) : null,
      responseTypeId,
      state: this.data.question?.state || 1,
    });
  }

  private toValue(value: number | null | undefined): string | null {
    return value ? String(value) : null;
  }
}
