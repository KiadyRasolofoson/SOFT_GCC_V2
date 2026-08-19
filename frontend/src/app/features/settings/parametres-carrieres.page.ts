import { Component } from '@angular/core';
import { GccPageHeader } from '../../ui/gcc-page-header';
import { EntityManagerComponent } from './entity-manager.component';
import { PARAMETRES_CARRIERES } from './entity.config';

@Component({
  selector: 'app-parametres-carrieres-page',
  imports: [GccPageHeader, EntityManagerComponent],
  template: `
    <gcc-page-header
      [title]="config.title"
      [subtitle]="config.subtitle"
      [icon]="config.icon"
      [crumbs]="crumbs"
    />
    <app-entity-manager [entities]="config.entities" />
  `,
})
export class ParametresCarrieresPage {
  readonly config = PARAMETRES_CARRIERES;
  readonly crumbs = [{ label: 'Accueil' }, { label: 'Paramètres' }, { label: 'Carrières' }];
}
