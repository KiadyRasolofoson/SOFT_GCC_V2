import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { GccSelect } from '../../ui/gcc-select';
import { GccSelectOption } from '../../ui/gcc.types';
import {
  CompetenceDomainNode,
  PositionOption,
  ResponseTypeOption,
  SettingsEvalType,
  SettingsQuestion,
  SettingsQuestionOption,
  SettingsQuestionPayload,
} from './evaluation.models';

export interface SettingsQuestionDialogData {
  question: SettingsQuestion | null;
  types: SettingsEvalType[];
  positions: PositionOption[];
  domains: CompetenceDomainNode[];
  responseTypes: ResponseTypeOption[];
  options: SettingsQuestionOption[];
}

@Component({
  selector: 'app-settings-question-dialog',
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatCheckboxModule, MatIconModule, GccSelect],
  template: `
    <div class="p-1">
      <h2 mat-dialog-title class="!mb-1 !font-sans !text-lg !font-bold !text-navy">
        {{ data.question ? 'Modifier la question' : 'Nouvelle question' }}
      </h2>
      <p class="px-6 text-xs font-medium text-slate-500">
        Reliez la question à une compétence du référentiel (domaine → famille → compétence). Le poste est facultatif.
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
            <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Type de réponse
            </span>
            <gcc-select [options]="responseOptions" [(value)]="responseTypeId" placeholder="Choisir un type" />
          </label>
          <label class="block">
            <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Domaine</span>
            <gcc-select
              [options]="domainOptions"
              [(value)]="domainId"
              placeholder="Choisir un domaine"
              [searchable]="true"
              searchPlaceholder="Rechercher un domaine…"
            />
          </label>
          <label class="block">
            <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Famille</span>
            <gcc-select
              [options]="familyOptions()"
              [(value)]="familyId"
              placeholder="Choisir une famille"
              [searchable]="true"
              searchPlaceholder="Rechercher une famille…"
            />
          </label>
          <label class="block">
            <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Compétence</span>
            <gcc-select
              [options]="skillOptions()"
              [(value)]="skillId"
              placeholder="Choisir une compétence"
              [searchable]="true"
              searchPlaceholder="Rechercher une compétence…"
            />
          </label>
          <label class="block">
            <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Poste
            </span>
            <gcc-select
              [options]="positionOptions"
              [(value)]="positionId"
              placeholder="Tous les postes"
              [searchable]="true"
              searchPlaceholder="Rechercher un poste…"
            />
          </label>
        </div>

        @if (isQcm()) {
          <section class="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
            <div class="mb-3 flex items-center justify-between gap-3">
              <div>
                <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Choix de réponses</p>
                <p class="text-xs text-slate-500">Cochez une ou plusieurs bonnes réponses. Le salarié pourra en sélectionner plusieurs.</p>
              </div>
              <button mat-stroked-button class="gcc-btn-secondary !rounded-xl !text-xs" type="button" (click)="addOption()">
                <mat-icon class="!mr-1 !h-4 !w-4 !text-[16px]">add</mat-icon>
                Ajouter un choix
              </button>
            </div>
            <div class="space-y-2">
              @for (option of options(); track $index; let i = $index) {
                <div class="flex items-start gap-2 rounded-xl border border-slate-200 bg-white p-2">
                  <div class="flex flex-col gap-1 pt-1">
                    <button
                      class="gcc-icon-btn !h-7 !w-7"
                      type="button"
                      [disabled]="i === 0"
                      (click)="moveOption(i, -1)"
                      aria-label="Monter"
                    >
                      <mat-icon class="!text-[18px]">arrow_upward</mat-icon>
                    </button>
                    <button
                      class="gcc-icon-btn !h-7 !w-7"
                      type="button"
                      [disabled]="i === options().length - 1"
                      (click)="moveOption(i, 1)"
                      aria-label="Descendre"
                    >
                      <mat-icon class="!text-[18px]">arrow_downward</mat-icon>
                    </button>
                  </div>
                  <input
                    class="gcc-input min-h-10 flex-1"
                    [ngModel]="option.optionText"
                    (ngModelChange)="setOptionText(i, $event)"
                    [placeholder]="'Choix ' + (i + 1)"
                  />
                  <mat-checkbox
                    class="mt-1 shrink-0"
                    [checked]="option.isCorrect"
                    (change)="setOptionCorrect(i, $event.checked)"
                  >
                    Bonne réponse
                  </mat-checkbox>
                  <button
                    class="gcc-icon-btn mt-1"
                    type="button"
                    [disabled]="options().length <= 2"
                    (click)="removeOption(i)"
                    aria-label="Supprimer le choix"
                  >
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              }
            </div>
          </section>
        }

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
  readonly domainId = signal(this.toValue(this.resolveInitialDomainId()));
  readonly familyId = signal(this.toValue(this.resolveInitialFamilyId()));
  readonly skillId = signal(this.toValue(this.data.question?.skillId));
  readonly positionId = signal(this.toValue(this.data.question?.positionId));
  readonly responseTypeId = signal(
    this.toValue(this.data.question?.responseTypeId ?? this.data.responseTypes[0]?.responseTypeId ?? 1),
  );
  readonly options = signal<SettingsQuestionOption[]>(this.initialOptions());
  readonly error = signal<string | null>(null);

  readonly typeOptions: GccSelectOption[] = this.data.types.map((item) => ({
    label: item.designation,
    value: String(item.evaluationTypeId),
  }));
  readonly domainOptions: GccSelectOption[] = this.data.domains.map((item) => ({
    label: item.domainName,
    value: String(item.domainId),
  }));
  readonly positionOptions: GccSelectOption[] = [
    { label: 'Tous les postes', value: 'all' },
    ...this.data.positions.map((item) => ({
      label: item.positionName,
      value: String(item.positionId),
    })),
  ];
  readonly responseOptions: GccSelectOption[] = this.data.responseTypes.map((item) => ({
    label: item.typeName,
    value: String(item.responseTypeId),
  }));

  readonly isQcm = computed(() => this.isQcmType(Number(this.responseTypeId())));

  readonly familyOptions = computed<GccSelectOption[]>(() => {
    const domainId = Number(this.domainId());
    const domain = this.data.domains.find((item) => item.domainId === domainId);
    return (domain?.families ?? []).map((item) => ({
      label: item.familyName,
      value: String(item.familyId),
    }));
  });

  readonly skillOptions = computed<GccSelectOption[]>(() => {
    const domainId = Number(this.domainId());
    const familyId = Number(this.familyId());
    const domain = this.data.domains.find((item) => item.domainId === domainId);
    const family = domain?.families.find((item) => item.familyId === familyId);
    return (family?.skills ?? []).map((item) => ({
      label: item.skillName,
      value: String(item.skillId),
    }));
  });

  constructor() {
    effect(() => {
      const families = this.familyOptions();
      untracked(() => {
        const current = this.familyId();
        if (current && !families.some((item) => item.value === current)) {
          this.familyId.set(null);
          this.skillId.set(null);
        }
      });
    });
    effect(() => {
      const skills = this.skillOptions();
      untracked(() => {
        const current = this.skillId();
        if (current && !skills.some((item) => item.value === current)) {
          this.skillId.set(null);
        }
      });
    });
    effect(() => {
      const qcm = this.isQcm();
      untracked(() => {
        if (qcm && this.options().length < 2) {
          this.options.set(emptyOptions());
        }
      });
    });
  }

  addOption(): void {
    this.options.update((current) => [...current, { optionId: null, optionText: '', isCorrect: false, sortOrder: current.length }]);
  }

  removeOption(index: number): void {
    this.options.update((current) => (current.length <= 2 ? current : current.filter((_, i) => i !== index)));
  }

  moveOption(index: number, delta: number): void {
    this.options.update((current) => {
      const next = [...current];
      const target = index + delta;
      if (target < 0 || target >= next.length) return current;
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next;
    });
  }

  setOptionText(index: number, value: string): void {
    this.options.update((current) => current.map((item, i) => (i === index ? { ...item, optionText: value } : item)));
  }

  setOptionCorrect(index: number, isCorrect: boolean): void {
    this.options.update((current) => current.map((item, i) => (i === index ? { ...item, isCorrect } : item)));
  }

  submit(): void {
    const text = this.question().trim();
    const evaluationTypeId = Number(this.evaluationTypeId());
    const skillId = Number(this.skillId());
    const responseTypeId = Number(this.responseTypeId());
    const positionRaw = this.positionId();
    const positionId =
      !positionRaw || positionRaw === 'all' || Number(positionRaw) <= 0 ? null : Number(positionRaw);

    if (!text || !evaluationTypeId || !skillId || !responseTypeId) {
      this.error.set('Renseignez l’intitulé, le type, la compétence et le mode de réponse.');
      return;
    }

    const options = this.isQcm()
      ? this.options().map((item, index) => ({
          optionId: item.optionId,
          optionText: item.optionText.trim(),
          isCorrect: item.isCorrect,
          sortOrder: index + 1,
        }))
      : [];

    if (this.isQcm()) {
      if (options.length < 2) {
        this.error.set('Un QCM doit proposer au moins deux choix.');
        return;
      }
      if (options.some((item) => !item.optionText)) {
        this.error.set('Chaque choix de QCM doit avoir un libellé.');
        return;
      }
      if (!options.some((item) => item.isCorrect)) {
        this.error.set('Cochez au moins une bonne réponse.');
        return;
      }
    }

    this.dialogRef.close({
      questionId: this.data.question?.questionId ?? null,
      question: text,
      evaluationTypeId,
      skillId,
      positionId,
      competenceLineId: this.data.question?.competenceLineId ?? null,
      responseTypeId,
      state: this.data.question?.state || 1,
      options,
    });
  }

  private initialOptions(): SettingsQuestionOption[] {
    const stored = this.data.options ?? [];
    if (stored.length >= 2) return stored.map((item) => ({ ...item }));
    return this.isQcmType(this.data.question?.responseTypeId) ? emptyOptions() : [];
  }

  private isQcmType(responseTypeId: number | null | undefined): boolean {
    const type = this.data.responseTypes.find((item) => item.responseTypeId === responseTypeId);
    return (type?.typeName ?? '').trim().toUpperCase() === 'QCM' || responseTypeId === 2;
  }

  private resolveInitialDomainId(): number | null {
    const question = this.data.question;
    if (question?.domainId) return question.domainId;
    if (!question?.skillId) return null;
    for (const domain of this.data.domains) {
      for (const family of domain.families) {
        if (family.skills.some((skill) => skill.skillId === question.skillId)) {
          return domain.domainId;
        }
      }
    }
    return null;
  }

  private resolveInitialFamilyId(): number | null {
    const question = this.data.question;
    if (question?.familyId) return question.familyId;
    if (!question?.skillId) return null;
    for (const domain of this.data.domains) {
      for (const family of domain.families) {
        if (family.skills.some((skill) => skill.skillId === question.skillId)) {
          return family.familyId;
        }
      }
    }
    return null;
  }

  private toValue(value: number | null | undefined): string | null {
    return value ? String(value) : null;
  }
}

function emptyOptions(): SettingsQuestionOption[] {
  return [
    { optionId: null, optionText: '', isCorrect: false, sortOrder: 1 },
    { optionId: null, optionText: '', isCorrect: false, sortOrder: 2 },
  ];
}
