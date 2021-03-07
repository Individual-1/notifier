import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { UnlockComponent } from './pages/unlock/unlock.component';
import { OauthComponent } from './pages/oauth/oauth.component';
import { LockedGuard } from '@core/locked/locked.guard';
import { BackgroundComponent } from './pages/background/background.component';
import { PageRouterGuard } from '@core/page-router/page-router.guard';
import { UsersComponent } from './pages/users/users.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [LockedGuard]
  },
  {
    path: 'settings',
    component: SettingsComponent,
    canActivate: [LockedGuard]
  },
  {
    path: 'background',
    component: BackgroundComponent,
  },
  {
    path: 'unlock',
    component: UnlockComponent,
  },
  {
    path: 'authorize',
    component: OauthComponent,
    canActivate: [LockedGuard]
  },
  {
    path: 'users',
    component: UsersComponent,
    canActivate: [LockedGuard]
  },
  {
    path: '**',
    component: HomeComponent,
    canActivate: [PageRouterGuard, LockedGuard]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
