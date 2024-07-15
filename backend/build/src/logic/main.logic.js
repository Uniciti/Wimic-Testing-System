"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.setFreq = exports.writeDataToExcel = exports.parseData = exports.validator = exports.getPower = exports.setBertDuration = exports.setBertSpeed = exports.delay = exports.fileName = exports.pathToFile = void 0;
const att_service_1 = require("../services/att.service");
const bert_service_1 = require("../services/bert.service");
const stantion_service_1 = require("../services/stantion.service");
const m3m_service_1 = require("../services/m3m.service");
const ws_server_1 = require("../ws.server");
// import { speed, sens, modName } from './consts.logic';
const XLSX = __importStar(require("xlsx"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
exports.pathToFile = path.join(os.homedir(), '/');
;
exports.fileName = "test.xlsx";
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
exports.delay = delay;
function setBertSpeed(speed) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield bert_service_1.sshClient.sendCommand('configure');
            yield (0, exports.delay)(200);
            yield bert_service_1.sshClient.sendCommand(`bert rate ${speed} kbps`);
            yield (0, exports.delay)(200);
            yield bert_service_1.sshClient.sendCommand('exit');
            yield (0, exports.delay)(200);
        }
        catch (error) {
            console.error('Error occurred:', error);
            throw error;
        }
    });
}
exports.setBertSpeed = setBertSpeed;
function setBertDuration(duration) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const millisecondsInASecond = 1000;
            const millisecondsInAMinute = 60 * millisecondsInASecond;
            const millisecondsInAnHour = 60 * millisecondsInAMinute;
            const hours = Math.floor(duration / millisecondsInAnHour);
            const remainingAfterHours = duration % millisecondsInAnHour;
            const minutes = Math.floor(remainingAfterHours / millisecondsInAMinute);
            const remainingAfterMinutes = remainingAfterHours % millisecondsInAMinute;
            const seconds = Math.floor(remainingAfterMinutes / millisecondsInASecond);
            const formatNumber = (num) => num.toString().padStart(2, '0');
            yield bert_service_1.sshClient.sendCommand('configure');
            yield (0, exports.delay)(200);
            yield bert_service_1.sshClient.sendCommand(`bert duration ${formatNumber(hours)}.${formatNumber(minutes)}.${formatNumber(seconds)}`);
            yield (0, exports.delay)(200);
            yield bert_service_1.sshClient.sendCommand('exit');
            yield (0, exports.delay)(200);
        }
        catch (error) {
            console.error('Error occurred:', error);
            throw error;
        }
    });
}
exports.setBertDuration = setBertDuration;
function getPower(speed) {
    return __awaiter(this, void 0, void 0, function* () {
        let m3mPow = null;
        try {
            yield bert_service_1.sshClient.sendCommand('configure');
            yield (0, exports.delay)(200);
            yield bert_service_1.sshClient.sendCommand(`txgen rate ${speed} kbps`);
            yield (0, exports.delay)(200);
            yield bert_service_1.sshClient.sendCommand('exit');
            yield (0, exports.delay)(200);
            yield bert_service_1.sshClient.sendCommand('txgen start');
            yield (0, exports.delay)(4000);
            // console.log("ToooClooose");
            // while (m3mPow === null){
            m3mPow = yield m3m_service_1.comClient.receiveData();
            // }
            // console.log("YouuuuWIIIINN!");
            yield (0, exports.delay)(1000);
            yield bert_service_1.sshClient.sendCommand('txgen stop');
            yield (0, exports.delay)(1000);
        }
        catch (error) {
            console.error('Error occurred:', error);
            throw error;
        }
        return m3mPow;
    });
}
exports.getPower = getPower;
function validator() {
    return __awaiter(this, void 0, void 0, function* () {
        const response = { type: 'is-connected' };
        const result0 = yield bert_service_1.sshClient.checkConnect();
        response.pingBert = result0;
        const result1 = yield att_service_1.tcpClient.checkConnect();
        response.pingAtt = result1;
        const result3 = yield m3m_service_1.comClient.checkConnect();
        response.pingM3M = result3;
        const result2 = yield stantion_service_1.snmpClient.checkConnect();
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
        (0, ws_server_1.broadcaster)(JSON.stringify(response));
        return result0 && result1 && pingStat0 && pingStat1 && result3;
    });
}
exports.validator = validator;
function parseData(data) {
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
        }
        catch (error) {
            reject(new Error('Failed to parse numbers from lines'));
        }
    });
}
exports.parseData = parseData;
;
function writeDataToExcel(newData, testName) {
    // const filePath = path.join(__dirname, 'test.xlsx');
    const worksheet = XLSX.utils.json_to_sheet(newData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, testName);
    const date = new Date();
    const dateString = date.toISOString().split('T')[0];
    const timeString = date.toTimeString().split(' ')[0].replace(/:/g, '-');
    const uniqueFileName = `${testName} ${dateString} ${timeString}.xlsx`;
    const filePath = path.join(exports.pathToFile, uniqueFileName);
    XLSX.writeFile(workbook, filePath);
    console.log(`File saved as: ${filePath}`);
}
exports.writeDataToExcel = writeDataToExcel;
// export function setPathName(path: string, name: string) { 
//     pathToFile = (path || os.homedir()) || "/home/vlad/";
//     fileName = (name + ".xlsx") || "test.xlsx";
// }
function setFreq(frequency) {
    return __awaiter(this, void 0, void 0, function* () {
        stantion_service_1.snmpClient.setToBase("1.3.6.1.4.1.19707.7.7.2.1.4.13.0", frequency * 1000);
        yield (0, exports.delay)(1000);
        stantion_service_1.snmpClient.setToSubscriber("1.3.6.1.4.1.19707.7.7.2.1.4.13.0", frequency * 1000);
        yield (0, exports.delay)(4000);
    });
}
exports.setFreq = setFreq;
