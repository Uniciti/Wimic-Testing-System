import { Request, Response } from 'express';
import path from 'path';

export const test = (req: Request, res: Response) => {
	res.send('test prek');
};

export const frontSender = (req: Request, res: Response) => {
	res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
};