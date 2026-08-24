import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../core/auth.service';
import { NotificationService } from '../core/notification.service';
import { toMaterialIcon } from '../core/icon-map';
import { AppModule } from '../core/models';
import { GccNotificationBell } from '../ui/gcc-notification-bell';
import { GccAiChatWidget } from '../features/ai-chat/gcc-ai-chat-widget';

@Component({
  selector: 'gcc-app-shell',
  imports: [MatIconModule, MatButtonModule, RouterLink, RouterOutlet, GccNotificationBell, GccAiChatWidget],
  template: `
    <div class="flex h-screen overflow-hidden bg-canvas font-sans">
      <!-- Sidebar Navigation -->
      <aside class="flex w-64 shrink-0 flex-col bg-slate-950 text-slate-300 border-r border-slate-800/80 shadow-xl">
        <!-- Logo & Brand Header -->
        <div class="flex items-center justify-center px-4 py-3 border-b border-slate-800/60">
          <img src="assets/logo/logo.png" alt="SoftTalent" class="h-15 w-auto object-contain brightness-0 invert opacity-90" />
        </div>

        <!-- Navigation Menu -->
        <nav class="flex-1 space-y-1 overflow-y-auto px-3.5 py-4 text-xs font-medium">
          <p class="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">Navigation Principale</p>

          @for (item of auth.sortedModules(); track item.moduleId) {
            @if (item.childModules.length) {
              <div>
                <button
                  type="button"
                  class="group flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all duration-150"
                  [class]="parentActive(item) ? 'bg-slate-800/90 text-white font-semibold shadow-xs' : 'hover:bg-slate-800/50 hover:text-slate-100'"
                  (click)="toggle(item.name)"
                >
                  <mat-icon
                    class="!h-5 !w-5 !text-[20px] transition-colors"
                    [class]="parentActive(item) ? 'text-accent' : 'text-slate-400 group-hover:text-slate-200'"
                  >
                    {{ iconOf(item.icon) }}
                  </mat-icon>
                  <span class="min-w-0 flex-1 truncate text-xs">{{ item.displayName }}</span>
                  <mat-icon class="!h-4 !w-4 !text-[16px] text-slate-400 transition-transform duration-200" [class.rotate-90]="isOpen(item.name)">
                    chevron_right
                  </mat-icon>
                </button>

                @if (isOpen(item.name)) {
                  <div class="my-1 ml-3.5 space-y-0.5 border-l-2 border-slate-800 pl-3">
                    @for (child of item.childModules; track child.moduleId) {
                      <a
                        class="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] transition-all duration-150"
                        [class]="isActive(child.route) ? 'bg-indigo-600/90 text-white font-semibold shadow-xs' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'"
                        [routerLink]="child.route || '/page-introuvable'"
                      >
                        <span
                          class="h-1.5 w-1.5 rounded-full"
                          [class]="isActive(child.route) ? 'bg-white' : 'bg-slate-600'"
                        ></span>
                        <span class="truncate">{{ child.displayName }}</span>
                      </a>
                    }
                  </div>
                }
              </div>
            } @else {
              <a
                class="group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs transition-all duration-150"
                [class]="isActive(item.route) ? 'bg-indigo-600 text-white font-semibold shadow-sm shadow-indigo-600/30' : 'hover:bg-slate-800/50 hover:text-slate-100'"
                [routerLink]="item.route || '/page-introuvable'"
              >
                <mat-icon
                  class="!h-5 !w-5 !text-[20px] transition-colors"
                  [class]="isActive(item.route) ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'"
                >
                  {{ iconOf(item.icon) }}
                </mat-icon>
                <span class="truncate">{{ item.displayName }}</span>
              </a>
            }
          }
        </nav>

      </aside>

      <!-- Main Layout Content -->
      <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
        <!-- Topbar Header -->
        <header class="sticky top-0 z-20 flex items-center justify-end border-b border-slate-200/80 bg-white/90 px-6 py-3.5 backdrop-blur-md shadow-2xs">
          <!-- Right Actions & User Profile -->
          <div class="flex items-center gap-4">
            <!-- Notification Bell -->
            <gcc-notification-bell />

            <div class="relative">
              <button
                type="button"
                class="flex h-9 items-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-1.5 pr-2 text-left shadow-2xs transition-all hover:border-slate-300 hover:bg-slate-50"
                (click)="toggleUserMenu()"
              >
                <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-accent to-indigo-500 text-[10px] font-extrabold text-white">
                  {{ auth.initials() }}
                </span>
                <span class="hidden min-w-0 leading-none sm:block">
                  <span class="block truncate text-[11px] font-bold text-navy">{{ auth.displayName() }}</span>
                  <span class="mt-0.5 block truncate text-[10px] text-slate-500">{{ auth.user()?.roleTitle || 'Utilisateur' }}</span>
                </span>
                <mat-icon class="hidden !h-4 !w-4 !text-[16px] text-slate-400 sm:block">
                  expand_more
                </mat-icon>
              </button>

              @if (userMenuOpen()) {
                <button
                  type="button"
                  class="fixed inset-0 z-20 cursor-default"
                  aria-label="Fermer le menu utilisateur"
                  (click)="closeUserMenu()"
                ></button>

                <div class="absolute right-0 top-[calc(100%+0.75rem)] z-30 w-56 rounded-2xl border border-slate-200/80 bg-white p-2 shadow-2xl">
                  <div class="mb-2 flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                    <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-accent to-indigo-500 text-xs font-extrabold text-white shadow-sm">
                      {{ auth.initials() }}
                    </span>
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-xs font-bold text-navy">{{ auth.displayName() }}</p>
                      <p class="truncate text-[11px] text-slate-500">{{ auth.user()?.roleTitle || 'Utilisateur' }}</p>
                    </div>
                  </div>

                  <button
                    mat-stroked-button
                    class="gcc-btn-secondary !flex !w-full !justify-start !rounded-xl !text-xs !py-2"
                    type="button"
                    (click)="logout()"
                  >
                    <mat-icon class="!mr-2 !text-[18px]">logout</mat-icon>
                    Déconnexion
                  </button>
                </div>
              }
            </div>
          </div>
        </header>

        <!-- Main Workspace -->
        <main
          class="flex min-w-0 flex-1 flex-col transition duration-200"
          [class.overflow-y-auto]="!canvasMain()"
          [class.overflow-hidden]="canvasMain()"
          [class.p-6]="!canvasMain()"
          [class.lg:p-8]="!canvasMain()"
          [class.p-0]="canvasMain()"
          [class.pointer-events-none]="notifications.panelOpen()"
          [class.select-none]="notifications.panelOpen()"
          [class.blur-sm]="notifications.panelOpen()"
          [class.opacity-70]="notifications.panelOpen()"
        >
          <router-outlet />
        </main>

        @if (!canvasMain()) {
          <footer
            class="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 bg-white/50 px-6 py-3.5 text-xs text-slate-400 transition duration-200"
            [class.pointer-events-none]="notifications.panelOpen()"
            [class.select-none]="notifications.panelOpen()"
            [class.blur-sm]="notifications.panelOpen()"
            [class.opacity-70]="notifications.panelOpen()"
          >
            <span>© SoftTalent — Plateforme de Gestion des Compétences & Carrières</span>
            <span class="text-slate-400">Données RH Confidentielles</span>
          </footer>
        }
      </div>
    </div>
    <gcc-ai-chat-widget />
  `,
})
export class GccAppShell {
  readonly auth = inject(AuthService);
  readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  readonly openMenu = signal<string | null>(null);
  readonly userMenuOpen = signal(false);
  currentPath = signal(this.router.url.split('?')[0]);
  readonly canvasMain = computed(() => this.currentPath().startsWith('/soft-gcc/assistant'));

  constructor() {
    this.syncOpenMenu(this.currentPath());
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((e) => {
        const path = e.urlAfterRedirects.split('?')[0];
        this.currentPath.set(path);
        this.syncOpenMenu(path);
      });
  }

  iconOf(icon: string): string {
    return toMaterialIcon(icon);
  }

  isActive(route: string | null | undefined): boolean {
    if (!route) return false;
    const path = route.split('?')[0];
    const current = this.currentPath();
    return current === path || current.startsWith(`${path}/`);
  }

  parentActive(item: AppModule): boolean {
    if (this.isActive(item.route)) return true;
    return item.childModules.some((child) => this.isActive(child.route));
  }

  isOpen(name: string): boolean {
    return this.openMenu() === name;
  }

  toggle(name: string): void {
    this.openMenu.update((current) => (current === name ? null : name));
  }

  toggleUserMenu(): void {
    this.userMenuOpen.update((current) => !current);
  }

  closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  logout(): void {
    this.closeUserMenu();
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }

  private syncOpenMenu(pathname: string): void {
    for (const mod of this.auth.sortedModules()) {
      if (mod.route && pathname.startsWith(mod.route.split('?')[0])) {
        this.openMenu.set(mod.name);
        return;
      }
      if (mod.childModules.some((child) => child.route && pathname.startsWith(child.route.split('?')[0]))) {
        this.openMenu.set(mod.name);
        return;
      }
    }
  }
}
