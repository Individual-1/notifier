import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { CryptoService } from '@core/crypto/crypto.service';

@Component({
  selector: 'app-unlock',
  templateUrl: './unlock.component.html',
  styleUrls: ['./unlock.component.scss'],
})
export class UnlockComponent implements OnInit {
  unlockForm: FormGroup = this.formBuilder.group({
    passphrase: [, { validators: [Validators.required], updateOn: "change" }],
  });

  private defaultMsg: string = "Enter your existing passphrase, or choose a new passphrase if you haven't";
  hintMsg: string = this.defaultMsg;

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

  async submitPass() {
    this.hintMsg = this.defaultMsg;
    let pwControl: AbstractControl | null = this.unlockForm.get('passphrase');
    if (pwControl !== null) {
      let enc: TextEncoder = new TextEncoder();
      let pw: Uint8Array = enc.encode(pwControl.value);
      try {
      let success: boolean = await this.c.unlockKey(pw);
        if (success) this.redirectHome();
      } catch (e) {
        this.hintMsg = e.name + ": " + e.message;
      }
    }
  }

  private redirectHome() {
    this.router.navigateByUrl('/home');
  }

}
