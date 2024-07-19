import { tcpClient, TcpClient } from "../services/att.service";
import { sshClient, SSHClient } from "../services/bert.service";
import { snmpClient, SNMPClient } from "../services/stantion.service";
import { comClient, COMClient } from "../services/m3m.service";
import { broadcaster } from "../ws.server";
// import { speed, sens, modName } from './consts.logic';
import * as XLSX from "xlsx";
import * as path from "path";
import * as fs from "fs-extra";
import * as os from "os";

export let pathToFile: string = path.join(os.homedir(), "/tests/");
// export let pathToFile = path.join(__dirname, 'tests');
export let fileName: string = "test.xlsx";

export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function setBertSpeed(speed: number): Promise<void> {
  try {
    await sshClient.sendCommand("configure");
    await delay(200);
    await sshClient.sendCommand(`bert rate ${speed} kbps`);
    await delay(200);
    await sshClient.sendCommand("exit");
    await delay(200);
  } catch (error) {
    console.error("Error occurred:", error);
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

    const formatNumber = (num: number) => num.toString().padStart(2, "0");

    await sshClient.sendCommand("configure");
    await delay(200);
    await sshClient.sendCommand(
      `bert duration ${formatNumber(hours)}.${formatNumber(
        minutes
      )}.${formatNumber(seconds)}`
    );
    await delay(200);
    await sshClient.sendCommand("exit");
    await delay(200);
  } catch (error) {
    console.error("Error occurred:", error);
    throw error;
  }
}

export async function getPower(speed: number): Promise<number> {
  let m3mPow: number | null = null;

  try {
    await sshClient.sendCommand("configure");
    await delay(200);
    await sshClient.sendCommand(`txgen rate ${speed} kbps`);
    await delay(200);
    await sshClient.sendCommand("exit");
    await delay(200);
    await sshClient.sendCommand("txgen start");
    await delay(4000);
    // console.log("ToooClooose");
    // while (m3mPow === null){
    m3mPow = await comClient.receiveData();
    // }
    // console.log("YouuuuWIIIINN!");
    await delay(1000);
    await sshClient.sendCommand("txgen stop");
    await delay(1000);
  } catch (error) {
    console.error("Error occurred:", error);
    throw error;
  }

  return m3mPow;
}

export async function validator(): Promise<boolean> {
  const response: any = { type: "is-connected" };
  const result0 = await sshClient.checkConnect();
  response.pingBert = result0;
  const result1 = await tcpClient.checkConnect();
  response.pingAtt = result1;
  const result3 = await comClient.checkConnect();
  response.pingM3M = result3;
  const result2 = await snmpClient.checkConnect();
  const [pingStat0, pingStat1] = result2;

  // let result2 = await snmpClient.checkConnect();
  // let [pingStat0, pingStat1] = result2;
  // console.log(pingStat0, pingStat1);
  // if (!pingStat0 || !pingStat1) {
  //     const realStat = await snmpClient.connect();
  //     console.log(realStat);
  //     await delay(500);
  //     result2 = await snmpClient.checkConnect();
  //     [pingStat0, pingStat1] = result2;
  // }

  // console.log(pingStat0, pingStat1);

  response.pingStat0 = pingStat0;
  response.pingStat1 = pingStat1;

  broadcaster(JSON.stringify(response));
  return result0 && result1 && pingStat0 && pingStat1 && result3;
}

export function parseData(data: string): Promise<[number, number]> {
  return new Promise((resolve, reject) => {
    const lines = data.split("\n");

    const txFramesLine = lines.find((line) =>
      line.trim().startsWith("Tx bytes")
    );
    const rxFramesLine = lines.find((line) =>
      line.trim().startsWith("Rx bytes")
    );

    if (!txFramesLine || !rxFramesLine) {
      reject(new Error("Required lines not found in data"));
      return;
    }

    const txFramesValues = txFramesLine.trim().split(/\s+/);
    const rxFramesValues = rxFramesLine.trim().split(/\s+/);

    try {
      const txFrames = parseInt(txFramesValues[2], 10);
      const rxFrames = parseInt(rxFramesValues[3], 10);

      resolve([txFrames, rxFrames]);
    } catch (error) {
      reject(new Error("Failed to parse numbers from lines"));
    }
  });
}

export async function writeDataToExcel(
  newData: any[],
  testName: string
): Promise<void> {
  await fs.ensureDir(pathToFile);

  const worksheet = XLSX.utils.json_to_sheet(newData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, testName);

  const date = new Date();
  const dateString = date.toISOString().split("T")[0];
  const timeString = date.toTimeString().split(" ")[0].replace(/:/g, "-");
  const uniqueFileName = `${testName} ${dateString} ${timeString}.xlsx`;
  const filePath = path.join(pathToFile, uniqueFileName);

  XLSX.writeFile(workbook, filePath);
  console.log(`File saved as: ${filePath}`);
}

// export function writeDataToExcel(newData: any[],  testName: string): void {
// 	// const filePath = path.join(__dirname, 'test.xlsx');
// 	const worksheet = XLSX.utils.json_to_sheet(newData);
// 	const workbook = XLSX.utils.book_new();
//   	XLSX.utils.book_append_sheet(workbook, worksheet, testName);

//     const date = new Date();
//     const dateString = date.toISOString().split('T')[0];
//     const timeString = date.toTimeString().split(' ')[0].replace(/:/g, '-');
//     const uniqueFileName = `${testName} ${dateString} ${timeString}.xlsx`;
//     const filePath = path.join(pathToFile, uniqueFileName);

//   	XLSX.writeFile(workbook, filePath);
//     console.log(`File saved as: ${filePath}`);

// }

// export function setPathName(path: string, name: string) {
//     pathToFile = (path || os.homedir()) || "/home/vlad/";
//     fileName = (name + ".xlsx") || "test.xlsx";
// }

export async function setFreq(frequency: number): Promise<void> {
  snmpClient.setToBase("1.3.6.1.4.1.19707.7.7.2.1.4.13.0", frequency * 1000);
  await delay(1000);
  snmpClient.setToSubscriber(
    "1.3.6.1.4.1.19707.7.7.2.1.4.13.0",
    frequency * 1000
  );
  await delay(4000);
}
