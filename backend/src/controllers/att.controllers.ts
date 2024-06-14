// это рудимент

import { Request, Response } from 'express';
import { tcpClient } from '../services/att.service';

export const connectToAttenuator = async (req: Request, res: Response) => {
  try {
    await tcpClient.connect();
    res.status(200).send('Connected to attenuator.');
  } catch (err) {
    res.status(500).send('Error connecting to attenuator');
  }
};

export const sendCommandToAttenuator = async (req: Request, res: Response) => {
  const attValue = req.body.attValue;
  console.log(attValue);
  try {
    await tcpClient.sendCommand(attValue);
    res.status(200).send('Command sent successfully.');
  } catch (err) {
    res.status(500).send('Error sending');
  }
};

export const receiveAttenuatorValue = async (req: Request, res: Response) => {
  try {
    const data = await tcpClient.receiveData();
    res.status(200).send(`Received  ${data}`);
  } catch (err) {
    res.status(500).send('Error receiving');
  }
};

export const disconnectFromAttenuator = (req: Request, res: Response) => {
  tcpClient.disconnect();
  res.status(200).send('Disconnected from attenuator.');
};