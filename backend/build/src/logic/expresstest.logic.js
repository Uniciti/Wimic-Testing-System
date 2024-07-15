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
    constructor(pa1, pa2, splitterAtt, splitterM3M, pa1ToSplit, splitToAtt, attToPa2, duration, bandwidth, frequency, modList) {
        // private m3mPow: number = 0;
        this.offset = 0;
        this.baseAtt = 0;
        this.duration = 0;
        this.bandwidth = 10;
        this.frequency = 5600000;
        this.speed = consts_logic_1.speed10;
        this.sens = consts_logic_1.sens10;
        this.duration = duration * 1000;
        this.bandwidth = bandwidth;
        this.frequency = frequency;
        this.modList = modList;
        this.offset = Math.round(pa1 + splitterM3M + pa1ToSplit) + 3;
        this.baseAtt = pa1 + pa2 + pa1ToSplit + splitToAtt + attToPa2 + splitterAtt;
    }
    calculateAtt(mod, m3mPow) {
        const mainAtt = Math.ceil(mod + m3mPow - this.baseAtt);
        return mainAtt;
    }
    setFreq() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.frequency) {
                return;
            }
            console.log(this.frequency * 1000);
            yield stantion_service_1.snmpClient.setToBase("1.3.6.1.4.1.19707.7.7.2.1.4.13.0", this.frequency * 1000);
            yield (0, main_logic_1.delay)(1000);
            yield stantion_service_1.snmpClient.setToSubscriber("1.3.6.1.4.1.19707.7.7.2.1.4.13.0", this.frequency * 1000);
            yield (0, main_logic_1.delay)(4000);
        });
    }
    setBandwidth() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.bandwidth == 20) {
                this.speed = consts_logic_1.speed20;
                this.sens = consts_logic_1.sens20;
                yield stantion_service_1.snmpClient.setToBase("1.3.6.1.4.1.19707.7.7.2.1.4.56.0", 5);
                yield (0, main_logic_1.delay)(1000);
                yield stantion_service_1.snmpClient.setToSubscriber("1.3.6.1.4.1.19707.7.7.2.1.4.56.0", 5);
                yield (0, main_logic_1.delay)(5000);
            }
            else {
                this.speed = consts_logic_1.speed10;
                this.sens = consts_logic_1.sens10;
                yield stantion_service_1.snmpClient.setToBase("1.3.6.1.4.1.19707.7.7.2.1.4.56.0", 3);
                yield (0, main_logic_1.delay)(1000);
                yield stantion_service_1.snmpClient.setToSubscriber("1.3.6.1.4.1.19707.7.7.2.1.4.56.0", 3);
                yield (0, main_logic_1.delay)(5000);
            }
            const freq = yield stantion_service_1.snmpClient.getFromSubscriber("1.3.6.1.4.1.19707.7.7.2.1.4.13.0");
            const ver = yield stantion_service_1.snmpClient.getFromSubscriber("1.3.6.1.4.1.19707.7.7.2.1.3.99.0");
            if (ver <= '2.7.5') {
                yield stantion_service_1.snmpClient.setToBase("1.3.6.1.4.1.19707.7.7.2.1.4.102.0", 1);
                yield stantion_service_1.snmpClient.setToSubscriber("1.3.6.1.4.1.19707.7.7.2.1.4.102.0", 1);
                yield (0, main_logic_1.delay)(5000);
            }
            let firstTime = true;
            console.log("pullman time");
            return new Promise((resolve, reject) => {
                let pingStat0;
                let pingStat1;
                try {
                    const checkOutput = () => __awaiter(this, void 0, void 0, function* () {
                        const result = yield stantion_service_1.snmpClient.checkConnect();
                        if (Array.isArray(result)) {
                            [pingStat0, pingStat1] = result;
                        }
                        if (pingStat1 && !pingStat0 && firstTime) {
                            yield stantion_service_1.snmpClient.setToSubscriber("1.3.6.1.4.1.19707.7.7.2.1.4.13.0", parseInt(freq));
                            firstTime = false;
                        }
                        if (pingStat0 && pingStat1) {
                            yield (0, main_logic_1.delay)(1000);
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
            let valid = yield (0, main_logic_1.validator)();
            // console.log(valid);
            if (!valid) {
                return;
            }
            return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                m3m_service_1.comClient.sendCommand(this.offset);
                yield (0, main_logic_1.delay)(1000);
                (0, main_logic_1.setBertDuration)(this.duration * 7 + 1000);
                yield (0, main_logic_1.delay)(1000);
                const dataArray = [];
                // for(let i = 6; i >= 0; i--) {
                for (const i of this.modList) {
                    valid = yield (0, main_logic_1.validator)();
                    if (!valid) {
                        break;
                    }
                    dataArray.push({ "Модуляция": consts_logic_1.modName[i],
                        "Аттен, ДБ": "none",
                        "С/Ш": "none",
                        "Отправлено, байт": "none",
                        "Принято, байт": "none",
                        "Потеряно, байт": "none",
                        "Процент ошибок, %": "none",
                        "Статус": "Ошибка поиска модуляции",
                        "Полоса": this.bandwidth,
                        "Аварийное завершение": !valid,
                    });
                    const message = { status: "modulation", messageMod: this.modList.findIndex(element => element === i) + 1, stage: this.modList.length };
                    (0, ws_server_1.broadcaster)(JSON.stringify(message));
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
                        // let valid: boolean = true;
                        const startTest = () => __awaiter(this, void 0, void 0, function* () {
                            intervalChecker = setInterval(() => __awaiter(this, void 0, void 0, function* () {
                                valid = yield (0, main_logic_1.validator)();
                                if (!valid) {
                                    clearInterval(intervalChecker);
                                }
                            }), 5000);
                            // await delay(this.duration);
                            const start = Date.now();
                            while (Date.now() - start < this.duration) {
                                if (!valid) {
                                    break;
                                }
                                yield (0, main_logic_1.delay)(100);
                            }
                            clearInterval(intervalChecker);
                        });
                        // broadcaster(JSON.stringify({status: "testingMod"}));
                        yield startTest();
                        // broadcaster(JSON.stringify({status: "stopTestingMod"}));
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
                        console.log(valid);
                        console.log("^^^^");
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
                            "Аварийное завершение": !valid,
                        };
                    }
                }
                console.log(dataArray);
                (0, main_logic_1.writeDataToExcel)(dataArray, "express test");
                let message = null;
                if (valid) {
                    message = { testid: "expresstest", status: "processing" };
                }
                else {
                    message = { testid: "expresstest", status: "error exec" };
                }
                (0, ws_server_1.broadcaster)(JSON.stringify(message));
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
