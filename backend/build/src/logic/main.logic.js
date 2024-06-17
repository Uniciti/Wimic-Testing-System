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
exports.parseBits = exports.getPower = void 0;
const bert_service_1 = require("../services/bert.service");
const m3m_service_1 = require("../services/m3m.service");
function getPower(mod) {
    return __awaiter(this, void 0, void 0, function* () {
        let m3mPow = 0;
        try {
            bert_service_1.sshClient.sendCommand('configure');
            bert_service_1.sshClient.sendCommand('txgen rate 1600 kbps');
            bert_service_1.sshClient.sendCommand('exit');
            bert_service_1.sshClient.sendCommand('txgen start');
            yield new Promise((resolve, reject) => {
                setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                    try {
                        m3mPow = yield m3m_service_1.comClient.receiveData();
                        resolve();
                    }
                    catch (error) {
                        reject(error);
                    }
                }), 1000);
            });
            bert_service_1.sshClient.sendCommand('txgen stop');
        }
        catch (error) {
            console.error('Error occurred:', error);
            throw error;
        }
        return m3mPow;
    });
}
exports.getPower = getPower;
function parseBits(inputString) {
    const regex = /bits\s(\d+)\sebits\s(\d+)/;
    const matches = regex.exec(inputString);
    return new Promise((resolve, reject) => {
        if (matches) {
            const bits = parseInt(matches[1], 10);
            const ebits = parseInt(matches[2], 10);
            resolve([bits, ebits]);
        }
        else {
            reject(new Error("No matches found in the input string."));
        }
    });
}
exports.parseBits = parseBits;
