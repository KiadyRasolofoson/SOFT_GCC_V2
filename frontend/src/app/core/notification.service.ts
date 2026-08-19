import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';
import { environment } from '../../environments/environment';
import { Notification } from './notification.model';
import { AuthService } from './auth.service';

const PAGE_SIZE = 20;

function asNotifications(payload: unknown): Notification[] {
  if (Array.isArray(payload)) return payload as Notification[];
  if (!payload || typeof payload !== 'object') return [];

  const candidates = [
    (payload as { data?: unknown }).data,
    (payload as { items?: unknown }).items,
    (payload as { notifications?: unknown }).notifications,
    (payload as { result?: unknown }).result,
  ];

  for (const value of candidates) {
    if (Array.isArray(value)) return value as Notification[];
  }

  return [];
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  private readonly hubUrl = environment.apiUrl.replace('/api', '') + '/hubs/notification';
  private connection: HubConnection | null = null;

  readonly notifications = signal<Notification[]>([]);
  readonly unreadCount = signal(0);
  readonly loading = signal(false);
  readonly hasMore = signal(true);
  readonly panelOpen = signal(false);
  private currentPage = 1;
  private initialized = false;

  readonly unreadLabel = computed(() => {
    const n = this.unreadCount();
    return n > 99 ? '99+' : n > 0 ? String(n) : null;
  });

  constructor() {
    effect(() => {
      const user = this.auth.user();
      if (user && !this.initialized) {
        this.initialized = true;
        void this.init();
      }
      if (!user && this.initialized) {
        this.initialized = false;
        this.disconnect();
        this.notifications.set([]);
        this.unreadCount.set(0);
        this.currentPage = 1;
        this.hasMore.set(true);
      }
    });
  }

  private async init(): Promise<void> {
    await Promise.all([this.loadPage(1, false), this.refreshUnreadCount()]);
    await this.connect();
  }

  private async connect(): Promise<void> {
    const token = localStorage.getItem('token');
    if (!token) return;
    if (this.connection?.state === HubConnectionState.Connected) return;

    this.connection = new HubConnectionBuilder()
      .withUrl(this.hubUrl, { accessTokenFactory: () => token })
      .configureLogging(LogLevel.Warning)
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .build();

    this.connection.on('ReceiveNotification', (notif: Notification) => {
      this.notifications.update((prev) => [notif, ...prev]);
      this.unreadCount.update((n) => n + 1);
      this.showToast(notif);
    });

    this.connection.onreconnecting(() => console.log('[SignalR] Reconnexion…'));
    this.connection.onreconnected(() => console.log('[SignalR] Reconnecté'));
    this.connection.onclose(() => console.log('[SignalR] Connexion fermée'));

    try {
      await this.connection.start();
      console.log('[SignalR] Connecté au hub de notifications');
    } catch (err) {
      console.error('[SignalR] Erreur connexion:', err);
    }
  }

  disconnect(): void {
    if (this.connection) {
      void this.connection.stop();
      this.connection = null;
    }
  }

  async loadMore(): Promise<void> {
    if (this.loading() || !this.hasMore()) return;
    await this.loadPage(this.currentPage + 1, true);
  }

  async refresh(): Promise<void> {
    await Promise.all([this.loadPage(1, false), this.refreshUnreadCount()]);
  }

  async markAsRead(id: number): Promise<void> {
    try {
      await firstValueFrom(this.http.put(`${environment.apiUrl}/Notification/${id}/read`, {}));
      this.notifications.update((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      this.unreadCount.update((n) => Math.max(0, n - 1));
    } catch (err) {
      console.error('[Notifications] Erreur markAsRead:', err);
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      await firstValueFrom(this.http.put(`${environment.apiUrl}/Notification/read-all`, {}));
      this.notifications.update((prev) => prev.map((n) => ({ ...n, isRead: true })));
      this.unreadCount.set(0);
    } catch (err) {
      console.error('[Notifications] Erreur markAllAsRead:', err);
    }
  }

  private async loadPage(page: number, append: boolean): Promise<void> {
    this.loading.set(true);
    try {
      const data = await firstValueFrom(
        this.http.get<unknown>(
          `${environment.apiUrl}/Notification?page=${page}&pageSize=${PAGE_SIZE}`,
        ),
      );
      const list = asNotifications(data);
      if (append) {
        this.notifications.update((prev) => [...prev, ...list]);
      } else {
        this.notifications.set(list);
      }
      this.hasMore.set(list.length === PAGE_SIZE);
      this.currentPage = page;
    } catch (err) {
      console.error('[Notifications] Erreur fetch:', err);
    } finally {
      this.loading.set(false);
    }
  }

  private async refreshUnreadCount(): Promise<void> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ count: number }>(`${environment.apiUrl}/Notification/unread-count`),
      );
      this.unreadCount.set(res?.count ?? 0);
    } catch {
      // silencieux
    }
  }

  private showToast(notif: Notification): void {
    // Toast léger natif — pas de dépendance externe
    const toast = document.createElement('div');
    toast.setAttribute(
      'style',
      `position:fixed;top:1rem;right:1rem;z-index:9999;
       max-width:360px;padding:1rem 1.25rem;border-radius:0.75rem;
       background:#ffffff;border:1px solid #e2e8f0;
       box-shadow:0 8px 30px rgba(0,0,0,.12);
       font-family:Inter,sans-serif;display:flex;gap:.75rem;align-items:flex-start;`,
    );
    toast.innerHTML = `
      <span style="font-size:1.25rem;line-height:1">🔔</span>
      <div>
        <p style="margin:0;font-size:.875rem;font-weight:600;color:#0f172a">${notif.title}</p>
        <p style="margin:.25rem 0 0;font-size:.8rem;color:#64748b">${notif.message}</p>
      </div>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
  }
}
