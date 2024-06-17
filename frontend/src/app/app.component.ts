import { Component } from '@angular/core';
import { RouterOutlet} from "@angular/router";
import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { deviceStatusComponent } from './deviceStatus/deviceStatus.component';
import { ExpressTest } from './ExpressTest/ExpressTest.component';
import { NotificationComponent } from './Notifications/Notification.component';
import { ConnectionStatusComponent } from './ConnectionStatus/ConnectionStatus.component';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeaderComponent,
    SidebarComponent, 
    deviceStatusComponent, 
    ExpressTest,
    NotificationComponent,
    ConnectionStatusComponent, 
    RouterOutlet, 
    HttpClientModule
    ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css' ],
})
export class AppComponent {}