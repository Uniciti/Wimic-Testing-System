import { SerialPort } from 'serialport';
import 'dotenv/config';

const COM_PORT = process.env.COM_PORT || '/dev/ttyUSB0';
const BAUD_RATE = parseInt(process.env.BAUD_RATE || '19300', 10);

export class COMClient {
  private port: SerialPort | null = null;
  private isConnected: boolean = false;
  private portPath: string = '/dev/ttyUSB0';

  constructor() {}

  private async findPort(): Promise<string | null> {
    const ports = await SerialPort.list();
    const portInfo = ports.find(port=> port.path.includes('ttyUSB'));
    return portInfo ? portInfo.path : null;
  }


  public async connect(): Promise<boolean> {
  	const portPath = await this.findPort();
    if (this.isConnected && this.port) {
      return true;
    } 

    if (!portPath) {
      return false;
    }

    return new Promise((resolve, reject) => {
      this.port = new SerialPort({             
      		path: portPath,
            baudRate: 19300,
            dataBits: 8,
            stopBits: 1,
            parity: 'none', });
      this.portPath = portPath;

      this.port.once('open', () => {
        this.isConnected = true;
        console.log(`COM port ${this.portPath} is open.`);
        resolve(true);
      });

      this.port.on('close', () => {
        this.isConnected = false;
        console.log(`COM port ${this.portPath} is closed.`);
        resolve(false);
      });

      this.port.once('error', (err) => {
        this.isConnected = false;
        console.error(`Error on COM port ${this.portPath}: ${err.message}`);
        reject(err);
      });
    });
  }

  public disconnect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.port) {
        resolve();
      }

      this.port?.close((err) => {
        if (err) {
          return reject(err);
        }

        this.isConnected = false;
        this.port = null;
        resolve();
      });
    });
  }

  public async checkConnect(): Promise<boolean> {
  	const portPath = await this.findPort();
    // return this.isConnected;
  	return new Promise((resolve, reject) => {
  	  if (!this.isConnected || !this.port) {
  	  	console.log('Not connected to COM.');
        resolve(false);
      }

      try {
      	if (portPath && this.port && this.portPath) {
      		this.isConnected = true;
      		resolve(true);
      	} else {
      		this.isConnected = false;
          this.disconnect();
      		resolve(false);
      	}
      } catch(err) {
      	console.error('Port checking error');
      	reject(err)
      }
  	});





  }

  public sendCommand(offset: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected || !this.port) {
        return reject(new Error('COM port is not connected.'));
      }

      const buf = new Uint8Array(3);
      buf[0] = 65;
      buf[1] = 84;
      buf[2] = offset;

      this.port?.write(buf, (err) => {
        if (err) {
          return reject(err);
        }

        this.port?.drain((drainErr) => {
          if (drainErr) {
            return reject(drainErr);
          }

          resolve();
        });
      });
    });
  }

  public receiveData(): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected || !this.port) {
        return reject(new Error('COM port is not connected.'));
      }

      const buf = new Uint8Array(1);
      buf[0] = 0;

      this.port?.write(buf, (err) => {
        if (err) {
          return reject(err);
        }
          this.port?.once('data', (data: any) => {
	   	    const deviceResponse = parseFloat(data);
	      	resolve(deviceResponse);
	      });

	      this.port?.once('error', (err: any) => {
	      	reject(err);
	      });
	  });


      
    });
  }
}

export const comClient = new COMClient();