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
import { setConsts, getConsts } from "./logic/consts.logic";

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
        const {
          type,
          deviceId,
          command,
          ber,
          att,
          stat,
          m3m,
          params,
          model,
          modulations,
        } = parsedMessage;
        const device = devices[deviceId] || "connectChecker";

        if (!device) {
          broadcaster(
            JSON.stringify({
              type: "error",
              message: `Device ${deviceId} not found`,
            })
          );

          return;
        }
        switch (type) {

          case "changeFrequency":
            await setFreq(command.frequency);
            broadcaster(JSON.stringify({ status: "sended" }));
            break;

          case "changeIP":
            snmpClient.changeIp(command.baseIP, command.abonentIP);
            await delay(300);
            broadcaster(
              JSON.stringify({
                status: "sended",
                type: "is-connected",
                pingStat0: false,
                pingStat1: false,
              })
            );
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
            await delay(300);
            queue.start();

            break;

          case "connect":
            const conStatus = await device.connect();
            broadcaster(JSON.stringify({ type: "connect", deviceId, conStatus }));
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

          case "set-settings":
            setConsts(model, modulations);
            broadcaster(JSON.stringify({ settings: "set-ok" }));
            break;

          case "get-settings":
            const [res, ver] = getConsts();
            broadcaster(
              JSON.stringify({
                settings: "get-settings",
                version: ver,
                data: res,
              })
            );
            break;
          
          case "disconnect":
            device.disconnect();
            broadcaster(JSON.stringify({ type: "disconnect", deviceId }));
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

            broadcaster(JSON.stringify(response));
            break;

          default:
            broadcaster(JSON.stringify({ type: "error", message: "Unknown command" }));
        }
      } catch (err) {
        broadcaster(JSON.stringify({ type: "error", message: "ws error" }));
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
      client.send(data);
    }
  });
}
