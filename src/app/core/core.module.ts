import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CryptoService } from './crypto/crypto.service';
import { LockedGuard } from './locked/locked.guard';
import { StorageService } from './storage/storage.service';
import { PageRouterGuard } from './page-router/page-router.guard';



@NgModule({
  providers: [
  ],
  declarations: [],
  imports: [
    CommonModule
  ]
})
export class CoreModule { }
