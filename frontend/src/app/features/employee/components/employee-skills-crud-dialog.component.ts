import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { EmployeeSkillsProfileService } from '../../../core/employee-skills-profile.service';
import { GccSelect } from '../../../ui/gcc-select';
import { GccSelectOption } from '../../../ui/gcc.types';
import { SKILL_RANK_OPTIONS } from '../../skill-referential/skill-referential.models';

type JsonObject = Record<string, any>;
export type CrudKind = 'skill' | 'education' | 'language' | 'other';

const STATE_OPTIONS: GccSelectOption[] = [
  { label: 'Non évalué', value: '1' },
  { label: 'Validé par évaluation', value: '5' },
];

/**
 * Dialog générique d'ajout / édition des données de compétences d'un employé :
 * compétence, diplôme & formation, langue, autre formation.
 * `item` renseigné → édition (PUT), sinon création (POST).
 */
@Component({
  selector: 'app-employee-skills-crud-dialog',
  imports: [FormsModule, MatButtonModule, MatIconModule, GccSelect],
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-[1px]">
        <div class="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
          <div class="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3 class="text-lg font-semibold text-navy">{{ title() }}</h3>
              <p class="text-sm text-slate-500">{{ subtitle() }}</p>
            </div>
            <button mat-icon-button type="button" (click)="close()" aria-label="Fermer">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          @if (optionsLoading()) {
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-500">
              Chargement des référentiels…
            </div>
          } @else {
            <div class="grid gap-4">
              @switch (kind()) {
                @case ('skill') {
                  <label class="block">
                    <span class="mb-1.5 block text-xs font-medium uppercase tracking-[0.08em] text-slate-500">Compétence *</span>
                    <gcc-select [options]="skillOptions()" [value]="skillId()" (valueChange)="skillId.set($event)" placeholder="Sélectionner une compétence" />
                    @if (errors()['skillId']) {
                      <p class="mt-1 text-xs text-red-600">{{ errors()['skillId'] }}</p>
                    }
                  </label>
                  <p class="text-xs text-slate-500">Le domaine est dérivé automatiquement de la famille de la compétence.</p>
                }
                @case ('education') {
                  <label class="block">
                    <span class="mb-1.5 block text-xs font-medium uppercase tracking-[0.08em] text-slate-500">Filière *</span>
                    <gcc-select [options]="studyPathOptions()" [value]="studyPathId()" (valueChange)="studyPathId.set($event)" placeholder="Sélectionner une filière" />
                    @if (errors()['studyPathId']) {
                      <p class="mt-1 text-xs text-red-600">{{ errors()['studyPathId'] }}</p>
                    }
                  </label>
                  <label class="block">
                    <span class="mb-1.5 block text-xs font-medium uppercase tracking-[0.08em] text-slate-500">Niveau *</span>
                    <gcc-select [options]="degreeOptions()" [value]="degreeId()" (valueChange)="degreeId.set($event)" placeholder="Sélectionner un niveau" />
                    @if (errors()['degreeId']) {
                      <p class="mt-1 text-xs text-red-600">{{ errors()['degreeId'] }}</p>
                    }
                  </label>
                  <label class="block">
                    <span class="mb-1.5 block text-xs font-medium uppercase tracking-[0.08em] text-slate-500">École *</span>
                    <gcc-select [options]="schoolOptions()" [value]="schoolId()" (valueChange)="schoolId.set($event)" placeholder="Sélectionner une école" />
                    @if (errors()['schoolId']) {
                      <p class="mt-1 text-xs text-red-600">{{ errors()['schoolId'] }}</p>
                    }
                  </label>
                }
                @case ('language') {
                  <label class="block">
                    <span class="mb-1.5 block text-xs font-medium uppercase tracking-[0.08em] text-slate-500">Langue *</span>
                    <gcc-select [options]="languageOptions()" [value]="languageId()" (valueChange)="languageId.set($event)" placeholder="Sélectionner une langue" />
                    @if (errors()['languageId']) {
                      <p class="mt-1 text-xs text-red-600">{{ errors()['languageId'] }}</p>
                    }
                  </label>
                }
                @case ('other') {
                  <label class="block">
                    <span class="mb-1.5 block text-xs font-medium uppercase tracking-[0.08em] text-slate-500">Description *</span>
                    <input
                      type="text"
                      class="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-navy outline-none transition focus:border-accent"
                      [(ngModel)]="descriptionValue"
                    />
                    @if (errors()['description']) {
                      <p class="mt-1 text-xs text-red-600">{{ errors()['description'] }}</p>
                    }
                  </label>
                }
              }

              @if (kind() !== 'other') {
                <label class="block">
                  <span class="mb-1.5 block text-xs font-medium uppercase tracking-[0.08em] text-slate-500">État *</span>
                  <gcc-select [options]="stateOptions" [value]="state()" (valueChange)="onStateChange($event)" placeholder="Sélectionner un état" />
                  @if (errors()['state']) {
                    <p class="mt-1 text-xs text-red-600">{{ errors()['state'] }}</p>
                  }
                </label>
              }

              @if (kind() === 'skill') {
                <label class="block">
                  <span class="mb-1.5 block text-xs font-medium uppercase tracking-[0.08em] text-slate-500">Niveau acquis *</span>
                  <gcc-select [options]="rankOptions" [value]="acquiredLevel()" (valueChange)="acquiredLevel.set($event)" placeholder="Niveau 1 à 4" />
                  @if (errors()['acquiredLevel']) {
                    <p class="mt-1 text-xs text-red-600">{{ errors()['acquiredLevel'] }}</p>
                  }
                </label>
                @if (legacyPercent() > 0) {
                  <p class="text-xs text-slate-500">Ancien niveau legacy : {{ legacyPercent() }} % (lecture seule)</p>
                }
              }

              @if (showLevel() && kind() !== 'skill') {
                <label class="block">
                  <span class="mb-1.5 block text-xs font-medium uppercase tracking-[0.08em] text-slate-500">Niveau (en %)</span>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    class="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-navy outline-none transition focus:border-accent"
                    [(ngModel)]="levelValue"
                  />
                  @if (errors()['level']) {
                    <p class="mt-1 text-xs text-red-600">{{ errors()['level'] }}</p>
                  }
                </label>
              }

              @if (kind() === 'education' || kind() === 'other') {
                <div class="grid grid-cols-2 gap-3">
                  <label class="block">
                    <span class="mb-1.5 block text-xs font-medium uppercase tracking-[0.08em] text-slate-500">Date début</span>
                    <input
                      type="date"
                      class="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-navy outline-none transition focus:border-accent"
                      [(ngModel)]="startDateValue"
                    />
                    @if (errors()['startDate']) {
                      <p class="mt-1 text-xs text-red-600">{{ errors()['startDate'] }}</p>
                    }
                  </label>
                  <label class="block">
                    <span class="mb-1.5 block text-xs font-medium uppercase tracking-[0.08em] text-slate-500">Date fin</span>
                    <input
                      type="date"
                      class="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-navy outline-none transition focus:border-accent"
                      [(ngModel)]="endingDateValue"
                    />
                    @if (errors()['endingDate']) {
                      <p class="mt-1 text-xs text-red-600">{{ errors()['endingDate'] }}</p>
                    }
                  </label>
                </div>
              }

              @if (kind() === 'other') {
                <label class="block">
                  <span class="mb-1.5 block text-xs font-medium uppercase tracking-[0.08em] text-slate-500">Commentaires</span>
                  <textarea
                    rows="3"
                    class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-navy outline-none transition focus:border-accent"
                    [(ngModel)]="commentValue"
                    placeholder="Entrez vos commentaires ici"
                  ></textarea>
                </label>
              }

              @if (submitError()) {
                <p class="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{{ submitError() }}</p>
              }
            </div>
          }

          <div class="mt-6 flex justify-end gap-2">
            <button mat-stroked-button type="button" class="gcc-btn-secondary" (click)="close()">Annuler</button>
            <button mat-flat-button type="button" class="gcc-btn-primary" (click)="save()" [disabled]="submitting() || optionsLoading()">
              {{ submitting() ? 'Enregistrement…' : 'Enregistrer' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class EmployeeSkillsCrudDialogComponent {
  private readonly service = inject(EmployeeSkillsProfileService);

  readonly kind = input<CrudKind>('skill');
  readonly employeeId = input<number | null>(null);
  readonly item = input<JsonObject | null>(null);
  readonly open = input(false);

  readonly saved = output<void>();
  readonly closed = output<void>();

  readonly stateOptions = STATE_OPTIONS;
  readonly rankOptions = SKILL_RANK_OPTIONS;

  readonly optionsLoading = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly errors = signal<Record<string, string>>({});

  readonly domainOptions = signal<GccSelectOption[]>([]);
  readonly skillOptions = signal<GccSelectOption[]>([]);
  readonly studyPathOptions = signal<GccSelectOption[]>([]);
  readonly degreeOptions = signal<GccSelectOption[]>([]);
  readonly schoolOptions = signal<GccSelectOption[]>([]);
  readonly languageOptions = signal<GccSelectOption[]>([]);

  readonly domainSkillId = signal<string | null>(null);
  readonly skillId = signal<string | null>(null);
  readonly acquiredLevel = signal<string | null>(null);
  readonly legacyPercent = signal(0);
  readonly studyPathId = signal<string | null>(null);
  readonly degreeId = signal<string | null>(null);
  readonly schoolId = signal<string | null>(null);
  readonly languageId = signal<string | null>(null);
  readonly state = signal<string | null>(null);
  readonly level = signal(0);
  readonly description = signal('');
  readonly startDate = signal('');
  readonly endingDate = signal('');
  readonly comment = signal('');

  readonly showLevel = signal(false);

  // Aliases [(ngModel)] sur signaux
  get levelValue(): number {
    return this.level();
  }
  set levelValue(value: number) {
    this.level.set(Number(value) || 0);
  }
  get descriptionValue(): string {
    return this.description();
  }
  set descriptionValue(value: string) {
    this.description.set(value);
  }
  get startDateValue(): string {
    return this.startDate();
  }
  set startDateValue(value: string) {
    this.startDate.set(value);
  }
  get endingDateValue(): string {
    return this.endingDate();
  }
  set endingDateValue(value: string) {
    this.endingDate.set(value);
  }
  get commentValue(): string {
    return this.comment();
  }
  set commentValue(value: string) {
    this.comment.set(value);
  }

  readonly title = signal('');
  readonly subtitle = signal('');

  constructor() {
    effect(() => {
      if (this.open()) {
        void this.prepare();
      }
    });
  }

  onStateChange(value: string | null): void {
    this.state.set(value);
    this.showLevel.set(value === '5');
    if (value !== '5') {
      this.level.set(0);
    }
  }

  close(): void {
    this.closed.emit();
  }

  async save(): Promise<void> {
    const validation = this.validate();
    this.errors.set(validation);
    if (Object.keys(validation).length > 0) return;

    const employeeId = this.employeeId();
    if (!employeeId) return;

    this.submitting.set(true);
    this.submitError.set(null);

    try {
      const now = new Date().toISOString();
      const edit = this.item();
      switch (this.kind()) {
        case 'skill': {
          const payload: Record<string, any> = {
            employeeId,
            skillId: Number(this.skillId()),
            state: Number(this.state()),
            acquiredLevel: Number(this.acquiredLevel()),
            level: this.legacyPercent() || 0,
            creationDate: now,
            updateDate: now,
          };
          if (edit) {
            await this.service.updateSkill(Number(edit['employeeSkillId']), { ...payload, employeeSkillId: Number(edit['employeeSkillId']) });
          } else {
            await this.service.createSkill(payload);
          }
          break;
        }
        case 'education': {
          const payload: Record<string, any> = {
            employeeId,
            studyPathId: Number(this.studyPathId()),
            degreeId: Number(this.degreeId()),
            schoolId: Number(this.schoolId()),
            state: Number(this.state() ?? 1),
            startDate: this.startDate() || null,
            endingDate: this.endingDate() || null,
            creationDate: now,
            updateDate: now,
          };
          if (edit) {
            await this.service.updateEducation(Number(edit['employeeEducationId']), { ...payload, employeeEducationId: Number(edit['employeeEducationId']) });
          } else {
            await this.service.createEducation(payload);
          }
          break;
        }
        case 'language': {
          const payload: Record<string, any> = {
            employeeId,
            language_id: Number(this.languageId()),
            state: Number(this.state()),
            level: this.showLevel() ? Number(this.level()) : 0,
            creationDate: now,
            updateDate: now,
          };
          if (edit) {
            await this.service.updateLanguage(Number(edit['employeeLanguageId']), { ...payload, employeeLanguageId: Number(edit['employeeLanguageId']) });
          } else {
            await this.service.createLanguage(payload);
          }
          break;
        }
        case 'other': {
          const payload: Record<string, any> = {
            employeeId,
            description: this.description(),
            startDate: this.startDate() || null,
            endDate: this.endingDate() || null,
            comment: this.comment(),
            state: Number(this.state() ?? 1),
            creationDate: now,
            updateDate: now,
          };
          if (edit) {
            await this.service.updateOtherSkill(Number(edit['employeeOtherFormationId']), { ...payload, employeeOtherFormationId: Number(edit['employeeOtherFormationId']) });
          } else {
            await this.service.createOtherSkill(payload);
          }
          break;
        }
      }
      this.saved.emit();
    } catch (err: any) {
      this.submitError.set(this.errorMessage(err));
    } finally {
      this.submitting.set(false);
    }
  }

  private async prepare(): Promise<void> {
    this.resetForm();
    this.errors.set({});
    this.submitError.set(null);
    this.title.set(this.item() ? `Modifier ${this.kindLabel()}` : `Ajouter ${this.kindLabel()}`);
    this.subtitle.set(this.item() ? 'Mettez à jour les informations.' : 'Renseignez les informations puis validez.');
    this.optionsLoading.set(true);

    try {
      await this.loadRefs();
      this.prefill(this.item());
    } catch {
      this.submitError.set('Impossible de charger les données nécessaires.');
    } finally {
      this.optionsLoading.set(false);
    }
  }

  private async loadRefs(): Promise<void> {
    switch (this.kind()) {
      case 'skill': {
        const skills = await this.service.loadSkills();
        const options = skills.map((s) => ({
          label: `${s['name'] ?? ''}${s['code'] ? ` (${s['code']})` : ''}`,
          value: String(s['skillId']),
        }));
        const current = this.item();
        if (current?.['skillId'] && !options.some((opt) => opt.value === String(current['skillId']))) {
          options.unshift({
            label: String(current['skillName'] ?? current['skillId']),
            value: String(current['skillId']),
          });
        }
        this.skillOptions.set(options);
        break;
      }
      case 'education': {
        const [paths, degrees, schools] = await Promise.all([
          this.service.loadStudyPaths(),
          this.service.loadDegrees(),
          this.service.loadSchools(),
        ]);
        this.studyPathOptions.set(paths.map((p) => ({ label: String(p['studyPathName'] ?? ''), value: String(p['studyPathId']) })));
        this.degreeOptions.set(degrees.map((d) => ({ label: String(d['name'] ?? ''), value: String(d['degreeId']) })));
        this.schoolOptions.set(schools.map((s) => ({ label: String(s['name'] ?? ''), value: String(s['schoolId']) })));
        break;
      }
      case 'language': {
        const languages = await this.service.loadLanguages();
        this.languageOptions.set(languages.map((l) => ({ label: String(l['name'] ?? ''), value: String(l['languageId']) })));
        break;
      }
    }
  }

  private prefill(item: JsonObject | null): void {
    if (!item) {
      // Défauts
      if (this.kind() === 'education' || this.kind() === 'other') {
        this.state.set('1');
      }
      return;
    }
    switch (this.kind()) {
      case 'skill':
        this.domainSkillId.set(String(item['domainSkillId'] ?? ''));
        this.skillId.set(String(item['skillId'] ?? ''));
        this.state.set(String(item['state'] ?? ''));
        this.level.set(Number(item['level']) || 0);
        this.legacyPercent.set(Number(item['level']) || 0);
        this.acquiredLevel.set(item['acquiredLevel'] ? String(item['acquiredLevel']) : null);
        break;
      case 'education':
        this.studyPathId.set(String(item['studyPathId'] ?? ''));
        this.degreeId.set(String(item['degreeId'] ?? ''));
        this.schoolId.set(String(item['schoolId'] ?? ''));
        this.state.set(String(item['state'] ?? '1'));
        this.startDate.set(this.toInputDate(item['startDate']));
        this.endingDate.set(this.toInputDate(item['endingDate']));
        break;
      case 'language':
        this.languageId.set(String(item['languageId'] ?? ''));
        this.state.set(String(item['state'] ?? ''));
        this.level.set(Number(item['level']) || 0);
        break;
      case 'other':
        this.description.set(String(item['description'] ?? ''));
        this.startDate.set(this.toInputDate(item['startDate']));
        this.endingDate.set(this.toInputDate(item['endDate']));
        this.comment.set(String(item['comment'] ?? ''));
        this.state.set(String(item['state'] ?? '1'));
        break;
    }
    this.showLevel.set(this.state() === '5');
  }

  private resetForm(): void {
    this.domainSkillId.set(null);
    this.skillId.set(null);
    this.acquiredLevel.set(null);
    this.legacyPercent.set(0);
    this.studyPathId.set(null);
    this.degreeId.set(null);
    this.schoolId.set(null);
    this.languageId.set(null);
    this.state.set(null);
    this.level.set(0);
    this.description.set('');
    this.startDate.set('');
    this.endingDate.set('');
    this.comment.set('');
    this.showLevel.set(false);
  }

  private validate(): Record<string, string> {
    const errors: Record<string, string> = {};
    switch (this.kind()) {
      case 'skill':
        if (!this.skillId()) errors['skillId'] = 'La compétence est requise.';
        if (!this.state()) errors['state'] = "L'état est requis.";
        if (!this.acquiredLevel() || !['1', '2', '3', '4'].includes(this.acquiredLevel()!)) {
          errors['acquiredLevel'] = 'Choisissez un niveau de 1 à 4.';
        }
        break;
      case 'education':
        if (!this.studyPathId()) errors['studyPathId'] = 'Veuillez sélectionner une filière.';
        if (!this.degreeId()) errors['degreeId'] = 'Veuillez sélectionner un niveau.';
        if (!this.schoolId()) errors['schoolId'] = 'Veuillez sélectionner une école.';
        if (!this.startDate()) errors['startDate'] = 'Veuillez entrer une date de début.';
        break;
      case 'language':
        if (!this.languageId()) errors['languageId'] = 'Veuillez sélectionner une langue.';
        if (!this.state()) errors['state'] = 'Veuillez sélectionner un état.';
        if (this.showLevel() && (Number(this.level()) < 1 || Number(this.level()) > 100)) {
          errors['level'] = 'Le niveau doit être compris entre 1 et 100.';
        }
        break;
      case 'other':
        if (!this.description()) errors['description'] = 'Veuillez entrer une description.';
        if (!this.startDate()) errors['startDate'] = 'Veuillez entrer une date.';
        if (!this.endingDate()) errors['endingDate'] = 'Veuillez entrer une date.';
        if (this.startDate() && !this.isValidPastDate(this.startDate())) errors['startDate'] = 'Veuillez entrer une date valide.';
        if (this.endingDate() && !this.isValidPastDate(this.endingDate())) errors['endingDate'] = 'Veuillez entrer une date valide.';
        break;
    }
    return errors;
  }

  private isValidPastDate(value: string): boolean {
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return false;
    const min = new Date('1900-01-01T00:00:00');
    const now = new Date();
    return date >= min && date <= now;
  }

  private kindLabel(): string {
    switch (this.kind()) {
      case 'skill':
        return 'une compétence';
      case 'education':
        return 'un diplôme & formation';
      case 'language':
        return 'une compétence linguistique';
      case 'other':
        return 'une autre formation';
    }
  }

  private toInputDate(value: unknown): string {
    if (!value) return '';
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) return '';
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private errorMessage(err: any): string {
    const status = err?.status;
    if (status === 401 || status === 403) {
      return 'Action non autorisée. Vérifiez vos permissions.';
    }
    const body = err?.error;
    if (typeof body === 'string' && body.trim()) return body.trim();
    if (body && typeof body === 'object') {
      const msg = body.message ?? body.Message ?? body.title ?? body.detail;
      if (typeof msg === 'string' && msg.trim()) return msg.trim();
    }
    return "Erreur lors de l'enregistrement.";
  }
}
