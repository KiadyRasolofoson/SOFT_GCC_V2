import { Component, ElementRef, computed, effect, inject, input, output, signal, untracked, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { isAdminRole } from '../../core/route-access';
import { AiChatMessage } from './ai-chat.models';
import { AiChatService } from './ai-chat.service';
import { GccAiMarkdown } from './gcc-ai-markdown';

@Component({
  selector: 'gcc-ai-chat-panel',
  imports: [FormsModule, MatIconModule, GccAiMarkdown, RouterLink],
  host: {
    class: 'gcc-ai-chat flex min-h-0 flex-1 flex-col overflow-hidden',
    '[class.gcc-ai-chat-page]': '!framed()',
  },
  template: `
    <div class="flex min-h-0 flex-1 overflow-hidden" [class.gcc-ai-frame]="framed()">
      @if (showSidebar()) {
        <aside
          class="flex shrink-0 flex-col border-r border-indigo-100/90 bg-white/75"
          [class.w-56]="framed()"
          [class.w-64]="!framed()"
        >
          <div class="flex items-center justify-between gap-2 border-b border-indigo-100 py-3" [class.px-3]="framed()" [class.px-4]="!framed()">
            <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Conversations</p>
            <button
              type="button"
              class="gcc-icon-btn !h-8 !w-8"
              aria-label="Nouvelle conversation"
              [disabled]="chat.busy()"
              (click)="chat.newConversation()"
            >
              <mat-icon class="!text-[18px]">add</mat-icon>
            </button>
          </div>
          <div class="min-h-0 flex-1 space-y-0.5 overflow-y-auto" [class.p-2]="framed()" [class.p-3]="!framed()">
            @for (conv of chat.conversations(); track conv.id) {
              <div
                class="group relative flex items-center gap-1 rounded-xl px-2 py-2 pl-3 text-left transition-colors duration-200"
                [class]="conv.id === chat.activeId() ? 'bg-indigo-50 text-indigo-pro' : 'text-slate-600 hover:bg-slate-50'"
              >
                @if (conv.id === chat.activeId()) {
                  <span class="absolute bottom-1.5 left-0 top-1.5 w-0.5 rounded-full bg-accent" aria-hidden="true"></span>
                }
                <button type="button" class="min-w-0 flex-1 truncate text-left text-xs font-semibold leading-snug" (click)="chat.select(conv.id)">
                  {{ conv.title }}
                </button>
                <button
                  type="button"
                  class="gcc-ai-side-del"
                  aria-label="Supprimer"
                  [disabled]="chat.busy()"
                  (click)="chat.deleteConversation(conv.id)"
                >
                  <mat-icon class="!text-[16px]">delete_outline</mat-icon>
                </button>
              </div>
            }
          </div>
        </aside>
      }

      <section class="flex min-w-0 flex-1 flex-col">
        @if (showHeader()) {
          <header class="flex items-center justify-between gap-3 border-b border-indigo-100 bg-white/70 px-4 py-3">
            <div class="min-w-0">
              <p class="truncate text-sm font-bold text-navy">SoftTalent AI</p>
              <p class="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                <span class="gcc-ai-status" aria-hidden="true"></span>
                {{ chat.error() ? 'Indisponible' : 'En ligne' }}
              </p>
            </div>
            <div class="flex items-center gap-1">
              @if (isAdmin()) {
                <a
                  class="gcc-icon-btn"
                  routerLink="/soft-gcc/parametres/agent-ia"
                  aria-label="Paramètres de l'agent"
                >
                  <mat-icon>settings</mat-icon>
                </a>
              }
              @if (showExpand()) {
                <button type="button" class="gcc-icon-btn" [attr.aria-label]="expandIcon() === 'close_fullscreen' ? 'Réduire' : 'Agrandir'" (click)="expand.emit()">
                  <mat-icon>{{ expandIcon() }}</mat-icon>
                </button>
              }
              @if (showOpenPage()) {
                <button type="button" class="gcc-icon-btn" aria-label="Ouvrir la page" (click)="openPage.emit()">
                  <mat-icon>launch</mat-icon>
                </button>
              }
              @if (showClose()) {
                <button type="button" class="gcc-icon-btn" aria-label="Fermer" (click)="close.emit()">
                  <mat-icon>close</mat-icon>
                </button>
              }
            </div>
          </header>
        }

        <div
          #scroller
          class="min-h-0 flex-1 overflow-y-auto"
          [class.px-4]="framed()"
          [class.py-5]="framed()"
          [class.sm:px-6]="framed()"
          [class.px-8]="!framed()"
          [class.py-8]="!framed()"
          [class.lg:px-12]="!framed()"
          (scroll)="onScroll()"
        >
          @if (!chat.active()?.messages.length && !chat.thinking()) {
            <div class="flex h-full flex-col items-center justify-center px-4 text-center">
              <h2 class="gcc-ai-hello">{{ greeting() }}</h2>
              <p class="mt-3 max-w-md text-sm leading-relaxed text-slate-500" [class.text-base]="!framed()">
                Posez une question sur les compétences, évaluations, carrières ou l'usage de Soft Talent.
              </p>
            </div>
          } @else {
            <div class="mx-auto flex w-full flex-col gap-5" [class.max-w-3xl]="framed()" [class.max-w-4xl]="!framed()" [class.gap-7]="!framed()">
              @for (msg of chat.active()?.messages ?? []; track msg.id) {
                @if (msg.role === 'user') {
                  <div class="gcc-ai-msg group flex justify-end">
                    <div class="flex max-w-[85%] flex-col items-end gap-1">
                      <div class="gcc-ai-user-bubble">
                        {{ msg.content }}
                      </div>
                      <button
                        type="button"
                        class="gcc-ai-copy"
                        [attr.aria-label]="copiedId() === msg.id ? 'Copié' : 'Copier le prompt'"
                        [disabled]="isCopyDisabled(msg)"
                        (click)="copyMessage(msg)"
                      >
                        <mat-icon class="!text-[16px]">{{ copiedId() === msg.id ? 'check' : 'content_copy' }}</mat-icon>
                      </button>
                    </div>
                  </div>
                } @else {
                  <div class="gcc-ai-msg group w-full text-sm leading-relaxed text-slate-700">
                    <gcc-ai-markdown [text]="msg.content" />
                    @if (chat.streaming() && msg.id === lastAssistantId()) {
                      <span class="gcc-ai-caret" aria-hidden="true"></span>
                    }
                    <button
                      type="button"
                      class="gcc-ai-copy mt-1.5"
                      [attr.aria-label]="copiedId() === msg.id ? 'Copié' : 'Copier la réponse'"
                      [disabled]="isCopyDisabled(msg)"
                      (click)="copyMessage(msg)"
                    >
                      <mat-icon class="!text-[16px]">{{ copiedId() === msg.id ? 'check' : 'content_copy' }}</mat-icon>
                    </button>
                  </div>
                }
              }

              @if (chat.thinking()) {
                <div class="gcc-ai-msg flex items-center gap-2 py-2" aria-label="L'assistant réfléchit">
                  <span class="gcc-ai-dots" aria-hidden="true">
                    <i></i><i></i><i></i>
                  </span>
                  <span class="text-xs font-medium text-slate-400">Réflexion…</span>
                </div>
              }
            </div>
          }
        </div>

        <form
          class="border-t border-indigo-100 bg-white/80"
          [class.px-3]="framed()"
          [class.py-3]="framed()"
          [class.sm:px-4]="framed()"
          [class.px-8]="!framed()"
          [class.py-5]="!framed()"
          [class.lg:px-12]="!framed()"
          (submit)="onSubmit($event)"
        >
          @if (chat.error()) {
            <p class="mb-2 px-1 text-xs font-semibold text-red-600">{{ chat.error() }}</p>
          } @else if (chat.warning()) {
            <p class="mb-2 px-1 text-xs font-semibold text-amber-700">{{ chat.warning() }}</p>
          }
          <div class="gcc-ai-composer" [class.mx-auto]="!framed()" [class.max-w-4xl]="!framed()">
            <textarea
              class="gcc-ai-input max-h-28 min-h-11 flex-1 resize-none bg-transparent py-2 text-sm text-navy outline-none"
              rows="1"
              name="prompt"
              [(ngModel)]="draft"
              placeholder="Écrire un message…"
              [disabled]="chat.busy()"
              (keydown.enter)="onEnter($event)"
            ></textarea>
            <button
              type="submit"
              class="gcc-ai-send"
              [class.gcc-ai-send-active]="draft.trim() && !chat.busy()"
              [disabled]="!draft.trim() || chat.busy()"
              aria-label="Envoyer"
            >
              <mat-icon class="!text-[20px]">send</mat-icon>
            </button>
          </div>
        </form>
      </section>
    </div>
  `,
})
export class GccAiChatPanel {
  readonly chat = inject(AiChatService);
  readonly auth = inject(AuthService);
  readonly isAdmin = computed(() => isAdminRole(this.auth.user()?.roleTitle));
  readonly showSidebar = input(true);
  readonly showHeader = input(true);
  readonly framed = input(true);
  readonly showExpand = input(false);
  readonly expandIcon = input('open_in_full');
  readonly showOpenPage = input(false);
  readonly showClose = input(false);
  readonly expand = output<void>();
  readonly openPage = output<void>();
  readonly close = output<void>();
  readonly copiedId = signal<string | null>(null);

  readonly greeting = computed(() => {
    const first = (this.auth.user()?.firstName ?? '').trim();
    const fallback = this.auth.displayName().split(' ')[0] ?? '';
    const name = first || fallback;
    const hello = timeGreeting();
    return name ? `${hello}, ${name}` : hello;
  });
  readonly lastAssistantId = computed(() => {
    const msgs = this.chat.active()?.messages ?? [];
    for (let i = msgs.length - 1; i >= 0; i -= 1) {
      if (msgs[i].role === 'assistant') return msgs[i].id;
    }
    return null;
  });

  draft = '';
  private stickToBottom = true;
  private copiedTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly scroller = viewChild<ElementRef<HTMLElement>>('scroller');

  constructor() {
    effect(() => {
      this.chat.active()?.messages.map((m) => m.content).join('\0');
      this.chat.thinking();
      this.chat.streaming();
      untracked(() => {
        if (this.stickToBottom) queueMicrotask(() => this.scrollToBottom());
      });
    });
  }

  isCopyDisabled(msg: AiChatMessage): boolean {
    return msg.role === 'assistant' && this.chat.streaming() && msg.id === this.lastAssistantId();
  }

  async copyMessage(msg: AiChatMessage): Promise<void> {
    const text = msg.content.trim();
    if (!text || this.isCopyDisabled(msg)) return;
    try {
      await navigator.clipboard.writeText(msg.content);
      this.copiedId.set(msg.id);
      if (this.copiedTimer) clearTimeout(this.copiedTimer);
      this.copiedTimer = setTimeout(() => {
        if (this.copiedId() === msg.id) this.copiedId.set(null);
      }, 1500);
    } catch {
      /* presse-papiers refusé */
    }
  }

  onScroll(): void {
    const el = this.scroller()?.nativeElement;
    if (!el) return;
    this.stickToBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
  }

  onEnter(event: Event): void {
    const ke = event as KeyboardEvent;
    if (ke.shiftKey) return;
    ke.preventDefault();
    void this.submit();
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    void this.submit();
  }

  private async submit(): Promise<void> {
    const text = this.draft;
    this.draft = '';
    this.stickToBottom = true;
    const ok = await this.chat.send(text);
    if (!ok && this.chat.error()) this.draft = text;
  }

  private scrollToBottom(): void {
    const el = this.scroller()?.nativeElement;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: prefersSmooth() ? 'smooth' : 'auto' });
  }
}

function prefersSmooth(): boolean {
  return typeof window !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function timeGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Bonjour';
  if (hour >= 12 && hour < 18) return 'Bon après-midi';
  return 'Bonsoir';
}
