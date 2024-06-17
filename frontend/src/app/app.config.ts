import { ApplicationConfig } from '@angular/core';
import { provideRouter, Routes } from '@angular/router';
import { deviceStatusComponent } from './deviceStatus/deviceStatus.component';
import { ExpressTest } from './ExpressTest/ExpressTest.component';

const routes: Routes = [
  { path: '', redirectTo: '/deviceStatus', pathMatch: 'full' },
  { path: 'deviceStatus', component: deviceStatusComponent },
  { path: 'expressTest', component: ExpressTest }
];

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes)]
};
