import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { GccSelect } from '../../ui/gcc-select';
import { GccSelectOption } from '../../ui/gcc.types';
import { AdminRole, RolePayload } from './user.models';

export interface RoleDialogData {
  role: AdminRole | null;
}

@Component({
  selector: 'app-role-dialog',
  imports: [FormsModule, MatDialogModule, MatButtonModule, GccSelect],
  template: `
    <div class="p-1">
      <h2 mat-dialog-title class="!mb-1 !font-sans !text-lg !font-bold !text-navy">
        {{ data.role ? 'Modifier le rôle' : 'Nouveau rôle' }}
      </h2>
      <p class="px-6 text-xs font-medium text-slate-500">
        Un rôle regroupe les pages du menu et les permissions attribuées aux comptes.
      </p>

      <mat-dialog-content class="!mt-4 !space-y-4">
        <label class="block">
          <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Intitulé
          </span>
          <input class="gcc-input" type="text" [(ngModel)]="title" placeholder="Ex. MANAGER_RH, SUPERVISEUR…" />
        </label>
        <label class="block">
          <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Statut</span>
          <gcc-select [options]="stateOptions" [(value)]="state" placeholder="Statut" />
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
          {{ data.role ? 'Enregistrer' : 'Créer le rôle' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
})
export class RoleDialog {
  readonly data = inject<RoleDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<RoleDialog, RolePayload>);

  readonly title = signal(this.data.role?.title ?? '');
  readonly state = signal(String(this.data.role?.state ?? 1));
  readonly error = signal<string | null>(null);
  readonly stateOptions: GccSelectOption[] = [
    { label: 'Actif — peut être attribué', value: '1' },
    { label: 'Inactif — attributions bloquées', value: '0' },
  ];

  submit(): void {
    const title = this.title().trim();
    if (!title) {
      this.error.set('L’intitulé du rôle est obligatoire.');
      return;
    }
    this.dialogRef.close({
      roleId: this.data.role?.roleId,
      title,
      state: Number(this.state()) === 0 ? 0 : 1,
    });
  }
}
