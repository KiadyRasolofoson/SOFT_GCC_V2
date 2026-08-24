import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { isAdminRole } from '../../core/route-access';
import { GccPageHeader } from '../../ui/gcc-page-header';
import { GccAiChatPanel } from './gcc-ai-chat-panel';

@Component({
  selector: 'app-ai-chat-page',
  imports: [GccPageHeader, GccAiChatPanel],
  host: { class: 'flex min-h-0 flex-1 flex-col' },
  template: `
    <div class="gcc-ai-page-head shrink-0 border-b border-slate-200/70 bg-white/80 px-6 pt-5 lg:px-8">
      <gcc-page-header
        title="SoftTalent AI"
        subtitle="Assistant RH en lecture seule, connecté aux données Soft Talent."
        icon="smart_toy"
        [crumbs]="crumbs"
        [secondaryLabel]="isAdmin() ? 'Paramètres' : ''"
        secondaryIcon="settings"
        (secondaryAction)="openSettings()"
      />
    </div>
    <gcc-ai-chat-panel class="min-h-0 flex-1" [framed]="false" [showHeader]="false" />
  `,
})
export class AiChatPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly crumbs = [{ label: 'Assistant IA' }];
  readonly isAdmin = computed(() => isAdminRole(this.auth.user()?.roleTitle));

  openSettings(): void {
    void this.router.navigateByUrl('/soft-gcc/parametres/agent-ia');
  }
}
