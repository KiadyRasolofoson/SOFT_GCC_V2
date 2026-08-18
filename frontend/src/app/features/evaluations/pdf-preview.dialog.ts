import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

export interface PdfPreviewData {
  url: string;
}

@Component({
  selector: 'app-pdf-preview-dialog',
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title class="!font-sans !text-lg !font-semibold !text-navy">Prévisualisation du rapport</h2>
    <mat-dialog-content class="!h-[70vh] !p-0">
      <iframe class="h-full w-full border-0" [src]="safeUrl" title="Prévisualisation du rapport d’évaluation"></iframe>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button class="gcc-btn-secondary" type="button" mat-dialog-close>Fermer</button>
    </mat-dialog-actions>
  `,
})
export class PdfPreviewDialog {
  private readonly data = inject<PdfPreviewData>(MAT_DIALOG_DATA);
  private readonly sanitizer = inject(DomSanitizer);

  readonly safeUrl: SafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.data.url);
}
