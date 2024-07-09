import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, Routes } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';
import { DeviceStatusComponent } from './deviceStatus/deviceStatus.component';
import { mainTestsComponent } from './mainTests/mainTests.component';
import { CustomRouteReuseStrategy } from './app.component.service';
import { RouteReuseStrategy } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: '/deviceStatus', pathMatch: 'full' },
  { path: 'deviceStatus', component: DeviceStatusComponent },
  { path: 'mainTests', component: mainTestsComponent }
];

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(BrowserModule),
    provideRouter(routes),
    { provide: RouteReuseStrategy, useClass: CustomRouteReuseStrategy }]
};