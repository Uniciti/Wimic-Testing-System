"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sshClient = exports.SSHClient = void 0;
const child_process_1 = require("child_process");
// import { Device } from '../interfaces/device.interface';
require("dotenv/config");
const BERT_PROXY = process.env.BERT_PROXY || 'admin@172.16.17.32';
const BERT_PASSWORD = process.env.BERT_PASSWORD || 'PleaseChangeTheAdminPassword';
class SSHClient {
    constructor(proxy, pass) {
        this.sshProcess = null;
        this.proxy = proxy;
        this.pass = pass;
        this.isConnected = false;
        this.output = '';
        this.firstTime = true;
    }
    connect() {
        return new Promise((resolve, reject) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
            if (this.firstTime) {
                // const command = `sshpass -p ${this.pass} autossh -M 0 -t ${this.proxy} -T -L 2222:localhost:22`;
                const command = `sshpass -p ${this.pass} ssh -T -L 2222:localhost:22 ${this.proxy}`;
                this.sshProcess = (0, child_process_1.spawn)(command, {
                    shell: true
                });
                const connectionTimeout = setTimeout(() => {
                    var _a;
                    console.error('Connection timed out.');
                    this.isConnected = false;
                    (_a = this.sshProcess) === null || _a === void 0 ? void 0 : _a.kill(); // Завершаем процесс после таймаута
                    resolve(false);
                }, 5000);
                (_b = (_a = this.sshProcess) === null || _a === void 0 ? void 0 : _a.stdout) === null || _b === void 0 ? void 0 : _b.once('data', (data) => {
                    clearTimeout(connectionTimeout);
                    this.output += data.toString();
                    console.log('Current output:', this.output);
                    this.isConnected = true;
                    this.firstTime = false;
                    resolve(true);
                });
                (_d = (_c = this.sshProcess) === null || _c === void 0 ? void 0 : _c.stderr) === null || _d === void 0 ? void 0 : _d.on('data', (error) => {
                    var _a;
                    clearTimeout(connectionTimeout);
                    console.error(`Error:\n${error}`);
                    this.isConnected = false;
                    (_a = this.sshProcess) === null || _a === void 0 ? void 0 : _a.kill();
                    reject(error);
                });
                (_e = this.sshProcess) === null || _e === void 0 ? void 0 : _e.on('close', (code) => {
                    var _a;
                    clearTimeout(connectionTimeout);
                    console.log(`Child process exited with code ${code}`);
                    this.isConnected = false;
                    (_a = this.sshProcess) === null || _a === void 0 ? void 0 : _a.kill();
                    resolve(false);
                });
            }
            else {
                (_g = (_f = this.sshProcess) === null || _f === void 0 ? void 0 : _f.stdin) === null || _g === void 0 ? void 0 : _g.write('show time\n');
                const timeout = setTimeout(() => {
                    this.isConnected = false;
                    console.log('Connection check timeout. Bercut may be disconnected.');
                    resolve(false);
                }, 1000);
                (_j = (_h = this.sshProcess) === null || _h === void 0 ? void 0 : _h.stdout) === null || _j === void 0 ? void 0 : _j.once('data', (data) => {
                    clearTimeout(timeout);
                    this.isConnected = true;
                    resolve(true);
                });
                (_l = (_k = this.sshProcess) === null || _k === void 0 ? void 0 : _k.stderr) === null || _l === void 0 ? void 0 : _l.on('data', (error) => {
                    clearTimeout(timeout);
                    console.error(`Error:\n${error}`);
                    this.isConnected = false;
                    reject(error);
                });
            }
        });
    }
    sendCommand(command) {
        return new Promise((resolve, reject) => {
            var _a, _b, _c, _d, _e, _f;
            if (!this.sshProcess) {
                console.error('SSH connection is not established');
                reject('SSH connection is not established');
            }
            this.output = '';
            (_b = (_a = this.sshProcess) === null || _a === void 0 ? void 0 : _a.stdin) === null || _b === void 0 ? void 0 : _b.write(command + '\n');
            (_d = (_c = this.sshProcess) === null || _c === void 0 ? void 0 : _c.stdout) === null || _d === void 0 ? void 0 : _d.once('data', (data) => {
                this.output += data.toString();
                console.log('Current output:', this.output);
                resolve(this.output);
            });
            (_f = (_e = this.sshProcess) === null || _e === void 0 ? void 0 : _e.stderr) === null || _f === void 0 ? void 0 : _f.once('data', (data) => {
                console.error(`Error:\n${data}`);
                reject(data);
            });
        });
    }
    disconnect() {
        var _a, _b;
        this.firstTime = true;
        (_b = (_a = this.sshProcess) === null || _a === void 0 ? void 0 : _a.stdin) === null || _b === void 0 ? void 0 : _b.write('exit\n');
    }
    receiveData() {
        return this.output;
    }
    checkConnect() {
        return new Promise((resolve, reject) => {
            var _a, _b, _c, _d, _e, _f;
            if (!this.isConnected) {
                console.log('Not connected to SSH server.');
                return resolve(false);
            }
            (_b = (_a = this.sshProcess) === null || _a === void 0 ? void 0 : _a.stdin) === null || _b === void 0 ? void 0 : _b.write('show time\n');
            const timeout = setTimeout(() => {
                this.isConnected = false;
                console.log('Connection check timeout. Bercut may be disconnected.');
                resolve(false);
            }, 1000);
            (_d = (_c = this.sshProcess) === null || _c === void 0 ? void 0 : _c.stdout) === null || _d === void 0 ? void 0 : _d.once('data', (data) => {
                clearTimeout(timeout);
                this.isConnected = true;
                resolve(true);
            });
            (_f = (_e = this.sshProcess) === null || _e === void 0 ? void 0 : _e.stderr) === null || _f === void 0 ? void 0 : _f.on('data', (error) => {
                clearTimeout(timeout);
                console.error(`Error:\n${error}`);
                this.isConnected = false;
                reject(error);
            });
        });
    }
}
exports.SSHClient = SSHClient;
exports.sshClient = new SSHClient(BERT_PROXY, BERT_PASSWORD);
