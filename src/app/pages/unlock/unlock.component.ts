import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { CryptoService } from '@core/crypto/crypto.service';

import { browser } from "webextension-polyfill-ts";

@Component({
  selector: 'app-unlock',
  templateUrl: './unlock.component.html',
  styleUrls: ['./unlock.component.scss'],
})
export class UnlockComponent implements OnInit {
  unlockForm: FormGroup = this.formBuilder.group({
    passphrase: [, { validators: [Validators.required], updateOn: "change" }],
  });

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private c: CryptoService
  ) {
    if (this.c.isUnlocked()) {
      this.router.navigate(['/']);
    }
  }

  ngOnInit(): void {
  }

  submitPass() {
    let pwControl: AbstractControl | null = this.unlockForm.get('passphrase');
    if (pwControl !== null) {
      let enc: TextEncoder = new TextEncoder();
      let pw: Uint8Array = enc.encode(pwControl.value);
      this.c.unlockKey(pw).then(
        r => { console.log('c' + r); if (r) this.redirectHome(); },
        e => { console.log('d'); }
      ); 
    }
  }

  private redirectHome() {
    this.router.navigateByUrl('/home');
  }

}
