import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AiConversationId, AiConversationDetail, AiConversationSummary, AiMessageDto } from './ai-agent.models';
import { AiAgentApi, apiErrorMessage } from './ai-agent.api';
import { AiChatConversation, AiChatMessage } from './ai-chat.models';

function uid(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function titleFrom(text: string): string {
  const clean = text.trim().replace(/\s+/g, ' ');
  return clean.length <= 42 ? clean : `${clean.slice(0, 42)}…`;
}

function toTimestamp(value: string | number | Date | undefined): number {
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();
  const parsed = Date.parse(String(value ?? ''));
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function visibleMessages(rows: AiMessageDto[]): AiChatMessage[] {
  return rows
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && (m.content ?? '').trim())
    .map((m) => ({
      id: String(m.id),
      role: m.role as 'user' | 'assistant',
      content: m.content,
      createdAt: toTimestamp(m.createdAt),
    }));
}

function fromSummary(row: AiConversationSummary): AiChatConversation {
  return {
    id: row.id,
    title: row.title || 'Conversation',
    updatedAt: toTimestamp(row.updatedAt),
    messages: [],
    loaded: false,
  };
}

function fromDetail(row: AiConversationDetail): AiChatConversation {
  return {
    id: row.id,
    title: row.title || 'Conversation',
    updatedAt: toTimestamp(row.updatedAt),
    messages: visibleMessages(row.messages ?? []),
    loaded: true,
  };
}

function emptyDraft(): AiChatConversation {
  return {
    id: 'draft',
    title: 'Nouvelle conversation',
    updatedAt: Date.now(),
    messages: [],
    loaded: true,
  };
}

@Injectable({ providedIn: 'root' })
export class AiChatService {
  private readonly api = inject(AiAgentApi);

  readonly conversations = signal<AiChatConversation[]>([]);
  readonly activeId = signal<AiConversationId | null>(null);
  readonly thinking = signal(false);
  readonly streaming = signal(false);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly warning = signal<string | null>(null);

  readonly active = computed(() => this.conversations().find((c) => c.id === this.activeId()) ?? null);
  readonly busy = computed(() => this.thinking() || this.streaming());

  private timers: ReturnType<typeof setTimeout>[] = [];
  private gen = 0;

  constructor() {
    void this.refresh();
  }

  async refresh(): Promise<void> {
    this.loading.set(true);
    try {
      const rows = await firstValueFrom(this.api.listConversations());
      const draft = this.conversations().find((c) => c.id === 'draft');
      const keepDraft = draft && (this.activeId() === 'draft' || draft.messages.length > 0);
      const mapped = (rows ?? []).map(fromSummary);
      const next = keepDraft ? [draft, ...mapped] : mapped;
      this.conversations.set(next.sort((a, b) => b.updatedAt - a.updatedAt));
      if (!this.activeId() || !next.some((c) => c.id === this.activeId())) {
        this.ensureConversation();
      }
    } catch (err) {
      this.error.set(apiErrorMessage(err, 'Impossible de charger les conversations.'));
      this.ensureConversation();
    } finally {
      this.loading.set(false);
    }
  }

  async select(id: AiConversationId): Promise<void> {
    if (this.busy()) return;
    this.activeId.set(id);
    this.warning.set(null);
    if (id === 'draft') return;
    await this.loadDetail(id);
  }

  newConversation(): void {
    if (this.busy()) return;
    this.error.set(null);
    this.warning.set(null);
    const existing = this.conversations().find((c) => c.id === 'draft' && c.messages.length === 0);
    if (existing) {
      this.activeId.set('draft');
      return;
    }
    const created = emptyDraft();
    this.conversations.update((list) => [created, ...list.filter((c) => c.id !== 'draft')]);
    this.activeId.set('draft');
  }

  async deleteConversation(id: AiConversationId): Promise<void> {
    if (this.busy()) return;
    if (id === 'draft') {
      this.conversations.update((list) => list.filter((c) => c.id !== 'draft'));
      this.ensureConversation();
      return;
    }
    try {
      await firstValueFrom(this.api.deleteConversation(id));
      this.conversations.update((list) => list.filter((c) => c.id !== id));
      if (this.activeId() === id) this.ensureConversation();
    } catch (err) {
      this.error.set(apiErrorMessage(err, 'Impossible de supprimer la conversation.'));
    }
  }

  async send(text: string): Promise<boolean> {
    const prompt = text.trim();
    if (!prompt || this.busy()) return false;

    this.ensureConversation();
    const originId = this.activeId()!;
    const ticket = ++this.gen;
    this.error.set(null);
    this.warning.set(null);

    const userMsg: AiChatMessage = { id: uid(), role: 'user', content: prompt, createdAt: Date.now() };
    this.patchConversation(originId, (conv) => ({
      ...conv,
      title: conv.messages.length === 0 ? titleFrom(prompt) : conv.title,
      updatedAt: Date.now(),
      messages: [...conv.messages, userMsg],
    }));

    this.thinking.set(true);

    try {
      const response = await firstValueFrom(
        this.api.chat({
          conversationId: originId === 'draft' ? undefined : originId,
          message: prompt,
        }),
      );

      if (ticket !== this.gen) return false;

      const nextId = response.conversationId;
      if (originId !== nextId) {
        this.renameId(originId, nextId);
      }
      this.activeId.set(nextId);
      this.warning.set(response.warning?.trim() || null);

      const assistantId = uid();
      this.thinking.set(false);
      this.streaming.set(true);
      this.patchConversation(nextId, (conv) => ({
        ...conv,
        title: response.title?.trim() || conv.title,
        updatedAt: Date.now(),
        loaded: true,
        messages: [...conv.messages, { id: assistantId, role: 'assistant', content: '', createdAt: Date.now() }],
      }));

      const full = response.reply || '';
      if (prefersReducedMotion()) {
        this.replaceAssistant(nextId, assistantId, full);
      } else {
        const words = full.split(/(\s+)/);
        let acc = '';
        for (const chunk of words) {
          if (ticket !== this.gen) return false;
          acc += chunk;
          this.replaceAssistant(nextId, assistantId, acc);
          await this.wait(chunk.trim() ? 28 : 10);
        }
      }

      if (ticket === this.gen) this.streaming.set(false);
      return true;
    } catch (err) {
      if (ticket !== this.gen) return false;
      this.thinking.set(false);
      this.streaming.set(false);
      this.patchConversation(originId, (conv) => ({
        ...conv,
        messages: conv.messages.filter((m) => m.id !== userMsg.id),
      }));
      this.error.set(apiErrorMessage(err, "L'assistant n'a pas pu répondre."));
      return false;
    }
  }

  stop(): void {
    this.gen += 1;
    this.clearTimers();
    this.thinking.set(false);
    this.streaming.set(false);
  }

  private async loadDetail(id: number): Promise<void> {
    try {
      const detail = await firstValueFrom(this.api.getConversation(id));
      const mapped = fromDetail(detail);
      this.conversations.update((list) =>
        list
          .map((c) => (c.id === id ? { ...mapped, messages: mapped.messages } : c))
          .sort((a, b) => b.updatedAt - a.updatedAt),
      );
    } catch (err) {
      this.error.set(apiErrorMessage(err, 'Impossible de charger la conversation.'));
    }
  }

  private ensureConversation(): void {
    if (this.conversations().length === 0) {
      const created = emptyDraft();
      this.conversations.set([created]);
      this.activeId.set('draft');
      return;
    }
    if (!this.activeId() || !this.conversations().some((c) => c.id === this.activeId())) {
      this.activeId.set(this.conversations()[0].id);
    }
  }

  private renameId(from: AiConversationId, to: number): void {
    this.conversations.update((list) =>
      list.map((c) => (c.id === from ? { ...c, id: to, loaded: true } : c)),
    );
  }

  private replaceAssistant(conversationId: AiConversationId, messageId: string, content: string): void {
    this.patchConversation(conversationId, (conv) => ({
      ...conv,
      updatedAt: Date.now(),
      messages: conv.messages.map((m) => (m.id === messageId ? { ...m, content } : m)),
    }));
  }

  private patchConversation(
    id: AiConversationId,
    update: (conv: AiChatConversation) => AiChatConversation,
  ): void {
    this.conversations.update((list) =>
      list
        .map((c) => (c.id === id ? update(c) : c))
        .sort((a, b) => b.updatedAt - a.updatedAt),
    );
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
      const t = setTimeout(resolve, ms);
      this.timers.push(t);
    });
  }

  private clearTimers(): void {
    for (const t of this.timers) clearTimeout(t);
    this.timers = [];
  }
}
