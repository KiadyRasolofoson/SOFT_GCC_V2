import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { GccSelect } from '../../ui/gcc-select';
import { GccSelectOption } from '../../ui/gcc.types';
import { AdminRole, AdminUser, UserPayload } from './user.models';

export interface UserDialogData {
  user: AdminUser | null;
  roles: AdminRole[];
}

@Component({
  selector: 'app-user-dialog',
  imports: [FormsModule, MatDialogModule, MatButtonModule, GccSelect],
  template: `
    <div class="p-1">
      <h2 mat-dialog-title class="!mb-1 !font-sans !text-lg !font-bold !text-navy">
        {{ data.user ? 'Modifier le compte' : 'Nouveau compte' }}
      </h2>
      <p class="px-6 text-xs font-medium text-slate-500">
        Le rôle détermine les pages visibles et les droits métier. Les changements d’accès exigent une reconnexion.
      </p>

      <mat-dialog-content class="!mt-4 !space-y-4">
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Nom</span>
            <input class="gcc-input" type="text" [(ngModel)]="lastName" placeholder="Rakoto" />
          </label>
          <label class="block">
            <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Prénom</span>
            <input class="gcc-input" type="text" [(ngModel)]="firstName" placeholder="Hery" />
          </label>
          <label class="block">
            <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Identifiant
            </span>
            <input class="gcc-input" type="text" [(ngModel)]="username" placeholder="h.rakoto" />
          </label>
          <label class="block">
            <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Email</span>
            <input class="gcc-input" type="email" [(ngModel)]="email" placeholder="hery.rakoto@entreprise.mg" />
          </label>
          <label class="block">
            <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Rôle</span>
            <gcc-select [options]="roleOptions" [(value)]="roleId" placeholder="Choisir un rôle" />
          </label>
          @if (!data.user) {
            <label class="block">
              <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Mot de passe
              </span>
              <input class="gcc-input" type="password" [(ngModel)]="password" placeholder="••••••••" />
            </label>
          }
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
          {{ data.user ? 'Enregistrer' : 'Créer le compte' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
})
export class UserDialog {
  readonly data = inject<UserDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<UserDialog, UserPayload>);

  readonly firstName = signal(this.data.user?.firstName ?? '');
  readonly lastName = signal(this.data.user?.lastName ?? '');
  readonly username = signal(this.data.user?.username ?? '');
  readonly email = signal(this.data.user?.email ?? '');
  readonly roleId = signal(this.data.user?.roleId ? String(this.data.user.roleId) : null);
  readonly password = signal('');
  readonly error = signal<string | null>(null);

  readonly roleOptions: GccSelectOption[] = this.data.roles.map((role) => ({
    label: role.title,
    value: String(role.roleId),
  }));

  submit(): void {
    const firstName = this.firstName().trim();
    const lastName = this.lastName().trim();
    const username = this.username().trim();
    const roleId = Number(this.roleId());
    if (!firstName || !lastName || !username || !roleId) {
      this.error.set('Renseignez le nom, le prénom, l’identifiant et le rôle.');
      return;
    }
    if (!this.data.user && this.password().trim().length < 6) {
      this.error.set('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    this.dialogRef.close({
      userId: this.data.user?.userId,
      firstName,
      lastName,
      username,
      email: this.email().trim(),
      roleId,
      password: this.data.user ? undefined : this.password(),
    });
  }
}
