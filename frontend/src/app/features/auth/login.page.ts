import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { loginErrorFromHttp, LoginError } from '../../core/http-error';
import { GccAuthShell } from '../../layouts/gcc-auth-shell';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule, MatButtonModule, MatIconModule, GccAuthShell],
  template: `
    <gcc-auth-shell>
      <div class="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white/95 p-8 shadow-xl shadow-slate-200/50 backdrop-blur-sm sm:p-10">
        <!-- Logo & Header for Mobile/Desktop -->
        <div class="mb-8 text-center">
          <img src="assets/logo/logo.png" alt="SoftTalent Logo" class="h-12 w-auto object-contain mb-3 mx-auto" />
          <h3 class="text-2xl font-bold tracking-tight text-navy">Connexion à SoftTalent</h3>
          <p class="mt-1.5 text-sm text-slate-500">
            Saisissez vos identifiants professionnels pour accéder à l'espace RH.
          </p>
        </div>

        @if (error(); as err) {
          <div class="mb-6 rounded-xl border border-amber-200/80 bg-amber-50/80 p-4 text-xs text-amber-900 shadow-xs">
            <div class="flex items-start gap-3">
              <mat-icon class="!h-5 !w-5 !text-[20px] shrink-0 text-amber-600 mt-0.5">warning</mat-icon>
              <div>
                <p class="font-bold text-amber-900">{{ err.message }}</p>
                <p class="mt-1 text-amber-700/90 leading-relaxed">{{ err.suggestion }}</p>
              </div>
            </div>
          </div>
        }

        <form (ngSubmit)="submit()" novalidate class="space-y-5">
          <!-- Identifier Field -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5" for="identifier">
              Identifiant / Email
            </label>
            <div class="relative flex items-center">
              <span class="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">
                <mat-icon class="!h-5 !w-5 !text-[20px]">person</mat-icon>
              </span>
              <input
                id="identifier"
                name="identifier"
                class="gcc-input !pl-11 !h-11 !text-sm !rounded-xl"
                placeholder="Matricule ou e-mail professionnel"
                [(ngModel)]="identifier"
                autocomplete="username"
              />
            </div>
            @if (empty.identifier) {
              <p class="mt-1 text-xs font-medium text-amber-600 flex items-center gap-1">
                <mat-icon class="!h-3.5 !w-3.5 !text-[14px]">error_outline</mat-icon>
                Ce champ est requis
              </p>
            }
          </div>

          <!-- Password Field -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5" for="password">
              Mot de passe
            </label>
            <div class="relative flex items-center">
              <span class="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">
                <mat-icon class="!h-5 !w-5 !text-[20px]">lock</mat-icon>
              </span>
              <input
                id="password"
                name="password"
                class="gcc-input !pl-11 !pr-11 !h-11 !text-sm !rounded-xl"
                [type]="showPassword() ? 'text' : 'password'"
                placeholder="Votre mot de passe"
                [(ngModel)]="password"
                autocomplete="current-password"
              />
              <button
                type="button"
                class="absolute right-2 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                (click)="showPassword.set(!showPassword())"
                [attr.aria-label]="showPassword() ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
              >
                <mat-icon class="!h-5 !w-5 !text-[20px]">
                  {{ showPassword() ? 'visibility_off' : 'visibility' }}
                </mat-icon>
              </button>
            </div>
            @if (empty.password) {
              <p class="mt-1 text-xs font-medium text-amber-600 flex items-center gap-1">
                <mat-icon class="!h-3.5 !w-3.5 !text-[14px]">error_outline</mat-icon>
                Ce champ est requis
              </p>
            }
          </div>

          <!-- Submit Button -->
          <button
            mat-flat-button
            class="gcc-btn-primary !h-11 !w-full !rounded-xl !text-sm !font-bold shadow-md shadow-accent/20 hover:shadow-lg hover:shadow-accent/30 transition-all duration-200 mt-2"
            type="submit"
            [disabled]="loading()"
          >
            @if (loading()) {
              <div class="flex items-center justify-center gap-2">
                <span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                <span>Authentification…</span>
              </div>
            } @else {
              <div class="flex items-center justify-center gap-2">
                <span>Se connecter</span>
                <mat-icon class="!h-5 !w-5 !text-[20px]">arrow_forward</mat-icon>
              </div>
            }
          </button>
        </form>

        <!-- Help Notice -->
        <div class="mt-8 text-center border-t border-slate-100 pt-6">
          <p class="text-xs text-slate-500">
            En cas de problème de connexion, contactez le support informatique de votre entreprise.
          </p>
        </div>
      </div>
    </gcc-auth-shell>
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  identifier = '';
  password = '';
  empty = { identifier: false, password: false };
  readonly showPassword = signal(false);
  readonly loading = signal(false);
  readonly error = signal<LoginError | null>(null);

  async submit(): Promise<void> {
    this.error.set(null);
    this.empty = {
      identifier: !this.identifier.trim(),
      password: !this.password.trim(),
    };
    if (this.empty.identifier || this.empty.password) {
      this.error.set({
        kind: 'validation',
        message: 'Veuillez remplir tous les champs.',
        suggestion: 'Saisissez votre identifiant et votre mot de passe.',
      });
      return;
    }

    this.loading.set(true);
    try {
      await this.auth.login(this.identifier.trim(), this.password);
      await this.router.navigateByUrl('/soft-gcc/tableau-de-bord');
    } catch (err) {
      this.error.set(
        err instanceof HttpErrorResponse
          ? loginErrorFromHttp(err)
          : {
              kind: 'auth',
              message: err instanceof Error ? err.message : 'Échec de la connexion.',
              suggestion: 'Réessayez. Si le problème persiste, contactez le support.',
            },
      );
    } finally {
      this.loading.set(false);
    }
  }
}
