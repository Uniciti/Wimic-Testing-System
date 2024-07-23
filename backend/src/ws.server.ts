import WebSocket from "ws";
// import { Device } from './interfaces/device.interface';
import { tcpClient, TcpClient } from "./services/att.service";
import { sshClient, SSHClient } from "./services/bert.service";
import { snmpClient, SNMPClient } from "./services/stantion.service";
import { comClient, COMClient } from "./services/m3m.service";
import { mongoClient, MongoClient } from "./services/db.service";

import { ExpressTest } from "./logic/expresstest.logic";
import { FullTest } from "./logic/fulltest.logic";
import { queue, Queue } from "./logic/queue.logic";
import { delay, getPower, setFreq } from "./logic/main.logic";

import "dotenv/config";

const devices: {
  [key: string]: TcpClient | SSHClient | SNMPClient | COMClient;
} = {
  Att: tcpClient,
  Ber: sshClient,
  Stat: snmpClient,
  M3M: comClient,
};

let wss: WebSocket.Server;

export function setupWebSocketServer(server: any) {
  wss = new WebSocket.Server({ server });
  wss.on("connection", (ws: WebSocket) => {
    console.log("Client connected");

    ws.on("message", async (message: string) => {
      try {
        const parsedMessage = JSON.parse(message);
        const { type, deviceId, command, value, ber, att, stat, m3m, params } =
          parsedMessage;
        console.log(parsedMessage);
        // console.log(parsedMessage.type);
        // console.log(parsedMessage.params);
        // console.log(parsedMessage.params[0].modulation);
        // console.log(parsedMessage.params[1].modulation);
        // console.log(parsedMessage.params[0].frequncy);
        // console.log(parsedMessage.params[1]);
        // console.log(parsedMessage.command);
        // console.log(parsedMessage.command[0]);
        // console.log(parsedMessage.command.pa1);
        const device = devices[deviceId] || "connectChecker";

        if (!device) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: `Device ${deviceId} not found`,
            })
          );

          return;
        }
        // большая часть команд является отладочными и не будет использоваться в конечном продукте
        switch (type) {
          // case 'stat-ip-switch':

          // case 'set-path':
          //   setPathName(path, filename);
          //   ws.send(JSON.stringify({ "path": (path + "/" + filename + ".xlsx").toString() }));
          //   break;

          case "changeFrequency":
            await setFreq(command.frequency);
            broadcaster(JSON.stringify({ status: "sended" }));
            // await validator();
            break;

          case "changeIP":
            snmpClient.changeIp(command.baseIP, command.abonentIP);
            await delay(300);
            // broadcaster(JSON.stringify({type: 'sended'}));
            broadcaster(
              JSON.stringify({
                status: "sended",
                type: "is-connected",
                pingStat0: false,
                pingStat1: false,
              })
            );
            // await validator();
            break;

          case "test":
            let modList: number[];
            for (const test of params) {
              modList = [];

              for (const modul of test.modulation) {
                modList.push(modul.value);
              }

              let frequency: number = 0;
              if (test.frequency != "none") {
                frequency = test.frequency;
              }

              if (test.type == "expresstest") {
                queue.addTest(
                  new ExpressTest(
                    command.Attenuator_PA1,
                    command.Attenuator_PA2,
                    command.splitter_straight,
                    command.splitterM3M,
                    command.cable1,
                    command.cable2,
                    command.cable3,
                    parseInt(test.time),
                    parseInt(test.bandwidth),
                    frequency,
                    modList.reverse()
                  )
                );
              } else if (test.type == "fulltest") {
                queue.addTest(
                  new FullTest(
                    command.Attenuator_PA1,
                    command.Attenuator_PA2,
                    command.splitter_straight,
                    command.splitterM3M,
                    command.cable1,
                    command.cable2,
                    command.cable3,
                    parseInt(test.time),
                    parseInt(test.bandwidth),
                    frequency,
                    modList.reverse()
                  )
                );
              } else {
                console.log("Cant find this test pattern");
              }
            }
            // queue.showContent();

            await delay(300);
            queue.start();

            break;

          case "connect":
            const conStatus = await device.connect();
            ws.send(JSON.stringify({ type: "connect", deviceId, conStatus }));
            break;

          case "get-data":
            await mongoClient.connect();
            broadcaster(
              JSON.stringify({
                action: "database",
                tableData: await mongoClient.getByDate(command),
              })
            );
            await mongoClient.disconnect();
            break;

          // case "get-test":
          //   await mongoClient.connect();
          //   const table = await mongoClient.getByDate("2024-07-19", "15:13");
          //   console.log(table);
          //   console.log(table ? table[0] : null);
          //   console.log(table ? table[0].data[0] : null);
          //   await mongoClient.deleteTest("2024-07-19", "15:13");
          //   const table1 = await mongoClient.getByDate("2024-07-19", "15:13");
          //   console.log(table1);
          //   console.log(table1 ? table1[0] : null);
          //   console.log(table1 ? table1[0].data[0] : null);
          //   await mongoClient.disconnect();

          //   break;

          // case "stat-test":
          //   const ver = await snmpClient.getFromSubscriber(
          //     "1.3.6.1.4.1.19707.7.7.2.1.3.99.0"
          //   );
          //   console.log(ver);
          //   console.log(ver > "2.7.6");
          //   console.log(ver > "2.7.4");
          //   console.log(ver < "2.8.6");
          //   console.log(ver < "2.8.4");
          //   console.log(typeof ver);
          //   break;

          // case "stat-ban1":
          //   snmpClient.setToBase("1.3.6.1.4.1.19707.7.7.2.1.4.56.0", 3);
          //   console.log("t11");
          //   await delay(1000);
          //   snmpClient.setToSubscriber("1.3.6.1.4.1.19707.7.7.2.1.4.56.0", 3);
          //   console.log("t12");
          //   await delay(4000);

          //   snmpClient.setToBase("1.3.6.1.4.1.19707.7.7.2.1.4.102.0", 1);
          //   snmpClient.setToSubscriber("1.3.6.1.4.1.19707.7.7.2.1.4.102.0", 1);
          //   await delay(4000);

          //   break;

          // case "stat-ban2":
          //   snmpClient.setToBase("1.3.6.1.4.1.19707.7.7.2.1.4.56.0", 5);
          //   console.log("t21");
          //   await delay(1000);
          //   snmpClient.setToSubscriber("1.3.6.1.4.1.19707.7.7.2.1.4.56.0", 5);
          //   console.log("t22");
          //   await delay(4000);

          //   snmpClient.setToBase("1.3.6.1.4.1.19707.7.7.2.1.4.102.0", 1);
          //   snmpClient.setToSubscriber("1.3.6.1.4.1.19707.7.7.2.1.4.102.0", 1);
          //   await delay(4000);

          //   break;

          // case "test-m3m":
          //   const pullman = await comClient.receiveData();
          //   const pullman2 = await getPower(16500);
          //   console.log(pullman);
          //   console.log(pullman2);
          //   break;

          // case "fuck-go-back":
          //   queue.stop();
          //   break;

          // case "fuck-go-forward":
          //   queue.start();
          //   break;

          case "disconnect":
            device.disconnect();
            ws.send(JSON.stringify({ type: "disconnect", deviceId }));
            break;

          case "is-connected":
            const response: any = { type: "is-connected" };

            if (ber) {
              const device = devices["Ber"];
              const result = await device.checkConnect();
              if (typeof result === "boolean") {
                response.pingBert = result;
              }
            }
            if (att) {
              const device = devices["Att"];
              const result = await device.checkConnect();
              if (typeof result === "boolean") {
                response.pingAtt = result;
              }
            }
            if (stat) {
              const device = devices["Stat"];
              const result = await device.checkConnect();
              if (Array.isArray(result)) {
                const [pingStat0, pingStat1] = result;
                response.pingStat0 = pingStat0;
                response.pingStat1 = pingStat1;
              }
            }
            if (m3m) {
              const device = devices["M3M"];
              const result = await device.checkConnect();
              if (typeof result === "boolean") {
                response.pingM3M = result;
              }
            }

            ws.send(JSON.stringify(response));
            break;

          default:
            ws.send(
              JSON.stringify({ type: "error", message: "Unknown command" })
            );
        }
      } catch (err) {
        ws.send(JSON.stringify({ type: "error", message: "ws error" }));
      }
    });

    ws.on("close", () => {
      console.log("Client disconnected");
    });
  });

  console.log(`WebSocket server is set up and running.`);
}

export function broadcaster(data: any) {
  if (!wss) {
    console.error("WebSocket server is not set up");
    return;
  }

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      console.log(data);
      client.send(data);
    }
  });
}
