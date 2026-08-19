import { Component } from '@angular/core';
import { GccPageHeader } from '../../ui/gcc-page-header';
import { EntityManagerComponent } from './entity-manager.component';
import { PARAMETRES_COMPETENCES } from './entity.config';

@Component({
  selector: 'app-parametres-competences-page',
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
export class ParametresCompetencesPage {
  readonly config = PARAMETRES_COMPETENCES;
  readonly crumbs = [{ label: 'Accueil' }, { label: 'Paramètres' }, { label: 'Compétences' }];
}
