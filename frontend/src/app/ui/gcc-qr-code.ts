import { AfterViewInit, Component, ElementRef, input, viewChild } from '@angular/core';
import QRCode from 'qrcode';

/**
 * Générateur de QR code du kit Soft GCC (canvas natif).
 * Encapsule la lib `qrcode` dans un composant réutilisable.
 */
@Component({
  selector: 'gcc-qr-code',
  host: { class: 'block' },
  template: `<canvas #canvas class="block"></canvas>`,
})
export class GccQrCode implements AfterViewInit {
  readonly value = input.required<string>();
  readonly size = input(120);

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  ngAfterViewInit(): void {
    this.render();
  }

  private render(): void {
    const canvas = this.canvas().nativeElement;
    QRCode.toCanvas(
      canvas,
      this.value(),
      { width: this.size(), margin: 2, errorCorrectionLevel: 'M' },
      (err) => {
        if (err) {
          console.error('Échec de génération du QR code', err);
        }
      },
    );
  }
}
