import { Component, input } from '@angular/core';
import { EmployeeFicheProfile } from '../../../core/employee-fiche.models';

@Component({
  selector: 'app-employee-infos-panel',
  template: `
    @if (!profile()) {
      <div class="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Aucune information disponible.
      </div>
    } @else if (profile(); as profile) {
      <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="mb-4 flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <h2 class="text-lg font-semibold text-navy">Informations principales</h2>
          <span class="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-accent">
            {{ profile.positionName || 'Profil RH' }}
          </span>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          @for (field of fields(profile); track field.label) {
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">{{ field.label }}</p>
              <p class="mt-2 text-base font-semibold text-navy">{{ field.value }}</p>
            </div>
          }
        </div>
      </section>
    }
  `,
})
export class EmployeeInfosPanelComponent {
  readonly profile = input<EmployeeFicheProfile | null>(null);

  fields(profile: EmployeeFicheProfile): Array<{ label: string; value: string }> {
    const fullName = [profile.name, profile.firstName].filter(Boolean).join(' ').trim();

    return [
      { label: 'Employé', value: fullName || '—' },
      { label: 'Matricule', value: profile.registrationNumber || '—' },
      { label: 'Date de naissance', value: this.formatDate(profile.birthday) },
      { label: 'Date d\'embauche', value: this.formatDate(profile.hiringDate) },
      { label: 'Département', value: profile.departmentName || '—' },
      { label: 'Poste actuel', value: profile.positionName || '—' },
      { label: 'Salaire de base', value: this.formatCurrency(profile.baseSalary) },
      { label: 'Salaire net', value: this.formatCurrency(profile.netSalary) },
      { label: 'Email', value: profile.email || '—' },
      { label: 'Dernière mise à jour compétences', value: this.formatDate(profile.updatedDate) },
      { label: 'Compétences', value: String(profile.skillNumber ?? 0) },
      { label: 'Diplômes & formations', value: String(profile.educationNumber ?? 0) },
      { label: 'Langues', value: String(profile.languageNumber ?? 0) },
      { label: 'Autres formations', value: String(profile.otherFormationNumber ?? 0) },
    ];
  }

  private formatDate(value: string | null | undefined): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  private formatCurrency(value: number | string | null | undefined): string {
    if (value == null || value === '') return '—';
    const amount = Number(value);
    if (!Number.isFinite(amount)) return String(value);
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(amount);
  }
}
