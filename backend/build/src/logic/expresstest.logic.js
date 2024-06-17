"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpressTest = void 0;
const consts_logic_1 = require("./consts.logic");
require("dotenv/config");
class ExpressTest {
    constructor() {
        this.m3mPow = 0;
        this.pa1 = 0;
        this.pa2 = 0;
        this.splitterStr = 0;
        this.splitterM3M = 0;
        this.pa1ToSplit = 0;
        this.splitToAtt = 0;
        this.attToPa2 = 0;
    }
    calculateAtt(modId) {
        const m3mAttCom = Math.round(this.pa1 + this.pa1ToSplit + this.splitterM3M) + 3;
        const baseAtt = (this.pa1 + this.pa2 + this.pa1ToSplit + this.splitToAtt + this.attToPa2 + this.splitterStr);
        const mainAtt = consts_logic_1.sens[modId] + this.m3mPow - baseAtt;
        return mainAtt;
    }
}
exports.ExpressTest = ExpressTest;
