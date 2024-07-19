import mongoose from 'mongoose';

import { TestResultSchema } from '../schemas/TestResult.schema';
import { ITestData } from '../interfaces/ITestData.interface';

import 'dotenv/config';

export class MongoClient{
    
    private bdUrl = `mongodb://${process.env.DB_URL!}`;
    private model = mongoose.model<ITestData>('TestResult', TestResultSchema);

    constructor() {}

    public async connect(): Promise<void>{
        try{
            await mongoose.connect(this.bdUrl);
            console.log('Database connected')
        } catch (error) {
            console.log(error);
        }
    }

    public async disconnect(): Promise<void> {
        await mongoose.disconnect();
    }

    public async saveTest(data: any[], type: string, platform: string, result: string): Promise<void> {
        try {
            const [ date, time ] = this.formatDate(new Date());
            const testResult = new this.model({
                date: date,
                time: time,
                testType: type,
                platform: platform,
                result: result,
                data: data
            });
            await testResult.save();
        } catch (error) {
            console.error(error);
        }
    }

    public async getByDate(date: string, time: string): Promise<ITestData[] | null>{
        try{
            const result = await this.model.find({ date, time });
            return result;
        } catch (error) {
            console.error(error);
        }
        return null;
    }

    public async getAll(): Promise<ITestData[] | null>{
        try{
            const result = await this.model.find();
            return result;
        } catch (error) {
            console.error(error);
        }
        return null;
    }

    public async deleteTest(date: string, time: string): Promise<void> {
        try {
            await this.model.findOneAndDelete({ date, time} )
            console.log('Data deleted from MongoDB successfully');
        } catch (error) {
            console.error(error);
        }
    }

    private formatDate(date: Date): [string, string] {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return [ `${year}-${month}-${day}`, `${hours}:${minutes}` ];
    }
}

export const mongoClient = new MongoClient();