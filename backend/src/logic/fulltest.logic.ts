import { speed10, sens10, speed20, sens20, modName, statVer } from "./consts.logic";

import { tcpClient, TcpClient } from "../services/att.service";
import { sshClient, SSHClient } from "../services/bert.service";
import { comClient, COMClient } from "../services/m3m.service";
import { snmpClient, SNMPClient } from "../services/stantion.service";
import { mongoClient, MongoClient } from "../services/db.service";

import {
  getPower,
  parseData,
  writeDataToExcel,
  delay,
  setBertSpeed,
  setBertDuration,
  validator,
} from "./main.logic";

import { broadcaster } from "../ws.server";

import "dotenv/config";

export class FullTest {
  private offset: number = 0;
  private baseAtt: number = 0;

  private duration: number = 0;

  private bandwidth: number = 10;
  private frequency: number = 5600000;
  private speed: number[] = speed10;
  private sens: number[] = sens10;

  private modList: number[];

  constructor(
    pa1: number,
    pa2: number,
    splitterAtt: number,
    splitterM3M: number,
    pa1ToSplit: number,
    splitToAtt: number,
    attToPa2: number,
    duration: number,
    bandwidth: number,
    frequency: number,
    modList: number[]
  ) {
    this.duration = duration * 1000;
    this.bandwidth = bandwidth;
    this.frequency = frequency;
    this.modList = modList;

    this.offset = Math.round(pa1 + splitterM3M + pa1ToSplit) + 3;
    this.baseAtt = pa1 + pa2 + pa1ToSplit + splitToAtt + attToPa2 + splitterAtt;
  }

  private calculateAtt(mod: number, m3mPow: number): number {
    const mainAtt = Math.ceil(mod + m3mPow - this.baseAtt);
    return mainAtt;
  }

  public async setFreq(): Promise<void> {
    if (!this.frequency) {
      return;
    }
    await snmpClient.setToBase(
      "1.3.6.1.4.1.19707.7.7.2.1.4.13.0",
      this.frequency * 1000
    );
    await delay(1000);
    await snmpClient.setToSubscriber(
      "1.3.6.1.4.1.19707.7.7.2.1.4.13.0",
      this.frequency * 1000
    );
    await delay(4000);
  }

  public async setBandwidth(): Promise<boolean> {
    if (this.bandwidth == 20) {
      this.speed = speed20;
      this.sens = sens20;
      await snmpClient.setToBase("1.3.6.1.4.1.19707.7.7.2.1.4.56.0", 5);
      await delay(1000);
      await snmpClient.setToSubscriber("1.3.6.1.4.1.19707.7.7.2.1.4.56.0", 5);
      await delay(4000);
    } else {
      this.speed = speed10;
      this.sens = sens10;
      await snmpClient.setToBase("1.3.6.1.4.1.19707.7.7.2.1.4.56.0", 3);
      await delay(1000);
      await snmpClient.setToSubscriber("1.3.6.1.4.1.19707.7.7.2.1.4.56.0", 3);
      await delay(4000);
    }
    const freq = await snmpClient.getFromSubscriber(
      "1.3.6.1.4.1.19707.7.7.2.1.4.13.0"
    );
    const ver = await snmpClient.getFromSubscriber(
      "1.3.6.1.4.1.19707.7.7.2.1.3.99.0"
    );
    if (ver <= "2.7.5") {
      await snmpClient.setToBase("1.3.6.1.4.1.19707.7.7.2.1.4.102.0", 1);
      await snmpClient.setToSubscriber("1.3.6.1.4.1.19707.7.7.2.1.4.102.0", 1);
      await delay(4000);
    }

    let firstTime: boolean = true;
    return new Promise((resolve, reject) => {
      let pingStat0: boolean;
      let pingStat1: boolean;
      try {
        const checkOutput = async () => {
          const result = await snmpClient.checkConnect();
          if (Array.isArray(result)) {
            [pingStat0, pingStat1] = result;
          }

          if (pingStat1 && !pingStat0 && firstTime) {
            await snmpClient.setToSubscriber(
              "1.3.6.1.4.1.19707.7.7.2.1.4.13.0",
              parseInt(freq)
            );
            firstTime = false;
          }

          if (pingStat0 && pingStat1) {
            await delay(1000);
            resolve(true);
          } else {
            setTimeout(checkOutput, 5000);
          }
        };

        checkOutput();

        setTimeout(() => {
          if (!(pingStat0 && pingStat1)) {
            console.log(
              "Connection check timeout. Stations may be disconnected."
            );
            resolve(false);
          }
        }, 180000);
      } catch (error: any) {
        reject(`SNMP server error ${error.message}`);
      }
    });
  }

  public async test(): Promise<void> {
    let valid = await validator();
    // console.log(valid);
    if (!valid) {
      return;
    }

    return new Promise(async (resolve) => {
      comClient.sendCommand(this.offset);
      await delay(1000);
      setBertDuration(this.duration * 7 + 1000);
      await delay(1000);
      const dataArray: any[] = [];
      // for(let i = 6; i >= 0; i--) {
      for (const i of this.modList) {
        valid = await validator();
        if (!valid) {
          break;
        }

        const message = {
          status: "modulation",
          messageMod: this.modList.findIndex((element) => element === i),
          stage: this.modList.length,
        };
        broadcaster(JSON.stringify(message));

        const m3mPow = await getPower(this.speed[i]);
        console.log(m3mPow);
        let attValue = Math.round(this.calculateAtt(this.sens[i], m3mPow));
        await tcpClient.sendCommand(attValue);
        await delay(1000);
        let x = await snmpClient.getFromSubscriber(
          "1.3.6.1.4.1.19707.7.7.2.1.3.9.0"
        );

        let txBytes: number = 0;
        let rxBytes: number = 0;
        let lostBytes: number = 0;
        let errorRate: number = 0;

        let pinVerdict = "Чуствительность соответствует";
        let verdict = "Не пройдено";
        let pinN = 0;
        let pinV = "";

        if (i != 0) {
          while (x != i.toString()) {
            valid = await validator();
            if (!valid) {
              break;
            }

            console.log(modName[i], i);
            console.log(modName[parseInt(x)], parseInt(x));
            if (parseInt(x) < i) {
              attValue -= 1;
              await tcpClient.sendCommand(attValue);
              await delay(2000);
              x = await snmpClient.getFromSubscriber(
                "1.3.6.1.4.1.19707.7.7.2.1.3.9.0"
              );
            } else {
              attValue += 1;
              await tcpClient.sendCommand(attValue);
              await delay(2000);
              x = await snmpClient.getFromSubscriber(
                "1.3.6.1.4.1.19707.7.7.2.1.3.9.0"
              );
            }
          }

          while (x == i.toString()) {
            valid = await validator();
            if (!valid) {
              break;
            }

            attValue += 1;
            await tcpClient.sendCommand(attValue);
            await delay(2000);
            x = await snmpClient.getFromSubscriber(
              "1.3.6.1.4.1.19707.7.7.2.1.3.9.0"
            );
          }

          do {
            await tcpClient.sendCommand(attValue - 2);
            await delay(1000);
            await tcpClient.sendCommand(attValue - 1);
            attValue -= 1;
            await delay(2000);

            x = await snmpClient.getFromSubscriber(
              "1.3.6.1.4.1.19707.7.7.2.1.3.9.0"
            );
            if (parseInt(x) > i) {
              pinVerdict = "Ошибка чуствительности";
              verdict = "Не пройдено";
              pinN = attValue + this.baseAtt - m3mPow;
              pinV = await snmpClient.getFromSubscriber(
                "1.3.6.1.4.1.19707.7.7.2.1.3.2.0"
              );
              break;
            }

            pinN = attValue + this.baseAtt - m3mPow;
            pinV = await snmpClient.getFromSubscriber(
              "1.3.6.1.4.1.19707.7.7.2.1.3.2.0"
            );

            await sshClient.sendCommand("statistics clear");
            await delay(1000);
            await setBertSpeed(this.speed[i]);
            await delay(1000);
            await sshClient.sendCommand("bert start");
            await delay(1000);

            let intervalChecker: NodeJS.Timeout;

            const startTest = async () => {
              intervalChecker = setInterval(async () => {
                valid = await validator();

                if (!valid) {
                  clearInterval(intervalChecker);
                }
              }, 5000);

              const start = Date.now();
              while (Date.now() - start < this.duration) {
                if (!valid) {
                  break;
                }
                await delay(100);
              }

              clearInterval(intervalChecker);
            };
            await startTest();

            await sshClient.sendCommand("bert stop");
            await delay(2000);
            const data = await sshClient.sendCommand("statistics show");
            delay(500);
            const [tx, rx] = await parseData(data);
            delay(500);
            txBytes = tx;
            rxBytes = rx;
            if (txBytes <= rxBytes) {
              rxBytes = txBytes;
            }
            delay(500);
            lostBytes = txBytes - rxBytes;
            errorRate = parseFloat(((lostBytes / txBytes) * 100).toFixed(2));
            console.log(errorRate);
            console.log(0.1 < errorRate);
            if (!valid) {
              break;
            }
          } while (0.1 < errorRate);
        } else {
          while (x != i.toString()) {
            valid = await validator();
            if (!valid) {
              break;
            }

            attValue += 1;
            await tcpClient.sendCommand(attValue);
            await delay(2000);
            x = await snmpClient.getFromSubscriber(
              "1.3.6.1.4.1.19707.7.7.2.1.3.9.0"
            );
          }

          do {
            attValue += 1;
            await tcpClient.sendCommand(attValue);
            await delay(2000);

            await sshClient.sendCommand("statistics clear");
            await delay(1000);
            await setBertSpeed(this.speed[i]);
            await delay(1000);
            await sshClient.sendCommand("bert start");
            await delay(1000);

            let intervalChecker: NodeJS.Timeout;

            let valid: boolean = true;
            const startTest = async () => {
              intervalChecker = setInterval(async () => {
                valid = await validator();

                if (!valid) {
                  clearInterval(intervalChecker);
                }
              }, 5000);

              const start = Date.now();
              while (Date.now() - start < 10000) {
                if (!valid) {
                  break;
                }
                await delay(100);
              }

              clearInterval(intervalChecker);
            };

            await startTest();

            await sshClient.sendCommand("bert stop");
            await delay(2000);
            const data = await sshClient.sendCommand("statistics show");
            delay(500);
            const [tx, rx] = await parseData(data);
            delay(500);
            txBytes = tx;
            rxBytes = rx;
            if (txBytes <= rxBytes) {
              rxBytes = txBytes;
            }
            delay(500);
            lostBytes = txBytes - rxBytes;
            errorRate = parseFloat(((lostBytes / txBytes) * 100).toFixed(2));
            console.log(errorRate);
            console.log(0.1 > errorRate);
            if (!valid) {
              break;
            }
          } while (0.1 > errorRate);

          do {
            await tcpClient.sendCommand(attValue - 2);
            await delay(1000);
            await tcpClient.sendCommand(attValue - 1);
            attValue -= 1;
            await delay(2000);

            x = await snmpClient.getFromSubscriber(
              "1.3.6.1.4.1.19707.7.7.2.1.3.9.0"
            );
            if (x != i.toString()) {
              pinVerdict = "Ошибка чуствительности";
              verdict = "Не пройдено";
              pinN = this.sens[i];
              pinV = await snmpClient.getFromSubscriber(
                "1.3.6.1.4.1.19707.7.7.2.1.3.2.0"
              );
              break;
            }

            pinN = attValue + this.baseAtt - m3mPow;
            pinV = await snmpClient.getFromSubscriber(
              "1.3.6.1.4.1.19707.7.7.2.1.3.2.0"
            );

            await sshClient.sendCommand("statistics clear");
            await delay(1000);
            await setBertSpeed(this.speed[i]);
            await delay(1000);
            await sshClient.sendCommand("bert start");
            await delay(1000);

            let intervalChecker: NodeJS.Timeout;

            let valid: boolean = true;

            const startTest = async () => {
              intervalChecker = setInterval(async () => {
                valid = await validator();

                if (!valid) {
                  clearInterval(intervalChecker);
                }
              }, 5000);

              const start = Date.now();
              while (Date.now() - start < this.duration) {
                if (!valid) {
                  break;
                }
                await delay(100);
              }

              clearInterval(intervalChecker);
            };
            await startTest();

            await sshClient.sendCommand("bert stop");
            await delay(2000);
            const data = await sshClient.sendCommand("statistics show");
            delay(500);
            const [tx, rx] = await parseData(data);
            delay(500);
            txBytes = tx;
            rxBytes = rx;
            if (txBytes <= rxBytes) {
              rxBytes = txBytes;
            }
            delay(500);
            lostBytes = txBytes - rxBytes;
            errorRate = parseFloat(((lostBytes / txBytes) * 100).toFixed(2));
            if (!valid) {
              break;
            }
          } while (0.1 < errorRate);
        }
        const snr = await snmpClient.getFromSubscriber(
          "1.3.6.1.4.1.19707.7.7.2.1.3.1.0"
        );
        if (0.1 >= errorRate && valid) {
          verdict = "Пройдено";
        }
        if (pinN < this.sens[i] || !valid) {
          pinVerdict = "Чуствительность не соответствует";
        }
        dataArray.push({
          Modulation: modName[i],
          Attenuation: attValue,
          SNR: parseFloat(snr.slice(0, 5)),
          Pin: -1 * pinN,
          Sens: -1 * this.sens[i],
          PinStat: parseFloat(pinV),
          LostPercent: errorRate,
          TestStatus: verdict,
          SensStatus: pinVerdict,
          Frequency: this.frequency,
          Bandwidth: this.bandwidth,
          ErrorExec: !valid,
        });
      }

      console.log(dataArray);
      writeDataToExcel(dataArray, "full test");
      let message: any = null;
      let result: string = "Провал";
      if (valid) {
        message = { testid: "fulltest", status: "processing" };
        result = "Успех";
      } else {
        message = { testid: "fulltest", status: "error exec" };
        result = "Провал";
      }
      await mongoClient.saveTest(dataArray, "Полный тест", statVer, result);
      broadcaster(JSON.stringify(message));
      resolve();
    });
  }
}
