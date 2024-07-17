import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Observable } from 'rxjs';
//import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SharedWebSocketService {
  private socket$: WebSocketSubject<any>;

  constructor() {
    this.socket$ = webSocket('');
  }

  public connect(): void {
    this.socket$ = webSocket('ws://localhost:8080');
  }

  public sendMessage(msg: any): void {
    this.socket$.next(msg);
  }

  public getMessages(): Observable<any> {
    return this.socket$.asObservable();   //.asObservable();
  }

  public disconnect(): void {
    this.socket$.complete();
  }
}