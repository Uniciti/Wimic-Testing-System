import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private settingsSubject = new BehaviorSubject<any>(null);
  settings$ = this.settingsSubject.asObservable();

  updateSettings(settings: any) {
    this.settingsSubject.next(settings);
  }

  getSettings() {
    return this.settingsSubject.value;
  }
}
