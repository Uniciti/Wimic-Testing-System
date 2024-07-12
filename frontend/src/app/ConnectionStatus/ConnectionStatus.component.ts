import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgClass, NgFor } from "@angular/common";
import { Subscription } from 'rxjs';

import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

import { ConnectionStatusService } from '../core/services/ConnectionStatus.service';

@Component({
  selector: 'app-ConnectionStatus',
  standalone: true, 
  imports: [
    NgClass,
    NgFor,
    TableModule,
    CardModule,
    ButtonModule
  ],
  templateUrl: './ConnectionStatus.component.html',
  styleUrls: ['./ConnectionStatus.component.css']
})

export class ConnectionStatusComponent implements OnInit, OnDestroy {
  bercutStatus: string = '';
  attStatus: string = '';
  StationStatus: string = '';
  M3MStatus: string = '';

  _IP_Abonent: string | null = '';
  _IP_Base: string | null = '';
  _Frequency: string | null = null;  
  _Bandwidth: string = '';
  _Attenuation: string = '';
  _Offset: string | null = null;

  tableOpacity = false;

  devices = [
    { device: 'Беркут-ЕТ', status: 'Отключено' },
    { device: 'Аттенюатор', status: 'Отключено' },
    { device: 'Станции', status: 'Отключено' },
    { device: 'M3M', status: 'Отключено' }
  ];

  parameters = [
    { parameter: 'IP адрес базы', value: '' },
    { parameter: 'IP адрес абонента', value: '' },
    { parameter: 'Частота, КГц', value: '' }
  ];
  
  private subscription: Subscription = new Subscription();

  constructor(
    private connectionStatusService: ConnectionStatusService
   ) { }

  ngOnInit() {
    this.subscription.add(this.connectionStatusService.currentIP_BaseStatus.subscribe(_IP_Base => {
      this._IP_Base = _IP_Base;
    }));

    this.subscription.add(this.connectionStatusService.currentIP_AbonentStatus.subscribe(_IP_Abonent => {
      this._IP_Abonent = _IP_Abonent;
    }));

    this.subscription.add(this.connectionStatusService.currentFrequencyStatus.subscribe(_Frequency => {
      this._Frequency = _Frequency;
    }));

    this.subscription.add(this.connectionStatusService.currentBandwidthStatus.subscribe(_Bandwidth => {
      this._Bandwidth = _Bandwidth;
    }));

    this.subscription.add(this.connectionStatusService.currentAttenuationStatus.subscribe(_Attenuation => {
      this._Attenuation = _Attenuation;
    }));

    this.subscription.add(this.connectionStatusService.currentOffsetStatus.subscribe(_Offset => {
      this._Offset = _Offset;
    }));

    this.subscription.add(this.connectionStatusService.currentBercutStatus.subscribe(_bercutStatus => {
      this.bercutStatus = _bercutStatus ? "Подключено" : "Отключено";
    }));

    this.subscription.add(this.connectionStatusService.currentAttenuatorStatus.subscribe(_attStatus => {
      this.attStatus = _attStatus ? "Подключено" : "Отключено"
    }));

    this.subscription.add(this.connectionStatusService.currentStationStatus.subscribe(_StationStatus => {
      this.StationStatus = _StationStatus ? "Подключено" : "Отключено"
    }));

    this.subscription.add(this.connectionStatusService.currentM3MStatus.subscribe(_M3MStatus => {
      this.M3MStatus = _M3MStatus ? "Подключено" : "Отключено"
    }));
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}


