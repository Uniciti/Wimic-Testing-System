import { Component, OnInit, ChangeDetectorRef, OnDestroy, NgZone } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { SharedWebSocketService } from '../SharedWebSocket.service';
import { Subscription, timer } from 'rxjs';
//import { NotificationService } from '../Notifications/Notification.service';
import { NotificationService } from '../Notification.service';
import { ProgressBarModule } from 'primeng/progressbar';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-ExpressTest',
  standalone: true,
  imports: [
    FormsModule,
    InputNumberModule,
    ButtonModule,
    ProgressBarModule,
    ToastModule
  ],
  templateUrl: './ExpressTest.component.html',
  styleUrls: ['./ExpressTest.component.css'],
  providers: [ NotificationService ]
})

export class ExpressTest implements OnInit, OnDestroy {
  loadingExpressTest: boolean = false;
  expressTestPrs: boolean = false;
  interval: any;
  modulation: number = 0;

  pa1: number | null = null;
  pa2: number | null = null;
  splitterM3M: number | null = null;
  splitterST: number | null = null;
  cable1: number | null = null;
  cable2: number | null = null;
  cable3: number | null = null;
  //duration: number | null = null;
  
  private subscription: Subscription = new Subscription();

  constructor(
    private sharedWebSocketService: SharedWebSocketService,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService,
    private ngZone: NgZone,
  ) {}

  ngOnInit(): void {
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  load(property: 'loadingExpressTest'): void {
    this[property] = true;

    setTimeout(() => {
      this[property] = false;
    }, 4000);
  }

  pullman() {
    this.ngZone.runOutsideAngular(() => {
      this.interval = setInterval(() => {
        this.ngZone.run(() => {
          let subscription = this.sharedWebSocketService.getMessages().subscribe({
            next: (message) => {
              if (message.status === "modulation") {
                this.modulation = message.modulation * 16.6;
                if (message.status === "completed") {
                  this.modulation = 0;
                  this.notificationService.showSuccess("Тестирование успешно завершено, проверьте папку tests...");
                  subscription.unsubscribe();
                  clearInterval(this.interval);
                }
              }
            },
            error: (error) => {
              this.expressTestPrs = false;
              this.loadingExpressTest = false;
              subscription.unsubscribe();
              clearInterval(this.interval);
          }});
          this.subscription.add(subscription);
        });
      }, 2000);
    });
  }


  Express_test() {
    this.loadingExpressTest = true;
    const InputedParams = [
      {
        device: "Attenuators",
        pa1: this.pa1,
        pa2: this.pa2
      },
      {
        device: "Splitter",
        v1: this.splitterST,
        v2: this.splitterM3M
      },
      {
        device: "Cable",
        c1: this.cable1,
        c2: this.cable2,
        c3: this.cable3
      },
    ];

    const message = {"type": "send-command", "deviceId": "stat", "command": InputedParams};
    this.sharedWebSocketService.sendMessage(message);

    const connectionTimeout = timer(5000).subscribe(() => {
      this.loadingExpressTest = false;
      connectionTimeout.unsubscribe();
    });

    let subscription = this.sharedWebSocketService.getMessages().subscribe({
      next: (message) => {
        connectionTimeout.unsubscribe();
        this.pullman();
        if (message.type === "sended" && message.deviceId === "stat") {
          this.expressTestPrs = true;
          if (message.status === "completed") {
            this.expressTestPrs = false;
            this.loadingExpressTest = false;
            this.cdr.detectChanges();
            subscription.unsubscribe();
          }
        } else {
          this.notificationService.showError('Проверьте подключение к устройствам');
          this.expressTestPrs = false;
          this.loadingExpressTest = false;
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        connectionTimeout.unsubscribe();
        this.expressTestPrs = false;
        this.loadingExpressTest = false;
        this.notificationService.showError('Проверьте подключение к устройствам');
        this.cdr.detectChanges();
        subscription.unsubscribe();
      }
    });
    this.subscription.add(subscription);
  }
}