import { Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GccAiChatPanel } from './gcc-ai-chat-panel';

@Component({
  selector: 'gcc-ai-chat-widget',
  imports: [MatIconModule, GccAiChatPanel],
  template: `
    @if (!onAssistantPage()) {
      @if (!open()) {
        <button
          type="button"
          class="gcc-ai-fab"
          aria-label="Ouvrir SoftTalent AI"
          (click)="open.set(true)"
        >
          <mat-icon>smart_toy</mat-icon>
        </button>
      } @else {
        @if (expanded()) {
          <button type="button" class="gcc-ai-widget-backdrop" aria-label="Réduire" (click)="expanded.set(false)"></button>
        }
        <div class="gcc-ai-widget" [class.gcc-ai-widget-expanded]="expanded()">
          <gcc-ai-chat-panel
            class="h-full"
            [showSidebar]="expanded()"
            [showExpand]="true"
            [expandIcon]="expanded() ? 'close_fullscreen' : 'open_in_full'"
            [showOpenPage]="true"
            [showClose]="true"
            (expand)="expanded.update((v) => !v)"
            (openPage)="goPage()"
            (close)="close()"
          />
        </div>
      }
    }
  `,
})
export class GccAiChatWidget {
  private readonly router = inject(Router);

  readonly open = signal(false);
  readonly expanded = signal(false);
  readonly onAssistantPage = signal(this.isAssistant(this.router.url));

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((e) => {
        const onPage = this.isAssistant(e.urlAfterRedirects);
        this.onAssistantPage.set(onPage);
        if (onPage) this.close();
      });
  }

  goPage(): void {
    this.close();
    void this.router.navigateByUrl('/soft-gcc/assistant');
  }

  close(): void {
    this.open.set(false);
    this.expanded.set(false);
  }

  private isAssistant(url: string): boolean {
    const path = url.split('?')[0];
    return path.startsWith('/soft-gcc/assistant') || path.startsWith('/soft-gcc/parametres/agent-ia');
  }
}
