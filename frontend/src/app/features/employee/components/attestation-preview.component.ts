import { Component, ElementRef, input, viewChild } from '@angular/core';
import { GccQrCode } from '../../../ui/gcc-qr-code';
import { AttestationSection, CompanyInfo, EMPTY_COMPANY, JsonObject } from './attestation.constants';

/**
 * Aperçu du document d'attestation (composant purement visuel).
 * Expose l'élément DOM via `previewElement()` pour l'export PDF.
 */
@Component({
  selector: 'app-attestation-preview',
  imports: [GccQrCode],
  host: { class: 'block' },
  styles: [
    `
      .att-preview-doc {
        line-height: 1.55;
      }
      .att-preview-doc h1 {
        font-size: 1.25rem;
        font-weight: 700;
        margin: 0.5rem 0;
      }
      .att-preview-doc h2 {
        font-size: 1.05rem;
        font-weight: 700;
        margin: 0.5rem 0;
      }
      .att-preview-doc p {
        margin: 0.35rem 0;
      }
      .att-preview-doc ul {
        list-style: disc;
        padding-left: 1.25rem;
        margin: 0.35rem 0;
      }
      .att-preview-doc ol {
        list-style: decimal;
        padding-left: 1.25rem;
        margin: 0.35rem 0;
      }
      .att-preview-doc a {
        color: #6366f1;
        text-decoration: underline;
      }
    `,
  ],
  template: `
    <div #previewDoc class="att-preview-doc rounded-xl border border-[#E2E8F0] bg-white p-8 text-sm text-[#0F172A]">
      @if (logo(); as logo) {
        <div class="mb-3 text-left">
          <img [src]="logo" alt="Logo" style="width: 140px; object-fit: contain" />
        </div>
      }

      <p class="mb-3 text-center text-lg font-bold">{{ title() || 'Attestation' }}</p>

      <p class="mb-3">
        <strong style="text-decoration: underline">Ref</strong> : {{ reference() }}
      </p>

      @for (section of sections(); track section.id) {
        <div class="mb-3 text-justify" [innerHTML]="replaceVariables(section.content)"></div>
      }

      <div class="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p>
            <strong style="text-decoration: underline">Motif</strong> : <strong>{{ reason() }}</strong>
          </p>
          <div class="mt-4 flex justify-center">
            <gcc-qr-code [value]="qrValue()" [size]="120" />
          </div>
        </div>
        <div class="text-right">
          <p>
            Fait à <strong>{{ place() }}</strong>, le <strong>{{ formatDate(date()) }}</strong>
          </p>
          <p><strong>{{ signatoryPosition() }}</strong></p>
          <p class="mt-6" style="padding-top: 40px"><strong>{{ signatoryName() }}</strong></p>
        </div>
      </div>

      <footer class="mt-6 border-t border-[#E2E8F0] pt-3 text-xs text-[#334155]">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="mb-1"><strong>Adresse :</strong> {{ companyInfo().adresse || '…' }}</p>
            <p class="mb-1"><strong>Téléphone :</strong> {{ companyInfo().telephone || '…' }}</p>
            <p class="mb-0"><strong>Email :</strong> {{ companyInfo().email || '…' }}</p>
          </div>
          <div class="text-right">
            <p class="mb-1"><strong>Site web :</strong> {{ companyInfo().site || '…' }}</p>
            <p class="mb-0"><strong>Réseaux :</strong> {{ companyInfo().reseaux || '…' }}</p>
          </div>
        </div>
      </footer>
    </div>
  `,
})
export class AttestationPreviewComponent {
  readonly logo = input<string | null>(null);
  readonly title = input('Attestation');
  readonly reference = input('');
  readonly sections = input<AttestationSection[]>([]);
  readonly reason = input('');
  readonly place = input('');
  readonly date = input('');
  readonly signatoryPosition = input('');
  readonly signatoryName = input('');
  readonly companyInfo = input<CompanyInfo>(EMPTY_COMPANY);
  readonly qrValue = input('');
  readonly careerSummary = input<JsonObject | null>(null);

  private readonly previewDoc = viewChild<ElementRef<HTMLDivElement>>('previewDoc');

  /** Élément DOM du document, utilisé par le parent pour l'export PDF. */
  previewElement(): HTMLElement | null {
    return this.previewDoc()?.nativeElement ?? null;
  }

  replaceVariables(text: string): string {
    const data = this.careerSummary();
    if (!data) return text;
    const mapping: Record<string, string> = {
      Nom: String(data['name'] ?? ''),
      Prenom: String(data['firstName'] ?? ''),
      Date_embauche: this.formatDate(String(data['hiringDate'] ?? '')),
      Poste: String(data['positionName'] ?? ''),
      Société: this.companyInfo().nom,
      Ancienneté: String(data['anciennete'] ?? ''),
      Civilité: String(data['civiliteName'] ?? ''),
    };
    return text.replace(/\{\{(.*?)\}\}/g, (_match, key: string) => mapping[key.trim()] ?? '');
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '—';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return String(value);
    return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }).format(parsed);
  }
}
