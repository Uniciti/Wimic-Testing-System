"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sshClient = exports.SSHClient = void 0;
const child_process_1 = require("child_process");
require("dotenv/config");
const BERT_PROXY = process.env.BERT_PROXY || 'admin@172.16.17.32';
const BERT_PASSWORD = process.env.BERT_PASSWORD || 'PleaseChangeTheAdminPassword';
class SSHClient {
    constructor(proxy, pass) {
        this.sshProcess = null;
        this.commandResolve = null;
        this.commandReject = null;
        this.proxy = proxy;
        this.pass = pass;
        this.isConnected = false;
        this.output = '';
        this.firstTime = true;
    }
    setupListeners() {
        var _a, _b;
        if (!this.sshProcess)
            return;
        (_a = this.sshProcess.stdout) === null || _a === void 0 ? void 0 : _a.on('data', (data) => {
            this.output += data.toString();
            if (this.commandResolve) {
                this.commandResolve(this.output);
                this.commandResolve = null;
                this.commandReject = null;
            }
        });
        (_b = this.sshProcess.stderr) === null || _b === void 0 ? void 0 : _b.on('data', (error) => {
            console.error(`Error:\n${error}`);
            if (this.commandReject) {
                this.commandReject(error);
                this.commandResolve = null;
                this.commandReject = null;
            }
        });
        this.sshProcess.on('close', (code) => {
            var _a;
            console.log(`Child process exited with code ${code}`);
            this.isConnected = false;
            (_a = this.sshProcess) === null || _a === void 0 ? void 0 : _a.kill();
        });
    }
    connect() {
        return new Promise((resolve, reject) => {
            var _a, _b, _c, _d, _e, _f;
            if (this.firstTime) {
                const command = `sshpass -p ${this.pass} ssh -T -L 2222:localhost:22 ${this.proxy}`;
                this.sshProcess = (0, child_process_1.spawn)(command, {
                    shell: true
                });
                this.setupListeners();
                const connectionTimeout = setTimeout(() => {
                    var _a;
                    console.error('Connection timed out.');
                    this.isConnected = false;
                    (_a = this.sshProcess) === null || _a === void 0 ? void 0 : _a.kill();
                    resolve(false);
                }, 5000);
                (_b = (_a = this.sshProcess) === null || _a === void 0 ? void 0 : _a.stdout) === null || _b === void 0 ? void 0 : _b.once('data', () => {
                    clearTimeout(connectionTimeout);
                    this.isConnected = true;
                    this.firstTime = false;
                    resolve(true);
                });
                (_d = (_c = this.sshProcess) === null || _c === void 0 ? void 0 : _c.stderr) === null || _d === void 0 ? void 0 : _d.once('data', (error) => {
                    var _a;
                    clearTimeout(connectionTimeout);
                    console.error(`Error:\n${error}`);
                    this.isConnected = false;
                    (_a = this.sshProcess) === null || _a === void 0 ? void 0 : _a.kill();
                    reject(error);
                });
            }
            else {
                this.output = '';
                (_f = (_e = this.sshProcess) === null || _e === void 0 ? void 0 : _e.stdin) === null || _f === void 0 ? void 0 : _f.write('show time\n');
                try {
                    const checkOutput = () => {
                        if (this.output) {
                            this.isConnected = true;
                            resolve(true);
                        }
                        else {
                            setTimeout(checkOutput, 100);
                        }
                    };
                    checkOutput();
                    setTimeout(() => {
                        if (!this.output) {
                            console.log('Connection check timeout. Bercut may be disconnected.');
                            this.isConnected = false;
                            this.firstTime = true;
                            resolve(false);
                        }
                    }, 2000);
                }
                catch (error) {
                    reject(`SSH server error ${error.message}`);
                }
            }
        });
    }
    sendCommand(command) {
        return new Promise((resolve, reject) => {
            var _a, _b;
            if (!this.isConnected) {
                console.error('SSH connection is not established');
                reject('SSH connection is not established');
            }
            this.commandResolve = resolve;
            this.commandReject = reject;
            this.output = '';
            try {
                (_b = (_a = this.sshProcess) === null || _a === void 0 ? void 0 : _a.stdin) === null || _b === void 0 ? void 0 : _b.write(command + '\n');
                const checkOutput = () => {
                    if (this.output) {
                        console.log('Current output:', this.output);
                        resolve(this.output);
                    }
                    else {
                        setTimeout(checkOutput, 100);
                    }
                };
                checkOutput();
                setTimeout(() => {
                    if (!this.output) {
                        reject('Bercut timeout');
                    }
                }, 2000);
            }
            catch (error) {
                reject(`Failed to send command: ${error.message}`);
            }
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
            var _a, _b;
            if (!this.isConnected) {
                console.log('Not connected to SSH server');
                resolve(false);
            }
            this.output = '';
            (_b = (_a = this.sshProcess) === null || _a === void 0 ? void 0 : _a.stdin) === null || _b === void 0 ? void 0 : _b.write('show time\n');
            try {
                const checkOutput = () => {
                    if (this.output) {
                        this.isConnected = true;
                        resolve(true);
                    }
                    else {
                        setTimeout(checkOutput, 100);
                    }
                };
                checkOutput();
                setTimeout(() => {
                    if (!this.output) {
                        console.log('Connection check timeout. Bercut may be disconnected.');
                        this.isConnected = false;
                        resolve(false);
                    }
                }, 2000);
            }
            catch (error) {
                reject(`SSH server error ${error.message}`);
            }
        });
    }
}
exports.SSHClient = SSHClient;
exports.sshClient = new SSHClient(BERT_PROXY, BERT_PASSWORD);
