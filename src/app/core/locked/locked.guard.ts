import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { CryptoService } from '@core/crypto/crypto.service';

@Injectable({
  providedIn: 'root'
})
export class LockedGuard implements CanActivate {

  constructor(private router: Router, private c: CryptoService) {}

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Promise<boolean | UrlTree> {
    let unlocked: boolean = await this.c.isUnlocked();
    if (!unlocked) {
      return this.router.parseUrl('/unlock');
    } else {
      return true;
    }
  }
}
