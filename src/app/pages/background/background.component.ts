import { Component, OnInit } from '@angular/core';
import { CryptoService } from '@core/crypto/crypto.service';



@Component({
  selector: 'app-background',
  templateUrl: './background.component.html',
  styleUrls: ['./background.component.scss']
})
export class BackgroundComponent implements OnInit {

  constructor(private c: CryptoService) { }

  ngOnInit(): void {
  }



}
