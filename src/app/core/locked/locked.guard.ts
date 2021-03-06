import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { BackgroundAction, BackgroundDataType, BackgroundMessage, sendBackgroundMessage} from '@models';

@Injectable({
  providedIn: 'root'
})
export class LockedGuard implements CanActivate {

  constructor(private router: Router) { }

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Promise<boolean | UrlTree> {
    let msg: BackgroundMessage = { action: BackgroundAction.isUnlocked, type: BackgroundDataType.null, data: null } as BackgroundMessage;
    let unlocked: boolean | null = await sendBackgroundMessage(msg);
    if (unlocked !== undefined && unlocked !== null) {
      if (!unlocked) {
        return this.router.parseUrl('/unlock');
      } else {
        return true;
      }
    } else {
      return this.router.parseUrl('/unlock');
    }
  }
}
