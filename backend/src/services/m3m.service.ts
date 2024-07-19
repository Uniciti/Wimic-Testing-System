import { SerialPort } from "serialport";
import { delay } from "../logic/main.logic";
import { exec } from "child_process";
import { promisify } from "util";

import "dotenv/config";

const execAsync = promisify(exec);
const COM_PORT = process.env.COM_PORT!;
const BAUD_RATE = parseInt(process.env.BAUD_RATE!, 10);

export class COMClient {
  private port: SerialPort | null = null;
  private isConnected: boolean = false;
  private portPath: string = COM_PORT;
  private output: number = 0;
  private commandResolve:
    | ((value: number | PromiseLike<number>) => void)
    | null = null;
  private commandReject: ((reason?: any) => void) | null = null;

  constructor() {}

  private async getDeviceDetails(devicePath: string): Promise<boolean> {
    try {
      const { stdout } = await execAsync(
        `udevadm info --query=all --name=${devicePath}`
      );
      const lines = stdout.split("\n");
      const idModelIdLine = lines.find((line) => line.includes("ID_MODEL_ID="));
      if (idModelIdLine) {
        const idModelId = idModelIdLine.split("=")[1].trim();
        if (idModelId === "6001") {
          return true;
        }
      }
    } catch (err) {
      console.error(
        `Error executing udevadm command for device ${devicePath}:`,
        err
      );
    }
    return false;
  }

  private async findPort(): Promise<string | null> {
    try {
      const { stdout } = await execAsync("ls /dev/ttyUSB*");
      const devices = stdout.trim().split("\n");
      for (const device of devices) {
        const res = await this.getDeviceDetails(device);
        if (res) {
          return device;
        }
      }
    } catch (err: any) {
      if (err.stderr && err.stderr.includes("No such file or directory")) {
        console.log("No ttyUSB devices found.");
      } else {
        console.error("Error executing ls command:", err);
      }
    }
    return null;
  }

  private setupListeners(): void {
    this.port?.on("data", (data: any) => {
      this.output = parseFloat(data);

      if (this.commandResolve) {
        this.commandResolve(this.output);
        this.commandResolve = null;
        this.commandReject = null;
      }
    });

    this.port?.on("open", () => {
      this.isConnected = true;
      console.log(`COM port ${this.portPath} is open.`);
    });

    this.port?.on("close", () => {
      this.isConnected = false;
      console.log(`COM port ${this.portPath} is closed.`);
    });

    this.port?.on("error", (err) => {
      // this.isConnected = false;
      console.error(`Error on COM port ${this.portPath}: ${err.message}`);

      if (this.commandReject) {
        this.commandReject(err);
        this.commandResolve = null;
        this.commandReject = null;
      }
    });
  }

  public async connect(): Promise<boolean> {
    const portPath = await this.findPort();
    if (this.isConnected && this.port) {
      return true;
    }

    if (!portPath) {
      return false;
    }

    return new Promise(async (resolve, reject) => {
      this.port = new SerialPort({
        path: portPath,
        baudRate: BAUD_RATE,
        dataBits: 8,
        stopBits: 1,
        parity: "none",
      });
      this.portPath = portPath;

      this.setupListeners();
      await delay(100);

      resolve(this.isConnected);

      // this.port.once('open', () => {
      //   this.isConnected = true;
      //   console.log(`COM port ${this.portPath} is open.`);
      //   resolve(true);
      // });

      // this.port.on('close', () => {
      //   this.isConnected = false;
      //   console.log(`COM port ${this.portPath} is closed.`);
      //   resolve(false);
      // });

      // this.port.once('error', (err) => {
      //   this.isConnected = false;
      //   console.error(`Error on COM port ${this.portPath}: ${err.message}`);
      //   reject(err);
      // });
    });
  }

  public disconnect(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      if (!this.port) {
        resolve();
      }

      const res = await this.checkConnect();
      if (!res) {
        this.isConnected = false;
        this.port = null;
        resolve();
      }

      this.port?.close((err) => {
        if (err) {
          reject(err);
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
        console.log("Not connected to COM.");
        resolve(false);
      }

      try {
        if (this.port && this.portPath) {
          this.isConnected = true;
          resolve(true);
        } else {
          this.isConnected = false;
          this.disconnect();
          resolve(false);
        }
      } catch (err) {
        console.error("Port checking error");
        reject(err);
      }
    });
  }

  public sendCommand(offset: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected || !this.port) {
        reject(new Error("COM port is not connected."));
      }

      const buf = new Uint8Array(3);
      buf[0] = 65;
      buf[1] = 84;
      buf[2] = offset;

      this.port?.write(buf, (err) => {
        if (err) {
          reject(err);
        }

        this.port?.drain((drainErr) => {
          if (drainErr) {
            reject(drainErr);
          }

          resolve();
        });
      });
    });
  }

  public receiveData(): Promise<number> {
    return new Promise(async (resolve, reject) => {
      if (!this.isConnected || !this.port) {
        reject(new Error("COM port is not connected."));
      }

      const buf = new Uint8Array(1);
      buf[0] = 0;
      try {
        this.port?.write(buf, (err) => {
          if (err) {
            reject(err);
          }
        });
        await delay(100);
        const checkOutput = () => {
          if (this.output) {
            console.log("Current output:", this.output);
            const buffer = this.output;
            this.output = 0;
            resolve(buffer);
          } else {
            setTimeout(checkOutput, 100);
          }
        };

        checkOutput();

        setTimeout(() => {
          if (!this.output) {
            reject("m3m timeout");
          }
        }, 5000);
      } catch (err: any) {
        reject(`Failed to get data: ${err.message}`);
      }
    });
  }
}

export const comClient = new COMClient();
