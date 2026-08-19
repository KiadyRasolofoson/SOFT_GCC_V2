import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { GccSelect } from '../../ui/gcc-select';
import { GccSelectOption } from '../../ui/gcc.types';
import { toMaterialIcon } from '../../core/icon-map';
import { AdminModule, MODULE_ICON_OPTIONS, ModulePayload } from './user.models';

export interface ModuleDialogData {
  module: AdminModule | null;
  parents: AdminModule[];
  presetParentId?: number | null;
}

@Component({
  selector: 'app-module-dialog',
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatIconModule, GccSelect],
  template: `
    <div class="p-1">
      <h2 mat-dialog-title class="!mb-1 !font-sans !text-lg !font-bold !text-navy">
        {{ data.module ? 'Modifier le module' : 'Nouveau module' }}
      </h2>
      <p class="px-6 text-xs font-medium text-slate-500">
        Les modules racines regroupent les pages du menu. Une page enfant porte généralement une route.
      </p>

      <mat-dialog-content class="!mt-4 !space-y-4">
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Clé technique
            </span>
            <input class="gcc-input" type="text" [(ngModel)]="name" placeholder="ex. module_evaluations" />
          </label>
          <label class="block">
            <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Libellé menu
            </span>
            <input class="gcc-input" type="text" [(ngModel)]="displayName" placeholder="ex. Évaluations" />
          </label>
          <label class="block sm:col-span-2">
            <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Icône</span>
            <div class="flex items-center gap-3">
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-accent">
                <mat-icon class="!h-5 !w-5 !text-[20px]">{{ previewIcon() }}</mat-icon>
              </span>
              <div class="min-w-0 flex-1">
                <gcc-select [options]="iconOptions" [(value)]="icon" placeholder="Choisir une icône" />
              </div>
            </div>
          </label>
          <label class="block">
            <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Route</span>
            <input class="gcc-input" type="text" [(ngModel)]="route" placeholder="/soft-gcc/evaluations/accueil" />
          </label>
          <label class="block">
            <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Parent</span>
            <gcc-select [options]="parentOptions" [(value)]="parentModuleId" placeholder="Module racine" />
          </label>
          <label class="block">
            <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Ordre</span>
            <input class="gcc-input" type="number" [(ngModel)]="sortOrder" />
          </label>
          <label class="block sm:col-span-2">
            <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Description
            </span>
            <textarea class="gcc-input min-h-20 leading-relaxed" [(ngModel)]="description" placeholder="Usage du module dans le menu…"></textarea>
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
export class ModuleDialog {
  readonly data = inject<ModuleDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ModuleDialog, ModulePayload>);

  readonly name = signal(this.data.module?.name ?? '');
  readonly displayName = signal(this.data.module?.displayName ?? '');
  readonly icon = signal(this.resolveIcon(this.data.module?.icon));
  readonly route = signal(this.data.module?.route ?? '');
  readonly parentModuleId = signal(
    this.toParentValue(this.data.module?.parentModuleId ?? this.data.presetParentId ?? null),
  );
  readonly sortOrder = signal(this.data.module?.sortOrder ?? 0);
  readonly description = signal(this.data.module?.description ?? '');
  readonly error = signal<string | null>(null);
  readonly iconOptions = MODULE_ICON_OPTIONS;

  readonly parentOptions: GccSelectOption[] = [
    { label: 'Aucun — module racine', value: 'none' },
    ...this.data.parents
      .filter((item) => !this.data.module || item.moduleId !== this.data.module.moduleId)
      .map((item) => ({
        label: item.parentModuleId ? `↳ ${item.displayName}` : item.displayName,
        value: String(item.moduleId),
      })),
  ];

  previewIcon(): string {
    return toMaterialIcon(this.icon() || 'apps');
  }

  submit(): void {
    const name = this.name().trim();
    const displayName = this.displayName().trim();
    if (!name || !displayName) {
      this.error.set('La clé technique et le libellé sont obligatoires.');
      return;
    }
    const parent = this.parentModuleId();
    this.dialogRef.close({
      moduleId: this.data.module?.moduleId,
      name,
      displayName,
      icon: this.icon() || 'apps',
      route: this.route().trim(),
      parentModuleId: parent && parent !== 'none' ? Number(parent) : null,
      sortOrder: Number(this.sortOrder()) || 0,
      description: this.description().trim(),
    });
  }

  private resolveIcon(value: string | undefined): string | null {
    if (!value) return 'apps';
    const mapped = toMaterialIcon(value);
    return this.iconOptions.some((opt) => opt.value === mapped) ? mapped : 'apps';
  }

  private toParentValue(value: number | null): string {
    return value ? String(value) : 'none';
  }
}
