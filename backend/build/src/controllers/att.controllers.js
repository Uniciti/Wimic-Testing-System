"use strict";
// это рудимент
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
exports.disconnectFromAttenuator = exports.receiveAttenuatorValue = exports.sendCommandToAttenuator = exports.connectToAttenuator = void 0;
const att_service_1 = require("../services/att.service");
const connectToAttenuator = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield att_service_1.tcpClient.connect();
        res.status(200).send('Connected to attenuator.');
    }
    catch (err) {
        res.status(500).send('Error connecting to attenuator');
    }
});
exports.connectToAttenuator = connectToAttenuator;
const sendCommandToAttenuator = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const attValue = req.body.attValue;
    console.log(attValue);
    try {
        yield att_service_1.tcpClient.sendCommand(attValue);
        res.status(200).send('Command sent successfully.');
    }
    catch (err) {
        res.status(500).send('Error sending');
    }
});
exports.sendCommandToAttenuator = sendCommandToAttenuator;
const receiveAttenuatorValue = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield att_service_1.tcpClient.receiveData();
        res.status(200).send(`Received  ${data}`);
    }
    catch (err) {
        res.status(500).send('Error receiving');
    }
});
exports.receiveAttenuatorValue = receiveAttenuatorValue;
const disconnectFromAttenuator = (req, res) => {
    att_service_1.tcpClient.disconnect();
    res.status(200).send('Disconnected from attenuator.');
};
exports.disconnectFromAttenuator = disconnectFromAttenuator;
