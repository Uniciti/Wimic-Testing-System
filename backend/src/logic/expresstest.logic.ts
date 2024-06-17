import { speed, sens, modName } from './consts.logic';
import 'dotenv/config';


export class ExpressTest {
	private m3mPow: number = 0;
	private pa1: number = 0;
	private pa2: number = 0; 
	private splitterAtt: number = 0;
	private splitterM3M: number = 0;
	private pa1ToSplit: number = 0;
	private splitToAtt: number = 0;
	private attToPa2: number = 0;
	private duration: number = 0;

	constructor() {}

	private calculateAtt(modId: number): number {
		const m3mAttCom = Math.round(this.pa1 + this.pa1ToSplit + this.splitterM3M) + 3;
		const baseAtt = (this.pa1 + this.pa2 + this.pa1ToSplit + this.splitToAtt + this.attToPa2 + this.splitterAtt);
		const mainAtt = sens[modId] + this.m3mPow - baseAtt;
		return mainAtt;
	}




}




