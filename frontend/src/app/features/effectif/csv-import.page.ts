import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { OrgImportService } from '../../core/org-import.service';
import { GccPageHeader } from '../../ui/gcc-page-header';

@Component({
  selector: 'app-csv-import-page',
  imports: [GccPageHeader, MatButtonModule, MatIconModule],
  template: `
    <gcc-page-header
      title="Importer des employés"
      subtitle="Chargez un fichier CSV pour ajouter des collaborateurs à l'effectif."
      icon="upload_file"
      [crumbs]="crumbs"
      secondaryLabel="Retour"
      secondaryIcon="arrow_back"
      (secondaryAction)="goBack()"
    />

    @if (error(); as message) {
      <div class="mb-6 rounded-xl border border-red-200/80 bg-red-50/80 p-4 text-xs text-red-900 shadow-xs">
        <p class="whitespace-pre-line font-bold">{{ message }}</p>
      </div>
    }

    @if (success(); as message) {
      <div class="mb-6 rounded-xl border border-emerald-200/80 bg-emerald-50/80 p-4 text-xs text-emerald-900 shadow-xs">
        <p class="font-bold">{{ message }}</p>
      </div>
    }

    <div class="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="flex items-start gap-3 border-b border-slate-100 p-5">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-accent">
          <mat-icon class="!h-5 !w-5 !text-[20px]">file_upload</mat-icon>
        </span>
        <div>
          <h2 class="text-base font-semibold text-navy">Fichier CSV</h2>
          <p class="mt-0.5 text-sm text-slate-500">
            Colonnes attendues : registrationNumber, name, firstName, birthday, hiring_date,
            department_id, civiliteId, managerId.
          </p>
        </div>
      </div>

      <div class="p-5">
        <div
          class="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition"
          [class.border-accent]="dragActive()"
          [class.bg-indigo-50/50]="dragActive()"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave()"
          (drop)="onDrop($event)"
        >
          <mat-icon class="!h-10 !w-10 !text-[40px] text-slate-400">cloud_upload</mat-icon>
          <p class="text-sm text-slate-600">
            {{ fileName() ? 'Fichier sélectionné : ' + fileName() : 'Glissez-déposez un fichier CSV ici, ou choisissez-en un.' }}
          </p>
          <label
            class="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <mat-icon class="!h-4 !w-4 !text-[16px]">folder_open</mat-icon>
            Choisir un fichier
            <input type="file" accept=".csv,text/csv" class="hidden" (change)="onFileSelected($event)" />
          </label>
        </div>

        <div class="mt-5 flex flex-wrap gap-2.5">
          <button
            mat-flat-button
            type="button"
            class="gcc-btn-primary !rounded-xl"
            (click)="submit()"
            [disabled]="uploading() || csvData().length === 0"
          >
            @if (uploading()) {
              <span class="flex items-center gap-2">
                <span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                Import en cours…
              </span>
            } @else {
              <span class="flex items-center gap-2">
                <mat-icon>file_upload</mat-icon>
                Importer ({{ csvData().length }})
              </span>
            }
          </button>
          @if (csvData().length > 0) {
            <button mat-stroked-button type="button" class="gcc-btn-secondary !rounded-xl" (click)="clear()">
              <span class="flex items-center gap-2">
                <mat-icon>delete_sweep</mat-icon>
                Effacer
              </span>
            </button>
          }
        </div>
      </div>
    </div>

    @if (previewRows().length > 0) {
      <div class="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div class="flex items-start gap-3 border-b border-slate-100 p-5">
          <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-accent">
            <mat-icon class="!h-5 !w-5 !text-[20px]">table_chart</mat-icon>
          </span>
          <div>
            <h2 class="text-base font-semibold text-navy">Aperçu</h2>
            <p class="mt-0.5 text-sm text-slate-500">
              {{ csvData().length }} ligne(s) — affichage des {{ previewRows().length }} premières.
            </p>
          </div>
        </div>
        <div class="overflow-x-auto p-5">
          <table class="w-full min-w-[640px]">
            <thead>
              <tr class="border-b border-slate-200 text-left text-xs uppercase tracking-[0.08em] text-slate-500">
                @for (col of columns(); track $index) {
                  <th class="px-2 py-2 font-semibold">{{ col }}</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (row of previewRows(); track $index) {
                <tr class="border-b border-slate-100 text-sm text-slate-700">
                  @for (col of columns(); track $index) {
                    <td class="px-2 py-2">{{ row[col] || '—' }}</td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }
  `,
})
export class CsvImportPage {
  private readonly router = inject(Router);
  private readonly service = inject(OrgImportService);

  readonly crumbs = [{ label: 'Accueil' }, { label: 'Effectifs' }, { label: 'Import CSV' }];

  readonly csvData = signal<Record<string, any>[]>([]);
  readonly fileName = signal('');
  readonly uploading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly dragActive = signal(false);

  readonly previewRows = computed(() => this.csvData().slice(0, 8));

  readonly columns = computed(() => {
    const rows = this.previewRows();
    return rows.length > 0 ? Object.keys(rows[0]) : [];
  });

  goBack(): void {
    void this.router.navigate(['/soft-gcc/effectifs']);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.parseFile(file);
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragActive.set(true);
  }

  onDragLeave(): void {
    this.dragActive.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragActive.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.parseFile(file);
  }

  private parseFile(file: File): void {
    this.fileName.set(file.name);
    this.error.set(null);
    this.success.set(null);

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      try {
        this.csvData.set(this.parseCsv(text));
        if (this.csvData().length === 0) {
          this.error.set('Le fichier CSV est vide ou illisible.');
        }
      } catch {
        this.csvData.set([]);
        this.error.set('Erreur lors de la lecture du fichier CSV.');
      }
    };
    reader.onerror = () => {
      this.csvData.set([]);
      this.error.set('Erreur lors de la lecture du fichier CSV.');
    };
    reader.readAsText(file);
  }

  private parseCsv(text: string): Record<string, any>[] {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length < 2) return [];

    const headers = this.splitCsvLine(lines[0]).map((header) => header.trim());
    const rows: Record<string, any>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.splitCsvLine(lines[i]);
      if (values.length === 0) continue;
      const row: Record<string, any> = {};
      headers.forEach((header, index) => {
        row[header] = values[index]?.trim() ?? '';
      });
      rows.push(row);
    }
    return rows;
  }

  private splitCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }

  private transformData(data: Record<string, any>[]): Record<string, any>[] {
    return data.map((item) => ({
      employeeId: 0,
      registrationNumber: item['registrationNumber'] || '',
      name: item['name'] || '',
      firstName: item['firstName'] || '',
      birthday: this.toIsoDate(item['birthday']),
      department_id: parseInt(item['department_id'] ?? '0', 10) || 0,
      hiring_date: this.toIsoDate(item['hiring_date']),
      civiliteId: parseInt(item['civiliteId'] ?? '0', 10) || 0,
      managerId: parseInt(item['managerId'] ?? '0', 10) || 0,
    }));
  }

  private toIsoDate(value: string | undefined | null): string | null {
    if (!value) return null;
    const date = new Date(String(value).split('/').reverse().join('-'));
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0];
  }

  async submit(): Promise<void> {
    if (this.uploading() || this.csvData().length === 0) return;
    this.uploading.set(true);
    this.error.set(null);
    this.success.set(null);

    try {
      const formatted = this.transformData(this.csvData());
      const result = await this.service.importEmployees(formatted);
      if (result.success) {
        this.success.set(result.message || `${formatted.length} ligne(s) envoyée(s) avec succès.`);
      } else {
        this.error.set(result.errors?.join('\n') || result.message || "Erreur lors de l'envoi des données au serveur.");
      }
    } finally {
      this.uploading.set(false);
    }
  }

  clear(): void {
    this.csvData.set([]);
    this.fileName.set('');
    this.success.set(null);
    this.error.set(null);
  }
}
