import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '../core/notification.service';
import { Notification, NotificationType } from '../core/notification.model';

interface TypeConfig {
  icon: string;
  bg: string;
  text: string;
}

const TYPE_CONFIG: Record<string, TypeConfig> = {
  evaluation_assigned: { icon: 'assignment', bg: 'bg-blue-100', text: 'text-blue-700' },
  evaluation_validated: { icon: 'task_alt', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  career_updated: { icon: 'swap_horiz', bg: 'bg-orange-100', text: 'text-orange-600' },
  wish_status_changed: { icon: 'star', bg: 'bg-violet-100', text: 'text-violet-700' },
  sync_completed: { icon: 'sync', bg: 'bg-sky-100', text: 'text-sky-700' },
  license_expiring: { icon: 'key', bg: 'bg-red-100', text: 'text-red-700' },
};

const DEFAULT_CONFIG: TypeConfig = { icon: 'notifications', bg: 'bg-slate-100', text: 'text-slate-500' };

function typeConfig(type: NotificationType): TypeConfig {
  return TYPE_CONFIG[type] ?? DEFAULT_CONFIG;
}

function timeAgo(dateString: string): string {
  const now = Date.now();
  const date = new Date(dateString).getTime();
  const s = Math.floor((now - date) / 1000);
  if (s < 60) return "À l'instant";
  const m = Math.floor(s / 60);
  if (m < 60) return `Il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Il y a ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `Il y a ${d}j`;
  return new Date(dateString).toLocaleDateString('fr-FR');
}

@Component({
  selector: 'gcc-notification-bell',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatProgressSpinnerModule, NgClass],
  host: {
    class: 'relative block',
  },
  template: `
    <!-- Cloche -->
    <button
      type="button"
      class="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80
             bg-white/80 text-slate-500 shadow-2xs transition-all hover:bg-slate-50 hover:text-slate-700
             focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
      (click)="togglePanel()"
      aria-label="Notifications"
    >
      <mat-icon class="!h-[20px] !w-[20px] !text-[20px]">notifications</mat-icon>

      @if (svc.unreadLabel()) {
        <span
          class="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center
                 rounded-full bg-red-500 px-0.5 text-[10px] font-bold leading-none text-white shadow"
        >
          {{ svc.unreadLabel() }}
        </span>
      }
    </button>

    <!-- Panel drawer -->
    @if (open()) {
      <!-- Backdrop -->
      <div
        class="fixed inset-0 z-[990] bg-slate-950/8 transition-all duration-200"
        (click)="close()"
      ></div>

      <!-- Drawer -->
      <aside
        class="absolute right-0 top-[calc(100%+0.75rem)] z-[1000] flex max-h-[min(42rem,calc(100vh-6rem))]
               min-h-0 w-[400px] max-w-[92vw] flex-col rounded-2xl border border-slate-200/80 bg-white
               shadow-2xl overflow-hidden
               animate-slide-in-right"
      >
        <!-- Header drawer -->
        <div class="flex items-center justify-between border-b border-slate-200/60 bg-canvas px-5 py-4">
          <div class="flex items-center gap-2.5">
            <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
              <mat-icon class="!h-[18px] !w-[18px] !text-[18px] text-accent">notifications</mat-icon>
            </span>
            <div>
              <p class="text-sm font-bold text-navy">Notifications</p>
              @if (svc.unreadCount() > 0) {
                <p class="text-[11px] text-slate-500">{{ svc.unreadCount() }} non lue{{ svc.unreadCount() > 1 ? 's' : '' }}</p>
              }
            </div>
          </div>

          <div class="flex items-center gap-2">
            @if (svc.unreadCount() > 0) {
              <button
                type="button"
                mat-stroked-button
                class="gcc-btn-secondary !rounded-lg !py-1 !text-[11px]"
                (click)="markAll()"
              >
                <mat-icon class="!mr-1 !text-[15px]">done_all</mat-icon>
                Tout lire
              </button>
            }
            <button
              type="button"
              class="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400
                     hover:bg-slate-100 hover:text-slate-600 transition-colors"
              (click)="close()"
              aria-label="Fermer"
            >
              <mat-icon class="!h-[18px] !w-[18px] !text-[18px]">close</mat-icon>
            </button>
          </div>
        </div>

        <!-- Corps -->
        <div class="min-h-0 flex-1 overflow-y-auto bg-white">
          @if (svc.loading() && svc.notifications().length === 0) {
            <!-- Skeleton loading -->
            <div class="flex flex-col gap-0">
              @for (i of [1,2,3,4,5]; track i) {
                <div class="flex gap-3 border-b border-slate-100 px-5 py-4">
                  <div class="h-9 w-9 shrink-0 animate-pulse rounded-xl bg-slate-200"></div>
                  <div class="flex-1 space-y-2 pt-0.5">
                    <div class="h-3 w-3/4 animate-pulse rounded bg-slate-200"></div>
                    <div class="h-2.5 w-full animate-pulse rounded bg-slate-100"></div>
                    <div class="h-2 w-1/3 animate-pulse rounded bg-slate-100"></div>
                  </div>
                </div>
              }
            </div>
          } @else if (svc.notifications().length === 0) {
            <!-- Vide -->
            <div class="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
              <span class="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                <mat-icon class="!h-8 !w-8 !text-[32px] text-slate-400">notifications_off</mat-icon>
              </span>
              <p class="text-sm font-semibold text-slate-600">Aucune notification</p>
              <p class="text-[12px] text-slate-400">Vous êtes à jour !</p>
            </div>
          } @else {
            <!-- Liste -->
            <ul class="divide-y divide-slate-100">
              @for (notif of svc.notifications(); track notif.id) {
                <li>
                  <button
                    type="button"
                    class="group flex w-full gap-3 px-5 py-4 text-left transition-colors
                           hover:bg-slate-50/80 focus:outline-none"
                    [class.bg-indigo-50/60]="!notif.isRead"
                    (click)="handleClick(notif)"
                  >
                    <!-- Icône type -->
                    <span
                      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      [ngClass]="[cfg(notif.type).bg]"
                    >
                      <mat-icon
                        class="!h-[18px] !w-[18px] !text-[18px]"
                        [ngClass]="cfg(notif.type).text"
                      >{{ cfg(notif.type).icon }}</mat-icon>
                    </span>

                    <!-- Texte -->
                    <div class="min-w-0 flex-1">
                      <p
                        class="truncate text-[13px] leading-snug text-navy"
                        [class.font-semibold]="!notif.isRead"
                        [class.font-normal]="notif.isRead"
                      >
                        {{ notif.title }}
                      </p>
                      <p class="mt-0.5 line-clamp-2 text-[12px] text-slate-500">{{ notif.message }}</p>
                      <p class="mt-1 text-[11px] text-slate-400">{{ ago(notif.createdAt) }}</p>
                    </div>

                    <!-- Point non-lu -->
                    @if (!notif.isRead) {
                      <span class="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent"></span>
                    }
                  </button>
                </li>
              }
            </ul>

            <!-- Voir plus -->
            @if (svc.hasMore()) {
              <div class="flex justify-center py-3">
                <button
                  type="button"
                  mat-stroked-button
                  class="gcc-btn-secondary !rounded-lg !text-xs"
                  [disabled]="svc.loading()"
                  (click)="loadMore()"
                >
                  @if (svc.loading()) {
                    <mat-spinner diameter="14" class="!mr-2 inline-block"></mat-spinner>
                  }
                  Voir plus
                </button>
              </div>
            }
          }
        </div>
      </aside>
    }
  `,
  styles: [`
    @keyframes slide-in-right {
      from { transform: translateX(100%); opacity: 0; }
      to   { transform: translateX(0);    opacity: 1; }
    }
    .animate-slide-in-right {
      animation: slide-in-right 0.22s cubic-bezier(.4,0,.2,1) both;
    }
  `],
})
export class GccNotificationBell {
  readonly svc = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly open = signal(false);

  togglePanel(): void {
    this.open.update((v) => !v);
    this.svc.panelOpen.set(this.open());
    if (this.open()) {
      void this.svc.refresh();
    }
  }

  close(): void {
    this.open.set(false);
    this.svc.panelOpen.set(false);
  }

  cfg(type: NotificationType): TypeConfig {
    return typeConfig(type);
  }

  ago(date: string): string {
    return timeAgo(date);
  }

  async handleClick(notif: Notification): Promise<void> {
    if (!notif.isRead) {
      await this.svc.markAsRead(notif.id);
    }
    if (notif.link) {
      void this.router.navigateByUrl(notif.link);
    }
    this.close();
  }

  async markAll(): Promise<void> {
    await this.svc.markAllAsRead();
  }

  async loadMore(): Promise<void> {
    await this.svc.loadMore();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.open()) return;
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (!this.elementRef.nativeElement.contains(target)) {
      this.close();
    }
  }
}
