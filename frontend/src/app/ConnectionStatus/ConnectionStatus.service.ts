import { Injectable } from '@angular/core';
import { BehaviorSubject, Subscription, interval } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedService {

  //private subscription_interval: Subscription = new Subscription();
  // private berSubject = new BehaviorSubject<boolean>(false);
  // private attSubject = new BehaviorSubject<boolean>(false);
  // private statSubject = new BehaviorSubject<boolean>(false);
  // private m3mSubject = new BehaviorSubject<boolean>(false);

  // ber$ = this.berSubject.asObservable();
  // att$ = this.berSubject.asObservable();
  // stat$ = this.berSubject.asObservable();
  // m3m$ = this.berSubject.asObservable();

  constructor() { }

  private IP_BaseStatusSource = new BehaviorSubject<string>('');
  currentIP_BaseStatus = this.IP_BaseStatusSource.asObservable();

  private IP_AbonentStatusSource = new BehaviorSubject<string>('');
  currentIP_AbonentStatus = this.IP_AbonentStatusSource.asObservable();

  private frequencyStatusSource = new BehaviorSubject<string | null>(null);
  currentFrequencyStatus = this.frequencyStatusSource.asObservable();

  private BandwidthStatusSource = new BehaviorSubject<string>('');
  currentBandwidthStatus = this.BandwidthStatusSource.asObservable();

  private AttenuationStatusSource = new BehaviorSubject<string>('');
  currentAttenuationStatus = this.AttenuationStatusSource.asObservable();

  private OffsetStatusSource = new BehaviorSubject<string | null>(null);
  currentOffsetStatus = this.OffsetStatusSource.asObservable();

  private BercutStatus = new BehaviorSubject<boolean>(false);
  currentBercutStatus = this.BercutStatus.asObservable();

  private AttenuatorStatus = new BehaviorSubject<boolean>(false);
  currentAttenuatorStatus = this.AttenuatorStatus.asObservable();

  private StationStatus = new BehaviorSubject<boolean>(false);
  currentStationStatus = this.StationStatus.asObservable();

  private M3MStatus = new BehaviorSubject<boolean>(false);
  currentM3MStatus = this.M3MStatus.asObservable();

  changeOidParamsStatus(_Frequency: string | null, _Bandwidth: string) {
    this.frequencyStatusSource.next(_Frequency);
	  this.BandwidthStatusSource.next(_Bandwidth);
  }

  changeIpParamsStatus(_IP_Base: string, _IP_Abonent: string) {
    this.IP_BaseStatusSource.next(_IP_Base);
	  this.IP_AbonentStatusSource.next(_IP_Abonent);
  }

  changeOffsetM3MStatus(_Offset: string | null) {
	  this.OffsetStatusSource.next(_Offset);
  }
  
  changeAttenuationAttStatus(_Attenuation: string) {
	  this.AttenuationStatusSource.next(_Attenuation);
  }

  updateStatus(device: string, value: boolean): void {
    switch(device) {
      case "ber":
        this.BercutStatus.next(value);
        break;
      case "att":
        this.AttenuatorStatus.next(value);
        break;
      case "stat":
        this.StationStatus.next(value);
        break;
      case "m3m":
        this.M3MStatus.next(value);
        break;
      default:
        console.log("Такого устройства не существует.");
    }
    
  }

//   updateStatus(message: any): void {
//     if (message.deviceId === "bercut" && message.type === "is-connected") {
//       this.bercutStatus = message.isConnected == true ? 'Подключено' : 'Отключено';
//     } else if (message.deviceId === "attenuator" && message.type === "is-connected") {
//       this.attStatus = message.isConnected == true ? 'Подключено' : 'Отключено';
//     } else if (message.deviceId === "M3M" && message.type === "is-connected") {
//       this.M3MStatus = message.isConnected == true ? 'Подключено' : 'Отключено';
//     }
//      if (message.deviceId === "bercut" && (message.type === "disconnect" || message.type === "connect")) {
//       this.bercutStatus = message.type === "connect" ? 'Подключено' : 'Отключено';
//     } else if (message.deviceId === "attenuator" && (message.type === "disconnect" || message.type === "connect")) {
//       this.attStatus = message.type === "connect" ? 'Подключено' : 'Отключено';
//     } else if (message.deviceId === "M3M" && (message.type === "disconnect" || message.type === "connect")) {
//       this.M3MStatus = message.type === "connect" ? 'Подключено' : 'Отключено';
//     }
//  }

  // setBer(value: boolean) {
  //   this.berSubject.next(value);
  // }

  // setAtt(value: boolean) {
  //   this.attSubject.next(value);
  // }

  // stopSendingMessagesBer() {
  //   if (this.subscription_interval) {
  //     this.subscription_interval.unsubscribe();
  //     this.subscription_interval = new Subscription(); // reset the subscription
  //   }
  // }
}