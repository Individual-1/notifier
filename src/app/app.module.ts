import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule} from '@angular/common/http';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';

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
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    CoreModule,
    PagesModule,
    BrowserAnimationsModule,
    HttpClientModule,
  ],
  providers: [CryptoService, StorageService, UserService, TokenService],
  bootstrap: [AppComponent]
})
export class AppModule { }
