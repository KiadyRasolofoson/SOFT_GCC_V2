import { Component, effect, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  CertificateHistoryItem,
  EmployeeAttestationService,
} from '../../../core/employee-attestation.service';
import { GccEmptyState } from '../../../ui/gcc-empty-state';

@Component({
  selector: 'app-employee-attestation-history',
  imports: [MatButtonModule, MatIconModule, GccEmptyState],
  template: `
    @if (!registrationNumber()) {
      <gcc-empty-state
        title="Matricule introuvable"
        message="Impossible de charger l'historique des attestations."
      />
    } @else {
      <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div class="mb-3 flex items-center justify-between">
          <h3 class="text-base font-semibold text-navy">Historique des attestations</h3>
          <button mat-stroked-button type="button" class="gcc-btn-secondary" (click)="reload()">
            <mat-icon>refresh</mat-icon>
            Actualiser
          </button>
        </div>

        @if (loading()) {
          <div class="rounded-xl border border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-500">
            Chargement de l'historique…
          </div>
        } @else if (error()) {
          <gcc-empty-state variant="error" title="Erreur" [message]="error() ?? ''" />
        } @else if (rows().length === 0) {
          <gcc-empty-state title="Aucune attestation" message="Aucune attestation trouvée pour cet employé." />
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full min-w-[720px]">
              <thead>
                <tr class="border-b border-slate-200 text-left text-xs uppercase tracking-[0.08em] text-slate-500">
                  <th class="px-2 py-2 font-semibold">Nom</th>
                  <th class="px-2 py-2 font-semibold">Date de création</th>
                  <th class="px-2 py-2 font-semibold">Statut</th>
                  <th class="px-2 py-2 font-semibold">Taille</th>
                  <th class="px-2 py-2 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (row of rows(); track row.id) {
                  <tr class="border-b border-slate-100 text-sm text-slate-700">
                    <td class="px-2 py-2">{{ row.fileName || 'Attestation.pdf' }}</td>
                    <td class="px-2 py-2">{{ formatDateTime(row.createdAt) }}</td>
                    <td class="px-2 py-2">
                      <span class="rounded-full px-2.5 py-1 text-[11px] font-semibold" [class]="statusClass(row.state)">
                        {{ statusLabel(row.state) }}
                      </span>
                    </td>
                    <td class="px-2 py-2">{{ formatSize(row.fileSize) }}</td>
                    <td class="px-2 py-2">
                      <div class="flex flex-wrap gap-2">
                        <button mat-stroked-button type="button" class="gcc-btn-secondary" (click)="viewPdf(row)">
                          <mat-icon>visibility</mat-icon>
                          Visualiser
                        </button>
                        <button mat-stroked-button type="button" class="!border-red-200 !text-red-700" (click)="deleteRow(row)">
                          <mat-icon>delete</mat-icon>
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        @if (success()) {
          <p class="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{{ success() }}</p>
        }

        @if (pdfUrl()) {
          <div class="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div class="mb-2 flex items-center justify-between">
              <p class="text-sm font-semibold text-navy">Visualisation PDF</p>
              <button mat-button type="button" (click)="closePdf()">Fermer</button>
            </div>
            <iframe [src]="pdfUrl()" class="h-[28rem] w-full rounded-lg border border-slate-200 bg-white"></iframe>
          </div>
        }
      </article>
    }
  `,
})
export class EmployeeAttestationHistoryComponent {
  private readonly service = inject(EmployeeAttestationService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly registrationNumber = input<string | null>(null);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly rows = signal<CertificateHistoryItem[]>([]);
  readonly pdfUrl = signal<SafeResourceUrl | null>(null);

  private rawPdfUrl: string | null = null;

  constructor() {
    effect(() => {
      const registration = this.registrationNumber();
      if (!registration) {
        this.rows.set([]);
        this.error.set(null);
        this.closePdf();
        return;
      }
      void this.reload();
    });
  }

  async reload(): Promise<void> {
    const registration = this.registrationNumber();
    if (!registration) return;

    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await this.service.getHistory(registration);
      this.rows.set(response);
    } catch {
      this.rows.set([]);
      this.error.set('Erreur lors du chargement de l\'historique.');
    } finally {
      this.loading.set(false);
    }
  }

  async viewPdf(row: CertificateHistoryItem): Promise<void> {
    if (!row.id) return;

    this.error.set(null);
    const blob = await this.service.getPdfBlob(row.id);
    if (!blob) {
      this.error.set('Impossible de charger le fichier PDF.');
      return;
    }

    this.closePdf();
    const url = URL.createObjectURL(blob);
    this.rawPdfUrl = url;
    this.pdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
  }

  async deleteRow(row: CertificateHistoryItem): Promise<void> {
    if (!row.id) return;

    const confirmed = confirm('Voulez-vous vraiment supprimer cette attestation ?');
    if (!confirmed) return;

    this.error.set(null);
    this.success.set(null);

    try {
      await this.service.deleteCertificate(row.id);
      this.rows.update((list) => list.filter((item) => item.id !== row.id));
      this.success.set('Attestation supprimée avec succès.');
    } catch {
      this.error.set('Échec de la suppression.');
    }
  }

  closePdf(): void {
    if (this.rawPdfUrl) {
      URL.revokeObjectURL(this.rawPdfUrl);
    }
    this.rawPdfUrl = null;
    this.pdfUrl.set(null);
  }

  statusLabel(state: number | null): string {
    if (state === 1) return 'Fichier exporté';
    if (state === 2) return 'Envoyé par email';
    return 'Inconnu';
  }

  statusClass(state: number | null): string {
    if (state === 1) return 'bg-indigo-50 text-accent';
    if (state === 2) return 'bg-slate-100 text-slate-700';
    return 'bg-slate-100 text-slate-600';
  }

  formatDateTime(value: string | null): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  formatSize(value: number | null): string {
    if (value == null) return '—';
    return `${(value / 1024).toFixed(1)} ko`;
  }
}
