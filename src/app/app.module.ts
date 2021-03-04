import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule} from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { PagesModule } from './pages/pages.module';
import { CoreModule } from '@core/core.module';
import { CryptoService } from '@core/crypto/crypto.service';
import { StorageService } from '@core/storage/storage.service';
import { UserService } from '@core/user/user.service';
import { TokenService } from '@core/token/token.service';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    CoreModule,
    PagesModule,
    BrowserAnimationsModule,
    HttpClientModule,
    RouterModule,
  ],
  providers: [CryptoService, StorageService, UserService, TokenService],
  bootstrap: [AppComponent]
})
export class AppModule { }
