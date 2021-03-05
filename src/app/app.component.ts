import { ChangeDetectorRef, Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'reddit-notify-ext';

  constructor(private ref: ChangeDetectorRef) { }

  onRouteActivated() {
    this.ref.detectChanges();
  }
}
