import { Component, OnInit, OnDestroy } from '@angular/core';
import { SharedWebSocketService } from '../SharedWebSocket.service';
import { SharedService } from './ConnectionStatus.service';
import { NgClass } from "@angular/common";
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-ConnectionStatus',
  standalone: true,
  imports: [NgClass],
  templateUrl: './ConnectionStatus.component.html',
  styleUrls: ['./ConnectionStatus.component.css']
})

export class ConnectionStatusComponent implements OnInit, OnDestroy {
  bercutStatus: string = '';
  attStatus: string = '';
  StationStatus: string = '';
  M3MStatus: string = '';

  _IP_Abonent: string = '';
  _IP_Base: string = '';
  _Frequency: string = '';  
  _Bandwidth: string = '';
  _Attenuation: string = '';
  _Offset: string = '';
  
  private subscription: Subscription = new Subscription();

  //public messages: any[] = [];
  //public isConnected: boolean = false;

  constructor(private sharedWebSocketService: SharedWebSocketService, private sharedService: SharedService) { }

  ngOnInit() {
    this.sharedWebSocketService.connect();

    // this.subscription.add(this.sharedWebSocketService.getMessages().subscribe(message => {
    //   //this.updateStatus(message);
    // }));

    //  this.subscription_interval_attenuator = interval(5000).subscribe(() => {
    //   const message = {
    //     "type": "is-connected",
    //     "deviceId": "attenuator"
    //   };
    //   this.sharedWebSocketService.sendMessage(message);
    // });

    this.subscription.add(this.sharedService.currentIP_BaseStatus.subscribe(_IP_Base => {
      this._IP_Base = _IP_Base;
    }));

    this.subscription.add(this.sharedService.currentIP_AbonentStatus.subscribe(_IP_Abonent => {
      this._IP_Abonent = _IP_Abonent;
    }));

    this.subscription.add(this.sharedService.currentFrequencyStatus.subscribe(_Frequency => {
      this._Frequency = _Frequency;
    }));

    this.subscription.add(this.sharedService.currentBandwidthStatus.subscribe(_Bandwidth => {
      this._Bandwidth = _Bandwidth;
    }));

    this.subscription.add(this.sharedService.currentAttenuationStatus.subscribe(_Attenuation => {
      this._Attenuation = _Attenuation;
    }));

    this.subscription.add(this.sharedService.currentOffsetStatus.subscribe(_Offset => {
      this._Offset = _Offset;
    }));

    this.subscription.add(this.sharedService.currentBercutStatus.subscribe(_bercutStatus => {
      this.bercutStatus = _bercutStatus ? "Подключено" : "Отключено";
    }));

    this.subscription.add(this.sharedService.currentAttenuatorStatus.subscribe(_attStatus => {
      this.attStatus = _attStatus ? "Подключено" : "Отключено"
    }));

    this.subscription.add(this.sharedService.currentStationStatus.subscribe(_StationStatus => {
      this.StationStatus = _StationStatus ? "Подключено" : "Отключено"
    }));

    this.subscription.add(this.sharedService.currentM3MStatus.subscribe(_M3MStatus => {
      this.M3MStatus = _M3MStatus ? "Подключено" : "Отключено"
    }));
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.sharedWebSocketService.disconnect();
  }

  // private updateStatus(message: any): void {
  //    if (message.deviceId === "bercut" && message.type === "is-connected") {
  //      this.bercutStatus = message.isConnected == true ? 'Подключено' : 'Отключено';
  //    } else if (message.deviceId === "attenuator" && message.type === "is-connected") {
  //      this.attStatus = message.isConnected == true ? 'Подключено' : 'Отключено';
  //    } else if (message.deviceId === "M3M" && message.type === "is-connected") {
  //      this.M3MStatus = message.isConnected == true ? 'Подключено' : 'Отключено';
  //    }
  //     if (message.deviceId === "bercut" && (message.type === "disconnect" || message.type === "connect")) {
  //      this.bercutStatus = message.type === "connect" ? 'Подключено' : 'Отключено';
  //    } else if (message.deviceId === "attenuator" && (message.type === "disconnect" || message.type === "connect")) {
  //      this.attStatus = message.type === "connect" ? 'Подключено' : 'Отключено';
  //    } else if (message.deviceId === "M3M" && (message.type === "disconnect" || message.type === "connect")) {
  //      this.M3MStatus = message.type === "connect" ? 'Подключено' : 'Отключено';
  //    }
  // }
}


