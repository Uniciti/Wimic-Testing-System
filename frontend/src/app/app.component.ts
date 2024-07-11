import { Component, OnDestroy, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { RouterOutlet, NavigationEnd, Router } from "@angular/router";
import { NgClass, NgIf } from "@angular/common";
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { DeviceStatusComponent } from './deviceStatus/deviceStatus.component';
import { mainTestsComponent } from './mainTests/mainTests.component';
import { ConnectionStatusComponent } from './ConnectionStatus/ConnectionStatus.component';
import { QueueTestsFormComponent } from './queue-tests-form/queue-tests-form.component'

import { MessageService } from 'primeng/api';
import { FileUploadModule } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
// import { DynamicDialogModule, DialogService,
//   DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';

import { SharedWebSocketService } from './SharedWebSocket.service';
import { ConnectionStatusService } from './core/services/ConnectionStatus.service';
import { NotificationService } from './Notification.service';
import { CustomRouteReuseStrategy } from './app.component.service';
// import { RouteReuseStrategy } from '@angular/router';
//import { TabStateService } from './app.component.service'
// import { QueueTestsFormService } from './queue-tests-form/queue-tests-form.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    FormsModule,
    HeaderComponent,
    NgClass,
    NgIf,
    SidebarComponent, 
    DeviceStatusComponent, 
    mainTestsComponent,
    ConnectionStatusComponent, 
    RouterOutlet, 
    QueueTestsFormComponent,
    FileUploadModule,
    ToastModule,
    HttpClientModule
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
    CustomRouteReuseStrategy
  ]
})
export class AppComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild(ConnectionStatusComponent) connectionStatus!: ConnectionStatusComponent;

  constructor(
    private sharedWebSocketService: SharedWebSocketService,
    private connectionStatusService: ConnectionStatusService,
    private notificationService: NotificationService,
    private router: Router,
    private breakpointObserver: BreakpointObserver
  ) { }

  isSmallScreen = false;
  isComponentVisible = true;

  isVerySmallScreen = false;
  isComponentSidebarVisible = true;

  ngOnInit(): void {
    this.sharedWebSocketService.connect();

    this.breakpointObserver.observe(['(max-width: 1102px)']).subscribe(result => {
      this.isSmallScreen = result.matches;
      if (this.isSmallScreen) {
        this.isComponentVisible = false;
      }
    });

    // this.breakpointObserver.observe(['(max-width: 963px)']).subscribe(result => {
    //   this.isVerySmallScreen = result.matches;
    //   if (this.isVerySmallScreen) {
    //     this.isComponentSidebarVisible = false;
    //   }
    // });

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
      if (message_.pingStat0 == false || message_.pingStat1 == false) {
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

  ngOnDestroy(): void {
    // if (this.tabName) {
    //   this.tabStateService.setState(this.tabName, this.tabData);
    // }
    //this.sharedWebSocketService.disconnect();
  } 

  showTableStatus(): void {
    this.isComponentVisible = !this.isComponentVisible;
  }
}