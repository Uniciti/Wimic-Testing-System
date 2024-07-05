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
require("dotenv/config");
const COM_PORT = process.env.COM_PORT || '/dev/ttyUSB0';
const BAUD_RATE = parseInt(process.env.BAUD_RATE || '19300', 10);
class COMClient {
    constructor() {
        this.port = null;
        this.isConnected = false;
        this.portPath = '/dev/ttyUSB0';
    }
    findPort() {
        return __awaiter(this, void 0, void 0, function* () {
            const ports = yield serialport_1.SerialPort.list();
            const portInfo = ports.find(port => port.path.includes('ttyUSB'));
            return portInfo ? portInfo.path : null;
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
            return new Promise((resolve, reject) => {
                this.port = new serialport_1.SerialPort({
                    path: portPath,
                    baudRate: 19300,
                    dataBits: 8,
                    stopBits: 1,
                    parity: 'none',
                });
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
                return reject(new Error('COM port is not connected.'));
            }
            const buf = new Uint8Array(3);
            buf[0] = 65;
            buf[1] = 84;
            buf[2] = offset;
            (_a = this.port) === null || _a === void 0 ? void 0 : _a.write(buf, (err) => {
                var _a;
                if (err) {
                    return reject(err);
                }
                (_a = this.port) === null || _a === void 0 ? void 0 : _a.drain((drainErr) => {
                    if (drainErr) {
                        return reject(drainErr);
                    }
                    resolve();
                });
            });
        });
    }
    receiveData() {
        return new Promise((resolve, reject) => {
            var _a;
            if (!this.isConnected || !this.port) {
                return reject(new Error('COM port is not connected.'));
            }
            const buf = new Uint8Array(1);
            buf[0] = 0;
            (_a = this.port) === null || _a === void 0 ? void 0 : _a.write(buf, (err) => {
                var _a, _b;
                if (err) {
                    return reject(err);
                }
                (_a = this.port) === null || _a === void 0 ? void 0 : _a.once('data', (data) => {
                    const deviceResponse = parseFloat(data);
                    resolve(deviceResponse);
                });
                (_b = this.port) === null || _b === void 0 ? void 0 : _b.once('error', (err) => {
                    reject(err);
                });
            });
        });
    }
}
exports.COMClient = COMClient;
exports.comClient = new COMClient();
