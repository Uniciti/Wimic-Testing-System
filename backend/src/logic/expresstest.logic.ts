import { speed, sens, modName } from './consts.logic';
import { getPower, parseBits } from './main.logic';
import { tcpClient, TcpClient } from '../services/att.service';
import { sshClient, SSHClient } from '../services/bert.service';
import { comClient, COMClient } from '../services/m3m.service';
import { snmpClient, SNMPClient } from '../services/stantion.service';

import 'dotenv/config';


export class ExpressTest {
	// private m3mPow: number = 0;
	private offset: number = 0;
	private baseAtt: number = 0;

	private pa1: number = 0;
	private pa2: number = 0; 
	private splitterAtt: number = 0;
	private splitterM3M: number = 0;
	private pa1ToSplit: number = 0;
	private splitToAtt: number = 0;
	private attToPa2: number = 0;
	// private duration: number = 0;

	constructor(
		pa1: number,
		pa2: number, 
		splitterAtt: number,
		splitterM3M: number, 
		pa1ToSplit: number,
		splitToAtt: number,
		attToPa2: number,
		// duration: number
		) {

		this.pa1 = pa1;
		this.pa2 = pa2;
		this.splitterAtt = splitterAtt;
		this.splitterM3M = splitterM3M; 
		this.pa1ToSplit = pa1ToSplit;
		this.splitToAtt = splitToAtt;
		this.attToPa2 = attToPa2;
		// this.duration = duration;
		this.offset = Math.round(pa1 + splitterM3M + pa1ToSplit) + 3;
		this.baseAtt = pa1 + pa2 + pa1ToSplit + splitToAtt + attToPa2 + splitterAtt;

	}

	private calculateAtt(mod: number, m3mPow: number): number {
		const mainAtt = mod + m3mPow - this.baseAtt;
		return mainAtt;
	}

	public async test(): Promise<void> {
		comClient.sendCommand(this.offset);

		for(let i = 6; i >= 0; i --) {
			const m3mPow = await getPower(speed[i]);
			const attValue = this.calculateAtt(speed[i], m3mPow);
			await tcpClient.sendCommand(attValue);
			let x = await snmpClient.getFromSubscriber('1.3.6.1.4.1.19707.7.7.2.1.3.9.0');
			await tcpClient.sendCommand(attValue-2);
			await tcpClient.sendCommand(attValue-1);
			await tcpClient.sendCommand(attValue);
			x = await snmpClient.getFromSubscriber('1.3.6.1.4.1.19707.7.7.2.1.3.9.0');
			if (x == attValue.toString()) {
				await sshClient.sendCommand('bert start');
				let bits: number;
				let ebits: number;
				for (let j = 0; j < 5; j++) {
					const data = await sshClient.sendCommand('bert start');
					const [parsedBits, parsedEbits] = await parseBits(data);
			        bits = parsedBits;
			        ebits = parsedEbits;
					console.log('bits_Ebits: ', bits, ebits);
				}
				await sshClient.sendCommand('bert stop');
			}


		}
	}

	
}




