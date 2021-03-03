import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { TokenService } from '@core/token/token.service';

@Component({
  selector: 'app-oauth',
  templateUrl: './oauth.component.html',
  styleUrls: ['./oauth.component.scss']
})
export class OauthComponent implements OnInit {
  authForm: FormGroup = this.formBuilder.group({
  });
  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private t: TokenService
  ) { }

  ngOnInit(): void {
  }

  startAuth() {
    this.t.doAuthorize();
  }

}
