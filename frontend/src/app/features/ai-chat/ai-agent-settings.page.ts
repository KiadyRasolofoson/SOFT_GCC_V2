import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { isAdminRole } from '../../core/route-access';
import { UserAdminService } from '../users/user-admin.service';
import { GccEmptyState } from '../../ui/gcc-empty-state';
import { GccPageHeader } from '../../ui/gcc-page-header';
import { GccSelect } from '../../ui/gcc-select';
import { GccStatusTag } from '../../ui/gcc-status-tag';
import { GccSelectOption } from '../../ui/gcc.types';
import { AiAgentApi, apiErrorMessage } from './ai-agent.api';
import { AiProviderCatalog, AiToolInfo, AiToolPermission, UpsertAiToolPermission } from './ai-agent.models';

const ENABLED_OPTIONS: GccSelectOption[] = [
  { label: 'Activé', value: 'true' },
  { label: 'Désactivé', value: 'false' },
];

interface ProviderDraft {
  id: string;
  displayName: string;
  requiresApiKey: boolean;
  suggestedModels: string[];
  baseUrl: string;
  defaultModel: string | null;
  apiKey: string;
  hasApiKey: boolean;
  saving: boolean;
  testing: boolean;
  testOk: boolean | null;
  testMessage: string;
}

@Component({
  selector: 'app-ai-agent-settings-page',
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTableModule,
    MatTabsModule,
    GccPageHeader,
    GccEmptyState,
    GccSelect,
    GccStatusTag,
  ],
  template: `
    <gcc-page-header
      title="Agent IA"
      subtitle="Activez l’assistant, choisissez le fournisseur LLM et contrôlez les outils de lecture."
      icon="smart_toy"
      [crumbs]="crumbs"
      secondaryLabel="Ouvrir l’assistant"
      secondaryIcon="chat"
      (secondaryAction)="openAssistant()"
    />

    @if (!isAdmin()) {
      <gcc-empty-state
        variant="forbidden"
        title="Accès restreint"
        message="Le paramétrage de l’agent IA est réservé aux administrateurs."
        actionLabel="Retour à l’assistant"
        actionIcon="smart_toy"
        (action)="openAssistant()"
      />
    } @else {
      <div class="overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs sm:p-5">
        @if (loading()) {
          <mat-progress-bar mode="indeterminate" />
        }

        @if (error()) {
          <gcc-empty-state
            class="mt-4 block"
            variant="error"
            title="Impossible de charger la configuration"
            [message]="error()!"
            actionLabel="Réessayer"
            actionIcon="refresh"
            (action)="reload()"
          />
        } @else if (!loading()) {
          <mat-tab-group class="gcc-tabs" animationDuration="0">
            <mat-tab>
              <ng-template mat-tab-label>
                <span class="inline-flex items-center gap-1.5">
                  <mat-icon class="!h-4 !w-4 !text-[16px]">tune</mat-icon>
                  Général
                </span>
              </ng-template>
              <div class="grid gap-5 pt-5 sm:grid-cols-2">
                <div>
                  <label class="mb-1 block text-sm font-medium text-slate-600">État</label>
                  <gcc-select [options]="enabledOptions" [(value)]="isEnabled" />
                </div>
                <div>
                  <label class="mb-1 block text-sm font-medium text-slate-600">Fournisseur actif</label>
                  <gcc-select
                    [options]="providerOptions()"
                    [value]="provider"
                    placeholder="Choisir un fournisseur"
                    (valueChange)="onProviderChange($event)"
                  />
                </div>
                <div>
                  <label class="mb-1 block text-sm font-medium text-slate-600">Modèle</label>
                  <gcc-select [options]="modelOptions()" [(value)]="activeModel" placeholder="Choisir un modèle" />
                  <input
                    class="gcc-input mt-2"
                    type="text"
                    name="customModel"
                    [(ngModel)]="activeModel"
                    placeholder="Ou saisir un modèle personnalisé"
                  />
                </div>
                <div class="grid grid-cols-2 gap-4 lg:grid-cols-3">
                  <div>
                    <label class="mb-1 block text-sm font-medium text-slate-600" for="temperature">Température</label>
                    <input
                      id="temperature"
                      class="gcc-input"
                      type="number"
                      min="0"
                      max="2"
                      step="0.1"
                      name="temperature"
                      [(ngModel)]="temperature"
                    />
                  </div>
                  <div>
                    <label class="mb-1 block text-sm font-medium text-slate-600" for="maxTokens">Max tokens</label>
                    <input
                      id="maxTokens"
                      class="gcc-input"
                      type="number"
                      min="64"
                      max="8192"
                      step="64"
                      name="maxTokens"
                      [(ngModel)]="maxTokens"
                    />
                  </div>
                  <div>
                    <label class="mb-1 block text-sm font-medium text-slate-600" for="maxToolRounds">Max. appels d’outils</label>
                    <input
                      id="maxToolRounds"
                      class="gcc-input"
                      type="number"
                      min="1"
                      max="40"
                      step="1"
                      name="maxToolRounds"
                      [(ngModel)]="maxToolRounds"
                    />
                    <p class="mt-1 text-[11px] text-slate-400">Tours d’outils par message (1 à 40).</p>
                  </div>
                </div>
              </div>
              @if (saveMessage()) {
                <p class="mt-4 text-xs font-semibold" [class]="saveOk() ? 'text-emerald-700' : 'text-red-600'">
                  {{ saveMessage() }}
                </p>
              }
              <div class="mt-6 flex justify-end gap-2">
                <button mat-stroked-button class="gcc-btn-secondary !rounded-xl" type="button" (click)="reload()">
                  Annuler
                </button>
                <button
                  mat-flat-button
                  class="gcc-btn-primary !rounded-xl"
                  type="button"
                  [disabled]="saving()"
                  (click)="saveGeneral()"
                >
                  {{ saving() ? 'Enregistrement…' : 'Enregistrer' }}
                </button>
              </div>
            </mat-tab>

            <mat-tab>
              <ng-template mat-tab-label>
                <span class="inline-flex items-center gap-1.5">
                  <mat-icon class="!h-4 !w-4 !text-[16px]">vpn_key</mat-icon>
                  Fournisseurs
                </span>
              </ng-template>
              <div class="grid gap-4 pt-5">
                @for (row of providers; track row.id) {
                  <article class="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs sm:p-5">
                    <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p class="text-sm font-bold text-navy">{{ row.displayName }}</p>
                        <p class="mt-0.5 text-xs text-slate-500">
                          {{ row.requiresApiKey ? 'Clé API requise' : 'Clé API optionnelle (Ollama local)' }}
                        </p>
                      </div>
                      <gcc-status-tag
                        [status]="row.hasApiKey ? 'ok' : row.requiresApiKey ? 'gap' : 'pending'"
                        [label]="row.hasApiKey ? 'Clé enregistrée' : row.requiresApiKey ? 'Clé manquante' : 'Sans clé'"
                      />
                    </div>
                    <div class="grid gap-4 sm:grid-cols-2">
                      <div class="sm:col-span-2">
                        <label class="mb-1 block text-sm font-medium text-slate-600">URL de base</label>
                        <input class="gcc-input" type="url" [(ngModel)]="row.baseUrl" [name]="'base-' + row.id" />
                      </div>
                      <div>
                        <label class="mb-1 block text-sm font-medium text-slate-600">Modèle par défaut</label>
                        <gcc-select
                          [options]="modelOptionsFor(row)"
                          [(value)]="row.defaultModel"
                          placeholder="Modèle"
                        />
                      </div>
                      <div>
                        <label class="mb-1 block text-sm font-medium text-slate-600">Clé API</label>
                        <input
                          class="gcc-input"
                          type="password"
                          autocomplete="new-password"
                          [(ngModel)]="row.apiKey"
                          [name]="'key-' + row.id"
                          [placeholder]="row.hasApiKey ? '•••••••• (inchangée si vide)' : 'Saisir la clé'"
                        />
                      </div>
                    </div>
                    @if (row.testMessage) {
                      <p class="mt-3 text-xs font-semibold" [class]="row.testOk ? 'text-emerald-700' : 'text-red-600'">
                        {{ row.testMessage }}
                      </p>
                    }
                    <div class="mt-4 flex flex-wrap justify-end gap-2">
                      @if (row.hasApiKey) {
                        <button
                          mat-stroked-button
                          class="gcc-btn-secondary !rounded-xl"
                          type="button"
                          [disabled]="row.saving"
                          (click)="clearKey(row)"
                        >
                          Effacer la clé
                        </button>
                      }
                      <button
                        mat-stroked-button
                        class="gcc-btn-secondary !rounded-xl"
                        type="button"
                        [disabled]="row.testing || row.saving"
                        (click)="testProvider(row)"
                      >
                        {{ row.testing ? 'Test…' : 'Tester' }}
                      </button>
                      <button
                        mat-flat-button
                        class="gcc-btn-primary !rounded-xl"
                        type="button"
                        [disabled]="row.saving"
                        (click)="saveProvider(row)"
                      >
                        {{ row.saving ? 'Enregistrement…' : 'Enregistrer' }}
                      </button>
                    </div>
                  </article>
                }
              </div>
            </mat-tab>

            <mat-tab>
              <ng-template mat-tab-label>
                <span class="inline-flex items-center gap-1.5">
                  <mat-icon class="!h-4 !w-4 !text-[16px]">handyman</mat-icon>
                  Outils
                </span>
              </ng-template>
              <div class="pt-5">
                <p class="mb-4 max-w-2xl text-sm text-slate-500">
                  Par défaut, un outil est autorisé si le rôle a déjà la permission Soft Talent correspondante.
                  Un refus ici bloque l’outil sans élargir les droits RBAC.
                </p>
                <div class="mb-4 max-w-sm">
                  <label class="mb-1 block text-sm font-medium text-slate-600">Rôle</label>
                  <gcc-select
                    [options]="roleOptions"
                    [value]="roleId"
                    placeholder="Choisir un rôle"
                    (valueChange)="onRoleChange($event)"
                  />
                </div>

                @if (!roleId) {
                  <gcc-empty-state title="Choisissez un rôle" message="Sélectionnez un rôle pour autoriser ou refuser les outils de lecture." />
                } @else if (!tools.length) {
                  <gcc-empty-state title="Aucun outil" message="Le catalogue d’outils de l’agent est vide." />
                } @else {
                  <div class="gcc-table overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
                    <table mat-table [dataSource]="tools" class="w-full">
                      <ng-container matColumnDef="tool">
                        <th mat-header-cell *matHeaderCellDef>Outil</th>
                        <td mat-cell *matCellDef="let row">
                          <p class="font-mono text-xs font-bold text-navy">{{ row.key }}</p>
                          <p class="mt-0.5 max-w-md text-xs text-slate-500">{{ row.description }}</p>
                        </td>
                      </ng-container>
                      <ng-container matColumnDef="permissions">
                        <th mat-header-cell *matHeaderCellDef>Permissions</th>
                        <td mat-cell *matCellDef="let row">
                          <p class="max-w-xs text-[11px] font-medium text-slate-500">
                            {{ row.requiredPermissions.join(', ') || '—' }}
                          </p>
                        </td>
                      </ng-container>
                      <ng-container matColumnDef="access">
                        <th mat-header-cell *matHeaderCellDef>Accès</th>
                        <td mat-cell *matCellDef="let row">
                          <div class="inline-flex overflow-hidden rounded-xl border border-slate-200">
                            <button
                              type="button"
                              class="px-3 py-1.5 text-xs font-bold"
                              [class]="toolAccess[row.key] !== false ? 'bg-indigo-50 text-indigo-pro' : 'bg-white text-slate-500'"
                              (click)="setToolAccess(row.key, true)"
                            >
                              Autorisé
                            </button>
                            <button
                              type="button"
                              class="border-l border-slate-200 px-3 py-1.5 text-xs font-bold"
                              [class]="toolAccess[row.key] === false ? 'bg-red-50 text-red-700' : 'bg-white text-slate-500'"
                              (click)="setToolAccess(row.key, false)"
                            >
                              Refusé
                            </button>
                          </div>
                        </td>
                      </ng-container>
                      <tr mat-header-row *matHeaderRowDef="toolColumns"></tr>
                      <tr mat-row *matRowDef="let row; columns: toolColumns"></tr>
                    </table>
                  </div>
                  @if (toolsMessage()) {
                    <p class="mt-4 text-xs font-semibold" [class]="toolsOk() ? 'text-emerald-700' : 'text-red-600'">
                      {{ toolsMessage() }}
                    </p>
                  }
                  <div class="mt-4 flex justify-end">
                    <button
                      mat-flat-button
                      class="gcc-btn-primary !rounded-xl"
                      type="button"
                      [disabled]="savingTools()"
                      (click)="saveTools()"
                    >
                      {{ savingTools() ? 'Enregistrement…' : 'Enregistrer les accès' }}
                    </button>
                  </div>
                }
              </div>
            </mat-tab>
          </mat-tab-group>
        }
      </div>
    }
  `,
})
export class AiAgentSettingsPage implements OnInit {
  private readonly api = inject(AiAgentApi);
  private readonly auth = inject(AuthService);
  private readonly users = inject(UserAdminService);
  private readonly router = inject(Router);

  readonly crumbs = [{ label: 'Paramètres' }, { label: 'Agent IA' }];
  readonly enabledOptions = ENABLED_OPTIONS;
  readonly toolColumns = ['tool', 'permissions', 'access'];
  readonly isAdmin = computed(() => isAdminRole(this.auth.user()?.roleTitle));

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly savingTools = signal(false);
  readonly error = signal<string | null>(null);
  readonly saveMessage = signal<string | null>(null);
  readonly saveOk = signal(false);
  readonly toolsMessage = signal<string | null>(null);
  readonly toolsOk = signal(false);

  isEnabled: string | null = 'false';
  provider: string | null = null;
  activeModel: string | null = null;
  temperature = 0.3;
  maxTokens = 2048;
  maxToolRounds = 15;
  catalog: AiProviderCatalog[] = [];
  providers: ProviderDraft[] = [];
  tools: AiToolInfo[] = [];
  permissions: AiToolPermission[] = [];
  roleOptions: GccSelectOption[] = [];
  roleId: string | null = null;
  toolAccess: Record<string, boolean> = {};

  ngOnInit(): void {
    if (this.isAdmin()) this.reload();
  }

  providerOptions(): GccSelectOption[] {
    return this.catalog.map((p) => ({ label: p.displayName, value: p.id }));
  }

  modelOptions(): GccSelectOption[] {
    const current = this.catalog.find((p) => p.id === this.provider);
    return this.toModelOptions(current?.suggestedModels ?? [], this.activeModel);
  }

  modelOptionsFor(row: ProviderDraft): GccSelectOption[] {
    return this.toModelOptions(row.suggestedModels, row.defaultModel);
  }

  openAssistant(): void {
    void this.router.navigateByUrl('/soft-gcc/assistant');
  }

  reload(): void {
    this.loading.set(true);
    this.error.set(null);
    this.saveMessage.set(null);
    this.toolsMessage.set(null);
    void this.loadAll();
  }

  async saveGeneral(): Promise<void> {
    this.saving.set(true);
    this.saveMessage.set(null);
    try {
      const settings = await firstValueFrom(
        this.api.updateSettings({
          provider: this.provider ?? undefined,
          model: this.activeModel?.trim() || undefined,
          isEnabled: this.isEnabled === 'true',
          maxTokens: Number(this.maxTokens) || 2048,
          maxToolRounds: Number(this.maxToolRounds) || 15,
          temperature: Number(this.temperature),
        }),
      );
      this.applySettings(settings);
      this.saveOk.set(true);
      this.saveMessage.set('Paramètres généraux enregistrés.');
    } catch (err) {
      this.saveOk.set(false);
      this.saveMessage.set(apiErrorMessage(err, 'Impossible d’enregistrer les paramètres.'));
    } finally {
      this.saving.set(false);
    }
  }

  async saveProvider(row: ProviderDraft): Promise<void> {
    row.saving = true;
    row.testMessage = '';
    try {
      const updated = await firstValueFrom(
        this.api.updateProvider(row.id, {
          baseUrl: row.baseUrl.trim() || undefined,
          defaultModel: row.defaultModel?.trim() || undefined,
          apiKey: row.apiKey.trim() || undefined,
        }),
      );
      row.hasApiKey = updated.hasApiKey;
      row.baseUrl = updated.baseUrl ?? '';
      row.defaultModel = updated.defaultModel ?? null;
      row.apiKey = '';
      row.testOk = true;
      row.testMessage = 'Fournisseur enregistré.';
    } catch (err) {
      row.testOk = false;
      row.testMessage = apiErrorMessage(err, 'Impossible d’enregistrer ce fournisseur.');
    } finally {
      row.saving = false;
    }
  }

  async clearKey(row: ProviderDraft): Promise<void> {
    row.saving = true;
    try {
      const updated = await firstValueFrom(
        this.api.updateProvider(row.id, { clearApiKey: true, baseUrl: row.baseUrl.trim() || undefined }),
      );
      row.hasApiKey = updated.hasApiKey;
      row.apiKey = '';
      row.testOk = true;
      row.testMessage = 'Clé API effacée.';
    } catch (err) {
      row.testOk = false;
      row.testMessage = apiErrorMessage(err, 'Impossible d’effacer la clé.');
    } finally {
      row.saving = false;
    }
  }

  async testProvider(row: ProviderDraft): Promise<void> {
    row.testing = true;
    row.testMessage = '';
    try {
      const result = await firstValueFrom(this.api.testProvider(row.id));
      row.testOk = result.success;
      row.testMessage = result.message || (result.success ? 'Connexion réussie.' : 'Échec du test.');
    } catch (err) {
      row.testOk = false;
      row.testMessage = apiErrorMessage(err, 'Le test du fournisseur a échoué.');
    } finally {
      row.testing = false;
    }
  }

  onProviderChange(value: string | null): void {
    this.provider = value;
    const catalog = this.catalog.find((p) => p.id === value);
    const cfg = this.providers.find((p) => p.id === value);
    this.activeModel = cfg?.defaultModel || catalog?.suggestedModels[0] || this.activeModel;
  }

  onRoleChange(value: string | null): void {
    this.roleId = value;
    this.syncToolAccess();
  }

  setToolAccess(toolKey: string, allowed: boolean): void {
    this.toolAccess = { ...this.toolAccess, [toolKey]: allowed };
  }

  async saveTools(): Promise<void> {
    if (!this.roleId) return;
    this.savingTools.set(true);
    this.toolsMessage.set(null);
    const role = Number(this.roleId);
    const kept: UpsertAiToolPermission[] = this.permissions
      .filter((p) => p.userId != null || p.roleId !== role)
      .map((p) => ({
        roleId: p.userId != null ? null : p.roleId,
        userId: p.userId ?? null,
        toolKey: p.toolKey,
        isAllowed: p.isAllowed,
      }));
    const denies = this.tools
      .filter((t) => this.toolAccess[t.key] === false)
      .map((t) => ({ roleId: role, userId: null, toolKey: t.key, isAllowed: false }));
    try {
      this.permissions = await firstValueFrom(this.api.replaceToolPermissions([...kept, ...denies]));
      this.syncToolAccess();
      this.toolsOk.set(true);
      this.toolsMessage.set('Règles d’accès enregistrées.');
    } catch (err) {
      this.toolsOk.set(false);
      this.toolsMessage.set(apiErrorMessage(err, 'Impossible d’enregistrer les accès outils.'));
    } finally {
      this.savingTools.set(false);
    }
  }

  private async loadAll(): Promise<void> {
    try {
      const [settings, catalog, tools, permissions, roles] = await Promise.all([
        firstValueFrom(this.api.getSettings()),
        firstValueFrom(this.api.getProviders()),
        firstValueFrom(this.api.getTools()),
        firstValueFrom(this.api.getToolPermissions()),
        firstValueFrom(this.users.getRoles()),
      ]);
      this.catalog = catalog ?? [];
      this.applySettings(settings);
      this.tools = tools?.tools ?? [];
      this.permissions = permissions ?? [];
      this.roleOptions = (roles ?? []).map((r) => ({ label: r.title, value: String(r.roleId) }));
      if (!this.roleId && this.roleOptions[0]) this.roleId = this.roleOptions[0].value;
      this.syncToolAccess();
    } catch (err) {
      this.error.set(apiErrorMessage(err, 'Impossible de charger la configuration de l’agent.'));
    } finally {
      this.loading.set(false);
    }
  }

  private applySettings(settings: {
    activeProvider: string;
    activeModel: string;
    isEnabled: boolean;
    maxTokens: number;
    maxToolRounds?: number;
    temperature: number;
    providers: { provider: string; baseUrl?: string | null; defaultModel?: string | null; hasApiKey: boolean }[];
  }): void {
    this.isEnabled = settings.isEnabled ? 'true' : 'false';
    this.provider = settings.activeProvider || null;
    this.activeModel = settings.activeModel || null;
    this.maxTokens = settings.maxTokens;
    this.maxToolRounds = settings.maxToolRounds || 15;
    this.temperature = settings.temperature;
    const byId = new Map(settings.providers.map((p) => [p.provider, p]));
    this.providers = this.catalog.map((item) => {
      const cfg = byId.get(item.id);
      return {
        id: item.id,
        displayName: item.displayName,
        requiresApiKey: item.requiresApiKey,
        suggestedModels: item.suggestedModels ?? [],
        baseUrl: cfg?.baseUrl ?? item.defaultBaseUrl,
        defaultModel: cfg?.defaultModel ?? item.suggestedModels[0] ?? null,
        apiKey: '',
        hasApiKey: cfg?.hasApiKey ?? false,
        saving: false,
        testing: false,
        testOk: null,
        testMessage: '',
      };
    });
  }

  private syncToolAccess(): void {
    const role = Number(this.roleId);
    const next: Record<string, boolean> = {};
    for (const tool of this.tools) {
      const rule = this.permissions.find((p) => p.roleId === role && p.userId == null && p.toolKey === tool.key);
      next[tool.key] = rule ? rule.isAllowed : true;
    }
    this.toolAccess = next;
  }

  private toModelOptions(suggested: string[], current: string | null): GccSelectOption[] {
    const models = [...suggested];
    if (current && !models.includes(current)) models.unshift(current);
    return models.map((m) => ({ label: m, value: m }));
  }
}
