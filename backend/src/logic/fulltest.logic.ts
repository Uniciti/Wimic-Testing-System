import { speed10, sens10, speed20, sens20, modName } from './consts.logic';
import { getPower, parseData, writeDataToExcel, delay, setBertSpeed, setBertDuration} from './main.logic';
import { tcpClient, TcpClient } from '../services/att.service';
import { sshClient, SSHClient } from '../services/bert.service';
import { comClient, COMClient } from '../services/m3m.service';
import { snmpClient, SNMPClient } from '../services/stantion.service';
import { broadcast } from '../ws.server';
import 'dotenv/config';

export class FullTest {
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

	private bandwidth: number = 10;
	private speed: number[] = speed10;
	private sens: number[] = sens10;

	constructor(
		pa1: number,
		pa2: number, 
		splitterAtt: number,
		splitterM3M: number, 
		pa1ToSplit: number,
		splitToAtt: number,
		attToPa2: number,
		duration: number,
		bandwidth: number
		) {

		this.pa1 = pa1;
		this.pa2 = pa2;
		this.splitterAtt = splitterAtt;
		this.splitterM3M = splitterM3M; 
		this.pa1ToSplit = pa1ToSplit;
		this.splitToAtt = splitToAtt;
		this.attToPa2 = attToPa2;
		this.duration = duration * 1000;
		this.bandwidth = bandwidth;




		this.offset = Math.round(pa1 + splitterM3M + pa1ToSplit) + 3;
		this.baseAtt = pa1 + pa2 + pa1ToSplit + splitToAtt + attToPa2 + splitterAtt;
	}

	private calculateAtt(mod: number, m3mPow: number): number {
		const mainAtt = Math.ceil(mod + m3mPow - this.baseAtt);
		return mainAtt;
	}

	public async setBandwidth(): Promise<boolean> {
		if (this.bandwidth == 20) {
			this.speed = speed20;
			this.sens = sens20;
			await snmpClient.setToBase("1.3.6.1.4.1.19707.7.7.2.1.4.56.0", 5);
			await snmpClient.setToSubscriber("1.3.6.1.4.1.19707.7.7.2.1.4.56.0", 5);
			await snmpClient.setToBase("1.3.6.1.4.1.19707.7.7.2.1.4.102.0", 1);
			await snmpClient.setToSubscriber("1.3.6.1.4.1.19707.7.7.2.1.4.102.0", 1);
		} else {
			this.speed = speed10;
			this.sens = sens10;
			await snmpClient.setToBase("1.3.6.1.4.1.19707.7.7.2.1.4.56.0", 3);
			await snmpClient.setToSubscriber("1.3.6.1.4.1.19707.7.7.2.1.4.56.0", 3);
			await snmpClient.setToBase("1.3.6.1.4.1.19707.7.7.2.1.4.102.0", 1);
			await snmpClient.setToSubscriber("1.3.6.1.4.1.19707.7.7.2.1.4.102.0", 1);
		}
		await delay(5000);
		console.log("check");
		return new Promise((resolve, reject) => {
			let pingStat0: boolean;
			let pingStat1: boolean;
			try {
				const checkOutput = async () => {
					const result = await snmpClient.checkConnect();
	                if (Array.isArray(result)) {
	                    [pingStat0, pingStat1] = result;
	                }
		            if (pingStat0 && pingStat1) {
		                resolve(true);
		            } else {
		                setTimeout(checkOutput, 5000);
		            }
		        };

		        checkOutput();

		        setTimeout(() => {
		            if (!(pingStat0 && pingStat1)) {
		            	console.log('Connection check timeout. Stations may be disconnected.');
		                resolve(false)
		            }
		        }, 180000);
			} catch (error: any) {
				reject(`SNMP server error ${error.message}`);
			}
		});
	}
		
		


	

	public async test(): Promise<void> {
		comClient.sendCommand(this.offset);
		await delay(1000);
		setBertDuration(this.duration * 7 + 1000);
		await delay(1000);
		const dataArray: any[] = [];
		for(let i = 6; i >= 6; i--) {

			// dataArray.push({"Модуляция": modName[i],
			// 				"Аттен, ДБ": "none",
			// 				"С/Ш": "none",
			// 				"Pin": "none",
			// 				"Чуствительность":this.sens[i];
			// 				"Pin станция": "none",
			// 				"Отправлено, байт": "none", 
			// 				"Принято, байт": "none", 
			// 				"Потеряно, байт": "none", 
			// 				"Процент ошибок, %": "none",
			// 				"Статус": "Ошибка поиска модуляции",
			// 				"Статус чуствительности":"Ошибка поиска модуляции",
			// 				"Полоса": this.bandwidth,
							
			// 			});

			broadcast("fulltest", (6 - i).toString());

			const m3mPow = await getPower(this.speed[i]);
			console.log(m3mPow);
			let attValue = Math.round(this.calculateAtt(this.sens[i], m3mPow));
			await tcpClient.sendCommand(attValue);
			await delay(1000);
			let x = await snmpClient.getFromSubscriber('1.3.6.1.4.1.19707.7.7.2.1.3.9.0');


			let txBytes: number = 0;
			let rxBytes: number = 0;
			let lostBytes: number = 0;
			let errorRate: number = 0;

			let pinVerdict = "Чуствительность соответствует";
			let verdict = "Пройдено";
			let pinN = 0;
			let pinV = "";


			if (i != 0){
				while (x != i.toString()) {
					console.log(modName[i], i);
					console.log(modName[parseInt(x)], parseInt(x));
					if (parseInt(x) < i) {
						attValue -= 1;
						await tcpClient.sendCommand(attValue);
						await delay(2000);
						x = await snmpClient.getFromSubscriber('1.3.6.1.4.1.19707.7.7.2.1.3.9.0');
					} else {
						attValue += 1;
						await tcpClient.sendCommand(attValue);
						await delay(2000);
						x = await snmpClient.getFromSubscriber('1.3.6.1.4.1.19707.7.7.2.1.3.9.0');
					}

				}

				while (x == i.toString()) {
					attValue += 1;
					await tcpClient.sendCommand(attValue);
					await delay(2000);
					x = await snmpClient.getFromSubscriber('1.3.6.1.4.1.19707.7.7.2.1.3.9.0');
				}


				do {
					await tcpClient.sendCommand(attValue-2);
					await delay(1000);
					await tcpClient.sendCommand(attValue-1);
					attValue -= 1;
					await delay(2000);

					x = await snmpClient.getFromSubscriber('1.3.6.1.4.1.19707.7.7.2.1.3.9.0');
					if (parseInt(x) > i) {
						pinVerdict = "Ошибка чуствительности";
						verdict = "Не пройдено";
						pinN = (attValue + this.baseAtt) - m3mPow;
						pinV = await snmpClient.getFromSubscriber('1.3.6.1.4.1.19707.7.7.2.1.3.2.0');
						break;
					}


					
					pinN = (attValue + this.baseAtt) - m3mPow;
					pinV = await snmpClient.getFromSubscriber('1.3.6.1.4.1.19707.7.7.2.1.3.2.0');

					await sshClient.sendCommand('statistics clear');
					await delay(1000);
					await setBertSpeed(this.speed[i])
					await delay(1000);
					await sshClient.sendCommand('bert start');
					await delay(1000);

					// let intervalChecker: NodeJS.Timeout;

					// const startTest =  async () => {
					//     intervalChecker = setInterval(async () => {
					//         try {
					//             const data = await sshClient.sendCommand('statistics show');
					//             delay(500);
					//             const [tx, rx] = await parseData(data);
					//             delay(500);
					//             txBytes = tx;
					//             rxBytes = rx;
					//             console.log('TX/RX: ', txBytes, rxBytes);
					//         } catch (error: any) {
					//             console.log(`SSH server error ${error.message}`);
					//         }
					//     }, 5000);

					//     await delay(this.duration);
					//     clearInterval(intervalChecker);
					    
					// };

					// await startTest();


					await delay(this.duration);

					await sshClient.sendCommand('bert stop');
					await delay(2000);
					const data = await sshClient.sendCommand('statistics show');
		            delay(500);
		            const [tx, rx] = await parseData(data);
		            delay(500);
		            txBytes = tx;
		            rxBytes = rx;
		            if (txBytes <= rxBytes) {
		            	rxBytes = txBytes;
		            }
		            delay(500);
					lostBytes = txBytes - rxBytes
					errorRate = parseFloat(((lostBytes / txBytes) * 100).toFixed(2));
					console.log(errorRate);
					console.log(0.1 < errorRate);


				} while (0.1 < errorRate);

			} else {

				while (x != i.toString()) {
					attValue += 1;
					await tcpClient.sendCommand(attValue);
					await delay(2000);
					x = await snmpClient.getFromSubscriber('1.3.6.1.4.1.19707.7.7.2.1.3.9.0');
				}

				do {
					attValue += 1;
					await tcpClient.sendCommand(attValue);
					await delay(2000);

					await sshClient.sendCommand('statistics clear');
					await delay(1000);
					await setBertSpeed(this.speed[i])
					await delay(1000);
					await sshClient.sendCommand('bert start');
					await delay(1000);

					await delay(10000);

					await sshClient.sendCommand('bert stop');
					await delay(2000);
					const data = await sshClient.sendCommand('statistics show');
		            delay(500);
		            const [tx, rx] = await parseData(data);
		            delay(500);
		            txBytes = tx;
		            rxBytes = rx;
		            if (txBytes <= rxBytes) {
		            	rxBytes = txBytes;
		            }
		            delay(500);
					lostBytes = txBytes - rxBytes
					errorRate = parseFloat(((lostBytes / txBytes) * 100).toFixed(2));
					console.log(errorRate);
					console.log(0.1 > errorRate);


				} while (0.1 > errorRate);

				do {
					await tcpClient.sendCommand(attValue-2);
					await delay(1000);
					await tcpClient.sendCommand(attValue-1);
					attValue -= 1;
					await delay(2000);
					
					x = await snmpClient.getFromSubscriber('1.3.6.1.4.1.19707.7.7.2.1.3.9.0');
					if (x != i.toString()) {
						pinVerdict = "Ошибка чуствительности";
						verdict = "Не пройдено";
						pinN = this.sens[i];
						pinV = await snmpClient.getFromSubscriber('1.3.6.1.4.1.19707.7.7.2.1.3.2.0');
						break;
					}



					pinN = (attValue + this.baseAtt) - m3mPow;
					pinV = await snmpClient.getFromSubscriber('1.3.6.1.4.1.19707.7.7.2.1.3.2.0');

					await sshClient.sendCommand('statistics clear');
					await delay(1000);
					await setBertSpeed(this.speed[i])
					await delay(1000);
					await sshClient.sendCommand('bert start');
					await delay(1000);
					await delay(this.duration);
					await sshClient.sendCommand('bert stop');
					await delay(2000);
					const data = await sshClient.sendCommand('statistics show');
		            delay(500);
		            const [tx, rx] = await parseData(data);
		            delay(500);
		            txBytes = tx;
		            rxBytes = rx;
		            if (txBytes <= rxBytes) {
		            	rxBytes = txBytes;
		            }
		            delay(500);
					lostBytes = txBytes - rxBytes
					errorRate = parseFloat(((lostBytes / txBytes) * 100).toFixed(2));


				} while (0.1 < errorRate);
			}


			const snr = await snmpClient.getFromSubscriber('1.3.6.1.4.1.19707.7.7.2.1.3.1.0');
			
			if (0.1 < errorRate) {
				verdict = "Не пройдено";
			}

			
			if (pinN < this.sens[i]) {
				pinVerdict = "Чуствительность не соответствует"
			}

			// dataArray[dataArray.length - 1] = {
			// 					"Модуляция": modName[i],
			// 					"Аттен, ДБ": attValue,
			// 					"С/Ш": (parseFloat(snr.slice(0, 5))),
			// 					"Pin": pinN,
			// 					"Чуствительность":this.sens[i];
			// 					"Pin станция": pinV,
			// 					"Отправлено, байт": txBytes, 
			// 					"Принято, байт": rxBytes, 
			// 					"Потеряно, байт": lostBytes, 
			// 					"Процент ошибок, %": errorRate,
			// 					"Статус": verdict,
			// 					"Статус чуствительности":pinVerdict,
			// 					"Полоса": this.bandwidth,

			// 				};

			dataArray.push({
					"Модуляция": modName[i],
					"Аттен, ДБ": attValue,
					"С/Ш": (parseFloat(snr.slice(0, 5))),
					"Pin": pinN,
					"Чувствительность":this.sens[i],
					"Pin станция": parseFloat(pinV),
					"Отправлено, байт": txBytes, 
					"Принято, байт": rxBytes, 
					"Потеряно, байт": lostBytes, 
					"Процент ошибок, %": errorRate,
					"Статус": verdict,
					"Статус чувствительности":pinVerdict,
					"Полоса": this.bandwidth,

				});
		
		}

		console.log(dataArray);
		writeDataToExcel(dataArray, "full test");
		broadcast("fulltest", "completed");

	}
}