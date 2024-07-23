import { Component, OnInit, ChangeDetectorRef, OnDestroy } from "@angular/core";
import { NgClass, NgFor } from "@angular/common";
import { Subscription } from "rxjs";

import { TableModule } from "primeng/table";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";

import { ConnectionStatusService } from "../core/services/ConnectionStatus.service";

@Component({
  selector: "app-ConnectionStatus",
  standalone: true,
  imports: [NgClass, NgFor, TableModule, CardModule, ButtonModule],
  templateUrl: "./ConnectionStatus.component.html",
  styleUrls: ["./ConnectionStatus.component.css"],
})
export class ConnectionStatusComponent implements OnInit, OnDestroy {
  bercutStatus: string = "";
  attStatus: string = "";
  StationStatus: string = "";
  M3MStatus: string = "";

  _IP_Abonent: string | null = "";
  _IP_Base: string | null = "";
  _Frequency: string | null = null;
  // _Bandwidth: string = '';
  // _Attenuation: string = '';
  // _Offset: string | null = null;

  //tableOpacity = false;

  devices = [
    { device: "Беркут-ЕТ", status: "Отключено" },
    { device: "Аттенюатор", status: "Отключено" },
    { device: "Станции", status: "Отключено" },
    { device: "M3M", status: "Отключено" },
  ];

  parameters = [
    { parameter: "IP адрес базы", value: "" },
    { parameter: "IP адрес абонента", value: "" },
    { parameter: "Частота, МГц", value: "" },
    { parameter: "Настройки 10МГц", value: "Стандартные" },
    { parameter: "Настройки 20МГц", value: "Стандартные" },
  ];

  private subscription: Subscription = new Subscription();

  constructor(
    private connectionStatusService: ConnectionStatusService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.subscription.add(
      this.connectionStatusService.currentIP_BaseStatus.subscribe(
        (_IP_Base) => {
          this.parameters[0].value = _IP_Base!;
          this.cdr.detectChanges();
        }
      )
    );

    this.subscription.add(
      this.connectionStatusService.currentIP_AbonentStatus.subscribe(
        (_IP_Abonent) => {
          this.parameters[1].value = _IP_Abonent!;
          this.cdr.detectChanges();
        }
      )
    );

    this.subscription.add(
      this.connectionStatusService.currentFrequencyStatus.subscribe(
        (_Frequency) => {
          this.parameters[2].value = _Frequency!;
          this.cdr.detectChanges();
        }
      )
    );

    this.subscription.add(
      this.connectionStatusService.currentBand10SettingsStatus.subscribe(
        (_settings10) => {
          if (_settings10) {
            this.parameters[3].value = "Установлено";
            this.cdr.detectChanges();
          }
        }
      )
    );

    this.subscription.add(
      this.connectionStatusService.currentBand20SettingsStatus.subscribe(
        (_settings20) => {
          if (_settings20) {
            this.parameters[4].value = "Установлено";
            this.cdr.detectChanges();
          }
        }
      )
    );

    // this.subscription.add(this.connectionStatusService.currentBandwidthStatus.subscribe(_Bandwidth => {
    //   this._Bandwidth = _Bandwidth!;
    //   this.cdr.detectChanges();
    // }));

    // this.subscription.add(this.connectionStatusService.currentAttenuationStatus.subscribe(_Attenuation => {
    //   this._Attenuation = _Attenuation!;
    //   this.cdr.detectChanges();
    // }));

    // this.subscription.add(this.connectionStatusService.currentOffsetStatus.subscribe(_Offset => {
    //   this._Offset = _Offset!;
    //   this.cdr.detectChanges();
    // }));

    this.subscription.add(
      this.connectionStatusService.currentBercutStatus.subscribe(
        (_bercutStatus) => {
          this.devices[0].status = _bercutStatus ? "Подключено" : "Отключено";
          this.cdr.detectChanges();
        }
      )
    );

    this.subscription.add(
      this.connectionStatusService.currentAttenuatorStatus.subscribe(
        (_attStatus) => {
          this.devices[1].status = _attStatus ? "Подключено" : "Отключено";
          this.cdr.detectChanges();
        }
      )
    );

    this.subscription.add(
      this.connectionStatusService.currentStationStatus.subscribe(
        (_StationStatus) => {
          this.devices[2].status = _StationStatus ? "Подключено" : "Отключено";
          this.cdr.detectChanges();
        }
      )
    );

    this.subscription.add(
      this.connectionStatusService.currentM3MStatus.subscribe((_M3MStatus) => {
        this.devices[3].status = _M3MStatus ? "Подключено" : "Отключено";
        this.cdr.detectChanges();
      })
    );
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
