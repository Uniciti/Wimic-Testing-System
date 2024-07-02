import { ApplicationConfig } from '@angular/core';
import { provideRouter, Routes } from '@angular/router';
import { DeviceStatusComponent } from './deviceStatus/deviceStatus.component';
import { mainTestsComponent } from './mainTests/mainTests.component';

const routes: Routes = [
  { path: '', redirectTo: '/deviceStatus', pathMatch: 'full' },
  { path: 'deviceStatus', component: DeviceStatusComponent },
  { path: 'mainTests', component: mainTestsComponent }
];

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes)]
};
