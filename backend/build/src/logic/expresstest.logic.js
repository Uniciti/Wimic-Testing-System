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
require("dotenv/config");
class ExpressTest {
    // private duration: number = 0;
    constructor(pa1, pa2, splitterAtt, splitterM3M, pa1ToSplit, splitToAtt, attToPa2) {
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
    calculateAtt(mod, m3mPow) {
        const mainAtt = mod + m3mPow - this.baseAtt;
        return mainAtt;
    }
    test() {
        return __awaiter(this, void 0, void 0, function* () {
            m3m_service_1.comClient.sendCommand(this.offset);
            const dataArray = [];
            for (let i = 6; i >= 0; i--) {
                const m3mPow = yield (0, main_logic_1.getPower)(consts_logic_1.speed[i]);
                const attValue = this.calculateAtt(consts_logic_1.speed[i], m3mPow);
                yield att_service_1.tcpClient.sendCommand(attValue);
                let x = yield stantion_service_1.snmpClient.getFromSubscriber('1.3.6.1.4.1.19707.7.7.2.1.3.9.0');
                yield att_service_1.tcpClient.sendCommand(attValue - 2);
                yield att_service_1.tcpClient.sendCommand(attValue - 1);
                yield att_service_1.tcpClient.sendCommand(attValue);
                x = yield stantion_service_1.snmpClient.getFromSubscriber('1.3.6.1.4.1.19707.7.7.2.1.3.9.0');
                if (x == attValue.toString()) {
                    yield bert_service_1.sshClient.sendCommand('bert start');
                    let bits = 0;
                    let ebits = 0;
                    for (let j = 0; j < 5; j++) {
                        const data = yield bert_service_1.sshClient.sendCommand('bert start');
                        const [parsedBits, parsedEbits] = yield (0, main_logic_1.parseBits)(data);
                        bits = parsedBits;
                        ebits = parsedEbits;
                        console.log('bits_Ebits: ', bits, ebits);
                    }
                    yield bert_service_1.sshClient.sendCommand('bert stop');
                    const errorRate = (ebits / (ebits + bits)) * 100;
                    dataArray.push({ modulation: consts_logic_1.modName[i], bits, ebits, errorRate });
                }
            }
            (0, main_logic_1.writeDataToExcel)(dataArray);
        });
    }
}
exports.ExpressTest = ExpressTest;
