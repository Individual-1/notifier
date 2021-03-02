import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { CryptoService } from '@core/crypto/crypto.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LockedGuard implements CanActivate {

  constructor(private router: Router, private c: CryptoService) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (!this.c.isUnlocked()) {
      return this.router.parseUrl('/unlock');
    } else {
      return true;
    }
  }
}
