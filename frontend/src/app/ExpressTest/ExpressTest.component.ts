import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { SharedWebSocketService } from '../SharedWebSocket.service';
import { Subscription, timer } from 'rxjs';
import { NotificationService } from '../Notifications/Notification.service';

@Component({
  selector: 'app-ExpressTest',
  standalone: true,
  imports: [
    FormsModule,
    InputNumberModule,
    ButtonModule
  ],
  templateUrl: './ExpressTest.component.html',
  styleUrls: ['./ExpressTest.component.css']
})
export class ExpressTest implements OnInit, OnDestroy {
  loadingExpressTest: boolean = false;
  expressTestPrs: boolean = false;

  pa1: string = '';
  pa2: string = '';
  splitterM3M: string = '';
  splitterST: string = '';
  cable1: string = '';
  cable2: string = '';
  cable3: string = '';

  private subscription: Subscription = new Subscription();

  constructor(
    private sharedWebSocketService: SharedWebSocketService,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {}

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  load(property: 'loadingExpressTest'): void {
    this[property] = true;

    setTimeout(() => {
      this[property] = false;
    }, 4000);
  }

  Express_test() {
    // const button = document.getElementById('expressTestButton') as HTMLButtonElement;
    // if (button) {
    //   button.disabled = true;
    //   button.style.opacity = '0.5';
    // }

    // const InputedParams = [
    //   {
    //     device: "Attenuators",
    //     pa1: this.pa1,
    //     pa2: this.pa2
    //   },
    //   {
    //     device: "Splitter",
    //     v1: this.splitterST,
    //     v2: this.splitterM3M
    //   },
    //   {
    //     device: "Cable",
    //     c1: this.cable1,
    //     c2: this.cable2,
    //     c3: this.cable3
    //   },
    // ];

    // // Send the POST request
    // this.http.post('/Test/EXPRESS_TEST', InputedParams, { responseType: 'json' }).subscribe(
    //   response => {
    //     console.log(response);
    //     if (button) {
    //       button.disabled = false;
    //       button.style.opacity = '1';
    //     }
    //   },
    //   error => {
    //     console.error('Ошибка запроса:', error);
    //     if (button) {
    //       button.disabled = false;
    //       button.style.opacity = '1';
    //     }
    //   }
    // );
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

    const timeout = timer(5000).subscribe(() => {
      this.loadingExpressTest = false;
      timeout.unsubscribe();
    });

    let subscription = this.sharedWebSocketService.getMessages().subscribe({
      next: (message) => {
      if (message.type === "sended" && message.deviceId === "stat") {
        this.expressTestPrs = true;
        this.loadingExpressTest = false;
        this.cdr.detectChanges();
        subscription.unsubscribe();
        timeout.unsubscribe();
      } else {
        this.notificationService.showNotification('Проверьте подключение к устройствам');
        this.loadingExpressTest = false;
        this.cdr.detectChanges();
      }
    }, error: (error) => {
      this.loadingExpressTest = false;
      this.notificationService.showNotification('Проверьте подключение к устройствам');
      this.cdr.detectChanges();
      subscription.unsubscribe();
      timeout.unsubscribe();
    }
    });
    this.subscription.add(subscription);
  }


}