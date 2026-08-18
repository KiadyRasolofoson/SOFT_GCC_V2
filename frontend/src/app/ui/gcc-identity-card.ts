import { Component, input } from '@angular/core';

@Component({
  selector: 'gcc-identity-card',
  template: `
    <article class="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
      <span class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent text-lg font-semibold text-white">
        {{ initials() }}
      </span>
      <div class="min-w-0 flex-1">
        <p class="text-xs font-semibold uppercase tracking-wider text-accent">Profil employé</p>
        <h2 class="mt-0.5 truncate text-xl font-semibold text-navy">{{ name() }}</h2>
        <p class="mt-1 text-sm text-slate-500">
          {{ role() }} · {{ department() }}
        </p>
      </div>
      <dl class="grid grid-cols-2 gap-x-8 gap-y-1 text-sm sm:text-right">
        <dt class="text-slate-500">Matricule</dt>
        <dd class="tabular font-medium text-navy">{{ matricule() }}</dd>
        <dt class="text-slate-500">Ancienneté</dt>
        <dd class="tabular font-medium text-navy">{{ seniority() }}</dd>
      </dl>
    </article>
  `,
})
export class GccIdentityCard {
  name = input('Marie Rasoanaivo');
  role = input('Analyste RH');
  department = input('Ressources Humaines');
  matricule = input('EMP-1042');
  seniority = input('6 ans');
  initials = input('MR');
}
