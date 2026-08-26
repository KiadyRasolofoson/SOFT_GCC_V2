import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { GccPageHeader } from '../../ui/gcc-page-header';
import { EvaluationPortalService } from './evaluation-portal.service';
import { EvaluationPortalSession } from './evaluation-portal-session';

interface PortalLoginError {
  message: string;
  suggestion: string;
}

@Component({
  selector: 'app-evaluation-login-page',
  imports: [FormsModule, GccPageHeader, MatButtonModule, MatIconModule],
  host: { class: 'flex min-h-full flex-1 flex-col' },
  template: `
    <gcc-page-header
      title="Auto-évaluation"
      subtitle="Saisissez les identifiants temporaires reçus pour accéder au questionnaire."
      icon="quiz"
    />

    <div class="flex flex-1 items-start justify-center sm:items-center">
      <div
        class="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-8"
      >
        @if (error(); as err) {
          <div class="mb-6 rounded-xl border border-amber-200/80 bg-amber-50/80 p-4 text-xs text-amber-900">
            <div class="flex items-start gap-3">
              <mat-icon class="mt-0.5 !h-5 !w-5 shrink-0 !text-[20px] text-amber-600">warning</mat-icon>
              <div class="min-w-0">
                <p class="font-bold text-amber-900">{{ err.message }}</p>
                <p class="mt-1 leading-relaxed text-amber-700/90">{{ err.suggestion }}</p>
              </div>
            </div>
          </div>
        }

        <form (ngSubmit)="submit()" novalidate class="space-y-5">
          <div>
            <label class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600" for="tempLogin">
              Identifiant temporaire
            </label>
            <div class="relative flex items-center">
              <span class="pointer-events-none absolute left-3.5 flex items-center text-slate-400">
                <mat-icon class="!h-5 !w-5 !text-[20px]">person</mat-icon>
              </span>
              <input
                id="tempLogin"
                name="tempLogin"
                class="gcc-input !h-11 !rounded-xl !pl-11 !text-sm"
                placeholder="Identifiant fourni par RH"
                [(ngModel)]="tempLogin"
                autocomplete="username"
              />
            </div>
            @if (empty.tempLogin) {
              <p class="mt-1 flex items-center gap-1 text-xs font-medium text-amber-600">
                <mat-icon class="!h-3.5 !w-3.5 !text-[14px]">error_outline</mat-icon>
                Ce champ est requis
              </p>
            }
          </div>

          <div>
            <label class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600" for="tempPassword">
              Mot de passe temporaire
            </label>
            <div class="relative flex items-center">
              <span class="pointer-events-none absolute left-3.5 flex items-center text-slate-400">
                <mat-icon class="!h-5 !w-5 !text-[20px]">lock</mat-icon>
              </span>
              <input
                id="tempPassword"
                name="tempPassword"
                class="gcc-input !h-11 !rounded-xl !pl-11 !pr-11 !text-sm"
                [type]="showPassword() ? 'text' : 'password'"
                placeholder="Mot de passe fourni par RH"
                [(ngModel)]="tempPassword"
                autocomplete="current-password"
              />
              <button
                type="button"
                class="absolute right-2 flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                (click)="showPassword.set(!showPassword())"
                [attr.aria-label]="showPassword() ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
              >
                <mat-icon class="!h-5 !w-5 !text-[20px]">
                  {{ showPassword() ? 'visibility_off' : 'visibility' }}
                </mat-icon>
              </button>
            </div>
            @if (empty.tempPassword) {
              <p class="mt-1 flex items-center gap-1 text-xs font-medium text-amber-600">
                <mat-icon class="!h-3.5 !w-3.5 !text-[14px]">error_outline</mat-icon>
                Ce champ est requis
              </p>
            }
          </div>

          <button
            mat-flat-button
            class="gcc-btn-primary mt-2 !h-11 !w-full !rounded-xl !text-sm !font-bold"
            type="submit"
            [disabled]="loading()"
          >
            @if (loading()) {
              <span class="flex items-center justify-center gap-2">
                <span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                Connexion…
              </span>
            } @else {
              Accéder au questionnaire
            }
          </button>
        </form>

        <p class="mt-6 flex items-center justify-center gap-1.5 border-t border-slate-100 pt-4 text-[11px] text-slate-400">
          <span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
          Session sécurisée · identifiants à usage unique
        </p>
      </div>
    </div>
  `,
})
export class EvaluationLoginPage implements OnInit {
  private readonly portal = inject(EvaluationPortalService);
  private readonly session = inject(EvaluationPortalSession);
  private readonly router = inject(Router);

  tempLogin = '';
  tempPassword = '';
  empty = { tempLogin: false, tempPassword: false };
  readonly showPassword = signal(false);
  readonly loading = signal(false);
  readonly error = signal<PortalLoginError | null>(null);

  ngOnInit(): void {
    this.session.resetChrome();
    this.session.setCampaignTitle('Connexion au questionnaire');
  }

  async submit(): Promise<void> {
    this.error.set(null);
    this.empty = {
      tempLogin: !this.tempLogin.trim(),
      tempPassword: !this.tempPassword.trim(),
    };
    if (this.empty.tempLogin || this.empty.tempPassword) {
      this.error.set({
        message: 'Veuillez renseigner vos identifiants temporaires.',
        suggestion: 'Ils figurent dans le message envoyé par les ressources humaines.',
      });
      return;
    }

    this.loading.set(true);
    try {
      const result = await firstValueFrom(
        this.portal.login(this.tempLogin.trim(), this.tempPassword.trim()),
      );
      const token = result?.token?.trim();
      const evaluationId = Number(result?.evaluationId);
      if (!result?.success || !token || !Number.isFinite(evaluationId) || evaluationId <= 0) {
        this.error.set({
          message: result?.message || 'Identifiants invalides ou expirés.',
          suggestion: 'Vérifiez le couple identifiant / mot de passe. Un compte déjà utilisé ne peut plus se connecter.',
        });
        return;
      }
      this.session.persist(token, evaluationId);
      await this.router.navigateByUrl('/soft-gcc/evaluation/questionnaire');
    } catch (err) {
      this.error.set(portalLoginError(err));
    } finally {
      this.loading.set(false);
    }
  }
}

function portalLoginError(err: unknown): PortalLoginError {
  if (!(err instanceof HttpErrorResponse)) {
    return {
      message: 'Une erreur inattendue est survenue.',
      suggestion: 'Réessayez. Si le problème persiste, contactez les ressources humaines.',
    };
  }
  if (err.status === 0) {
    return {
      message: 'Impossible de vous connecter. Le serveur est injoignable.',
      suggestion: 'Vérifiez votre connexion puis réessayez.',
    };
  }
  const message = serverMessage(err);
  if (err.status === 403) {
    return {
      message: message || 'Cette évaluation n’est pas accessible pour le moment.',
      suggestion:
        'La campagne n’a pas encore commencé ou la période est terminée. Contactez les ressources humaines si besoin.',
    };
  }
  if (err.status === 404) {
    return {
      message: message || 'Évaluation non trouvée.',
      suggestion: 'Vérifiez vos identifiants ou demandez un nouveau compte temporaire.',
    };
  }
  if (err.status === 401) {
    return {
      message: message || 'Identifiants invalides ou expirés.',
      suggestion: 'Vérifiez le couple identifiant / mot de passe. Un compte déjà utilisé ne peut plus se connecter.',
    };
  }
  return {
    message: message || 'Impossible de vous connecter en raison d’une erreur du serveur.',
    suggestion: 'Réessayez dans quelques instants.',
  };
}

function serverMessage(err: HttpErrorResponse): string {
  const data = err.error;
  if (typeof data === 'string' && data.trim()) return data.trim();
  if (data && typeof data === 'object') {
    const msg = (data as { message?: string; Message?: string }).message
      ?? (data as { Message?: string }).Message;
    if (typeof msg === 'string' && msg.trim()) return msg.trim();
  }
  return '';
}
