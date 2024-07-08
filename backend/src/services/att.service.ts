import net from 'net';
// import { Device } from '../interfaces/device.interface';
import 'dotenv/config';

const ATTENUATOR_HOST = process.env.ATTENUATOR_HOST || '169.254.0.160';
const ATTENUATOR_PORT = parseInt(process.env.ATTENUATOR_PORT || '5025', 10);

export class TcpClient {
  private host: string;
  private port: number;
  private output: string;
  private client: net.Socket;
  private isConnected: boolean;
  private commandResolve: ((value: string | PromiseLike<string>) => void) | null = null;
  private commandReject: ((reason?: any) => void) | null = null;

  constructor(host: string, port: number) {
    this.host = host;
    this.port = port;
    this.output = '';
    this.client = new net.Socket();
    this.isConnected = false;

    this.client.on('close', () => {
      this.isConnected = false;
      console.log('TCP connection closed.');
    });

    this.client.on('data', (data: string) => {
      this.output += data.toString();

      if (this.commandResolve) {
          this.commandResolve(this.output);
          this.commandResolve = null;
          this.commandReject = null;
      }
    });

    this.client.on('error', (error: string) => {
        console.error(`Error:\n${error}`);
        if (this.commandReject) {
            this.commandReject(error);
            this.commandResolve = null;
            this.commandReject = null;
        }
    }); 
  }


  // private setupListeners(): void {
  //   if (!this.client) return;

   


  // }



  public connect(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.isConnected) return;

      console.log(`Attempting to connect to TCP server at ${this.host}:${this.port}...`);

      // this.setupListeners()

      const connectionTimeout = setTimeout(() => {
        console.error('Connection timed out.');
        this.isConnected = false;
        this.client.destroy(); 
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
        reject('Not connected to TCP server');
      }

      console.log(`Sending command: ${command}`);
      this.client.write(command, (error) => {
        if (error) {
          reject(error);
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
        reject('Not connected to TCP server');
      }

      this.commandResolve = resolve;
      this.commandReject = reject;
      this.output = '';

      try {
        this.client.write(command);

        const checkOutput = () => {
            if (this.output) {
              console.log('Received attenuator value:', this.output);
              resolve(this.output);
            } else {
              setTimeout(checkOutput, 100);
            }
        };

        checkOutput();

        setTimeout(() => {
            if (!this.output) {
              reject('Attenuator timeout');
            }
        }, 2000);


      } catch (error: any) {
        reject(`Failed to send command: ${error.message}`);
      }


      // console.log(`Sending command: ${command}`);
      // this.client.write(command, (error) => {
      //   if (error) {
      //     return reject(error);
      //   }

      //   this.client.once('data', (data) => {
      //     console.log('Received attenuator value:', data.toString());
      //     resolve(data.toString());
      //   });

      //   this.client.once('error', (error) => {
      //     reject(error);
      //   });
      // });
    });

  }


  public checkConnect(): Promise<boolean> {
    const command = '*IDN?\n';

    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        console.log('Not connected to TCP server.');
        resolve(false);
      }

      this.output = '';

      try {
        this.client.write(command);

        const checkOutput = () => {
            if (this.output) {
                this.isConnected = true;
                resolve(true);
            } else {
                setTimeout(checkOutput, 100);
            }
        };

        checkOutput();

        setTimeout(() => {
            if (!this.output) {
              console.log('Connection check timeout. Attenuator may be disconnected.');
              this.isConnected = false;
              this.client.destroy();
              resolve(false);
            }
        }, 2000);


      } catch (error: any) {
        reject(`TCP server error: ${error.message}`);
      }

      // this.client.write(command, (error) => {
      //   if (error) {
      //     this.isConnected = false;
      //     return reject(error);
      //   }

      //   const timeout = setTimeout(() => {
      //     this.isConnected = false;
      //     console.log('Connection check timeout. Attenuator may be disconnected.');
      //     resolve(false);
      //   }, 1000);

      //   this.client.once('data', () => {
      //     clearTimeout(timeout);
      //     resolve(true);
      //   });

      //   this.client.once('error', (error) => {
      //     clearTimeout(timeout);
      //     this.isConnected = false;
      //     reject(error);
      //   });
      // });
    });
  }

}

// {"type":"connect", "deviceId":"attenuator"}
// {"type":"is-connected", "deviceId":"attenuator"}

export const tcpClient = new TcpClient(ATTENUATOR_HOST, ATTENUATOR_PORT);