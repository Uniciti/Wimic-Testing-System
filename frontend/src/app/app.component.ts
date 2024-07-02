import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterOutlet} from "@angular/router";
import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { DeviceStatusComponent } from './deviceStatus/deviceStatus.component';
import { mainTestsComponent } from './mainTests/mainTests.component';
//import { NotificationComponent } from './Notifications/Notification.component';
import { ConnectionStatusComponent } from './ConnectionStatus/ConnectionStatus.component';
import { NotificationService } from './Notification.service';
import { MessageService } from 'primeng/api';
import { SharedWebSocketService } from './SharedWebSocket.service';
import { ConnectionStatusService } from './core/services/ConnectionStatus.service';
// import { Observable, Subscriber } from 'rxjs';
// import { subscribe } from 'diagnostics_channel';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeaderComponent,
    SidebarComponent, 
    DeviceStatusComponent, 
    mainTestsComponent,
    ConnectionStatusComponent, 
    RouterOutlet, 
    ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css' ],
  providers: [ NotificationService, MessageService, ConnectionStatusService ]
})
export class AppComponent implements OnInit, OnDestroy {
  constructor(
    private sharedWebSocketService: SharedWebSocketService,
    private connectionStatusService: ConnectionStatusService,
    private notificationService: NotificationService
  ) {}

  // private observableWebSocket: Observable<> = new Observable();
  ngOnInit() {
    this.sharedWebSocketService.connect();
    this.sharedWebSocketService.getMessages().subscribe(message_ => {
    if (message_.type === "is-connected") {
      if (message_.pingBert == false) {
        this.connectionStatusService.updateStatus("Ber", false);
        this.notificationService.showError("Беркут-ЕТ отключился...");
      }
      if (message_.pingAtt == false) {
        this.connectionStatusService.updateStatus("Att", false);
        this.notificationService.showError("Аттенюатор отключился...");
      }
      if (message_.isStat0 == false || message_.isStat1 == false) {
        this.connectionStatusService.updateStatus("Stat", false);
        this.notificationService.showError("Станции или одна из них отключились...");
      }
      if (message_.pingM3M == false) {
        this.connectionStatusService.updateStatus("M3M", false);
        this.notificationService.showError("М3М отключился...");
      }
    }
  })

  }
  ngOnDestroy() {
    this.sharedWebSocketService.disconnect();
  } 
}