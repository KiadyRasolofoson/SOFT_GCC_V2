import { Component, computed, inject, input, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../../../environments/environment';
import { CertificateTypeItem, EmployeeAttestationService, EstablishmentInfo } from '../../../core/employee-attestation.service';
import { GccEmptyState } from '../../../ui/gcc-empty-state';
import { AttestationFormComponent } from './attestation-form.component';
import { AttestationPreviewPanelComponent } from './attestation-preview-panel.component';
import {
  ATTESTATION_VARIABLES,
  CompanyInfo,
  createAttestationForm,
  EMPTY_COMPANY,
  FALLBACK_EMAIL,
  JsonObject,
} from './attestation.constants';
import { downloadBlob, generateAttestationPdf, newToken, pdfToFile, toBase64 } from './attestation-pdf.util';

@Component({
  selector: 'app-employee-certificate-generator',
  imports: [MatButtonModule, MatIconModule, GccEmptyState, AttestationFormComponent, AttestationPreviewPanelComponent],
  template: `
    @if (!registrationNumber()) {
      <gcc-empty-state
        title="Matricule introuvable"
        message="Impossible de générer une attestation sans matricule employé."
      />
    } @else {
      @if (loading()) {
        <div class="rounded-xl border border-slate-200 bg-white p-5 text-center text-sm text-slate-500 shadow-sm">
          Chargement du formulaire…
        </div>
      } @else {
        <section class="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
          <!-- Colonne formulaire -->
          <app-attestation-form
            [form]="form"
            [certificateTypes]="certificateTypes()"
            [variables]="variables"
            [error]="error()"
            [uploading]="uploading()"
            [sending]="sending()"
            [errorUpload]="errorUpload()"
            [uploadSuccess]="uploadSuccess()"
            [sendError]="sendError()"
            [sendSuccess]="sendSuccess()"
            [info]="info()"
            [showPreview]="showPreview()"
            (regenerateReference)="regenerateReference()"
            (previewToggle)="togglePreview()"
            (exportPdf)="handleExportPDF()"
            (send)="handleSend()"
            (reset)="resetForm()"
          />

          <!-- Colonne aperçu -->
          <app-attestation-preview-panel
            [showPreview]="showPreview()"
            [logo]="form.logoPreview"
            [title]="form.certificateTypeName"
            [reference]="form.reference"
            [sections]="form.sections"
            [reason]="form.reason"
            [place]="form.place"
            [date]="form.date"
            [signatoryPosition]="form.signatoryPosition"
            [signatoryName]="form.signatoryName"
            [companyInfo]="companyInfo()"
            [qrValue]="qrValue()"
            [careerSummary]="careerSummary()"
            (previewToggle)="togglePreview()"
            (requestShow)="showPreview.set(true)"
          />
        </section>
      }
    }
  `,
})
export class EmployeeCertificateGeneratorComponent {
  private readonly service = inject(EmployeeAttestationService);

  readonly registrationNumber = input<string | null>(null);
  readonly careerSummary = input<JsonObject | null>(null);

  private readonly previewComp = viewChild(AttestationPreviewPanelComponent);

  readonly loading = signal(true);
  readonly uploading = signal(false);
  readonly sending = signal(false);
  readonly error = signal<string | null>(null);
  readonly errorUpload = signal<string | null>(null);
  readonly uploadSuccess = signal<string | null>(null);
  readonly sendError = signal<string | null>(null);
  readonly sendSuccess = signal(false);
  readonly info = signal<string | null>(null);

  readonly certificateTypes = signal<CertificateTypeItem[]>([]);
  readonly companyInfo = signal<CompanyInfo>(EMPTY_COMPANY);
  readonly showPreview = signal(false);
  readonly variables = ATTESTATION_VARIABLES;

  /** Modèle mutable du document, partagé entre le formulaire et l'aperçu. */
  readonly form = createAttestationForm();

  /** Jeton du document courant : partagé entre l'aperçu (QR) et l'enregistrement, régénéré après chaque succès. */
  private readonly token = signal(newToken());

  readonly qrValue = computed(() => `${environment.apiUrl}/verify/${this.token()}`);

  constructor() {
    void this.initialize();
  }

  async regenerateReference(): Promise<void> {
    this.form.reference = await this.service.generateReference();
  }

  togglePreview(): void {
    this.showPreview.update((value) => !value);
    this.info.set(null);
  }

  async handleExportPDF(): Promise<void> {
    this.errorUpload.set(null);
    this.uploadSuccess.set(null);
    this.info.set(null);

    if (!this.registrationNumber() || !this.form.certificateTypeId || !this.form.reference.trim()) {
      this.errorUpload.set('Certains champs obligatoires sont manquants pour l’enregistrement.');
      return;
    }
    if (!this.showPreview()) {
      this.info.set('Veuillez cliquer d’abord sur le bouton « Voir l’aperçu »');
      return;
    }

    try {
      const blob = await this.generatePdfBlob();
      const file = pdfToFile(blob, this.form.reference.trim());
      const uploaded = await this.handleUpload(file, 1, this.token());
      if (uploaded) {
        downloadBlob(blob, file.name);
      }
    } catch (err: any) {
      this.errorUpload.set(`Erreur lors de l'export PDF : ${err?.message ?? 'erreur inconnue'}`);
    }
  }

  async handleSend(): Promise<void> {
    this.sending.set(true);
    this.sendError.set(null);
    this.sendSuccess.set(false);
    this.errorUpload.set(null);
    this.info.set(null);

    try {
      if (!this.registrationNumber() || !this.form.certificateTypeId || !this.form.reference.trim()) {
        this.errorUpload.set('Certains champs obligatoires sont manquants pour l’enregistrement.');
        return;
      }
      if (!this.showPreview()) {
        this.info.set('Veuillez cliquer d’abord sur le bouton « Voir l’aperçu »');
        return;
      }

      const blob = await this.generatePdfBlob();
      const file = pdfToFile(blob, this.form.reference.trim());

      const uploaded = await this.handleUpload(file, 2, this.token());
      if (!uploaded) return; // stoppe si l'upload a échoué

      const recipient = String(this.careerSummary()?.['email'] ?? '') || FALLBACK_EMAIL;
      const data = this.careerSummary() ?? {};
      await this.service.sendCertificateEmail({
        recipientEmail: recipient,
        subject: this.form.certificateTypeName || 'Attestation',
        body: `<p>Bonjour ${data['civiliteName'] ?? ''} ${data['firstName'] ?? ''} ${data['name'] ?? ''},<br/>Veuillez trouver ci-joint votre attestation de travail.</p>`,
        fileName: file.name,
        base64Pdf: await toBase64(file),
      });

      this.sendSuccess.set(true);
      this.sendError.set(null);
    } catch {
      this.sendError.set("Une erreur s'est produite lors de l'envoi de l'attestation.");
    } finally {
      this.sending.set(false);
    }
  }

  async resetForm(): Promise<void> {
    await this.resetAboutModel();
    this.showPreview.set(false);
    this.info.set(null);
    this.errorUpload.set(null);
    this.uploadSuccess.set(null);
    this.sendError.set(null);
    this.sendSuccess.set(false);
  }

  private async initialize(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const establishmentId = Number(this.careerSummary()?.['establishmentId'] ?? 0) || null;
      const [establishment, types, reference] = await Promise.all([
        this.service.loadEstablishment(establishmentId),
        this.service.loadCertificateTypes(),
        this.service.generateReference(),
      ]);

      this.certificateTypes.set(types);
      this.form.reference = reference;
      this.form.place = String(this.careerSummary()?.['workLocation'] ?? '');
      this.companyInfo.set(this.toCompanyInfo(establishment));
    } catch {
      this.error.set('Erreur lors de la récupération des données.');
    } finally {
      this.loading.set(false);
    }
  }

  private toCompanyInfo(establishment: EstablishmentInfo | null): CompanyInfo {
    if (!establishment) return EMPTY_COMPANY;
    return {
      nom: establishment.establishmentName ?? '',
      adresse: establishment.address ?? '',
      telephone: establishment.phoneNumber ?? '',
      email: establishment.email ?? '',
      site: establishment.website ?? '',
      reseaux: establishment.socialMedia ?? '',
    };
  }

  private async resetAboutModel(): Promise<void> {
    this.form.certificateTypeId = null;
    this.form.certificateTypeName = '';
    this.form.place = '';
    this.form.date = '';
    this.form.reason = '';
    this.form.signatoryPosition = '';
    this.form.signatoryName = '';
    this.form.logoPreview = null;
    this.token.set(newToken());
    this.form.reference = await this.service.generateReference();
  }

  private async generatePdfBlob(): Promise<Blob> {
    const element = this.previewComp()?.previewElement();
    if (!element) {
      throw new Error('Aperçu introuvable');
    }
    return generateAttestationPdf(element);
  }

  private async handleUpload(file: File, state: number, token: string): Promise<boolean> {
    if (!file) {
      this.errorUpload.set('Aucun fichier sélectionné.');
      return false;
    }
    this.uploading.set(true);
    this.uploadSuccess.set(null);
    this.errorUpload.set(null);

    try {
      await this.service.saveCertificate({
        file,
        registrationNumber: this.registrationNumber()!,
        certificateTypeId: Number(this.form.certificateTypeId),
        reference: this.form.reference.trim(),
        state,
        token,
      });
      this.uploadSuccess.set(
        state === 1 ? 'PDF exporté et enregistré avec succès.' : 'PDF enregistré avec succès.',
      );
      await this.resetAboutModel();
      return true;
    } catch (err: any) {
      this.errorUpload.set(this.uploadErrorMessage(err));
      return false;
    } finally {
      this.uploading.set(false);
    }
  }

    private uploadErrorMessage(err: any): string {
    if (!err) {
      return "Erreur inconnue lors de l'enregistrement. Veuillez réessayer.";
    }
    console.error('[Attestation] Échec de l\'enregistrement', err);

    const status = err?.status;
    if (status === 409) {
      return 'Erreur : référence ou jeton déjà utilisé pour une autre attestation.';
    }
    if (status === 400) {
      return 'Erreur : fichier PDF invalide ou informations manquantes.';
    }
    if (status === 404) {
      return 'Erreur : employé introuvable pour cet enregistrement.';
    }
    if (status === 401) {
      return 'Erreur : session expirée, veuillez vous reconnecter.';
    }
    if (status === 403) {
      return 'Erreur : permissions insuffisantes pour enregistrer une attestation.';
    }
    if (status === 0) {
      return 'Impossible de joindre le serveur (réseau/CORS). Vérifiez que le backend est démarré.';
    }

    // const body = err?.error;
    // if (typeof body === 'string' && body.trim()) {
    //   return `Erreur serveur : ${body.trim()}`;
    // }
    // if (body && typeof body === 'object') {
    //   const msg = body.message ?? body.Message ?? body.title ?? body.detail ?? body.error;
    //   if (typeof msg === 'string' && msg.trim()) {
    //     return `Erreur serveur : ${msg.trim()}`;
    //   }
    //   if (body.traceId) {
    //     return `Erreur serveur (trace ${body.traceId}). Consultez les logs du serveur.`;
    //   }
    // }
    return "Erreur inconnue lors de l'enregistrement. Veuillez réessayer.";
  }
}
