import { Document } from 'mongoose';

export interface ITestData extends Document {
    date: string;
    time: string;
    testType: string;
    platform: string;
    result: string;
    data: any[];
}