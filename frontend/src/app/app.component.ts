import { Component, OnDestroy, OnInit, AfterViewInit } from '@angular/core';
import { RouterOutlet, NavigationEnd, Router } from "@angular/router";
import { NgClass } from "@angular/common";

import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { DeviceStatusComponent } from './deviceStatus/deviceStatus.component';
import { mainTestsComponent } from './mainTests/mainTests.component';
import { ConnectionStatusComponent } from './ConnectionStatus/ConnectionStatus.component';
import { QueueTestsFormComponent } from './queue-tests-form/queue-tests-form.component'

import { MessageService } from 'primeng/api';
// import { DynamicDialogModule, DialogService,
//   DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';

import { SharedWebSocketService } from './SharedWebSocket.service';
import { ConnectionStatusService } from './core/services/ConnectionStatus.service';
import { NotificationService } from './Notification.service';
// import { QueueTestsFormService } from './queue-tests-form/queue-tests-form.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    HeaderComponent,
    NgClass,
    SidebarComponent, 
    DeviceStatusComponent, 
    mainTestsComponent,
    ConnectionStatusComponent, 
    RouterOutlet, 
    QueueTestsFormComponent,
    //DynamicDialogModule
    ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css' ],
  styles: [`
  .tab_content{height: screen;
    overflow-y: scroll;
    -ms-overflow-style: none; 
    scrollbar-width: none}
  .tab-content::-webkit-scrollbar{display: none}`
  ],
  providers: [ NotificationService,
    MessageService,
    ConnectionStatusService,
    // DynamicDialogRef,
    // DialogService,
    // DynamicDialogConfig
  ]
})
export class AppComponent implements OnInit, OnDestroy, AfterViewInit {
  constructor(
    private sharedWebSocketService: SharedWebSocketService,
    private connectionStatusService: ConnectionStatusService,
    private notificationService: NotificationService,
    private router: Router,
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
    }})
  }

  ngAfterViewInit() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.resetScrollPosition();
      }
    });
  }

  resetScrollPosition() {
    const tabContent = document.querySelector('.tab_content');
    if (tabContent) {
      tabContent.scrollTop = 0;
    }
  }

  ngOnDestroy() {
    this.sharedWebSocketService.disconnect();
  } 
}