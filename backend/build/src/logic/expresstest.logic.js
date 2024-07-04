"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpressTest = void 0;
const consts_logic_1 = require("./consts.logic");
const main_logic_1 = require("./main.logic");
const att_service_1 = require("../services/att.service");
const bert_service_1 = require("../services/bert.service");
const m3m_service_1 = require("../services/m3m.service");
const stantion_service_1 = require("../services/stantion.service");
const ws_server_1 = require("../ws.server");
require("dotenv/config");
class ExpressTest {
    constructor(pa1, pa2, splitterAtt, splitterM3M, pa1ToSplit, splitToAtt, attToPa2, duration, bandwidth) {
        // private m3mPow: number = 0;
        this.offset = 0;
        this.baseAtt = 0;
        this.pa1 = 0;
        this.pa2 = 0;
        this.splitterAtt = 0;
        this.splitterM3M = 0;
        this.pa1ToSplit = 0;
        this.splitToAtt = 0;
        this.attToPa2 = 0;
        this.duration = 0;
        this.bandwidth = 10;
        this.speed = consts_logic_1.speed10;
        this.sens = consts_logic_1.sens10;
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
    calculateAtt(mod, m3mPow) {
        const mainAtt = Math.ceil(mod + m3mPow - this.baseAtt);
        return mainAtt;
    }
    setBandwidth() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.bandwidth == 20) {
                this.speed = consts_logic_1.speed20;
                this.sens = consts_logic_1.sens20;
                yield stantion_service_1.snmpClient.setToBase("1.3.6.1.4.1.19707.7.7.2.1.4.56.0", 5);
                yield stantion_service_1.snmpClient.setToSubscriber("1.3.6.1.4.1.19707.7.7.2.1.4.56.0", 5);
                yield stantion_service_1.snmpClient.setToBase("1.3.6.1.4.1.19707.7.7.2.1.4.102.0", 1);
                yield stantion_service_1.snmpClient.setToSubscriber("1.3.6.1.4.1.19707.7.7.2.1.4.102.0", 1);
            }
            else {
                this.speed = consts_logic_1.speed10;
                this.sens = consts_logic_1.sens10;
                yield stantion_service_1.snmpClient.setToBase("1.3.6.1.4.1.19707.7.7.2.1.4.56.0", 3);
                yield stantion_service_1.snmpClient.setToSubscriber("1.3.6.1.4.1.19707.7.7.2.1.4.56.0", 3);
                yield stantion_service_1.snmpClient.setToBase("1.3.6.1.4.1.19707.7.7.2.1.4.102.0", 1);
                yield stantion_service_1.snmpClient.setToSubscriber("1.3.6.1.4.1.19707.7.7.2.1.4.102.0", 1);
            }
            yield (0, main_logic_1.delay)(5000);
            console.log("check");
            return new Promise((resolve, reject) => {
                let pingStat0;
                let pingStat1;
                try {
                    const checkOutput = () => __awaiter(this, void 0, void 0, function* () {
                        const result = yield stantion_service_1.snmpClient.checkConnect();
                        if (Array.isArray(result)) {
                            [pingStat0, pingStat1] = result;
                        }
                        if (pingStat0 && pingStat1) {
                            resolve(true);
                        }
                        else {
                            setTimeout(checkOutput, 5000);
                        }
                    });
                    checkOutput();
                    setTimeout(() => {
                        if (!(pingStat0 && pingStat1)) {
                            console.log('Connection check timeout. Stations may be disconnected.');
                            resolve(false);
                        }
                    }, 180000);
                }
                catch (error) {
                    reject(`SNMP server error ${error.message}`);
                }
            });
        });
    }
    test() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                m3m_service_1.comClient.sendCommand(this.offset);
                yield (0, main_logic_1.delay)(1000);
                (0, main_logic_1.setBertDuration)(this.duration * 7 + 1000);
                yield (0, main_logic_1.delay)(1000);
                const dataArray = [];
                for (let i = 6; i >= 6; i--) {
                    dataArray.push({ "Модуляция": consts_logic_1.modName[i],
                        "Аттен, ДБ": "none",
                        "С/Ш": "none",
                        "Отправлено, байт": "none",
                        "Принято, байт": "none",
                        "Потеряно, байт": "none",
                        "Процент ошибок, %": "none",
                        "Статус": "Ошибка поиска модуляции",
                        "Полоса": this.bandwidth,
                    });
                    (0, ws_server_1.testBroadcast)("expresstest", (6 - i).toString());
                    const m3mPow = yield (0, main_logic_1.getPower)(this.speed[i]);
                    console.log(m3mPow);
                    const attValue = Math.round(this.calculateAtt(this.sens[i], m3mPow));
                    yield att_service_1.tcpClient.sendCommand(attValue);
                    // let x = await snmpClient.getFromSubscriber('1.3.6.1.4.1.19707.7.7.2.1.3.9.0');
                    yield att_service_1.tcpClient.sendCommand(attValue - 2);
                    yield att_service_1.tcpClient.sendCommand(attValue - 1);
                    yield att_service_1.tcpClient.sendCommand(attValue);
                    yield (0, main_logic_1.delay)(2000);
                    const x = yield stantion_service_1.snmpClient.getFromSubscriber('1.3.6.1.4.1.19707.7.7.2.1.3.9.0');
                    if (x == i.toString()) {
                        yield bert_service_1.sshClient.sendCommand('statistics clear');
                        yield (0, main_logic_1.delay)(1000);
                        yield (0, main_logic_1.setBertSpeed)(this.speed[i]);
                        yield (0, main_logic_1.delay)(1000);
                        yield bert_service_1.sshClient.sendCommand('bert start');
                        yield (0, main_logic_1.delay)(1000);
                        let txBytes = 0;
                        let rxBytes = 0;
                        let intervalChecker;
                        const startTest = () => __awaiter(this, void 0, void 0, function* () {
                            intervalChecker = setInterval(() => __awaiter(this, void 0, void 0, function* () {
                                try {
                                    const data = yield bert_service_1.sshClient.sendCommand('statistics show');
                                    (0, main_logic_1.delay)(500);
                                    const [tx, rx] = yield (0, main_logic_1.parseData)(data);
                                    (0, main_logic_1.delay)(500);
                                    txBytes = tx;
                                    rxBytes = rx;
                                    console.log('TX/RX: ', txBytes, rxBytes);
                                }
                                catch (error) {
                                    console.log(`SSH server error ${error.message}`);
                                }
                            }), 5000);
                            yield (0, main_logic_1.delay)(this.duration);
                            clearInterval(intervalChecker);
                        });
                        yield startTest();
                        // for (let j = 0; j < 5; j++) {
                        // 	const data = await sshClient.sendCommand('statistics show');
                        // 	await delay(1000);
                        // 	[txBytes, rxBytes] = await parseData(data);
                        // 	console.log('TX/RX: ', txBytes, rxBytes);
                        // }
                        yield bert_service_1.sshClient.sendCommand('bert stop');
                        yield (0, main_logic_1.delay)(2000);
                        const data = yield bert_service_1.sshClient.sendCommand('statistics show');
                        (0, main_logic_1.delay)(500);
                        const [tx, rx] = yield (0, main_logic_1.parseData)(data);
                        (0, main_logic_1.delay)(500);
                        txBytes = tx;
                        rxBytes = rx;
                        if (txBytes <= rxBytes) {
                            rxBytes = txBytes;
                        }
                        (0, main_logic_1.delay)(500);
                        const lostBytes = txBytes - rxBytes;
                        const errorRate = parseFloat(((lostBytes / txBytes) * 100).toFixed(2));
                        const snr = yield stantion_service_1.snmpClient.getFromSubscriber('1.3.6.1.4.1.19707.7.7.2.1.3.1.0');
                        let verdict = "Пройдено";
                        if (0.1 < errorRate) {
                            verdict = "Не пройдено";
                        }
                        dataArray[dataArray.length - 1] = {
                            "Модуляция": consts_logic_1.modName[i],
                            "Аттен, ДБ": attValue,
                            "С/Ш": (parseFloat(snr.slice(0, 5))),
                            "Отправлено, байт": txBytes,
                            "Принято, байт": rxBytes,
                            "Потеряно, байт": lostBytes,
                            "Процент ошибок, %": errorRate,
                            "Статус": verdict,
                            "Полоса": this.bandwidth,
                        };
                    }
                }
                console.log(dataArray);
                (0, main_logic_1.writeDataToExcel)(dataArray, "express test");
                (0, ws_server_1.testBroadcast)("expresstest", "completed");
                resolve();
            }));
        });
    }
    jsonParser() {
        return {
            name: "expresstest",
            duration: this.duration / 1000,
            bandwidth: this.bandwidth,
            offset: this.offset,
            baseAtt: this.baseAtt,
        };
    }
}
exports.ExpressTest = ExpressTest;
