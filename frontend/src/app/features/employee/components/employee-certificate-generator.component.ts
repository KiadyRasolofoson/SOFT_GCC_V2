import { Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { EmployeeAttestationService } from '../../../core/employee-attestation.service';
import { GccEmptyState } from '../../../ui/gcc-empty-state';
import { GccSelect } from '../../../ui/gcc-select';

type JsonObject = Record<string, any>;

@Component({
  selector: 'app-employee-certificate-generator',
  imports: [FormsModule, MatButtonModule, MatIconModule, GccSelect, GccEmptyState],
  template: `
    @if (!registrationNumber()) {
      <gcc-empty-state
        title="Matricule introuvable"
        message="Impossible de générer une attestation sans matricule employé."
      />
    } @else {
      <section class="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-base font-semibold text-navy">Génération d'attestation</h3>
            <button mat-stroked-button type="button" class="gcc-btn-secondary" (click)="regenerateReference()">
              <mat-icon>autorenew</mat-icon>
              Nouvelle référence
            </button>
          </div>

          @if (loading()) {
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-500">
              Chargement du formulaire…
            </div>
          } @else {
            <div class="grid gap-3 md:grid-cols-2">
              <label class="flex flex-col gap-1">
                <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Référence</span>
                <input
                  type="text"
                  class="h-10 rounded-xl border border-slate-200 px-3 text-sm text-navy outline-none"
                  [(ngModel)]="reference"
                />
              </label>

              <label class="flex flex-col gap-1">
                <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Type d'attestation</span>
                <gcc-select [options]="certificateTypeOptions()" [(value)]="certificateTypeId" placeholder="Sélectionner" />
              </label>

              <label class="flex flex-col gap-1">
                <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Date</span>
                <input
                  type="date"
                  class="h-10 rounded-xl border border-slate-200 px-3 text-sm text-navy outline-none"
                  [(ngModel)]="issueDate"
                />
              </label>

              <label class="flex flex-col gap-1">
                <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Lieu</span>
                <input
                  type="text"
                  class="h-10 rounded-xl border border-slate-200 px-3 text-sm text-navy outline-none"
                  [(ngModel)]="place"
                  placeholder="Antananarivo"
                />
              </label>

              <label class="flex flex-col gap-1 md:col-span-2">
                <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Motif</span>
                <input
                  type="text"
                  class="h-10 rounded-xl border border-slate-200 px-3 text-sm text-navy outline-none"
                  [(ngModel)]="reason"
                  placeholder="Attestation de travail"
                />
              </label>

              <label class="flex flex-col gap-1">
                <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Nom signataire</span>
                <input
                  type="text"
                  class="h-10 rounded-xl border border-slate-200 px-3 text-sm text-navy outline-none"
                  [(ngModel)]="signatoryName"
                />
              </label>

              <label class="flex flex-col gap-1">
                <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Poste signataire</span>
                <input
                  type="text"
                  class="h-10 rounded-xl border border-slate-200 px-3 text-sm text-navy outline-none"
                  [(ngModel)]="signatoryPosition"
                />
              </label>

              <label class="flex flex-col gap-1 md:col-span-2">
                <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Fichier PDF</span>
                <input
                  type="file"
                  accept="application/pdf"
                  class="h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm text-navy"
                  (change)="onFileSelected($event)"
                />
                @if (selectedFileName()) {
                  <span class="text-xs text-slate-500">Fichier sélectionné: {{ selectedFileName() }}</span>
                }
              </label>

              <label class="flex flex-col gap-1 md:col-span-2">
                <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Email destinataire</span>
                <input
                  type="email"
                  class="h-10 rounded-xl border border-slate-200 px-3 text-sm text-navy outline-none"
                  [(ngModel)]="recipientEmail"
                  placeholder="email@entreprise.com"
                />
              </label>
            </div>

            @if (error()) {
              <p class="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{{ error() }}</p>
            }
            @if (success()) {
              <p class="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{{ success() }}</p>
            }

            <div class="mt-4 flex flex-wrap gap-2">
              <button mat-flat-button type="button" class="gcc-btn-primary" (click)="saveExported()" [disabled]="saving()">
                <mat-icon>save</mat-icon>
                Enregistrer fichier exporté
              </button>
              <button mat-stroked-button type="button" class="gcc-btn-secondary" (click)="saveAndSend()" [disabled]="saving()">
                <mat-icon>send</mat-icon>
                Enregistrer et envoyer par email
              </button>
            </div>
          }
        </article>

        <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 class="mb-3 text-base font-semibold text-navy">Aperçu attestation</h3>
          <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p>
              Nous attestons que <strong>{{ fullName() }}</strong>, matricule <strong>{{ registrationNumber() }}</strong>,
              occupe le poste de <strong>{{ positionName() || '—' }}</strong>
              depuis le <strong>{{ hiringDateLabel() }}</strong>.
            </p>
            <p class="mt-2">
              Cette attestation est délivrée pour <strong>{{ reason || 'attester la situation professionnelle' }}</strong>.
            </p>
            <p class="mt-2">
              Fait à <strong>{{ place || '—' }}</strong>, le <strong>{{ formatDate(issueDate) }}</strong>.
            </p>
            <p class="mt-4">
              Signataire: <strong>{{ signatoryName || '—' }}</strong> ({{ signatoryPosition || '—' }})
            </p>
            <p class="mt-2 text-xs text-slate-500">Référence: {{ reference || '—' }}</p>
          </div>
        </article>
      </section>
    }
  `,
})
export class EmployeeCertificateGeneratorComponent {
  private readonly service = inject(EmployeeAttestationService);

  readonly registrationNumber = input<string | null>(null);
  readonly careerSummary = input<JsonObject | null>(null);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly selectedFileName = signal<string | null>(null);

  readonly certificateTypeOptions = signal<{ label: string; value: string }[]>([]);

  reference = '';
  certificateTypeId: string | null = null;
  issueDate = this.toInputDate(new Date());
  place = '';
  reason = 'Attestation de travail';
  signatoryName = '';
  signatoryPosition = '';
  recipientEmail = '';

  private selectedFile: File | null = null;

  constructor() {
    void this.initialize();
  }

  fullName(): string {
    const data = this.careerSummary();
    return [data?.['firstName'], data?.['name']].filter(Boolean).join(' ').trim() || 'Employé';
  }

  positionName(): string {
    return String(this.careerSummary()?.['positionName'] ?? '');
  }

  hiringDateLabel(): string {
    return this.formatDate(this.careerSummary()?.['hiringDate'] ?? this.careerSummary()?.['assignmentDate']);
  }

  async regenerateReference(): Promise<void> {
    this.reference = await this.service.generateReference();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (file && file.type !== 'application/pdf') {
      this.error.set('Le fichier doit être au format PDF.');
      this.selectedFile = null;
      this.selectedFileName.set(null);
      return;
    }

    this.selectedFile = file;
    this.selectedFileName.set(file?.name ?? null);
    this.error.set(null);
  }

  async saveExported(): Promise<void> {
    await this.save(1, false);
  }

  async saveAndSend(): Promise<void> {
    await this.save(2, true);
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(date);
  }

  private async initialize(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const [types, reference] = await Promise.all([
        this.service.loadCertificateTypes(),
        this.service.generateReference(),
      ]);

      this.certificateTypeOptions.set(
        types.map((item) => ({
          label: item.certificateTypeName,
          value: String(item.certificateTypeId),
        })),
      );

      this.certificateTypeId =
        this.certificateTypeOptions().length > 0 ? this.certificateTypeOptions()[0].value : null;
      this.reference = reference;
      this.place = String(this.careerSummary()?.['workLocation'] ?? '');
      this.recipientEmail = String(this.careerSummary()?.['email'] ?? '');
    } catch {
      this.error.set('Impossible de préparer le formulaire d\'attestation.');
    } finally {
      this.loading.set(false);
    }
  }

  private async save(state: number, sendEmail: boolean): Promise<void> {
    this.error.set(null);
    this.success.set(null);

    if (!this.registrationNumber()) {
      this.error.set('Matricule introuvable.');
      return;
    }
    if (!this.certificateTypeId) {
      this.error.set('Veuillez sélectionner un type d\'attestation.');
      return;
    }
    if (!this.reference.trim()) {
      this.error.set('La référence est obligatoire.');
      return;
    }
    if (!this.selectedFile) {
      this.error.set('Veuillez sélectionner un fichier PDF avant enregistrement.');
      return;
    }

    const token = crypto.randomUUID().replaceAll('-', '');
    this.saving.set(true);

    try {
      await this.service.saveCertificate({
        file: this.selectedFile,
        registrationNumber: this.registrationNumber()!,
        certificateTypeId: Number(this.certificateTypeId),
        reference: this.reference.trim(),
        state,
        token,
      });

      if (sendEmail) {
        if (!this.recipientEmail) {
          this.error.set('Aucun email destinataire.');
          return;
        }
        const base64Pdf = await this.toBase64(this.selectedFile);
        await this.service.sendCertificateEmail({
          recipientEmail: this.recipientEmail,
          subject: this.selectedTypeLabel() || 'Attestation',
          body: `<p>Bonjour,</p><p>Veuillez trouver ci-joint votre attestation (${this.reference}).</p>`,
          fileName: this.selectedFile.name,
          base64Pdf,
        });
      }

      this.success.set(sendEmail ? 'Attestation enregistrée et envoyée par email.' : 'Attestation enregistrée.');
      this.selectedFile = null;
      this.selectedFileName.set(null);
      this.reference = await this.service.generateReference();
    } catch (error: any) {
      const message = typeof error?.error === 'string' ? error.error : null;
      this.error.set(message || 'Erreur lors de l\'enregistrement de l\'attestation.');
    } finally {
      this.saving.set(false);
    }
  }

  private selectedTypeLabel(): string {
    const current = this.certificateTypeOptions().find((item) => item.value === this.certificateTypeId);
    return current?.label ?? '';
  }

  private async toBase64(file: File): Promise<string> {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result ?? '');
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  private toInputDate(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}
