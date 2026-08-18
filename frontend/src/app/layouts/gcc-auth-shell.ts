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

        <!-- Brand Header (Centered Vertically, Left Aligned) -->
        <div class="relative z-10 my-auto flex flex-col items-start text-left">
          <img src="assets/logo/logo.png" alt="SoftTalent" class="h-24 sm:h-28 xl:h-32 w-auto object-contain" />

          <h2 class="mt-8 max-w-lg text-2xl font-extrabold leading-tight tracking-tight text-white xl:text-3xl">
            Stabilité des données RH, clarté des parcours.
          </h2>
          <p class="mt-4 max-w-lg text-sm leading-relaxed text-slate-300/90 font-normal">
            Un espace unifié et performant pour orchestrer vos référentiels de compétences, piloter les mobilités et réussir les campagnes d’évaluation RH.
          </p>
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
