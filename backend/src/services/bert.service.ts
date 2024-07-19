import { spawn, ChildProcess, execSync } from 'child_process';
import 'dotenv/config';

const BERT_PROXY = process.env.BERT_PROXY!;
const BERT_PASSWORD = process.env.BERT_PASSWORD!;

export class SSHClient {
	private sshProcess: ChildProcess | null = null;
	private output: string;
	private proxy: string;
	private pass: string;
	private firstTime: boolean;
	private isConnected: boolean;
	private commandResolve: ((value: string | PromiseLike<string>) => void) | null = null;
	private commandReject: ((reason?: any) => void) | null = null;

	constructor(proxy: string, pass: string) {
		this.proxy = proxy;
		this.pass = pass;
		this.isConnected = false;
		this.output = '';
		this.firstTime = true;
	}

	private setupListeners(): void {
	    if (!this.sshProcess) return;

	    this.sshProcess.stdout?.on('data', (data: string) => {
	        this.output += data.toString();

	        if (this.commandResolve) {
	            this.commandResolve(this.output);
	            this.commandResolve = null;
	            this.commandReject = null;
	        }
	    });

	    this.sshProcess.stderr?.on('data', (error: string) => {
	        console.error(`Error:\n${error}`);
	        if (this.commandReject) {
	            this.commandReject(error);
	            this.commandResolve = null;
	            this.commandReject = null;
	        }
	    });

	    this.sshProcess.on('close', (code: string) => {
	        console.log(`Child process exited with code ${code}`);
	        this.isConnected = false;
	        this.sshProcess?.kill();
	    });
	}

	public connect(): Promise<boolean> {
		return new Promise((resolve, reject) => {
			if (this.firstTime) {
				const command = `sshpass -p ${this.pass} ssh -T -L 2222:localhost:22 ${this.proxy}`;
				this.sshProcess = spawn(command, {
					shell: true
				});

				this.setupListeners();

				const connectionTimeout = setTimeout(() => {
					console.error('Connection timed out.');
					this.isConnected = false;
					this.sshProcess?.kill();
					resolve(false);
				}, 5000);

				this.sshProcess?.stdout?.once('data', () => {
					clearTimeout(connectionTimeout);
					this.isConnected = true;
					this.firstTime = false;
					resolve(true);
				});

				this.sshProcess?.stderr?.once('data', (error: string) => {
					clearTimeout(connectionTimeout);
					console.error(`Error:\n${error}`);
					this.isConnected = false;
					this.sshProcess?.kill();
					reject(error);
				});
			} else {

				this.output = '';

				this.sshProcess?.stdin?.write('show time\n');

				try {
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
			            	console.log('Connection check timeout. Bercut may be disconnected.');
			            	this.isConnected = false;
			            	this.firstTime = true;
			                resolve(false)
			            }
			        }, 2000);
				} catch (error: any) {
					reject(`SSH server error ${error.message}`);
				}
			}
		});
	}

	public sendCommand(command: string): Promise<string> {
	    return new Promise((resolve, reject) => {
	        if (!this.isConnected) {
	            console.error('SSH connection is not established');
	            reject('SSH connection is not established');
	        }

	        this.commandResolve = resolve;
	        this.commandReject = reject;
	        this.output = '';

	        try {
		        this.sshProcess?.stdin?.write(command + '\n');

		        const checkOutput = () => {
		            if (this.output) {
		                // ('Current output:', this.output);
		                resolve(this.output);
		            } else {
		                setTimeout(checkOutput, 100);
		            }
		        };

		        checkOutput();

		        setTimeout(() => {
		            if (!this.output) {
		                reject('Bercut timeout');
		            }
		        }, 2000);
		    } catch	(error: any) {
		    	reject(`Failed to send command: ${error.message}`);
		    }
	    });
	}

	public disconnect(): void {
		this.firstTime = true;
		this.sshProcess?.stdin?.write('exit\n');
	}

	public receiveData(): string {
		return this.output;
	}

	public checkConnect(): Promise<boolean> {
		return new Promise((resolve, reject) => {
			if (!this.isConnected) {
				console.log('Not connected to SSH server');
				resolve(false);
			}

	        this.output = '';

			this.sshProcess?.stdin?.write('show time\n');
			try {
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
		            	console.log('Connection check timeout. Bercut may be disconnected.');
		            	this.isConnected = false;
		                resolve(false)
		            }
		        }, 2000);
			} catch (error: any) {
				reject(`SSH server error ${error.message}`);
			}
		});
	}
}

export const sshClient = new SSHClient(BERT_PROXY, BERT_PASSWORD);