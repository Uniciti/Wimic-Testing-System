import { speed, sens, modName } from './const.logic.ts';
import 'dotenv/config';


export class ExpressTest {
	private m3mPow: number = 0;
	private pa1: number = 0;
	private pa2: number = 0; 
	private splitterStr: number = 0;
	private splitterM3M: number = 0;
	private pa1ToSplit: number = 0;
	private splitToAtt: number = 0;
	private attToPa2: number = 0;

	constructor() {}

	private calculateAtt(modId: number) {
		m3mAttCom = Math.round(pa1 + pa1ToSplit + splitterM3M) + 3;
		baseAtt = (pa1 + pa2 + pa1ToSplit + splitToAtt + attToPa2 + splitterStr);
		mainAtt = sens[modId] + this.m3mPow - baseAtt;
	}



}




