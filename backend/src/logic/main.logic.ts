import { tcpClient, TcpClient } from '../services/att.service';
import { sshClient, SSHClient } from '../services/bert.service';
import { snmpClient, SNMPClient } from '../services/stantion.service';
import { comClient, COMClient } from '../services/m3m.service';
import { speed, sens, modName } from './consts.logic';
import * as XLSX from 'xlsx';
import path from 'path';


export async function getPower(mod: number): Promise<number> {
	let m3mPow: number = 0;

	try {
        sshClient.sendCommand('configure');
        sshClient.sendCommand('txgen rate 1600 kbps');
        sshClient.sendCommand('exit');
        sshClient.sendCommand('txgen start');

        await new Promise<void>((resolve, reject) => {
            setTimeout(async () => {
                try {
                    m3mPow = await comClient.receiveData();
                    resolve();
                } catch (error) {
                    reject(error);
                }
            }, 1000);
        });

        sshClient.sendCommand('txgen stop');
    } catch (error) {
        console.error('Error occurred:', error);
        throw error;
    }

	return m3mPow;
}


export function parseBits(inputString: string): Promise<[number, number]>{
	const regex = /bits\s(\d+)\sebits\s(\d+)/;

	const matches = regex.exec(inputString);

	return new Promise((resolve, reject) => {
		if (matches) {
		    const bits = parseInt(matches[1], 10);
		    const ebits = parseInt(matches[2], 10);
		    resolve([bits, ebits]);
		} else {
		    reject(new Error("No matches found in the input string."));
		}
		
	})
}


export function writeDataToExcel(newData: any[]): void {
	const filePath = path.join(__dirname, 'test');
	const worksheet = XLSX.utils.json_to_sheet(newData);
	const workbook = XLSX.utils.book_new();
  	XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  	XLSX.writeFile(workbook, filePath);


}

