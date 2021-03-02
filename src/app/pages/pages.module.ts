import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsComponent } from './settings/settings.component';
import { UnlockComponent } from './unlock/unlock.component';
import { OauthComponent } from './oauth/oauth.component';
import { HomeComponent } from './home/home.component';
import { BackgroundComponent } from './background/background.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { UsersComponent } from './users/users.component';



@NgModule({
  declarations: [SettingsComponent, UnlockComponent, OauthComponent, HomeComponent, BackgroundComponent, UsersComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
  ]
})
export class PagesModule { }
