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
exports.writeDataToExcel = exports.parseData = exports.getPower = exports.setBertSpeed = exports.delay = void 0;
const bert_service_1 = require("../services/bert.service");
const m3m_service_1 = require("../services/m3m.service");
const XLSX = __importStar(require("xlsx"));
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
exports.delay = delay;
function setBertSpeed(speed) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield bert_service_1.sshClient.sendCommand;
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
function getPower(speed) {
    return __awaiter(this, void 0, void 0, function* () {
        let m3mPow = 0;
        try {
            yield bert_service_1.sshClient.sendCommand('configure');
            yield (0, exports.delay)(200);
            yield bert_service_1.sshClient.sendCommand(`txgen rate ${speed} kbps`);
            yield (0, exports.delay)(200);
            yield bert_service_1.sshClient.sendCommand('exit');
            yield (0, exports.delay)(200);
            yield bert_service_1.sshClient.sendCommand('txgen start');
            yield (0, exports.delay)(2000);
            // console.log("ToooClooose");
            m3mPow = yield m3m_service_1.comClient.receiveData();
            // console.log("YouuuuWIIIINN!");
            yield (0, exports.delay)(200);
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
            const txFrames = parseInt(txFramesValues[2], 10); // Вторая цифра после Tx frames
            const rxFrames = parseInt(rxFramesValues[3], 10); // Третья цифра после Rx frames
            resolve([txFrames, rxFrames]);
        }
        catch (error) {
            reject(new Error('Failed to parse numbers from lines'));
        }
    });
}
exports.parseData = parseData;
;
function writeDataToExcel(newData) {
    // const filePath = path.join(__dirname, 'test.xlsx');
    const worksheet = XLSX.utils.json_to_sheet(newData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, 'test.xlsx');
}
exports.writeDataToExcel = writeDataToExcel;
