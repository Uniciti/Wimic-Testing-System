import { spawn, ChildProcess } from 'child_process';
// import { Device } from '../interfaces/device.interface';
import 'dotenv/config';


const BERT_PROXY = process.env.BERT_PROXY || 'admin@172.16.17.32';
const BERT_PASSWORD = process.env.BERT_PASSWORD || 'PleaseChangeTheAdminPassword';


export class SSHClient {
	private sshProcess: ChildProcess | null = null;
	private output: string;
	private proxy: string;
	private pass: string;
	private firstTime: boolean;
	private isConnected: boolean;

	constructor(proxy: string, pass: string) {
		this.proxy = proxy;
		this.pass = pass;
		this.isConnected = false;
		this.output = '';
		this.firstTime = true;
	}

	public connect(): Promise<boolean> {
		return new Promise((resolve, reject) => {
			if (this.firstTime) {
				// const command = `sshpass -p ${this.pass} autossh -M 0 -t ${this.proxy} -T -L 2222:localhost:22`;
				const command = `sshpass -p ${this.pass} ssh -T -L 2222:localhost:22 ${this.proxy}`;
				this.sshProcess = spawn(command, {
					shell: true
				});

				 const connectionTimeout = setTimeout(() => {
		            console.error('Connection timed out.');
		            this.isConnected = false;
		            this.sshProcess?.kill(); // Завершаем процесс после таймаута
		            resolve(false);
				}, 5000);


				this.sshProcess?.stdout?.once('data', (data: string) => {
					clearTimeout(connectionTimeout);
			        this.output += data.toString();
			        console.log('Current output:', this.output);
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

			    this.sshProcess?.on('close', (code: string) => {
			    	clearTimeout(connectionTimeout);
			        console.log(`Child process exited with code ${code}`);
			        this.isConnected = false;
			        this.sshProcess?.kill();
			        resolve(false);
			    });
			} else {
				this.sshProcess?.stdin?.write('show time\n');

				const timeout = setTimeout(() => {
		        	this.isConnected = false;
		        	console.log('Connection check timeout. Bercut may be disconnected.');
		        	resolve(false);
		        }, 1000);

				this.sshProcess?.stdout?.once('data', (data: string) => {
					clearTimeout(timeout);
			        this.isConnected = true;
			        resolve(true);
			    });

			    this.sshProcess?.stderr?.once('data', (error: string) => {
			    	clearTimeout(timeout);
			        console.error(`Error:\n${error}`);
			        this.isConnected = false;
			        reject(error);
			    });
			}

		});


	}

	public sendCommand(command: string): Promise<string> {
		return new Promise((resolve, reject) => {
			if (!this.sshProcess) {
				console.error('SSH connection is not established');
				reject('SSH connection is not established');
			}

			this.output = '';
        
	        this.sshProcess?.stdin?.write(command + '\n');
	        
	        this.sshProcess?.stdout?.once('data', (data: string) => {
	            this.output += data.toString();
	            console.log('Current output:', this.output);
	            resolve(this.output);
	        });

	        this.sshProcess?.stderr?.once('data', (data: string) => {
	            console.error(`Error:\n${data}`);
	            reject(data);
	        });
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
	        	console.log('Not connected to SSH server.');
	        	return resolve(false);
	        }
			this.sshProcess?.stdin?.write('show time\n');

			const timeout = setTimeout(() => {
	        	this.isConnected = false;
	        	console.log('Connection check timeout. Bercut may be disconnected.');
	        	resolve(false);
	        }, 1000);

			this.sshProcess?.stdout?.once('data', (data: string) => {
				clearTimeout(timeout);
		        this.isConnected = true;
		        resolve(true);
		    });

		    this.sshProcess?.stderr?.once('data', (error: string) => {
		    	clearTimeout(timeout);
		        console.error(`Error:\n${error}`);
		        this.isConnected = false;
		        reject(error);
		    });


		});
	}

}

export const sshClient = new SSHClient(BERT_PROXY, BERT_PASSWORD);