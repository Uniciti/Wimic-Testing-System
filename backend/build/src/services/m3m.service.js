"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.comClient = exports.COMClient = void 0;
const serialport_1 = require("serialport");
const main_logic_1 = require("../logic/main.logic");
require("dotenv/config");
const COM_PORT = process.env.COM_PORT || '/dev/ttyUSB0';
const BAUD_RATE = parseInt(process.env.BAUD_RATE || '19300', 10);
class COMClient {
    constructor() {
        this.port = null;
        this.isConnected = false;
        this.portPath = '/dev/ttyUSB0';
        this.output = 0;
        this.commandResolve = null;
        this.commandReject = null;
    }
    findPort() {
        return __awaiter(this, void 0, void 0, function* () {
            const ports = yield serialport_1.SerialPort.list();
            const portInfo = ports.find(port => port.path.includes('ttyUSB'));
            return portInfo ? portInfo.path : null;
        });
    }
    setupListeners() {
        var _a, _b, _c, _d;
        (_a = this.port) === null || _a === void 0 ? void 0 : _a.on('data', (data) => {
            this.output = parseFloat(data);
            if (this.commandResolve) {
                this.commandResolve(this.output);
                this.commandResolve = null;
                this.commandReject = null;
            }
        });
        (_b = this.port) === null || _b === void 0 ? void 0 : _b.on('open', () => {
            this.isConnected = true;
            console.log(`COM port ${this.portPath} is open.`);
        });
        (_c = this.port) === null || _c === void 0 ? void 0 : _c.on('close', () => {
            this.isConnected = false;
            console.log(`COM port ${this.portPath} is closed.`);
        });
        (_d = this.port) === null || _d === void 0 ? void 0 : _d.on('error', (err) => {
            // this.isConnected = false;
            console.error(`Error on COM port ${this.portPath}: ${err.message}`);
            if (this.commandReject) {
                this.commandReject(err);
                this.commandResolve = null;
                this.commandReject = null;
            }
        });
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            const portPath = yield this.findPort();
            if (this.isConnected && this.port) {
                return true;
            }
            if (!portPath) {
                return false;
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                this.port = new serialport_1.SerialPort({
                    path: portPath,
                    baudRate: 19300,
                    dataBits: 8,
                    stopBits: 1,
                    parity: 'none',
                });
                this.portPath = portPath;
                this.setupListeners();
                yield (0, main_logic_1.delay)(100);
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
            }));
        });
    }
    disconnect() {
        return new Promise((resolve, reject) => {
            var _a;
            if (!this.port) {
                resolve();
            }
            (_a = this.port) === null || _a === void 0 ? void 0 : _a.close((err) => {
                if (err) {
                    return reject(err);
                }
                this.isConnected = false;
                this.port = null;
                resolve();
            });
        });
    }
    checkConnect() {
        return __awaiter(this, void 0, void 0, function* () {
            const portPath = yield this.findPort();
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
                    }
                    else {
                        this.isConnected = false;
                        this.disconnect();
                        resolve(false);
                    }
                }
                catch (err) {
                    console.error('Port checking error');
                    reject(err);
                }
            });
        });
    }
    sendCommand(offset) {
        return new Promise((resolve, reject) => {
            var _a;
            if (!this.isConnected || !this.port) {
                reject(new Error('COM port is not connected.'));
            }
            const buf = new Uint8Array(3);
            buf[0] = 65;
            buf[1] = 84;
            buf[2] = offset;
            (_a = this.port) === null || _a === void 0 ? void 0 : _a.write(buf, (err) => {
                var _a;
                if (err) {
                    reject(err);
                }
                (_a = this.port) === null || _a === void 0 ? void 0 : _a.drain((drainErr) => {
                    if (drainErr) {
                        reject(drainErr);
                    }
                    resolve();
                });
            });
        });
    }
    // public receiveData(): Promise<number> {
    //   return new Promise((resolve, reject) => {
    //     if (!this.isConnected || !this.port) {
    //       return reject(new Error('COM port is not connected.'));
    //     }
    //     const buf = new Uint8Array(1);
    //     buf[0] = 0;
    //     this.port?.write(buf, (err) => {
    //       if (err) {
    //         return reject(err);
    //       }
    //       this.port?.once('data', (data: any) => {
    //    	    const deviceResponse = parseFloat(data);
    //       	resolve(deviceResponse);
    //       });
    //       this.port?.once('error', (err: any) => {
    //       	reject(err);
    //       });
    //   });
    receiveData() {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!this.isConnected || !this.port) {
                reject(new Error('COM port is not connected.'));
            }
            const buf = new Uint8Array(1);
            buf[0] = 0;
            try {
                (_a = this.port) === null || _a === void 0 ? void 0 : _a.write(buf, (err) => {
                    if (err) {
                        reject(err);
                    }
                });
                yield (0, main_logic_1.delay)(100);
                const checkOutput = () => {
                    if (this.output) {
                        console.log('Current output:', this.output);
                        const buffer = this.output;
                        this.output = 0;
                        resolve(buffer);
                    }
                    else {
                        setTimeout(checkOutput, 100);
                    }
                };
                checkOutput();
                setTimeout(() => {
                    if (!this.output) {
                        reject('m3m timeout');
                    }
                }, 5000);
            }
            catch (err) {
                reject(`Failed to get data: ${err.message}`);
            }
        }));
    }
}
exports.COMClient = COMClient;
exports.comClient = new COMClient();
