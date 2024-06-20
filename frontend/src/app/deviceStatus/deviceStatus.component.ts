import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
//import { HttpClient } from '@angular/common/http';
import { NgIf } from "@angular/common";
import { Subscription, timer, interval } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SharedWebSocketService } from '../SharedWebSocket.service';
import { SharedService } from '../ConnectionStatus/ConnectionStatus.service';
import { NotificationService } from '../Notifications/Notification.service';
  
interface Message {
  type: string;
  ber: boolean;
  att: boolean;
  stat: boolean;
  M3M: boolean;
}

@Component({
  selector: 'app-deviceStatus',
  standalone: true,
  imports: [
    FormsModule,
    NgIf,
    ButtonModule,
    SelectButtonModule,
    InputNumberModule,
    InputTextModule
  ],
  templateUrl: './deviceStatus.component.html',
  styleUrls: ['./deviceStatus.component.css']
})

export class deviceStatusComponent implements OnInit, OnDestroy {
  bercutConnected: boolean = false;
  attConnected: boolean = false;
  statConnected: boolean = false;
  M3MConnected: boolean = false;

  stationOptions: any[] = [{ label: '10 МГц', value: '3' },{ label: '20 МГц', value: '5' }];

  inputIP_BASE: string = '';
  inputIP_ABONENT: string = '';
  errorMessage: string | null = null;
  inputFrequency: string = '';
  selectionBandwidth: string = '';
  inputAttenuation: string = '';
  inputCommandBer: string = '';
  inputOffset: string = '';

  loadingAtt: boolean = false;
  loadingBer: boolean = false;
  loadingStat: boolean = false;
  loadingStatIp: boolean = false;
  loadingStatParams: boolean = false;
  loadingM3M: boolean = false;
  loadingM3Msend: boolean = false;

  private subscription: Subscription = new Subscription();
  
  constructor(
    //private http: HttpClient,
    private sharedWebSocketService: SharedWebSocketService, 
    private sharedService: SharedService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
  //    this.subscription.add(this.sharedWebSocketService.getMessages().subscribe(message => {
  //     if (message.deviceId === "attenuator" && message.type === "is-connected" && message.isConnected == true) {
  //       this.attConnected = true;
  //     }
  //     else if (message.deviceId === "attenuator" && message.type === "is-connected" && message.isConnected == false) {
  //       this.notificationService.showNotification('Аттенюатор отключился ');
  //      // this.subscription.unsubscribe();
  //       this.attConnected = false;
  //     }
  //     else if (message.deviceId === "bercut" && message.type === "is-connected" &&  message.isConnected == true) {
  //       this.bercutConnected = true;
  //     }
  //     else if (message.deviceId === "bercut" && message.type === "is-connected" &&  message.isConnected == false) {
  //       this.notificationService.showNotification('Беркут-ЕТ отключился ');
  //       //this.sharedService.stopSendingMessagesAtt();
  //       //this.subscription.unsubscribe();
  //       this.bercutConnected = false;
  //     }
  //     this.cdr.detectChanges();
  // }));
    // this.subscription = this.sharedService.ber$.subscribe(ber => {
    //   ber = this.bercutConnected;
    // });
    // this.subscription = this.sharedService.att$.subscribe(att => {
      
    // });
    this.startSendingMessages();
  };

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  startSendingMessages() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.subscription = interval(5000).subscribe(() => {
      const message: Message = {
        "type": "is-connected",
        "ber": this.bercutConnected,
        "att": this.attConnected,
        "stat": this.statConnected,
        "M3M": this.M3MConnected  
      };
      this.sharedWebSocketService.sendMessage(message);
    });

    this.sharedWebSocketService.getMessages().subscribe(message_ => {
      if (message_.type === "is-connected") {
        if (message_.pingBert == false && this.bercutConnected == true) {
          this.loadingBer = false;
          this.bercutConnected = false;
          this.sharedService.updateStatus("ber", this.bercutConnected);
        }
        if (message_.pingAtt == false && this.attConnected == true) {
          this.loadingAtt = false;
          this.attConnected = false;
          this.sharedService.updateStatus("att", this.attConnected);
        }
        if ((message_.isStat0 == false || message_.isStat1 == false) && this.statConnected == true) {
          this.loadingStat = false;
          this.statConnected = false;
          this.sharedService.updateStatus("stat", this.statConnected);
        }
        //this.sharedService.updateStatus(message_);
        this.cdr.detectChanges();
      }
    })
  };

  load(property: 'loadingAtt' | 'loadingBer' | 'loadingStat' | 'loadingM3M'
    | 'loadingStatIp' | 'loadingStatParams' | 'loadingM3Msend'): void {
    this[property] = true;

    setTimeout(() => {
      this[property] = false;
    }, 4000);
  }

  connectBer() {
    this.loadingBer = true;
    const message = { "type": "connect", "deviceId": "bercut" };
    this.sharedWebSocketService.sendMessage(message);

    const timeout = timer(5000).subscribe(() => {
      this.loadingBer = false;
      timeout.unsubscribe();
    });

    let subscription = this.sharedWebSocketService.getMessages().subscribe({
      next: (message) => {
        if (message.type === "connect" && message.deviceId === "bercut" && message.conStatus == true) {
          this.loadingBer = false;
          this.bercutConnected = true;
          //this.sharedService.startSendingMessagesBer(); // Начинаем опрос устройства
          //this.sharedService.setBer(true);
          this.sharedService.updateStatus("ber", this.bercutConnected);
          this.cdr.detectChanges();
          subscription.unsubscribe();
          timeout.unsubscribe();
        } else {
          this.notificationService.showNotification('Ошибка подключения к Беркут-ЕТ');
          this.loadingBer = false;
          this.bercutConnected = false;
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        this.loadingBer = false;
        this.notificationService.showNotification('Ошибка подключения к Беркут-ЕТ');
        this.cdr.detectChanges();
        subscription.unsubscribe();
        timeout.unsubscribe();
      }
    });
    this.subscription.add(subscription);
  }

  disconnectBer() {
    this.loadingBer = true;
    const message = { "type": "disconnect", "deviceId": "bercut" };
    this.sharedWebSocketService.sendMessage(message);

    const timeout = timer(5000).subscribe(() => {
      this.loadingBer = false;
      timeout.unsubscribe();
    });

    let subscription = this.sharedWebSocketService.getMessages().subscribe({
      next: (message) => {
      if (message.type === "disconnect" && message.deviceId === "bercut") {
        this.loadingBer = false;
        this.bercutConnected = false;
        this.sharedService.updateStatus("ber", this.bercutConnected);
        this.cdr.detectChanges();
        //this.sharedService.stopSendingMessagesAtt(); // Останавливаем опрос устройства
        //this.sharedService.setBer(false);
        subscription.unsubscribe();
        timeout.unsubscribe();
      }
      else {
        this.notificationService.showNotification('Ошибка отключения от Беркут-ЕТ');
        this.loadingBer = false;
        this.bercutConnected = true;
        this.cdr.detectChanges();
      }
    }, error: (error) => {
      this.loadingBer = false;
      this.notificationService.showNotification('Ошибка отключения от Беркут-ЕТ');
      this.cdr.detectChanges();
      subscription.unsubscribe();
      timeout.unsubscribe();
    }
    });
    this.subscription.add(subscription); // Добавляем подписку в общий объект подписок
  }

  connectAtt() {
    this.loadingAtt = true;
    const message = { "type": "connect", "deviceId": "attenuator" };
    this.sharedWebSocketService.sendMessage(message);

    const timeout = timer(5000).subscribe(() => {
      this.loadingAtt = false;
      timeout.unsubscribe();
    });

    let subscription = this.sharedWebSocketService.getMessages().subscribe({
      next: (message) => {
      if (message.type === "connect" && message.deviceId === "attenuator" && message.conStatus == true) {
        this.loadingAtt = false;
        this.attConnected = true;
        this.sharedService.updateStatus("att", this.attConnected);
        this.cdr.detectChanges();
        //this.sharedService.setAtt(true);
        subscription.unsubscribe();
        timeout.unsubscribe();
      } else {
        this.notificationService.showNotification('Ошибка подключения к аттенюатору');
        this.loadingAtt = false;
        this.attConnected = false;
        this.cdr.detectChanges();
      }
    }, error: (error) => {
      this.loadingAtt = false;
      this.notificationService.showNotification('Ошибка подключения к аттенюатору');
      this.cdr.detectChanges();
      subscription.unsubscribe();
      timeout.unsubscribe();
    }
    });
    this.subscription.add(subscription);
  }

  disconnectAtt() {
    this.loadingAtt = true;
    const message = { "type": "disconnect", "deviceId": "attenuator" };
    this.sharedWebSocketService.sendMessage(message);

    const timeout = timer(5000).subscribe(() => {
      this.loadingAtt = false;
      timeout.unsubscribe();
    });

    let subscription = this.sharedWebSocketService.getMessages().subscribe({
      next: (message) => {
      if (message.type === "disconnect" && message.deviceId === "attenuator") {
        this.loadingAtt = false;
        this.attConnected = false;
        this.sharedService.updateStatus("att", this.attConnected);
        this.cdr.detectChanges();
        //this.sharedService.stopSendingMessagesAtt();
        //this.sharedService.setAtt(false);
        subscription.unsubscribe();
        timeout.unsubscribe();
      } else {
        this.notificationService.showNotification('Ошибка отключения от аттенюатора');
        this.loadingAtt = false;
        this.attConnected = true;
        this.cdr.detectChanges();
      }
    }, error: (error) => {
      this.loadingAtt = false;
      this.notificationService.showNotification('Ошибка отключения от аттенюатора');
      this.cdr.detectChanges();
      subscription.unsubscribe();
      timeout.unsubscribe();
    }
    });
    this.subscription.add(subscription);
  }

  
  connectStat() {
    this.loadingStat = true;
    const message = { "type": "connect", "deviceId": "stat" };
    this.sharedWebSocketService.sendMessage(message);

    const timeout = timer(5000).subscribe(() => {
      this.loadingStat = false;
      timeout.unsubscribe();
    });

    let subscription = this.sharedWebSocketService.getMessages().subscribe({
      next: (message) => {
      if (message.type === "connect" && message.deviceId === "stat" && message.conStatus == true) {
        this.loadingStat = false;
        this.statConnected = true;
        this.sharedService.updateStatus("stat", this.statConnected);
        this.cdr.detectChanges();
        subscription.unsubscribe();
        timeout.unsubscribe();
      } else {
        this.notificationService.showNotification('Ошибка подключения к cтанциям');
        this.loadingStat = false;
        this.statConnected = false;
        this.cdr.detectChanges();
      }
    }, error: (error) => {
      this.loadingStat = false;
      this.notificationService.showNotification('Ошибка подключения к cтанциям');
      this.cdr.detectChanges();
      subscription.unsubscribe();
      timeout.unsubscribe();
    }
    });
    this.subscription.add(subscription);
  }

  disconnectStat() {
    this.loadingStat = true;
    const message = { "type": "disconnect", "deviceId": "stat" };
    this.sharedWebSocketService.sendMessage(message);

    const timeout = timer(5000).subscribe(() => {
      this.loadingStat = false;
      timeout.unsubscribe();
    });

    let subscription = this.sharedWebSocketService.getMessages().subscribe({
      next: (message) => {
      if (message.type === "disconnect" && message.deviceId === "stat") {
        this.loadingStat = false;
        this.statConnected = false;
        this.sharedService.updateStatus("stat", this.statConnected);
        this.cdr.detectChanges();
        subscription.unsubscribe();
        timeout.unsubscribe();
      } else {
        this.notificationService.showNotification('Ошибка отключения от станций');
        this.loadingStat = false;
        this.statConnected = true;
        this.cdr.detectChanges();
      }
    }, error: (error) => {
      this.loadingStat = false;
      this.notificationService.showNotification('Ошибка отключения от станций');
      this.cdr.detectChanges();
      subscription.unsubscribe();
      timeout.unsubscribe();
    }
    });
    this.subscription.add(subscription);
  }

  connectM3M() {
    this.loadingM3M = true;
    const message = { "type": "connect", "deviceId": "m3m" };
    this.sharedWebSocketService.sendMessage(message);

    const timeout = timer(5000).subscribe(() => {
      this.loadingM3M = false;
      timeout.unsubscribe();
    });

    let subscription = this.sharedWebSocketService.getMessages().subscribe({
      next: (message) => {
      if (message.type === "connect" && message.deviceId === "m3m" && message.conStatus == true) {
        this.loadingM3M = false;
        this.M3MConnected = true;
        this.sharedService.updateStatus("m3m", this.M3MConnected);
        this.cdr.detectChanges();
        subscription.unsubscribe();
        timeout.unsubscribe();
      } else {
        this.notificationService.showNotification('Ошибка подключения к M3M');
        this.loadingM3M = false;
        this.M3MConnected = false;
        this.cdr.detectChanges();
      }
    }, error: (error) => {
      this.loadingM3M = false;
      this.notificationService.showNotification('Ошибка подключения к M3M');
      this.cdr.detectChanges();
      subscription.unsubscribe();
      timeout.unsubscribe();
    }
    });
    this.subscription.add(subscription);
  }

  disconnectM3M() {
    this.loadingM3M = true;
    const message = { "type": "disconnect", "deviceId": "m3m" };
    this.sharedWebSocketService.sendMessage(message);

    const timeout = timer(5000).subscribe(() => {
      this.loadingM3M = false;
      timeout.unsubscribe();
    });

    let subscription = this.sharedWebSocketService.getMessages().subscribe({
      next: (message) => {
      if (message.type === "disconnect" && message.deviceId === "m3m") {
        this.loadingM3M = false;
        this.M3MConnected = false;
        this.sharedService.updateStatus("m3m", this.M3MConnected);
        this.cdr.detectChanges();
        //this.sharedService.stopSendingMessagesAtt();
        //this.sharedService.setAtt(false);
        subscription.unsubscribe();
        timeout.unsubscribe();
      } else {
        this.notificationService.showNotification('Ошибка отключения от M3M');
        this.loadingM3M = false;
        this.M3MConnected = true;
        this.cdr.detectChanges();
      }
    }, error: (error) => {
      this.loadingM3M = false;
      this.notificationService.showNotification('Ошибка отключения от M3M');
      this.cdr.detectChanges();
      subscription.unsubscribe();
      timeout.unsubscribe();
    }
    });
    this.subscription.add(subscription);
  }

  sendCommandAtt() {
    const message = { "type": "send-command", "deviceId": "attenuator", "value": `${this.inputAttenuation}` };
    console.log('message');
    this.sharedService.changeAttenuationAttStatus(`${this.inputAttenuation}`);
    this.sharedWebSocketService.sendMessage(message);
    console.log('zalupa');
  }


  sendCommandBer() {
    const message = { "type": "send-command", "deviceId": "bercut", "command": `${this.inputCommandBer}` };
    console.log('message');
    this.sharedService.changeAttenuationAttStatus("44");
    this.sharedWebSocketService.sendMessage(message);
    console.log('zalupa');
    }

  sendOID() {
    this.loadingStatParams = true;
    const InputedParams = {
      frequency: this.inputFrequency,
      width: this.selectionBandwidth
    };

    const message = {"type": "send-command", "deviceId": "stat", "command": InputedParams};
    this.sharedWebSocketService.sendMessage(message);

    const timeout = timer(5000).subscribe(() => {
      this.loadingStatParams = false;
      timeout.unsubscribe();
    });

    let subscription = this.sharedWebSocketService.getMessages().subscribe({
      next: (message) => {
      if (message.type === "sended" && message.deviceId === "stat") {
        this.loadingStatParams = false;
        //this.attConnected = false;
        this.sharedService.changeOidParamsStatus(InputedParams.frequency, InputedParams.width);
        this.cdr.detectChanges();
        subscription.unsubscribe();
        timeout.unsubscribe();
      } else {
        this.notificationService.showNotification('Ошибка отправки параметров к станциям');
        this.loadingStatParams = false;
        this.cdr.detectChanges();
      }
    }, error: (error) => {
      this.loadingStatParams = false;
      this.notificationService.showNotification('Ошибка отправки параметров к станциям');
      this.cdr.detectChanges();
      subscription.unsubscribe();
      timeout.unsubscribe();
    }
    });
    this.subscription.add(subscription);
  }

  sendIP() {
    const InputedParamsIP = {
      baseIP: this.inputIP_BASE,
      abonentIP: this.inputIP_ABONENT
    };

    const isBaseValid = this.validateIpAddress(this.inputIP_BASE);
    const isAbonentValid = this.validateIpAddress(this.inputIP_ABONENT);

    if (!isBaseValid || !isAbonentValid) {
      this.notificationService.showNotification('Некорректный ввод IP адресов для станций ');
      return;
    }

    this.loadingStatIp = true;

    const message = {"type": "send-command", "deviceId": "stat", "command": InputedParamsIP};
    this.sharedWebSocketService.sendMessage(message);

    const timeout = timer(5000).subscribe(() => {
      this.loadingStatIp = false;
      timeout.unsubscribe();
    });

    let subscription = this.sharedWebSocketService.getMessages().subscribe({
      next: (message) => {
      if (message.type === "sended" && message.deviceId === "stat") {
        this.loadingStatIp = false;
        this.sharedService.changeIpParamsStatus(InputedParamsIP.baseIP, InputedParamsIP.abonentIP);
        this.cdr.detectChanges();
        subscription.unsubscribe();
        timeout.unsubscribe();
      } else {
        this.notificationService.showNotification('Ошибка отправки параметров к станциям');
        this.loadingStatIp = false;
        this.cdr.detectChanges();
      }
    }, error: (error) => {
      this.loadingStatIp = false;
      this.notificationService.showNotification('Ошибка отправки параметров к станциям');
      this.cdr.detectChanges();
      subscription.unsubscribe();
      timeout.unsubscribe();
    }
    });
    this.subscription.add(subscription);
  }

  validateIpAddress(ip: string): boolean {
    const ipPattern = /^(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}$/;
    return ipPattern.test(ip);
  }

  swapMode() {
    const temp = this.inputIP_BASE;
    this.inputIP_BASE = this.inputIP_ABONENT;
    this.inputIP_ABONENT = temp;
    this.cdr.detectChanges();
    console.log('Роли сменены: BASE ->', this.inputIP_BASE, ', ABONENT ->', this.inputIP_ABONENT);
  }

  sendM3M() {
    const InputedParamsM3M = {
      offset: this.inputOffset
    };

    this.loadingM3Msend = true;

    const message = {"type": "send-command", "deviceId": "m3m", "command": InputedParamsM3M};
    this.sharedWebSocketService.sendMessage(message);

    const timeout = timer(5000).subscribe(() => {
      this.loadingM3Msend = false;
      timeout.unsubscribe();
    });

    let subscription = this.sharedWebSocketService.getMessages().subscribe({
      next: (message) => {
      if (message.type === "sended" && message.deviceId === "m3m") {
        this.loadingM3Msend = false;
        this.sharedService.changeOffsetM3MStatus(InputedParamsM3M.offset);
        this.cdr.detectChanges();
        subscription.unsubscribe();
        timeout.unsubscribe();
      } else {
        this.notificationService.showNotification('Ошибка отправки компенсации к M3M');
        this.loadingM3Msend = false;
        this.cdr.detectChanges();
      }
    }, error: (error) => {
      this.loadingM3Msend = false;
      this.notificationService.showNotification('Ошибка отправки компенсации к M3M');
      this.cdr.detectChanges();
      subscription.unsubscribe();
      timeout.unsubscribe();
    }
    });
    this.subscription.add(subscription);
  }
}