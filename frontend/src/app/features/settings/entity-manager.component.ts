import { Component, computed, inject, input, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { EntityCrudService } from '../../core/entity-crud.service';
import { EntityConfig } from './entity.config';

interface EntityRow {
  [key: string]: any;
}

@Component({
  selector: 'app-entity-manager',
  imports: [FormsModule, MatButtonModule, MatIconModule, MatPaginatorModule, NgClass],
  host: { class: 'block' },
  template: `
    <div class="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="mb-3 flex items-center gap-2 text-sm font-semibold text-navy">
        <mat-icon class="!h-4 !w-4 !text-[18px] text-slate-500">tune</mat-icon>
        <span>Filtrer les paramètres</span>
        <span class="ml-auto rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-accent">
          {{ filteredEntities().length }} / {{ entities().length }}
        </span>
      </div>
      <label class="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm text-navy">
        <mat-icon class="!h-5 !w-5 !text-[20px] text-slate-400">search</mat-icon>
        <input
          class="w-full border-0 bg-transparent text-sm text-navy outline-none placeholder:text-slate-400"
          placeholder="Rechercher un paramètre…"
          [(ngModel)]="tabFilter"
          (ngModelChange)="onTabFilterChange()"
        />
        @if (tabFilter()) {
          <button mat-icon-button type="button" class="!h-7 !w-7" (click)="clearTabFilter()" aria-label="Effacer">
            <mat-icon class="!text-[16px]">close</mat-icon>
          </button>
        }
      </label>
    </div>

    <div class="mb-5 flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
      @if (filteredEntities().length === 0) {
        <span class="px-3 py-2 text-sm text-slate-400">Aucun paramètre trouvé</span>
      } @else {
        @for (entity of filteredEntities(); track entity.key) {
          <button
            type="button"
            class="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all"
            [class]="
              entity.key === activeKey()
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-600 hover:bg-slate-100'
            "
            (click)="selectEntity(entity.key)"
          >
            <mat-icon class="!h-4 !w-4 !text-[16px]">{{ entity.icon }}</mat-icon>
            <span>{{ entity.label }}</span>
          </button>
        }
      }
    </div>

    @if (loading()) {
      <div class="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Chargement…
      </div>
    } @else if (error()) {
      <div class="mb-4 rounded-xl border border-red-200/80 bg-red-50/80 p-4 text-xs text-red-900">
        <div class="flex items-start gap-3">
          <mat-icon class="!h-5 !w-5 !text-[20px] shrink-0 text-red-600 mt-0.5">error_outline</mat-icon>
          <p class="font-bold text-red-900">{{ error() }}</p>
        </div>
      </div>
    } @else {
      <div class="grid items-start gap-5 lg:grid-cols-5">
        <!-- Formulaire -->
        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div class="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
            <mat-icon class="!text-[22px] text-amber-700">edit_document</mat-icon>
            <h2 class="text-base font-semibold text-amber-700">
              {{ editing() ? 'Formulaire de modification' : "Formulaire d'ajout" }}
            </h2>
          </div>

          @if (currentEntity().formKind === 'establishment') {
            <form (ngSubmit)="submit()" novalidate class="grid gap-3">
              <label class="flex flex-col gap-1">
                <span class="text-xs font-medium text-slate-600">Désignation *</span>
                <input class="gcc-input" type="text" required [ngModel]="formData['establishmentName']" (ngModelChange)="onModelChange('establishmentName', $event)" name="establishmentName" />
              </label>
              <label class="flex flex-col gap-1">
                <span class="text-xs font-medium text-slate-600">Adresse</span>
                <input class="gcc-input" type="text" [ngModel]="formData['adress']" (ngModelChange)="onModelChange('adress', $event)" name="adress" />
              </label>
              <label class="flex flex-col gap-1">
                <span class="text-xs font-medium text-slate-600">Téléphone</span>
                <input class="gcc-input" type="text" [ngModel]="formData['phoneNumber']" (ngModelChange)="onModelChange('phoneNumber', $event)" name="phoneNumber" />
              </label>
              <label class="flex flex-col gap-1">
                <span class="text-xs font-medium text-slate-600">Email</span>
                <input class="gcc-input" type="text" [ngModel]="formData['email']" (ngModelChange)="onModelChange('email', $event)" name="email" />
              </label>
              <label class="flex flex-col gap-1">
                <span class="text-xs font-medium text-slate-600">Site web</span>
                <input class="gcc-input" type="text" [ngModel]="formData['website']" (ngModelChange)="onModelChange('website', $event)" name="website" />
              </label>
              <label class="flex flex-col gap-1">
                <span class="text-xs font-medium text-slate-600">Réseaux sociaux</span>
                <input class="gcc-input" type="text" [ngModel]="formData['socialMedia']" (ngModelChange)="onModelChange('socialMedia', $event)" name="socialMedia" />
              </label>
              <label class="flex flex-col gap-1">
                <span class="text-xs font-medium text-slate-600">NIF</span>
                <input class="gcc-input" type="text" [ngModel]="formData['nif']" (ngModelChange)="onModelChange('nif', $event)" name="nif" />
              </label>
              <label class="flex flex-col gap-1">
                <span class="text-xs font-medium text-slate-600">STAT</span>
                <input class="gcc-input" type="text" [ngModel]="formData['stat']" (ngModelChange)="onModelChange('stat', $event)" name="stat" />
              </label>
              <label class="flex flex-col gap-1">
                <span class="text-xs font-medium text-slate-600">Logo</span>
                @if (logoPreview()) {
                  <img [src]="logoPreview()" alt="Logo" class="h-20 w-20 rounded-lg object-cover" />
                }
                <input
                  type="file"
                  accept="image/*"
                  class="h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm text-navy"
                  (change)="onFileSelected('logo', $event)"
                />
              </label>
              <div class="mt-2 flex justify-end gap-2">
                @if (editing()) {
                  <button mat-stroked-button type="button" class="gcc-btn-secondary" (click)="cancelEdit()">Annuler</button>
                }
                <button mat-flat-button type="submit" class="gcc-btn-primary" [disabled]="saving()">
                  <mat-icon>check</mat-icon>
                  {{ editing() ? 'Modifier' : 'Créer' }}
                </button>
              </div>
            </form>
          } @else if (currentEntity().formKind === 'department') {
            <form (ngSubmit)="submit()" novalidate class="grid gap-3">
              <label class="flex flex-col gap-1">
                <span class="text-xs font-medium text-slate-600">Nom du département *</span>
                <input class="gcc-input" type="text" required [ngModel]="formData['name']" (ngModelChange)="onModelChange('name', $event)" name="name" />
              </label>
              <label class="flex flex-col gap-1">
                <span class="text-xs font-medium text-slate-600">Photo du département</span>
                @if (photoPreview()) {
                  <img [src]="photoPreview()" alt="Photo" class="h-20 w-20 rounded-lg object-cover" />
                }
                <input
                  type="file"
                  accept="image/*"
                  class="h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm text-navy"
                  (change)="onFileSelected('photo', $event)"
                />
              </label>
              <div class="mt-2 flex justify-end gap-2">
                @if (editing()) {
                  <button mat-stroked-button type="button" class="gcc-btn-secondary" (click)="cancelEdit()">Annuler</button>
                }
                <button mat-flat-button type="submit" class="gcc-btn-primary" [disabled]="saving()">
                  <mat-icon>check</mat-icon>
                  {{ editing() ? 'Modifier' : 'Créer' }}
                </button>
              </div>
            </form>
          } @else {
            <form (ngSubmit)="submit()" novalidate class="grid gap-3">
              <label class="flex flex-col gap-1">
                <span class="text-xs font-medium text-slate-600">{{ currentEntity().formLabel || 'Désignation' }} *</span>
                <input class="gcc-input" type="text" required [ngModel]="formData[currentEntity().nameField]" (ngModelChange)="onModelChange(currentEntity().nameField, $event)" [name]="currentEntity().nameField" />
              </label>
              <div class="mt-2 flex justify-end gap-2">
                @if (editing()) {
                  <button mat-stroked-button type="button" class="gcc-btn-secondary" (click)="cancelEdit()">Annuler</button>
                }
                <button mat-flat-button type="submit" class="gcc-btn-primary" [disabled]="saving()">
                  <mat-icon>check</mat-icon>
                  {{ editing() ? 'Modifier' : 'Créer' }}
                </button>
              </div>
            </form>
          }
        </article>

        <!-- Liste -->
        <article class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-3">
          <div class="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
            <div>
              <h2 class="text-base font-semibold text-navy">Liste des enregistrements</h2>
              <p class="text-xs text-slate-500">{{ filteredData().length }} enregistrement(s)</p>
            </div>
            <span class="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-accent">
              {{ currentEntity().label }}
            </span>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3">
            <div class="flex items-center gap-2 text-xs text-slate-500">
              <span>Afficher</span>
              <select
                class="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-navy outline-none"
                [ngModel]="itemsPerPage()"
                (ngModelChange)="onPageSizeChange($event)"
              >
                <option [ngValue]="5">5</option>
                <option [ngValue]="10">10</option>
                <option [ngValue]="20">20</option>
                <option [ngValue]="50">50</option>
                <option [ngValue]="100">100</option>
              </select>
              <span>par page</span>
            </div>
            <label class="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-navy">
              <mat-icon class="!h-4 !w-4 !text-[16px] text-slate-400">search</mat-icon>
              <input
                class="w-full min-w-[160px] border-0 bg-transparent text-sm text-navy outline-none placeholder:text-slate-400"
                placeholder="Rechercher…"
                [(ngModel)]="searchTerm"
                (ngModelChange)="onSearchChange()"
              />
            </label>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full min-w-[560px]">
              <thead>
                <tr class="border-b border-slate-200 text-left text-[11px] uppercase tracking-[0.08em] text-slate-500">
                  @for (col of currentEntity().columns; track $index) {
                    <th class="px-4 py-3 font-semibold">{{ col.header }}</th>
                  }
                  <th class="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                @if (currentItems().length === 0) {
                  <tr>
                    <td [attr.colspan]="currentEntity().columns.length + 1" class="px-4 py-10 text-center text-sm text-slate-400">
                      <mat-icon class="!text-[36px]">inbox</mat-icon>
                      <p class="mt-2">Aucune donnée</p>
                    </td>
                  </tr>
                } @else {
                  @for (item of currentItems(); track item[currentEntity().idField]; let i = $index) {
                    <tr class="border-b border-slate-100 text-sm text-slate-700 transition-colors hover:bg-slate-50">
                      @for (col of currentEntity().columns; track $index) {
                        <td class="px-4 py-3" [ngClass]="col.className || ''">
                          @if (col.image) {
                            @if (item[currentEntity().idField] != null) {
                              <img
                                [src]="imageUrl(item, col)"
                                [alt]="item[currentEntity().nameField] || 'image'"
                                class="h-10 w-10 rounded-md object-cover"
                              />
                            } @else {
                              <span class="text-xs text-slate-400">{{ col.imageFallback || '—' }}</span>
                            }
                          } @else {
                            {{ item[col.field ?? ''] ?? '—' }}
                          }
                        </td>
                      }
                      <td class="px-4 py-3">
                        <div class="flex items-center justify-end gap-1">
                          <button mat-icon-button type="button" class="!h-8 !w-8" (click)="startEdit(item)" aria-label="Modifier">
                            <mat-icon class="!text-[18px] text-slate-500">edit</mat-icon>
                          </button>
                          <button mat-icon-button type="button" class="!h-8 !w-8" (click)="confirmDelete(item)" aria-label="Supprimer">
                            <mat-icon class="!text-[18px] text-red-500">delete</mat-icon>
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>

          @if (filteredData().length > itemsPerPage()) {
            <mat-paginator
              [length]="filteredData().length"
              [pageSize]="itemsPerPage()"
              [pageIndex]="pageIndex()"
              [pageSizeOptions]="[5, 10, 20, 50, 100]"
              showFirstLastButtons
              (page)="onPage($event)"
            />
          }
        </article>
      </div>
    }
  `,
})
export class EntityManagerComponent {
  private readonly service = inject(EntityCrudService);

  readonly entities = input.required<EntityConfig[]>();

  readonly activeKey = signal<string>('');
  readonly tabFilter = signal('');
  readonly rows = signal<EntityRow[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly editing = signal(false);
  readonly editingId = signal<number | string | null>(null);

  readonly searchTerm = signal('');
  readonly pageIndex = signal(0);
  readonly itemsPerPage = signal(10);

  readonly logoPreview = signal<string | null>(null);
  readonly photoPreview = signal<string | null>(null);

  readonly formData: EntityRow = {};
  private fileMap = new Map<string, File>();

  readonly currentEntity = computed<EntityConfig>(() => {
    const entities = this.entities();
    return entities.find((e) => e.key === this.activeKey()) ?? entities[0];
  });

  readonly filteredEntities = computed(() => {
    const term = this.tabFilter().toLowerCase();
    if (!term) return this.entities();
    return this.entities().filter(
      (e) => e.label.toLowerCase().includes(term) || e.key.toLowerCase().includes(term),
    );
  });

  readonly filteredData = computed(() => {
    const entity = this.currentEntity();
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.rows();
    return this.rows().filter((item) =>
      entity.searchFields.some((field) => {
        const val = item[field];
        return val != null && String(val).toLowerCase().includes(term);
      }),
    );
  });

  readonly currentItems = computed(() => {
    const start = this.pageIndex() * this.itemsPerPage();
    return this.filteredData().slice(start, start + this.itemsPerPage());
  });

  async ngOnInit(): Promise<void> {
    if (this.entities().length > 0) {
      this.activeKey.set(this.entities()[0].key);
      await this.fetchData();
    }
  }

  selectEntity(key: string): void {
    if (this.activeKey() === key) return;
    this.activeKey.set(key);
    this.resetForm();
    this.searchTerm.set('');
    this.pageIndex.set(0);
    this.error.set(null);
    void this.fetchData();
  }

  onTabFilterChange(): void {
    const filtered = this.filteredEntities();
    if (filtered.length > 0 && !filtered.some((e) => e.key === this.activeKey())) {
      this.activeKey.set(filtered[0].key);
      this.resetForm();
      this.searchTerm.set('');
      this.pageIndex.set(0);
      void this.fetchData();
    }
  }

  clearTabFilter(): void {
    this.tabFilter.set('');
  }

  async fetchData(): Promise<void> {
    const entity = this.currentEntity();
    if (!entity) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await this.service.list<EntityRow>(entity.apiEndpoint);
      this.rows.set(data);
    } catch (err) {
      this.error.set(`Erreur lors du chargement : ${err instanceof Error ? err.message : 'erreur inconnue'}`);
      this.rows.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  onSearchChange(): void {
    this.pageIndex.set(0);
  }

  onPageSizeChange(size: number): void {
    this.itemsPerPage.set(size);
    this.pageIndex.set(0);
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
  }

  onModelChange(field: string, value: any): void {
    this.formData[field] = value;
  }

  onFileSelected(field: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (file) {
      this.fileMap.set(field, file);
      if (field === 'logo') this.logoPreview.set(URL.createObjectURL(file));
      if (field === 'photo') this.photoPreview.set(URL.createObjectURL(file));
    }
  }

  resetForm(): void {
    Object.keys(this.formData).forEach((k) => delete this.formData[k]);
    this.fileMap.clear();
    this.logoPreview.set(null);
    this.photoPreview.set(null);
    this.editing.set(false);
    this.editingId.set(null);
  }

  cancelEdit(): void {
    this.resetForm();
  }

  async startEdit(item: EntityRow): Promise<void> {
    const entity = this.currentEntity();
    const id = item[entity.idField];
    if (id == null) return;

    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await this.service.getById<EntityRow>(entity.apiEndpoint, id);
      if (!data) return;

      this.resetForm();
      Object.assign(this.formData, data);

      if (entity.formKind === 'establishment' && data['establishmentId'] != null) {
        this.logoPreview.set(`${this.service.absoluteUrl('/Establishment/logo/' + data['establishmentId'])}?t=${Date.now()}`);
      }
      if (entity.formKind === 'department' && data['departmentId'] != null) {
        this.photoPreview.set(`${this.service.absoluteUrl('/Department/photo/' + data['departmentId'])}?t=${Date.now()}`);
      }

      this.editingId.set(id);
      this.editing.set(true);
    } catch (err) {
      this.error.set(`Erreur lors de la récupération : ${err instanceof Error ? err.message : 'erreur inconnue'}`);
    } finally {
      this.loading.set(false);
    }
  }

  async submit(): Promise<void> {
    const entity = this.currentEntity();
    if (this.saving()) return;
    this.error.set(null);

    const isFormData = entity.formKind === 'establishment' || entity.formKind === 'department';

    try {
      if (isFormData) {
        const form = new FormData();
        const fields =
          entity.formKind === 'establishment'
            ? ['establishmentName', 'adress', 'phoneNumber', 'email', 'website', 'socialMedia', 'nif', 'stat']
            : ['name'];
        for (const field of fields) {
          const value = this.formData[field];
          if (value != null) form.append(field, String(value));
        }
        const fileField = entity.formKind === 'establishment' ? 'logo' : 'photo';
        const file = this.fileMap.get(fileField);
        if (file) form.append(fileField, file);

        if (this.editing() && this.editingId() != null) {
          await this.service.update(entity.apiEndpoint, this.editingId()!, form);
        } else {
          await this.service.create(entity.apiEndpoint, form);
        }
      } else {
        const payload: EntityRow = {};
        payload[entity.nameField] = String(this.formData[entity.nameField] ?? '').trim();

        if (this.editing() && this.editingId() != null) {
          const id = this.editingId()!;
          payload[entity.idField] = id;
          await this.service.update(entity.apiEndpoint, id, payload);
        } else {
          await this.service.create(entity.apiEndpoint, payload);
        }
      }

      this.resetForm();
      await this.fetchData();
    } catch (err) {
      const apiError = (err as any)?.error;
      const detail =
        typeof apiError === 'string'
          ? apiError
          : apiError?.errors?.[0]?.code ?? JSON.stringify(apiError ?? null);
      this.error.set(
        `Erreur lors de ${this.editing() ? 'la modification' : "l'insertion"} : ${
          detail || (err instanceof Error ? err.message : 'erreur inconnue')
        }`,
      );
    } finally {
      this.saving.set(false);
    }
  }

  confirmDelete(item: EntityRow): void {
    const entity = this.currentEntity();
    const id = item[entity.idField];
    if (id == null) return;

    const confirmed = window.confirm('Confirmer la suppression ?');
    if (!confirmed) return;

    void this.deleteItem(entity, id);
  }

  private async deleteItem(entity: EntityConfig, id: number | string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.service.delete(entity.apiEndpoint, id);
      await this.fetchData();
      if (this.editing()) this.resetForm();
    } catch (err) {
      this.error.set(`Erreur lors de la suppression : ${err instanceof Error ? err.message : 'erreur inconnue'}`);
    } finally {
      this.loading.set(false);
    }
  }

  imageUrl(item: EntityRow, col: any): string {
    if (!col.imageEndpoint) return '';
    const id = item[this.currentEntity().idField];
    if (id == null) return '';
    return `${this.service.absoluteUrl(col.imageEndpoint.replace('{id}', String(id)))}?t=${Date.now()}`;
  }
}
