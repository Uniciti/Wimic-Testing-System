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
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
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
                    (_a = this.sshProcess) === null || _a === void 0 ? void 0 : _a.kill(); // Завершаем процесс после таймаута
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
                (_f = (_e = this.sshProcess) === null || _e === void 0 ? void 0 : _e.stdin) === null || _f === void 0 ? void 0 : _f.write('show time\n');
                const timeout = setTimeout(() => {
                    this.isConnected = false;
                    console.log('Connection check timeout. Bercut may be disconnected.');
                    resolve(false);
                }, 1000);
                (_h = (_g = this.sshProcess) === null || _g === void 0 ? void 0 : _g.stdout) === null || _h === void 0 ? void 0 : _h.once('data', () => {
                    clearTimeout(timeout);
                    this.isConnected = true;
                    resolve(true);
                });
                (_k = (_j = this.sshProcess) === null || _j === void 0 ? void 0 : _j.stderr) === null || _k === void 0 ? void 0 : _k.once('data', (error) => {
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
            var _a, _b;
            if (!this.sshProcess) {
                console.error('SSH connection is not established');
                return reject('SSH connection is not established');
            }
            this.commandResolve = resolve;
            this.commandReject = reject;
            this.output = '';
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
                    reject('Command timeout.');
                }
            }, 5000);
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
            (_d = (_c = this.sshProcess) === null || _c === void 0 ? void 0 : _c.stdout) === null || _d === void 0 ? void 0 : _d.once('data', () => {
                clearTimeout(timeout);
                this.isConnected = true;
                resolve(true);
            });
            (_f = (_e = this.sshProcess) === null || _e === void 0 ? void 0 : _e.stderr) === null || _f === void 0 ? void 0 : _f.once('data', (error) => {
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
// import { spawn, ChildProcess } from 'child_process';
// // import { Device } from '../interfaces/device.interface';
// import 'dotenv/config';
// const BERT_PROXY = process.env.BERT_PROXY || 'admin@172.16.17.32';
// const BERT_PASSWORD = process.env.BERT_PASSWORD || 'PleaseChangeTheAdminPassword';
// export class SSHClient {
// 	private sshProcess: ChildProcess | null = null;
// 	private output: string;
// 	private proxy: string;
// 	private pass: string;
// 	private firstTime: boolean;
// 	private isConnected: boolean;
// 	constructor(proxy: string, pass: string) {
// 		this.proxy = proxy;
// 		this.pass = pass;
// 		this.isConnected = false;
// 		this.output = '';
// 		this.firstTime = true;
// 	}
// 	public connect(): Promise<boolean> {
// 		return new Promise((resolve, reject) => {
// 			if (this.firstTime) {
// 				// const command = `sshpass -p ${this.pass} autossh -M 0 -t ${this.proxy} -T -L 2222:localhost:22`;
// 				const command = `sshpass -p ${this.pass} ssh -T -L 2222:localhost:22 ${this.proxy}`;
// 				this.sshProcess = spawn(command, {
// 					shell: true
// 				});
// 				const connectionTimeout = setTimeout(() => {
// 		            console.error('Connection timed out.');
// 		            this.isConnected = false;
// 		            this.sshProcess?.kill(); // Завершаем процесс после таймаута
// 		            resolve(false);
// 				}, 5000);
// 				this.sshProcess?.stdout?.once('data', (data: string) => {
// 					clearTimeout(connectionTimeout);
// 			        this.output += data.toString();
// 			        console.log('Current output:', this.output);
// 			        this.isConnected = true;
// 			        this.firstTime = false;
// 			        resolve(true);
// 			    });
// 			    this.sshProcess?.stderr?.once('data', (error: string) => {
// 			    	clearTimeout(connectionTimeout);
// 			        console.error(`Error:\n${error}`);
// 			        this.isConnected = false;
// 			        this.sshProcess?.kill();
// 			        reject(error);
// 			    });
// 			    this.sshProcess?.on('close', (code: string) => {
// 			    	clearTimeout(connectionTimeout);
// 			        console.log(`Child process exited with code ${code}`);
// 			        this.isConnected = false;
// 			        this.sshProcess?.kill();
// 			        resolve(false);
// 			    });
// 			} else {
// 				this.sshProcess?.stdin?.write('show time\n');
// 				const timeout = setTimeout(() => {
// 		        	this.isConnected = false;
// 		        	console.log('Connection check timeout. Bercut may be disconnected.');
// 		        	resolve(false);
// 		        }, 1000);
// 				this.sshProcess?.stdout?.once('data', (data: string) => {
// 					clearTimeout(timeout);
// 			        this.isConnected = true;
// 			        resolve(true);
// 			    });
// 			    this.sshProcess?.stderr?.once('data', (error: string) => {
// 			    	clearTimeout(timeout);
// 			        console.error(`Error:\n${error}`);
// 			        this.isConnected = false;
// 			        reject(error);
// 			    });
// 			}
// 		});
// 	}
// 	public sendCommand(command: string): Promise<string> {
// 		return new Promise((resolve, reject) => {
// 			if (!this.sshProcess) {
// 				console.error('SSH connection is not established');
// 				reject('SSH connection is not established');
// 			}
// 			this.output = '';
// 	        this.sshProcess?.stdin?.write(command + '\n');
// 	        this.sshProcess?.stdout?.once('data', (data: string) => {
// 	            this.output += data.toString();
// 	            console.log('Current output:', this.output);
// 	            resolve(this.output);
// 	        });
// 	        this.sshProcess?.stderr?.once('data', (data: string) => {
// 	            console.error(`Error:\n${data}`);
// 	            reject(data);
// 	        });
// 		});
// 	}
// 	public disconnect(): void {
// 		this.firstTime = true;
// 		this.sshProcess?.stdin?.write('exit\n');
// 	}
// 	public receiveData(): string {
// 		return this.output;
// 	}
// 	public checkConnect(): Promise<boolean> {
// 		return new Promise((resolve, reject) => {
// 			if (!this.isConnected) {
// 	        	console.log('Not connected to SSH server.');
// 	        	return resolve(false);
// 	        }
// 			this.sshProcess?.stdin?.write('show time\n');
// 			const timeout = setTimeout(() => {
// 	        	this.isConnected = false;
// 	        	console.log('Connection check timeout. Bercut may be disconnected.');
// 	        	resolve(false);
// 	        }, 1000);
// 			this.sshProcess?.stdout?.once('data', (data: string) => {
// 				clearTimeout(timeout);
// 		        this.isConnected = true;
// 		        resolve(true);
// 		    });
// 		    this.sshProcess?.stderr?.once('data', (error: string) => {
// 		    	clearTimeout(timeout);
// 		        console.error(`Error:\n${error}`);
// 		        this.isConnected = false;
// 		        reject(error);
// 		    });
// 		});
// 	}
// }
// export const sshClient = new SSHClient(BERT_PROXY, BERT_PASSWORD);
