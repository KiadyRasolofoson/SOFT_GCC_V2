import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';

/**
 * Éditeur riche du kit Soft GCC (wrapper Tiptap).
 * - Double liaison HTML : `content` (input) ↔ `contentChange` (output).
 * - `insertVariable(name)` insère ` {{Nom}}` au curseur.
 * - `editorReady` émet l'instance Tiptap une fois montée.
 */
@Component({
  selector: 'gcc-rich-editor',
  imports: [MatIconModule],
  host: { class: 'block' },
  template: `
    <div class="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div class="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50 px-2 py-1.5">
        <button type="button" class="gcc-tb-btn" [class.gcc-tb-active]="h1()" (click)="exec('h1')" title="Titre 1">
          <span class="text-[13px] font-bold leading-none">H1</span>
        </button>
        <button type="button" class="gcc-tb-btn" [class.gcc-tb-active]="h2()" (click)="exec('h2')" title="Titre 2">
          <span class="text-[13px] font-bold leading-none">H2</span>
        </button>
        <button type="button" class="gcc-tb-btn" [class.gcc-tb-active]="paragraph()" (click)="exec('p')" title="Paragraphe">
          <span class="text-[13px] font-bold leading-none">¶</span>
        </button>
        <span class="mx-1 h-5 w-px bg-slate-200"></span>
        <button type="button" class="gcc-tb-btn" [class.gcc-tb-active]="bold()" (click)="exec('bold')" title="Gras">
          <mat-icon class="!h-4 !w-4 !text-[16px]">format_bold</mat-icon>
        </button>
        <button type="button" class="gcc-tb-btn" [class.gcc-tb-active]="italic()" (click)="exec('italic')" title="Italique">
          <mat-icon class="!h-4 !w-4 !text-[16px]">format_italic</mat-icon>
        </button>
        <button type="button" class="gcc-tb-btn" [class.gcc-tb-active]="underline()" (click)="exec('underline')" title="Souligné">
          <mat-icon class="!h-4 !w-4 !text-[16px]">format_underlined</mat-icon>
        </button>
        <button type="button" class="gcc-tb-btn" [class.gcc-tb-active]="linkActive()" (click)="exec('link')" title="Lien">
          <mat-icon class="!h-4 !w-4 !text-[16px]">link</mat-icon>
        </button>
        <span class="mx-1 h-5 w-px bg-slate-200"></span>
        <button type="button" class="gcc-tb-btn" [class.gcc-tb-active]="bullet()" (click)="exec('bullet')" title="Liste à puces">
          <mat-icon class="!h-4 !w-4 !text-[16px]">format_list_bulleted</mat-icon>
        </button>
        <button type="button" class="gcc-tb-btn" [class.gcc-tb-active]="ordered()" (click)="exec('ordered')" title="Liste numérotée">
          <mat-icon class="!h-4 !w-4 !text-[16px]">format_list_numbered</mat-icon>
        </button>
        <span class="mx-1 h-5 w-px bg-slate-200"></span>
        <button type="button" class="gcc-tb-btn" (click)="exec('clean')" title="Effacer le format">
          <mat-icon class="!h-4 !w-4 !text-[16px]">format_clear</mat-icon>
        </button>
      </div>
      <div class="relative">
        <div #editorHost class="gcc-editor-body min-h-32 px-3 py-2 text-sm text-navy"></div>
        @if (isEmpty()) {
          <p class="pointer-events-none absolute left-3 top-2 text-sm text-slate-400">{{ placeholder() }}</p>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .gcc-tb-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 1.75rem;
        min-width: 1.75rem;
        padding: 0 0.375rem;
        border-radius: 0.5rem;
        color: #475569;
        transition: background-color 0.15s ease;
      }
      .gcc-tb-btn:hover {
        background: #e2e8f0;
      }
      .gcc-tb-active {
        background: #e0e7ff;
        color: #4f46e5;
      }
      .gcc-editor-body .ProseMirror {
        outline: none;
        min-height: 8rem;
      }
      .gcc-editor-body .ProseMirror h1 {
        font-size: 1.25rem;
        font-weight: 700;
        color: #0f172a;
        margin: 0.5rem 0;
      }
      .gcc-editor-body .ProseMirror h2 {
        font-size: 1.05rem;
        font-weight: 700;
        color: #0f172a;
        margin: 0.5rem 0;
      }
      .gcc-editor-body .ProseMirror p {
        margin: 0.35rem 0;
      }
      .gcc-editor-body .ProseMirror ul {
        list-style: disc;
        padding-left: 1.25rem;
        margin: 0.35rem 0;
      }
      .gcc-editor-body .ProseMirror ol {
        list-style: decimal;
        padding-left: 1.25rem;
        margin: 0.35rem 0;
      }
      .gcc-editor-body .ProseMirror a {
        color: #6366f1;
        text-decoration: underline;
      }
    `,
  ],
})
export class GccRichEditor implements AfterViewInit, OnDestroy {
  readonly content = input('');
  readonly placeholder = input('Rédigez le contenu…');
  readonly contentChange = output<string>();
  readonly editorReady = output<Editor>();

  private readonly host = viewChild.required<ElementRef<HTMLDivElement>>('editorHost');

  private editor: Editor | null = null;
  private writing = false;

  readonly h1 = signal(false);
  readonly h2 = signal(false);
  readonly paragraph = signal(false);
  readonly bold = signal(false);
  readonly italic = signal(false);
  readonly underline = signal(false);
  readonly linkActive = signal(false);
  readonly bullet = signal(false);
  readonly ordered = signal(false);
  readonly isEmpty = signal(true);

  /** Applique une mise à jour externe du contenu (ex. insertVariable) sans boucle. */
  private readonly syncContent = effect(() => {
    const value = this.content();
    if (!this.editor || this.writing) return;
    if (value === this.editor.getHTML()) return;
    this.writing = true;
    this.editor.commands.setContent(value || '<p></p>', { emitUpdate: false });
    this.writing = false;
  });

  ngAfterViewInit(): void {
    const editor = new Editor({
      element: this.host().nativeElement,
      extensions: [
        StarterKit.configure({ heading: { levels: [1, 2] } }),
        Underline,
        Link.configure({ openOnClick: false, autolink: true }),
      ],
      content: this.content() || '<p></p>',
      editorProps: {
        attributes: { class: 'outline-none' },
      },
      onUpdate: ({ editor: instance }) => {
        if (this.writing) return;
        this.contentChange.emit(instance.getHTML());
      },
      onSelectionUpdate: () => this.refreshToolbar(),
      onTransaction: () => this.refreshToolbar(),
    });
    this.editor = editor;
    this.refreshToolbar();
    this.editorReady.emit(editor);
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
    this.editor = null;
  }

  /** Définit le contenu depuis l'extérieur (ex. reset) sans ré-émettre. */
  setContent(html: string): void {
    if (!this.editor) return;
    this.writing = true;
    this.editor.commands.setContent(html || '<p></p>', { emitUpdate: false });
    this.writing = false;
    this.refreshToolbar();
  }

  /** Renvoie le HTML courant de l'éditeur. */
  getHtml(): string {
    return this.editor?.getHTML() ?? '';
  }

  /** Insère un champ dynamique (ex. {{Nom}}) au curseur. */
  insertVariable(name: string): void {
    this.editor?.chain().focus().insertContent(` {{${name}}}`).run();
  }

  exec(command: string): void {
    const chain = this.editor?.chain().focus();
    switch (command) {
      case 'h1':
        chain?.toggleHeading({ level: 1 }).run();
        break;
      case 'h2':
        chain?.toggleHeading({ level: 2 }).run();
        break;
      case 'p':
        chain?.setParagraph().run();
        break;
      case 'bold':
        chain?.toggleBold().run();
        break;
      case 'italic':
        chain?.toggleItalic().run();
        break;
      case 'underline':
        chain?.toggleUnderline().run();
        break;
      case 'bullet':
        chain?.toggleBulletList().run();
        break;
      case 'ordered':
        chain?.toggleOrderedList().run();
        break;
      case 'link':
        this.toggleLink();
        break;
      case 'clean':
        chain?.unsetAllMarks().clearNodes().run();
        break;
    }
  }

  private toggleLink(): void {
    if (!this.editor) return;
    if (this.editor.isActive('link')) {
      this.editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    const url = window.prompt('Adresse du lien :');
    if (url) {
      this.editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  }

  private refreshToolbar(): void {
    const e = this.editor;
    this.h1.set(e?.isActive('heading', { level: 1 }) ?? false);
    this.h2.set(e?.isActive('heading', { level: 2 }) ?? false);
    this.paragraph.set(e?.isActive('paragraph') ?? false);
    this.bold.set(e?.isActive('bold') ?? false);
    this.italic.set(e?.isActive('italic') ?? false);
    this.underline.set(e?.isActive('underline') ?? false);
    this.linkActive.set(e?.isActive('link') ?? false);
    this.bullet.set(e?.isActive('bulletList') ?? false);
    this.ordered.set(e?.isActive('orderedList') ?? false);
    this.isEmpty.set(e?.isEmpty ?? true);
  }
}
