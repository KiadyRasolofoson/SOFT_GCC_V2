import { Component, input, output, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AttestationPreviewComponent } from './attestation-preview.component';
import { AttestationSection, CompanyInfo, EMPTY_COMPANY, JsonObject } from './attestation.constants';

/**
 * Panneau d'aperçu de l'attestation (colonne droite).
 * Affiche l'état vide ou le document via `app-attestation-preview`, et expose
 * l'élément DOM via `previewElement()` pour l'export PDF.
 */
@Component({
  selector: 'app-attestation-preview-panel',
  imports: [MatButtonModule, MatIconModule, AttestationPreviewComponent],
  host: { class: 'block' },
  template: `
    <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-4">
      <div class="mb-3 flex items-center justify-between">
        <h3 class="text-sm font-semibold text-navy">
          <mat-icon class="!mr-1 !h-4 !w-4 !text-[16px] align-[-3px]">visibility</mat-icon>
          Aperçu
        </h3>
        @if (showPreview()) {
          <button mat-stroked-button type="button" class="gcc-btn-secondary !h-8 !px-3 !text-xs" (click)="previewToggle.emit()">
            Masquer
          </button>
        }
      </div>

      @if (!showPreview()) {
        <div class="flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
          <mat-icon class="!h-10 !w-10 !text-[40px] text-accent">visibility</mat-icon>
          <p class="mt-2 max-w-xs text-sm text-slate-500">
            Générez l'aperçu pour visualiser le document avant export ou envoi.
          </p>
          <button mat-flat-button type="button" class="gcc-btn-primary mt-4" (click)="requestShow.emit()">
            <mat-icon>visibility</mat-icon>
            Afficher l'aperçu
          </button>
        </div>
      } @else {
        <app-attestation-preview
          [logo]="logo()"
          [title]="title()"
          [reference]="reference()"
          [sections]="sections()"
          [reason]="reason()"
          [place]="place()"
          [date]="date()"
          [signatoryPosition]="signatoryPosition()"
          [signatoryName]="signatoryName()"
          [companyInfo]="companyInfo()"
          [qrValue]="qrValue()"
          [careerSummary]="careerSummary()"
        />
      }
    </div>
  `,
})
export class AttestationPreviewPanelComponent {
  readonly showPreview = input(false);
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

  readonly previewToggle = output<void>();
  readonly requestShow = output<void>();

  private readonly preview = viewChild(AttestationPreviewComponent);

  /** Élément DOM du document, utilisé par le parent pour l'export PDF. */
  previewElement(): HTMLElement | null {
    return this.preview()?.previewElement() ?? null;
  }
}
