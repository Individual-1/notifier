import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SettingsComponent } from './settings/settings.component';
import { UnlockComponent } from './unlock/unlock.component';
import { OauthComponent } from './oauth/oauth.component';
import { HomeComponent } from './home/home.component';
import { BackgroundComponent } from './background/background.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UsersComponent } from './users/users.component';
import { ReactiveComponentModule } from '@ngrx/component';



@NgModule({
  declarations: [SettingsComponent, UnlockComponent, OauthComponent, HomeComponent, BackgroundComponent, UsersComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ReactiveComponentModule,
    RouterModule,
  ]
})
export class PagesModule { }
