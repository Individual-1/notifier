import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { BackgroundAction, BackgroundMessage } from '@models';
import { browser } from 'webextension-polyfill-ts';

@Injectable({
  providedIn: 'root'
})
export class LockedGuard implements CanActivate {

  constructor(private router: Router) {}

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Promise<boolean | UrlTree> {
    let msg: BackgroundMessage = { type: BackgroundAction.isUnlocked, data: null } as BackgroundMessage;
    let unlocked: boolean | null = await browser.runtime.sendMessage(msg);
    if (unlocked !== undefined && unlocked !== null && !unlocked) {
      return this.router.parseUrl('/unlock');
    } else {
      return true;
    }
  }
}
