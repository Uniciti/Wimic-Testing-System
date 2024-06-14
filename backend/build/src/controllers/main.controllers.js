"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.frontSender = exports.test = void 0;
const path_1 = __importDefault(require("path"));
const test = (req, res) => {
    res.send('test prek');
};
exports.test = test;
const frontSender = (req, res) => {
    res.sendFile(path_1.default.resolve(__dirname, 'public', 'index.html'));
};
exports.frontSender = frontSender;
