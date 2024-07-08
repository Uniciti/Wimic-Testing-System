import WebSocket from 'ws';
// import { Device } from './interfaces/device.interface';
import { tcpClient, TcpClient } from './services/att.service';
import { sshClient, SSHClient } from './services/bert.service';
import { snmpClient, SNMPClient } from './services/stantion.service';
import { comClient, COMClient } from './services/m3m.service';
import { ExpressTest } from './logic/expresstest.logic';
import { FullTest } from './logic/fulltest.logic';
import { queue, Queue } from './logic/queue.logic';
import { pathToFile, fileName, delay } from './logic/main.logic';
import 'dotenv/config';

const devices: { [key: string]: TcpClient | SSHClient | SNMPClient | COMClient} = {
  'Att': tcpClient,
  'Ber': sshClient,
  'Stat': snmpClient,
  'M3M': comClient,
  
};

let wss: WebSocket.Server;

export function setupWebSocketServer(server: any) {
  wss = new WebSocket.Server({ server });
  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected');

    ws.on('message', async (message: string) => {

      try {

        const parsedMessage = JSON.parse(message);
        const { type, deviceId, command, value, ber, att, stat, m3m, filename, path} = parsedMessage;
        const device = devices[deviceId] || 'connectChecker';
  
        if (!device) {
          ws.send(JSON.stringify({ type: 'error', message: `Device ${deviceId} not found` }));
  
          return;
        }
        // большая часть команд является отладочными и не будет использоваться в конечном продукте
        switch (type) {

          // case 'stat-ip-switch':

          // case 'set-path':
          //   setPathName(path, filename);
          //   ws.send(JSON.stringify({ "path": (path + "/" + filename + ".xlsx").toString() }));
          //   break;
          
          case 'connect':
            const conStatus = await device.connect();
            ws.send(JSON.stringify({ type: 'connect', deviceId, conStatus }));
            break;
          
          case 'send-command':
            if (value === undefined && command === undefined) {
              ws.send(JSON.stringify({ type: 'error', message: 'Command or attValue is required' }));
              return;
            }
            if (device instanceof TcpClient){
              await device.sendCommand(value);
              ws.send(JSON.stringify({ type: 'sended', message: `Command sent to ${deviceId}` }));
              break;
            }
            if (device instanceof SSHClient){
              const data = await device.sendCommand(command);
              ws.send(JSON.stringify({ type: 'sended', message: `Bercut answer ${data}` }));
              break;
            }
            if (device instanceof SNMPClient){
              let args = command.split(" ");
              await device.setToBase(args[0], parseInt(args[1], 10));
              await device.setToSubscriber(args[0], parseInt(args[1], 10));
              ws.send(JSON.stringify({ type: 'sended', message: `Command sent to ${deviceId}` }));
              break;
            }
            if (device instanceof COMClient){
              await device.sendCommand(value);
              ws.send(JSON.stringify({ type: 'sended', message: `Command sent to ${deviceId}` }));
              break;
            }
            
          
          case 'receive-value':
            if (device instanceof TcpClient){
              const data = await device.receiveData();
              ws.send(JSON.stringify({ type: 'receive-value', deviceId, data }));
              break;
            };
            if (device instanceof SNMPClient){
              const data0 = await device.getFromBase(command);
              const data1 = await device.getFromSubscriber(command);
              
              ws.send(JSON.stringify({ type: 'receive-value', base: `Base answer ${data0}`, Sub: `Sub answer ${data1}`}));
              break;
            }
            if (device instanceof COMClient){
              const data = await device.receiveData();
              ws.send(JSON.stringify({ type: 'receive-value', message: `M3M answer ${data}` }));
              break;
            }
          

          case 'express-test':
            const testtest1 = new ExpressTest(30, 30, 0.7, 8.7, 1.32, 1.65, 2.27, 60, 10);
            const eresult = await testtest1.setBandwidth();
            // const eresult = true;
            console.log(eresult);
            if (eresult) {
              await testtest1.test();              
            }

            break;

          case 'full-test':
            const testtest2 = new FullTest(30, 30, 0.7, 8.7, 1.32, 1.65, 2.27, 60, 20);
            const eresultq = await testtest2.setBandwidth();
            // const eresultq = true;
            console.log(eresultq);
            if (eresultq) {
              await testtest2.test();              
            }

            break;

          
          case "att-test":
            const responseatt: any = { type: 'is-connected' };
            while (true) {
              
              const result = await tcpClient.checkConnect();
              if (typeof result === 'boolean') {
                responseatt.pingAtt = result;
              }
              ws.send(JSON.stringify(responseatt));
              await delay(3500);
            }
            
            break;


          case 'queue-test':
            const testtestq1 = new ExpressTest(30, 30, 0.7, 8.7, 1.32, 1.65, 2.27, 60, 10);
            const testtestq3 = new ExpressTest(30, 30, 0.7, 8.7, 1.32, 1.65, 2.27, 60, 10);
            const testtestq2 = new FullTest(30, 30, 0.7, 8.7, 1.32, 1.65, 2.27, 60, 10);
            queue.addTest(testtestq1);
            queue.addTest(testtestq1);
            queue.addTest(testtestq3);
            queue.addTest(testtestq2);
            queue.showContent();
            queue.removeTest(1);
            queue.showContent();
            //const resultq = await testtestq1.setBandwidth()
            const resultq = true;
            console.log(resultq);
            // if (resultq) {
            //   queue.start();
            // }
            break;

          case 'fuck-go-back':
            queue.stop();
            break;

          case 'fuck-go-forward':
            queue.start();
            break;


          case 'disconnect':
            device.disconnect();
            ws.send(JSON.stringify({ type: 'disconnect', deviceId }));
            break;

          case 'is-connected':

            const response: any = { type: 'is-connected' };


            if (ber){
              const device = devices['Ber'];
              const result = await device.checkConnect();
              if (typeof result === 'boolean') {
                response.pingBert = result;
              }
            }
            if (att){
              const device = devices['Att'];
              const result = await device.checkConnect();
              if (typeof result === 'boolean') {
                response.pingAtt = result;
              }
            }
            if (stat){
              const device = devices['Stat'];
              const result = await device.checkConnect();
              if (Array.isArray(result)) {
                  const [pingStat0, pingStat1] = result;
                  response.pingStat0 = pingStat0;
                  response.pingStat1 = pingStat1;
              }
            }
            if (m3m){
              const device = devices['M3M'];
              const result = await device.checkConnect();
              if (typeof result === 'boolean') {
                response.pingM3M = result;
              }
            }

            ws.send(JSON.stringify(response));
            break;

          default:
            ws.send(JSON.stringify({ type: 'error', message: 'Unknown command' }));
        }
      } catch (err) {
        ws.send(JSON.stringify({ type: 'error', message: 'ws error' }));
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });

  console.log(`WebSocket server is set up and running.`);

}


export function queueBroadcast(queue: string, data: any) {
  if (!wss) {
    console.error("WebSocket server is not set up");
    return;
  }

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ queue, "message": data }));
    }
  });
}

export function broadcaster(data: any) {
  if (!wss) {
    console.error("WebSocket server is not set up");
    return;
  }

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

