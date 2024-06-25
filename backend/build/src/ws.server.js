"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcast = exports.setupWebSocketServer = void 0;
const ws_1 = __importDefault(require("ws"));
// import { Device } from './interfaces/device.interface';
const att_service_1 = require("./services/att.service");
const bert_service_1 = require("./services/bert.service");
const stantion_service_1 = require("./services/stantion.service");
const m3m_service_1 = require("./services/m3m.service");
const expresstest_logic_1 = require("./logic/expresstest.logic");
const main_logic_1 = require("./logic/main.logic");
require("dotenv/config");
const devices = {
    'attenuator': att_service_1.tcpClient,
    'bercut': bert_service_1.sshClient,
    'stat': stantion_service_1.snmpClient,
    'm3m': m3m_service_1.comClient,
};
let wss;
function setupWebSocketServer(server) {
    wss = new ws_1.default.Server({ server });
    wss.on('connection', (ws) => {
        console.log('Client connected');
        ws.on('message', (message) => __awaiter(this, void 0, void 0, function* () {
            const parsedMessage = JSON.parse(message);
            const { type, deviceId, command, value, ber, att, stat, M3M, filename, path } = parsedMessage;
            const device = devices[deviceId] || 'connectChecker';
            if (!device) {
                ws.send(JSON.stringify({ type: 'error', message: `Device ${deviceId} not found` }));
                return;
            }
            try {
                // большая часть команд является отладочными и не будет использоваться в конечном продукте
                switch (type) {
                    // case 'stat-ip-switch':
                    case 'set-path':
                        (0, main_logic_1.setPathName)(path, filename);
                        ws.send(JSON.stringify({ "path": (path + "/" + filename + ".xlsx").toString() }));
                        break;
                    case 'connect':
                        const conStatus = yield device.connect();
                        ws.send(JSON.stringify({ type: 'connect', deviceId, conStatus }));
                        break;
                    case 'send-command':
                        if (value === undefined && command === undefined) {
                            ws.send(JSON.stringify({ type: 'error', message: 'Command or attValue is required' }));
                            return;
                        }
                        if (device instanceof att_service_1.TcpClient) {
                            yield device.sendCommand(value);
                            ws.send(JSON.stringify({ type: 'sended', message: `Command sent to ${deviceId}` }));
                            break;
                        }
                        if (device instanceof bert_service_1.SSHClient) {
                            const data = yield device.sendCommand(command);
                            ws.send(JSON.stringify({ type: 'sended', message: `Bercut answer ${data}` }));
                            break;
                        }
                        if (device instanceof stantion_service_1.SNMPClient) {
                            let args = command.split(" ");
                            const deviseRes = yield device.setToBase(args[0], parseInt(args[1], 10));
                            ws.send(JSON.stringify({ type: 'sended', message: `Command sent to ${deviceId}` }));
                            break;
                        }
                        if (device instanceof m3m_service_1.COMClient) {
                            yield device.sendCommand(value);
                            ws.send(JSON.stringify({ type: 'sended', message: `Command sent to ${deviceId}` }));
                            break;
                        }
                    case 'receive-value':
                        if (device instanceof att_service_1.TcpClient) {
                            const data = yield device.receiveData();
                            ws.send(JSON.stringify({ type: 'receive-value', deviceId, data }));
                            break;
                        }
                        ;
                        if (device instanceof stantion_service_1.SNMPClient) {
                            const data0 = yield device.getFromBase(command);
                            const data1 = yield device.getFromSubscriber(command);
                            ws.send(JSON.stringify({ type: 'receive-value', base: `Base answer ${data0}`, Sub: `Sub answer ${data1}` }));
                            break;
                        }
                        if (device instanceof m3m_service_1.COMClient) {
                            const data = yield device.receiveData();
                            ws.send(JSON.stringify({ type: 'receive-value', message: `M3M answer ${data}` }));
                            break;
                        }
                    case 'express-test':
                        const testtest = new expresstest_logic_1.ExpressTest(30, 30, 0.7, 8.7, 1.32, 1.65, 2.27, 60);
                        testtest.test();
                        break;
                    case 'disconnect':
                        device.disconnect();
                        ws.send(JSON.stringify({ type: 'disconnect', deviceId }));
                        break;
                    case 'is-connected':
                        const response = { type: 'is-connected' };
                        if (ber) {
                            const device = devices['bercut'];
                            const result = yield device.checkConnect();
                            if (typeof result === 'boolean') {
                                response.pingBert = result;
                            }
                        }
                        if (att) {
                            const device = devices['attenuator'];
                            const result = yield device.checkConnect();
                            if (typeof result === 'boolean') {
                                response.pingAtt = result;
                            }
                        }
                        if (stat) {
                            const device = devices['stat'];
                            const result = yield device.checkConnect();
                            if (Array.isArray(result)) {
                                const [pingStat0, pingStat1] = result;
                                response.pingStat0 = pingStat0;
                                response.pingStat1 = pingStat1;
                            }
                        }
                        if (M3M) {
                            const device = devices['m3m'];
                            const result = yield device.checkConnect();
                            if (typeof result === 'boolean') {
                                response.pingM3M = result;
                            }
                        }
                        ws.send(JSON.stringify(response));
                        break;
                    default:
                        ws.send(JSON.stringify({ type: 'error', message: 'Unknown command' }));
                }
            }
            catch (err) {
                ws.send(JSON.stringify({ type: 'error', message: 'ws error' }));
            }
        }));
        ws.on('close', () => {
            console.log('Client disconnected');
        });
    });
    console.log(`WebSocket server is set up and running.`);
}
exports.setupWebSocketServer = setupWebSocketServer;
const broadcast = (testId, data) => {
    if (!wss) {
        console.error("WebSocket server is not set up");
        return;
    }
    wss.clients.forEach(client => {
        if (client.readyState === ws_1.default.OPEN) {
            client.send(JSON.stringify({ testId, "message": data }));
        }
    });
};
exports.broadcast = broadcast;
