import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'gcc-auth-shell',
  imports: [MatIconModule],
  template: `
    <div class="grid min-h-screen overflow-hidden bg-slate-50 lg:grid-cols-12">
      <!-- Left Hero Panel (Large screens) -->
      <section
        class="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-950 via-navy to-indigo-950 p-12 text-white lg:col-span-5 lg:flex xl:col-span-6"
      >
        <!-- Background Ambient Glow Effects -->
        <div class="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-accent/20 blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none"></div>

        <!-- Brand Header -->
        <div class="relative z-10">
          <div class="inline-flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-2 backdrop-blur-md border border-white/10 shadow-lg">
            <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-accent to-indigo-400 font-extrabold text-white text-base shadow-md">
              G
            </span>
            <div>
              <p class="text-sm font-bold tracking-wider text-white">SOFT GCC</p>
              <p class="text-[10px] font-medium uppercase tracking-widest text-indigo-200">Gestion de Carrières & Compétences</p>
            </div>
          </div>

          <h2 class="mt-12 max-w-lg text-3xl font-extrabold leading-tight tracking-tight text-white xl:text-4xl">
            Stabilité des données RH, clarté des parcours.
          </h2>
          <p class="mt-4 max-w-lg text-sm leading-relaxed text-slate-300/90 font-normal">
            Un espace unifié et performant pour orchestrer vos référentiels de compétences, piloter les mobilités et réussir les campagnes d’évaluation RH.
          </p>

          <!-- Feature Highlights -->
          <div class="mt-10 grid gap-4 max-w-md">
            <div class="flex items-center gap-3.5 rounded-xl bg-white/5 p-3.5 backdrop-blur-xs border border-white/10">
              <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/20 text-accent-violet">
                <mat-icon class="!h-5 !w-5 !text-[20px]">verified</mat-icon>
              </div>
              <div class="text-xs">
                <p class="font-semibold text-white">Référentiel de Compétences</p>
                <p class="text-slate-400">Cartographie précise et mise à jour dynamique</p>
              </div>
            </div>

            <div class="flex items-center gap-3.5 rounded-xl bg-white/5 p-3.5 backdrop-blur-xs border border-white/10">
              <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                <mat-icon class="!h-5 !w-5 !text-[20px]">trending_up</mat-icon>
              </div>
              <div class="text-xs">
                <p class="font-semibold text-white">Plans de Carrière & Évolution</p>
                <p class="text-slate-400">Analyse des écarts et projection de postes</p>
              </div>
            </div>

            <div class="flex items-center gap-3.5 rounded-xl bg-white/5 p-3.5 backdrop-blur-xs border border-white/10">
              <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                <mat-icon class="!h-5 !w-5 !text-[20px]">insights</mat-icon>
              </div>
              <div class="text-xs">
                <p class="font-semibold text-white">Indicateurs RH Temps Réel</p>
                <p class="text-slate-400">Tableaux de bord consolidés pour la direction</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Info -->
        <div class="relative z-10 flex items-center justify-between pt-8 text-xs text-slate-400 border-t border-white/10">
          <span>v2.0 · Édition Entreprise</span>
          <span class="flex items-center gap-1.5">
            <span class="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Plateforme sécurisée
          </span>
        </div>
      </section>

      <!-- Right Form Section -->
      <section class="flex items-center justify-center bg-canvas p-6 sm:p-12 lg:col-span-7 xl:col-span-6">
        <ng-content />
      </section>
    </div>
  `,
})
export class GccAuthShell {}
