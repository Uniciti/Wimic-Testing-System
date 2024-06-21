import { speed, sens, modName } from './consts.logic';
import { getPower, parseData, writeDataToExcel, delay, setBertSpeed, setBertDuration} from './main.logic';
import { tcpClient, TcpClient } from '../services/att.service';
import { sshClient, SSHClient } from '../services/bert.service';
import { comClient, COMClient } from '../services/m3m.service';
import { snmpClient, SNMPClient } from '../services/stantion.service';
import { broadcast } from '../ws.server';
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
	private duration: number = 0;

	constructor(
		pa1: number,
		pa2: number, 
		splitterAtt: number,
		splitterM3M: number, 
		pa1ToSplit: number,
		splitToAtt: number,
		attToPa2: number,
		duration: number
		) {

		this.pa1 = pa1;
		this.pa2 = pa2;
		this.splitterAtt = splitterAtt;
		this.splitterM3M = splitterM3M; 
		this.pa1ToSplit = pa1ToSplit;
		this.splitToAtt = splitToAtt;
		this.attToPa2 = attToPa2;
		this.duration = duration * 1000;
		this.offset = Math.round(pa1 + splitterM3M + pa1ToSplit) + 3;
		this.baseAtt = pa1 + pa2 + pa1ToSplit + splitToAtt + attToPa2 + splitterAtt;
	}

	private calculateAtt(mod: number, m3mPow: number): number {
		const mainAtt = mod + m3mPow - this.baseAtt;
		return mainAtt;
	}

	public async test(): Promise<void> {
		comClient.sendCommand(this.offset);
		await delay(1000);
		setBertDuration(this.duration * 7 + 1000);
		await delay(1000);
		const dataArray: any[] = [];
		for(let i = 6; i >= 0; i --) {
			broadcast("expresstest", (6 - i).toString());
			const m3mPow = await getPower(speed[i]);
			const attValue = Math.round(this.calculateAtt(sens[i], m3mPow));
			await tcpClient.sendCommand(attValue);
			let x = await snmpClient.getFromSubscriber('1.3.6.1.4.1.19707.7.7.2.1.3.9.0');
			await tcpClient.sendCommand(attValue-2);
			await tcpClient.sendCommand(attValue-1);
			await tcpClient.sendCommand(attValue);
			await delay(1000);
			x = await snmpClient.getFromSubscriber('1.3.6.1.4.1.19707.7.7.2.1.3.9.0');
			if (x == i.toString()) {
				await sshClient.sendCommand('statistics clear');
				await setBertSpeed(speed[i])
				await sshClient.sendCommand('statistics clear');
				await delay(1000);
				await setBertSpeed(speed[i])
				await delay(1000);
				await sshClient.sendCommand('bert start');
				await delay(1000);
				let txBytes: number = 0;
				let rxBytes: number = 0;

				let intervalChecker: NodeJS.Timeout;

				const startTest =  async () => {
				    intervalChecker = setInterval(async () => {
				        try {
				            const data = await sshClient.sendCommand('statistics show');
				            delay(500);
				            const [tx, rx] = await parseData(data);
				            delay(500);
				            txBytes = tx;
				            rxBytes = rx;
				            console.log('TX/RX: ', txBytes, rxBytes);
				        } catch (error: any) {
				            console.log(`SSH server error ${error.message}`);
				        }
				    }, 5000);

				    await delay(this.duration);
				    clearInterval(intervalChecker);
				    
				};

				await startTest();
				
				// for (let j = 0; j < 5; j++) {
				// 	const data = await sshClient.sendCommand('statistics show');
				// 	await delay(1000);
				// 	[txBytes, rxBytes] = await parseData(data);
				// 	console.log('TX/RX: ', txBytes, rxBytes);
				// }

				await sshClient.sendCommand('bert stop');
				await delay(1000);
				const lostBytes = txBytes - rxBytes
				const errorRate = (lostBytes / txBytes) * 100;
				const snr = await snmpClient.getFromSubscriber('1.3.6.1.4.1.19707.7.7.2.1.3.1.0');
				dataArray.push({"Модуляция": modName[i],
								"Аттен, ДБ": attValue,
								"С/Ш": snr,
								"Отправлено, байт": txBytes, 
								"Принято, байт": rxBytes, 
								"Потеряно, байт": lostBytes, 
								"Процент ошибок, %": errorRate
							});

			}
		}
		console.log(dataArray);
		writeDataToExcel(dataArray);
		broadcast("expresstest", "completed");

	}

	
}