import { Component, OnInit, ChangeDetectorRef, OnDestroy, NgZone } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SharedWebSocketService } from '../SharedWebSocket.service';
import { Subscription, timer } from 'rxjs';
import { NotificationService } from '../Notification.service';
import { ProgressBarModule } from 'primeng/progressbar';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-mainTests',
  standalone: true,
  imports: [
    FormsModule,
    InputNumberModule,
    ButtonModule,
    ProgressBarModule,
    ToastModule,
    SelectButtonModule
  ],
  templateUrl: './mainTests.component.html',
  styleUrls: ['./mainTests.component.css'],
  providers: [ NotificationService ]
})

export class mainTestsComponent implements OnInit, OnDestroy {
  loadingTest: boolean = false;
  TestProcessing: boolean = false;
  interval: any;
  modulation: number = 0;

  selectionTestType: string = "express"
  selectionBandwidth: number =  3;

  pa1: number | null = null;
  pa2: number | null = null;
  splitterM3M: number | null = null;
  splitterST: number | null = null;
  cable1: number | null = null;
  cable2: number | null = null;
  cable3: number | null = null;
  duration: number | null = null;

  testOptions: any[] = [{ label: 'Экспресс тест', value: "express_test" },{ label: 'Полный тест', value: "full_test" }];
  stationOptions: any[] = [{ label: '10 МГц', value: 3 },{ label: '20 МГц', value: 5 }];
  
  private subscription: Subscription = new Subscription();

  constructor(
    private sharedWebSocketService: SharedWebSocketService,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService,
    private ngZone: NgZone,
  ) {}

  ngOnInit(): void { }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  buttonsControlTest(sub:  Subscription) {
    this.TestProcessing = false;
    this.loadingTest = false;
    this.cdr.detectChanges();
    sub.unsubscribe();
  }

  pullman() {
    this.ngZone.runOutsideAngular(() => {
      this.interval = setInterval(() => {
        this.ngZone.run(() => {
          let subscription = this.sharedWebSocketService.getMessages().subscribe({
            next: (message) => {
              if (message.status === "modulation") {
                this.modulation = message.modulation *  16.6;
                if (message.status === "completed") {
                  this.modulation = 0;
                  this.notificationService.showSuccess("Тестирование успешно завершено, проверьте папку tests...");
                  subscription.unsubscribe();
                  clearInterval(this.interval);
                }
              }
            },
            error: (error) => {
              this.TestProcessing = false;
              this.loadingTest = false;
              subscription.unsubscribe();
              clearInterval(this.interval);
          }});
          this.subscription.add(subscription);
        });
      }, 2000);
    });
  }

  Test(Test_type: string) {
    this.loadingTest = true;
    const InputedParams = 
    {
      pa1: this.pa1,
      pa2: this.pa2,
      v1: this.splitterST,
      v2: this.splitterM3M,
      c1: this.cable1,
      c2: this.cable2,
      c3: this.cable3,
      duration: this.duration,
      bandwidth: this.selectionBandwidth
    };

    const message = {"type": `${Test_type}`, "deviceId": "stat", "command": InputedParams};
    this.sharedWebSocketService.sendMessage(message);

    const connectionTimeout = timer(5000).subscribe(() => {
      this.loadingTest = false;
      connectionTimeout.unsubscribe();
    });

    let subscription = this.sharedWebSocketService.getMessages().subscribe({
      next: (message) => {
        if (message.type === "sended" && message.deviceId === "stat") {
          this.pullman();
          connectionTimeout.unsubscribe();
          this.TestProcessing = true;
          if (message.status !== "completed") {
            this.notificationService.showError('Проверьте подключение к устройствам');
          }
        } 
          this.buttonsControlTest(subscription);
      },
      error: (error) => {
        connectionTimeout.unsubscribe();
        this.notificationService.showError('Проверьте подключение к устройствам');
        this.buttonsControlTest(subscription);
      }
    });
    this.subscription.add(subscription);
  }
}