import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class ConnectionStatusService {
  constructor() {}

  private IP_BaseStatusSource = new BehaviorSubject<string | null>(null);
  currentIP_BaseStatus = this.IP_BaseStatusSource.asObservable();

  private IP_AbonentStatusSource = new BehaviorSubject<string | null>(null);
  currentIP_AbonentStatus = this.IP_AbonentStatusSource.asObservable();

  private Band10SettingsSource = new BehaviorSubject<boolean>(false);
  currentBand10SettingsStatus = this.Band10SettingsSource.asObservable();

  private Band20SettingsSource = new BehaviorSubject<boolean>(false);
  currentBand20SettingsStatus = this.Band20SettingsSource.asObservable();

  private frequencyStatusSource = new BehaviorSubject<string | null>(null);
  currentFrequencyStatus = this.frequencyStatusSource.asObservable();

  private BandwidthStatusSource = new BehaviorSubject<string>("");
  currentBandwidthStatus = this.BandwidthStatusSource.asObservable();

  private AttenuationStatusSource = new BehaviorSubject<string>("");
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

  changeOidParamsStatus(_Frequency: string | null) {
    this.frequencyStatusSource.next(_Frequency);
    //this.BandwidthStatusSource.next(_Bandwidth);
  }

  changeIpParamsStatus(_IP_Base: string | null, _IP_Abonent: string | null) {
    this.IP_BaseStatusSource.next(_IP_Base);
    this.IP_AbonentStatusSource.next(_IP_Abonent);
  }

  changeOffsetM3MStatus(_Offset: string | null) {
    this.OffsetStatusSource.next(_Offset);
  }

  changeAttenuationAttStatus(_Attenuation: string) {
    this.AttenuationStatusSource.next(_Attenuation);
  }

  changeBand10Settings(_Status: boolean) {
    this.Band10SettingsSource.next(_Status);
  }

  changeBand20Settings(_Status: boolean) {
    this.Band20SettingsSource.next(_Status);
  }

  updateStatus(device: string, value: boolean): void {
    switch (device) {
      case "Ber":
        this.BercutStatus.next(value);
        break;
      case "Att":
        this.AttenuatorStatus.next(value);
        break;
      case "Stat":
        this.StationStatus.next(value);
        break;
      case "M3M":
        this.M3MStatus.next(value);
        break;
      default:
        console.log("Такого устройства не существует.");
    }
  }
}
