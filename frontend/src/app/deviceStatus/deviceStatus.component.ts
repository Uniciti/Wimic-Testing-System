import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from "@angular/common";
import { Subscription, timer, interval } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SharedWebSocketService } from '../SharedWebSocket.service';
import { ConnectionStatusService } from '../core/services/ConnectionStatus.service';
import { NotificationService } from '../Notification.service';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-deviceStatus',
  standalone: true,
  imports: [
    FormsModule,
    NgIf,
    ButtonModule,
    SelectButtonModule,
    InputNumberModule,
    InputTextModule,
    ToastModule
  ],
  templateUrl: './deviceStatus.component.html',
  styleUrls: ['./deviceStatus.component.css'],
  providers: [ NotificationService ]
})

export class DeviceStatusComponent implements OnInit, OnDestroy {
  deviceConnected: boolean =  false;

  inputIP_BASE: string = '';
  inputIP_ABONENT: string = '';
  inputFrequency: string = '5600000';
  inputOffset: string = '';

  loadingButtons: {[key: string] : boolean} = {
    "Att": false,
    "Ber": false,
    "Stat": false,
    "M3M": false,
    "StatIP": false,
    "StatOID": false,
    "M3Moffset": false
  }

  connectionsButtons: {[key: string] : boolean} = {
    "Att": false,
    "Ber": false,
    "Stat": false,
    "M3M": false
  }

  private subscription: Subscription = new Subscription();
  
  constructor(
    private sharedWebSocketService: SharedWebSocketService, 
    private connectionStatusService: ConnectionStatusService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}
 
  ngOnInit() { };

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  buttonControlDevice(device: string ,_connected: boolean, sub: Subscription) {
    this.loadingButtons[device] = false;
    this.deviceConnected = _connected;
    this.cdr.detectChanges();
    sub.unsubscribe();
  }

  connectToDevice(device: string) {
    this.loadingButtons[device] = true;       //ХУЙ ЗНАЕТ , МБ НЕ РАБОТАЕТ , ТОЛЯН СКАЩАЛ, ЧТО НОРМАС ВРОДЕ
    const message = { "type": "connect", "deviceId": device };
    this.sharedWebSocketService.sendMessage(message);

    const timeout = timer(5000).subscribe(() => {
      this.loadingButtons[device] = false;
      timeout.unsubscribe();
    });

    let subscription = this.sharedWebSocketService.getMessages().subscribe({
      next: (message) => {
        if (message.type === "connect" && message.deviceId === device && message.conStatus == true) {
          this.connectionStatusService.updateStatus(device, this.deviceConnected);
          this.buttonControlDevice(device, true, subscription);
          timeout.unsubscribe();
        } else {
          this.notificationService.showError('Ошибка подключения к устройству');
          this.buttonControlDevice(device, false, subscription);
          timeout.unsubscribe();
        }
      },
      error: (error) => {
        this.notificationService.showError('Ошибка подключения к устройству');
        this.buttonControlDevice(device, false, subscription);
        timeout.unsubscribe();
      }
    });
    this.subscription.add(subscription);
  }

  disconnectToDevice(device: string) {
    this.loadingButtons[device] = true;
    const message = { "type": "disconnect", "deviceId": device };
    this.sharedWebSocketService.sendMessage(message);

    const timeout = timer(5000).subscribe(() => {
      this.loadingButtons[device] = false;
      timeout.unsubscribe();
    });

    let subscription = this.sharedWebSocketService.getMessages().subscribe({
      next: (message) => {
      if (message.type === "disconnect" && message.deviceId === device) {
        this.connectionStatusService.updateStatus(device, this.deviceConnected);
        this.buttonControlDevice(device, false, subscription);
        timeout.unsubscribe();
      }
      else {
        this.notificationService.showError('Ошибка отключения от устройства');
        this.buttonControlDevice(device, true, subscription);
        timeout.unsubscribe();
      }
    }, error: (error) => {
      this.notificationService.showError('Ошибка отключения от устройства');
      this.buttonControlDevice(device, true, subscription);
      timeout.unsubscribe();
    }
    });
    this.subscription.add(subscription); // Добавляем подписку в общий объект подписок
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

  sendParams(device: string) {
    this.loadingButtons[device] = true;
    let InputedParams: {[key: string]: string} = { "" : ""};
    switch(device) {
      case "StatOID": 
        InputedParams = {
          "frequency": this.inputFrequency,
        };
        break;
      case "StatIP":
        InputedParams = {
          "baseIP": this.inputIP_BASE,
          "abonentIP": this.inputIP_ABONENT
        };

        if ((this.inputIP_ABONENT && this.inputIP_BASE) == '') {
          this.notificationService.showWarning('Введите IP адрес для станций ');
          return;
        } 
    
        const isBaseValid = this.validateIpAddress(this.inputIP_BASE);
        const isAbonentValid = this.validateIpAddress(this.inputIP_ABONENT);
    
        if (!isBaseValid || !isAbonentValid) {
          this.notificationService.showWarning('Некорректный ввод IP адресов для станций ');
          return;
        }
        break;
      case "M3Moffset":
        InputedParams = {
          "offset": this.inputOffset
        };
        break;
    };

    const message = {"type": "send-command", "deviceId": device, "command": InputedParams};
    this.sharedWebSocketService.sendMessage(message);

    const timeout = timer(5000).subscribe(() => {
      this.loadingButtons[device] = false;
      timeout.unsubscribe();
    });

    let subscription = this.sharedWebSocketService.getMessages().subscribe({
      next: (message) => {
      if (message.type === "sended" && message.deviceId === device) {
        this.loadingButtons[device] = false;
        switch(device) {
          case "StatOID":
            this.connectionStatusService.changeOidParamsStatus(InputedParams["frequency"]);
            break;
          case "StatIP":
            this.connectionStatusService.changeIpParamsStatus(InputedParams["baseIP"], InputedParams["abonentIP"]);
            break;
          case "M3Moffset":
            this.connectionStatusService.changeOffsetM3MStatus(InputedParams["offset"]);
            break;
        }
        this.cdr.detectChanges();
        subscription.unsubscribe();
        timeout.unsubscribe();
      } else {
        this.notificationService.showError('Ошибка установки параметров');
        this.loadingButtons[device] = false;
        this.cdr.detectChanges();
      }
    }, error: (error) => {
      this.loadingButtons[device] = false;
      this.notificationService.showError('Ошибка установки параметров');
      this.cdr.detectChanges();
      subscription.unsubscribe();
      timeout.unsubscribe();
    }
    });
    this.subscription.add(subscription);
  }
}