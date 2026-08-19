import { Component, computed, inject, OnInit, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';
import { GccEmptyState } from '../../ui/gcc-empty-state';
import { GccPageHeader } from '../../ui/gcc-page-header';
import { AuthService } from '../../core/auth.service';
import {
  EVAL_SETTINGS_PERMISSIONS,
  SETTINGS_SECTIONS,
  SettingsSection,
  hasAnyFunctionalPermission,
  parseSettingsSection,
} from './evaluation.models';
import { SettingsAdminPanel } from './settings-admin.panel';
import { SettingsQuestionsPanel } from './settings-questions.panel';
import { SettingsTrainingsPanel } from './settings-trainings.panel';
import { SettingsTypesPanel } from './settings-types.panel';

@Component({
  selector: 'app-settings-page',
  imports: [
    GccPageHeader,
    GccEmptyState,
    MatTabsModule,
    MatIconModule,
    SettingsQuestionsPanel,
    SettingsTrainingsPanel,
    SettingsTypesPanel,
    SettingsAdminPanel,
  ],
  template: `
    <gcc-page-header
      [title]="header.title"
      [subtitle]="header.subtitle"
      [icon]="header.icon"
      [crumbs]="crumbs"
      [actionLabel]="actionLabel()"
      [actionIcon]="actionIcon()"
      (action)="onHeaderAction()"
    />

    @if (section() === 'administration' && !canAdmin()) {
      <gcc-empty-state
        variant="forbidden"
        title="Accès restreint"
        message="La configuration des durées est réservée aux administrateurs du module évaluations."
        actionLabel="Voir les questionnaires"
        actionIcon="quiz"
        (action)="selectSection('questionnaires')"
      />
    } @else {
      <div class="overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs sm:p-5">
        <mat-tab-group
          class="gcc-tabs"
          animationDuration="0"
          [selectedIndex]="tabIndex()"
          (selectedIndexChange)="onTabChange($event)"
        >
          <mat-tab>
            <ng-template mat-tab-label>
              <span class="inline-flex items-center gap-1.5">
                <mat-icon class="!h-4 !w-4 !text-[16px]">quiz</mat-icon>
                Questionnaires
              </span>
            </ng-template>
            <div class="pt-5">
              @if (section() === 'questionnaires') {
                <app-settings-questions-panel />
              }
            </div>
          </mat-tab>
          <mat-tab>
            <ng-template mat-tab-label>
              <span class="inline-flex items-center gap-1.5">
                <mat-icon class="!h-4 !w-4 !text-[16px]">school</mat-icon>
                Formations
              </span>
            </ng-template>
            <div class="pt-5">
              @if (section() === 'formations') {
                <app-settings-trainings-panel />
              }
            </div>
          </mat-tab>
          <mat-tab>
            <ng-template mat-tab-label>
              <span class="inline-flex items-center gap-1.5">
                <mat-icon class="!h-4 !w-4 !text-[16px]">category</mat-icon>
                Types
              </span>
            </ng-template>
            <div class="pt-5">
              @if (section() === 'types') {
                <app-settings-types-panel />
              }
            </div>
          </mat-tab>
          @if (canAdmin()) {
            <mat-tab>
              <ng-template mat-tab-label>
                <span class="inline-flex items-center gap-1.5">
                  <mat-icon class="!h-4 !w-4 !text-[16px]">timer</mat-icon>
                  Durées
                </span>
              </ng-template>
              <div class="pt-5">
                @if (section() === 'administration') {
                  <app-settings-admin-panel />
                }
              </div>
            </mat-tab>
          }
        </mat-tab-group>
      </div>
    }
  `,
})
export class SettingsPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly questionsPanel = viewChild(SettingsQuestionsPanel);
  private readonly trainingsPanel = viewChild(SettingsTrainingsPanel);
  private readonly typesPanel = viewChild(SettingsTypesPanel);

  readonly crumbs = [{ label: 'Paramètres' }, { label: 'Évaluations' }];
  readonly section = signal<SettingsSection>('questionnaires');
  readonly canAdmin = computed(() =>
    hasAnyFunctionalPermission(this.auth.user()?.permissions, EVAL_SETTINGS_PERMISSIONS),
  );

  readonly tabIndex = computed(() => {
    const visible = this.visibleSections();
    const index = visible.findIndex((item) => item.id === this.section());
    return Math.max(0, index);
  });

  readonly actionLabel = computed(() => {
    switch (this.section()) {
      case 'questionnaires':
        return 'Nouvelle question';
      case 'formations':
        return 'Nouvelle suggestion';
      case 'types':
        return 'Nouveau type';
      default:
        return '';
    }
  });

  readonly actionIcon = computed(() => (this.section() === 'administration' ? '' : 'add'));

  readonly header = {
    title: 'Gestion des évaluations',
    subtitle:
      'Pilotez le référentiel : questions, suggestions de formation, types de campagne et temps alloué au questionnaire.',
    icon: 'tune',
  };

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.applySection(parseSettingsSection(params.get('section')));
    });
  }

  ngOnInit(): void {
    this.applySection(parseSettingsSection(this.route.snapshot.paramMap.get('section')));
  }

  onTabChange(index: number): void {
    const next = this.visibleSections()[index];
    if (next && next.id !== this.section()) this.selectSection(next.id);
  }

  selectSection(section: SettingsSection): void {
    const path =
      section === 'questionnaires'
        ? '/soft-gcc/evaluations/parametres'
        : `/soft-gcc/evaluations/parametres/${section}`;
    void this.router.navigateByUrl(path);
  }

  onHeaderAction(): void {
    switch (this.section()) {
      case 'questionnaires':
        this.questionsPanel()?.openDialog();
        break;
      case 'formations':
        this.trainingsPanel()?.openDialog();
        break;
      case 'types':
        this.typesPanel()?.openDialog();
        break;
      default:
        break;
    }
  }

  private visibleSections() {
    return SETTINGS_SECTIONS.filter((item) => item.id !== 'administration' || this.canAdmin());
  }

  private applySection(section: SettingsSection): void {
    if (section === 'administration' && !this.canAdmin()) {
      this.section.set('questionnaires');
      return;
    }
    this.section.set(section);
  }
}
