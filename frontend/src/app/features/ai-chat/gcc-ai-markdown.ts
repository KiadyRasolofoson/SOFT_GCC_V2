import { Component, computed, input } from '@angular/core';
import { parseMarkdown } from './ai-markdown';

@Component({
  selector: 'gcc-ai-markdown',
  template: `
    <div class="gcc-ai-md">
      @for (block of blocks(); track $index) {
        @switch (block.type) {
          @case ('h2') {
            <h2 class="gcc-ai-md-h2">
              @for (part of block.parts; track $index) {
                @if (part.bold) {
                  <strong>{{ part.text }}</strong>
                } @else {
                  {{ part.text }}
                }
              }
            </h2>
          }
          @case ('h3') {
            <h3 class="gcc-ai-md-h3">
              @for (part of block.parts; track $index) {
                @if (part.bold) {
                  <strong>{{ part.text }}</strong>
                } @else {
                  {{ part.text }}
                }
              }
            </h3>
          }
          @case ('p') {
            <p class="gcc-ai-md-p">
              @for (part of block.parts; track $index) {
                @if (part.bold) {
                  <strong>{{ part.text }}</strong>
                } @else {
                  {{ part.text }}
                }
              }
            </p>
          }
          @case ('ul') {
            <ul class="gcc-ai-md-ul">
              @for (item of block.items; track $index) {
                <li>
                  @for (part of item; track $index) {
                    @if (part.bold) {
                      <strong>{{ part.text }}</strong>
                    } @else {
                      {{ part.text }}
                    }
                  }
                </li>
              }
            </ul>
          }
          @case ('ol') {
            <ol class="gcc-ai-md-ol">
              @for (item of block.items; track $index) {
                <li>
                  @for (part of item; track $index) {
                    @if (part.bold) {
                      <strong>{{ part.text }}</strong>
                    } @else {
                      {{ part.text }}
                    }
                  }
                </li>
              }
            </ol>
          }
        }
      }
    </div>
  `,
})
export class GccAiMarkdown {
  text = input.required<string>();
  readonly blocks = computed(() => parseMarkdown(this.text()));
}
