import { Injectable } from '@angular/core';
import { CryptoService } from '@core/crypto/crypto.service';
import { StorageService } from '@core/storage/storage.service';
import { User } from '@models';

export class UserService {

  constructor(private s: StorageService, private c: CryptoService) { }

}
