import net from 'net';
// import { Device } from '../interfaces/device.interface';
import 'dotenv/config';

const ATTENUATOR_HOST = process.env.ATTENUATOR_HOST || '169.254.0.160';
const ATTENUATOR_PORT = parseInt(process.env.ATTENUATOR_PORT || '5025', 10);

export class TcpClient {
  private host: string;
  private port: number;
  private client: net.Socket;
  private isConnected: boolean;

  constructor(host: string, port: number) {
    this.host = host;
    this.port = port;
    this.client = new net.Socket();
    this.isConnected = false;

    this.client.on('close', () => {
          this.isConnected = false;
          console.log('TCP connection closed.');
    });

  }

  public connect(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      console.log(`Attempting to connect to TCP server at ${this.host}:${this.port}...`);

      const connectionTimeout = setTimeout(() => {
        console.error('Connection timed out.');
        this.isConnected = false;
        this.client.destroy(); // Завершаем попытку подключения
        resolve(false);
      }, 5000);

      this.client.connect(this.port, this.host, () => {
        clearTimeout(connectionTimeout);
        this.isConnected = true;
        console.log('TCP connection established.');
        resolve(true);
      });

      this.client.once('error', (error) => {
        clearTimeout(connectionTimeout);
        console.error('TCP error occurred:', error.message);
        this.isConnected = false;
        this.client.destroy();
        reject(error);
      });
    });
  }

  public disconnect(): void {
    if (this.isConnected) {
      this.client.destroy();
      this.isConnected = false;
      console.log('Disconnected from TCP server.');
    }
  }

  public sendCommand(attValue: number): Promise<void> {
    const command = `:INP:ATT ${attValue.toString()}\n`;

    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        return reject(new Error('Not connected to TCP server.'));
      }

      console.log(`Sending command: ${command}`);
      this.client.write(command, (error) => {
        if (error) {
          return reject(error);
        }

        // Wait for 1500 milliseconds before resolving
        setTimeout(() => {
          resolve();
        }, 2000);
      });
    });
  }

  public receiveData(): Promise<string> {
    const command = ':INP:ATT?\n';

    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        return reject(new Error('Not connected to TCP server.'));
      }

      console.log(`Sending command: ${command}`);
      this.client.write(command, (error) => {
        if (error) {
          return reject(error);
        }

        this.client.once('data', (data) => {
          console.log('Received attenuator value:', data.toString());
          resolve(data.toString());
        });

        this.client.once('error', (error) => {
          reject(error);
        });
      });
    });

  }


  public checkConnect(): Promise<boolean> {
    const command = '*IDN?\n';

    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        console.log('Not connected to TCP server.');
        return resolve(false);
      }

      this.client.write(command, (error) => {
        if (error) {
          this.isConnected = false;
          return reject(error);
        }

        const timeout = setTimeout(() => {
          this.isConnected = false;
          console.log('Connection check timeout. Attenuator may be disconnected.');
          resolve(false);
        }, 1000);

        this.client.once('data', () => {
          clearTimeout(timeout);
          resolve(true);
        });

        this.client.once('error', (error) => {
          clearTimeout(timeout);
          this.isConnected = false;
          reject(error);
        });
      });
    });
  }

}

// {"type":"connect", "deviceId":"attenuator"}
// {"type":"is-connected", "deviceId":"attenuator"}

export const tcpClient = new TcpClient(ATTENUATOR_HOST, ATTENUATOR_PORT);