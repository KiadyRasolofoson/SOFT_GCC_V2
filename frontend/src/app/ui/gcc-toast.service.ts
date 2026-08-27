import { Injectable } from '@angular/core';

export type GccToastType = 'success' | 'error' | 'warning' | 'info';

/** Toast natif léger, sans dépendance externe (UX-07). */
@Injectable({ providedIn: 'root' })
export class GccToastService {
  private container: HTMLElement | null = null;

  show(message: string, type: GccToastType = 'success', duration = 3200): void {
    if (typeof document === 'undefined') return;
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.style.cssText =
        'position:fixed;top:16px;right:16px;z-index:9999;display:flex;flex-direction:column;gap:8px;max-width:360px;';
      document.body.appendChild(this.container);
    }

    const palette: Record<GccToastType, { bg: string; icon: string }> = {
      success: { bg: '#059669', icon: '✓' },
      error: { bg: '#dc2626', icon: '✕' },
      warning: { bg: '#d97706', icon: '⚠' },
      info: { bg: '#2563eb', icon: 'ℹ' },
    };
    const { bg, icon } = palette[type];

    const toast = document.createElement('div');
    toast.style.cssText =
      `display:flex;align-items:flex-start;gap:10px;padding:12px 16px;border-radius:12px;` +
      `background:${bg};color:#fff;font-size:13px;font-weight:500;line-height:1.35;` +
      `box-shadow:0 10px 24px rgba(0,0,0,.18);animation:gcc-toast-in .18s ease-out;`;
    toast.innerHTML = `<span style="font-size:14px;line-height:1.2">${icon}</span><span>${escapeHtml(message)}</span>`;
    this.container.appendChild(toast);

    window.setTimeout(() => toast.remove(), duration);
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
