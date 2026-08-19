import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { GccSelect } from '../../ui/gcc-select';
import { GccSelectOption } from '../../ui/gcc.types';
import { AdminModule, AdminPermission, FlatAdminModule, PermissionPayload, flattenModuleTree } from './user.models';

export interface PermissionDialogData {
  permission: AdminPermission | null;
  modules: AdminModule[];
}

@Component({
  selector: 'app-permission-dialog',
  imports: [FormsModule, MatDialogModule, MatButtonModule, GccSelect],
  template: `
    <div class="p-1">
      <h2 mat-dialog-title class="!mb-1 !font-sans !text-lg !font-bold !text-navy">
        {{ data.permission ? 'Modifier la permission' : 'Nouvelle permission' }}
      </h2>
      <p class="px-6 text-xs font-medium text-slate-500">
        La clé système est en SNAKE_CASE. Reliez-la à un module pour la regrouper dans l’attribution des droits.
      </p>

      <mat-dialog-content class="!mt-4 !space-y-4">
        <label class="block">
          <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Clé système
          </span>
          <input class="gcc-input" type="text" [(ngModel)]="name" placeholder="CAN_GENERATE_REPORT" />
        </label>
        <label class="block">
          <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Description
          </span>
          <textarea
            class="gcc-input min-h-20 leading-relaxed"
            [(ngModel)]="description"
            placeholder="Autorise la génération des rapports PDF…"
          ></textarea>
        </label>
        <label class="block">
          <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Module</span>
          <gcc-select [options]="moduleOptions" [(value)]="moduleId" placeholder="Permission globale" />
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
export class PermissionDialog {
  readonly data = inject<PermissionDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<PermissionDialog, PermissionPayload>);

  readonly name = signal(this.data.permission?.name ?? '');
  readonly description = signal(this.data.permission?.description ?? '');
  readonly moduleId = signal(this.data.permission?.moduleId ? String(this.data.permission.moduleId) : 'none');
  readonly error = signal<string | null>(null);

  readonly moduleOptions: GccSelectOption[] = [
    { label: 'Aucun — permission globale', value: 'none' },
    ...flattenModuleTree(this.data.modules).map((item: FlatAdminModule) => ({
      label: `${'— '.repeat(item.depth)}${item.displayName} (${item.name})`,
      value: String(item.moduleId),
    })),
  ];

  submit(): void {
    const name = this.name().trim().toUpperCase().replace(/\s+/g, '_');
    if (!name) {
      this.error.set('La clé système est obligatoire.');
      return;
    }
    const module = this.moduleId();
    this.dialogRef.close({
      permissionId: this.data.permission?.permissionId,
      name,
      description: this.description().trim(),
      moduleId: module && module !== 'none' ? Number(module) : null,
    });
  }
}
