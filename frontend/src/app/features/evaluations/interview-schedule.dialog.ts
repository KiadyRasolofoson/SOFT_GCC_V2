import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { GccIdentityCard } from '../../ui/gcc-identity-card';
import { GccSelect } from '../../ui/gcc-select';
import { GccSelectOption } from '../../ui/gcc.types';
import {
  employeeFullName,
  initialsOf,
  InterviewEmployeeRow,
  InterviewParticipantOption,
  participantLabel,
  roleLabel,
  toLocalDateTimeInput,
} from './evaluation.models';

export interface InterviewScheduleData {
  employee: InterviewEmployeeRow;
  participants: InterviewParticipantOption[];
  selectedIds: number[];
  scheduledDate: string;
  sendEmails: boolean;
  mode: 'create' | 'edit';
}

export interface InterviewScheduleResult {
  scheduledDate: string;
  participantIds: number[];
  sendEmails: boolean;
}

@Component({
  selector: 'app-interview-schedule-dialog',
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatIconModule, GccIdentityCard, GccSelect],
  template: `
    <div class="p-1">
      <h2 mat-dialog-title class="!mb-1 !font-sans !text-lg !font-bold !text-navy">
        {{ data.mode === 'edit' ? 'Reprogrammer l’entretien' : 'Planifier l’entretien' }}
      </h2>
      <p class="px-6 text-xs font-medium text-slate-500">
        Choisissez le créneau, les interlocuteurs et le mode de convocation.
      </p>

      <mat-dialog-content class="!mt-4 !space-y-5">
        <gcc-identity-card
          [name]="employeeName()"
          [role]="data.employee.position || 'Poste non renseigné'"
          [department]="data.employee.department || ''"
          [initials]="initialsOf(employeeName())"
          matricule=""
          seniority=""
        />

        <label class="block">
          <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Date et heure
          </span>
          <input
            class="gcc-input"
            type="datetime-local"
            [ngModel]="scheduledDate()"
            (ngModelChange)="onDateChange($event)"
          />
          @if (dateError()) {
            <p class="mt-1.5 text-xs font-semibold text-red-600">{{ dateError() }}</p>
          }
        </label>

        <button
          type="button"
          class="flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition"
          [class]="
            sendEmails()
              ? 'border-indigo-200 bg-indigo-50/70'
              : 'border-slate-200 bg-white hover:border-slate-300'
          "
          (click)="sendEmails.set(!sendEmails())"
        >
          <span
            class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
            [class]="sendEmails() ? 'bg-indigo-100 text-accent' : 'bg-slate-100 text-slate-500'"
          >
            <mat-icon class="!h-4 !w-4 !text-[18px]">
              {{ sendEmails() ? 'mark_email_read' : 'unsubscribe' }}
            </mat-icon>
          </span>
          <span class="min-w-0 flex-1">
            <span class="block text-sm font-bold text-navy">Convocation par e-mail</span>
            <span class="mt-0.5 block text-xs font-medium text-slate-500">
              {{ sendEmails()
                ? 'Un message sera envoyé au salarié et aux participants retenus.'
                : 'Aucune notification ne sera envoyée pour ce créneau.' }}
            </span>
          </span>
        </button>

        <div>
          <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Participants (hors salarié évalué)
          </span>
          <gcc-select
            [options]="availableOptions()"
            [value]="pick()"
            (valueChange)="addParticipant($event)"
            placeholder="Ajouter un manager ou un directeur"
          />
          @if (participantError()) {
            <p class="mt-1.5 text-xs font-semibold text-red-600">{{ participantError() }}</p>
          }

          <div class="mt-3 space-y-2">
            @for (participant of selectedRows(); track participant.id) {
              <div class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                <span
                  class="flex h-8 w-8 items-center justify-center rounded-xl bg-navy text-[10px] font-extrabold text-white"
                >
                  {{ initialsOf(participantLabel(participant)) }}
                </span>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-bold text-navy">{{ participantLabel(participant) }}</p>
                  <p class="text-[11px] font-medium text-slate-500">{{ roleLabel(participant.roleId, participant.role) }}</p>
                </div>
                <button type="button" class="text-slate-400 hover:text-red-600" (click)="removeParticipant(participant.id)">
                  <mat-icon class="!h-4 !w-4 !text-[16px]">close</mat-icon>
                </button>
              </div>
            } @empty {
              <p class="rounded-2xl border border-dashed border-slate-200 px-4 py-3 text-xs font-medium text-slate-500">
                Ajoutez au moins un interlocuteur pour tenir l’entretien.
              </p>
            }
          </div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="!px-6 !pb-5">
        <button mat-stroked-button class="gcc-btn-secondary !rounded-xl" type="button" mat-dialog-close>
          Annuler
        </button>
        <button mat-flat-button class="gcc-btn-primary !rounded-xl" type="button" (click)="confirm()">
          <mat-icon class="!mr-1.5">event_available</mat-icon>
          {{ data.mode === 'edit' ? 'Enregistrer le créneau' : 'Planifier' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
})
export class InterviewScheduleDialog {
  readonly data = inject<InterviewScheduleData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<InterviewScheduleDialog, InterviewScheduleResult>);

  readonly initialsOf = initialsOf;
  readonly participantLabel = participantLabel;
  readonly roleLabel = roleLabel;

  readonly scheduledDate = signal(this.data.scheduledDate || toLocalDateTimeInput(new Date()));
  readonly sendEmails = signal(this.data.sendEmails);
  readonly selectedIds = signal<number[]>([...this.data.selectedIds]);
  readonly pick = signal<string | null>(null);
  readonly dateError = signal('');
  readonly participantError = signal('');

  readonly employeeName = computed(() => employeeFullName(this.data.employee));

  readonly selectedRows = computed(() =>
    this.data.participants.filter((item) => this.selectedIds().includes(item.id)),
  );

  readonly availableOptions = computed<GccSelectOption[]>(() => {
    const selected = new Set(this.selectedIds());
    return this.data.participants
      .filter((item) => !selected.has(item.id))
      .map((item) => ({
        label: `${participantLabel(item)} · ${roleLabel(item.roleId, item.role)}`,
        value: String(item.id),
      }));
  });

  onDateChange(value: string): void {
    this.scheduledDate.set(value);
    this.dateError.set(this.validateDate(value));
  }

  addParticipant(value: string | null): void {
    const id = Number(value);
    if (!id || this.selectedIds().includes(id)) {
      this.pick.set(null);
      return;
    }
    this.selectedIds.update((ids) => [...ids, id]);
    this.participantError.set('');
    this.pick.set(null);
  }

  removeParticipant(id: number): void {
    this.selectedIds.update((ids) => ids.filter((item) => item !== id));
  }

  confirm(): void {
    const dateError = this.validateDate(this.scheduledDate());
    this.dateError.set(dateError);
    this.participantError.set(this.selectedIds().length ? '' : 'Ajoutez au moins un participant.');
    if (dateError || !this.selectedIds().length) return;

    this.dialogRef.close({
      scheduledDate: this.scheduledDate(),
      participantIds: this.selectedIds(),
      sendEmails: this.sendEmails(),
    });
  }

  private validateDate(value: string): string {
    if (!value) return 'Indiquez une date et une heure.';
    const selected = new Date(value);
    if (Number.isNaN(selected.getTime())) return 'Date invalide.';
    if (selected.getTime() < Date.now() - 60_000) return 'Le créneau ne peut pas être dans le passé.';
    return '';
  }
}
