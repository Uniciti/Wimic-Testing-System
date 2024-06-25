import { tcpClient, TcpClient } from '../services/att.service';
import { sshClient, SSHClient } from '../services/bert.service';
import { snmpClient, SNMPClient } from '../services/stantion.service';
import { comClient, COMClient } from '../services/m3m.service';
import { speed, sens, modName } from './consts.logic';
import * as XLSX from 'xlsx';
import path from 'path';

export let pathToFile: string = "/home/pudge/";
export let fileName: string = "test.xlsx";

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));


export async function setBertSpeed(speed: number): Promise<void> {
    try {
        await sshClient.sendCommand('configure');
        await delay(200);
        await sshClient.sendCommand(`bert rate ${speed} kbps`);
        await delay(200);
        await sshClient.sendCommand('exit');
        await delay(200);
    } catch (error) {
        console.error('Error occurred:', error);
        throw error;
    }
}

export async function setBertDuration(duration: number): Promise<void> {
    try {

        const millisecondsInASecond = 1000;
        const millisecondsInAMinute = 60 * millisecondsInASecond;
        const millisecondsInAnHour = 60 * millisecondsInAMinute;

        const hours = Math.floor(duration / millisecondsInAnHour);
        const remainingAfterHours = duration % millisecondsInAnHour;

        const minutes = Math.floor(remainingAfterHours / millisecondsInAMinute);
        const remainingAfterMinutes = remainingAfterHours % millisecondsInAMinute;

        const seconds = Math.floor(remainingAfterMinutes / millisecondsInASecond);

        const formatNumber = (num: number) => num.toString().padStart(2, '0');

        await sshClient.sendCommand('configure');
        await delay(200);
        await sshClient.sendCommand(`bert duration ${formatNumber(hours)}.${formatNumber(minutes)}.${formatNumber(seconds)}`);
        await delay(200);
        await sshClient.sendCommand('exit');
        await delay(200);
    } catch (error) {
        console.error('Error occurred:', error);
        throw error;
    }
}

export async function getPower(speed: number): Promise<number> {
    let m3mPow: number | null = null;

    try {
        await sshClient.sendCommand('configure');
        await delay(200);
        await sshClient.sendCommand(`txgen rate ${speed} kbps`);
        await delay(200);
        await sshClient.sendCommand('exit');
        await delay(200);
        await sshClient.sendCommand('txgen start');
        await delay(2000);
        // console.log("ToooClooose");
        while (m3mPow === null){
            m3mPow = await comClient.receiveData();
        }
        // console.log("YouuuuWIIIINN!");
        await delay(200);
        await sshClient.sendCommand('txgen stop');
        await delay(1000);
    } catch (error) {
        console.error('Error occurred:', error);
        throw error;
    }

    return m3mPow;
}


export function parseData(data: string): Promise<[number, number]> {
    return new Promise((resolve, reject) => {
        const lines = data.split('\n');

        const txFramesLine = lines.find(line => line.trim().startsWith('Tx bytes'));
        const rxFramesLine = lines.find(line => line.trim().startsWith('Rx bytes'));

        if (!txFramesLine || !rxFramesLine) {
            reject(new Error('Required lines not found in data'));
            return;
        }

        const txFramesValues = txFramesLine.trim().split(/\s+/);
        const rxFramesValues = rxFramesLine.trim().split(/\s+/);

        try {
            const txFrames = parseInt(txFramesValues[2], 10);
            const rxFrames = parseInt(rxFramesValues[3], 10);

            resolve([txFrames, rxFrames]);
        } catch (error) {
            reject(new Error('Failed to parse numbers from lines'));
        }
    });
};

export function writeDataToExcel(newData: any[],  testName: string): void {
	// const filePath = path.join(__dirname, 'test.xlsx');
	const worksheet = XLSX.utils.json_to_sheet(newData);
	const workbook = XLSX.utils.book_new();
  	XLSX.utils.book_append_sheet(workbook, worksheet, testName);
  	XLSX.writeFile(workbook, pathToFile + fileName);

}

export function setPathName(path: string, name: string) { 
    pathToFile = (path + "/") || "/home/pudge/";
    fileName = (name + ".xlsx") || "test.xlsx";
}
