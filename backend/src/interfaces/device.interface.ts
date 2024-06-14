export interface Device {
  connect(): void;
  disconnect(): void;
  // sendCommand(command: string): Promise<void>;
  // receiveData(): Promise<string>;
  checkConnect(): Promise<boolean>;
}