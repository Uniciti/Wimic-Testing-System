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
exports.snmpClient = exports.SNMPClient = void 0;
const net_snmp_1 = __importDefault(require("net-snmp"));
const ping_1 = __importDefault(require("ping"));
const BASE_HOST = process.env.BASE_HOST || '172.16.17.173';
const SUBSCRIBER_HOST = process.env.SUBSCRIBER_HOST || '172.16.17.84';
const SNMP_COMMUNITY = process.env.SNMP_COMMUNITY || 'public';
// const SNMP_VERSION = process.env.SNMP_VERSION || '2c';
class SNMPClient {
    constructor(baseHost, subscriberHost, community) {
        this.baseSession = null;
        this.subscriberSession = null;
        this.community = community;
        this.version = net_snmp_1.default.Version.snmp2c;
        this.baseHost = baseHost;
        this.subscriberHost = subscriberHost;
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.baseSession = net_snmp_1.default.createSession(this.baseHost, this.community, { version: this.version });
                this.subscriberSession = net_snmp_1.default.createSession(this.subscriberHost, this.community, { version: this.version });
                const [res0, res1] = yield this.checkConnect();
                return res0 && res1;
            }
            catch (error) {
                console.error(`Failed to create SNMP sessions: ${error}`);
                this.baseSession = null;
                this.subscriberSession = null;
                return false;
            }
        });
    }
    changeIp(baseHost, subscriberHost) {
        this.baseHost = baseHost;
        this.subscriberHost = subscriberHost;
        this.connect();
    }
    checkConnect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const res0 = yield ping_1.default.promise.probe(this.baseHost);
                const res1 = yield ping_1.default.promise.probe(this.subscriberHost);
                return [res0.alive && (this.baseSession != null), res1.alive && (this.subscriberSession != null)];
            }
            catch (error) {
                console.error(`Ping error: ${error}`);
                return [false, false];
            }
        });
    }
    // public async checkBaseConnect(): Promise<boolean> {
    //   return this.checkConnect(this.baseHost);
    // }
    // public async checkSubscriberConnect(): Promise<boolean> {
    //   return this.checkConnect(this.subscriberHost);
    // }
    getFromBase(oid) {
        if (!this.baseSession) {
            return Promise.reject('Base session is not established');
        }
        return this.get(this.baseSession, oid);
    }
    getFromSubscriber(oid) {
        if (!this.subscriberSession) {
            return Promise.reject('Subscriber session is not established');
        }
        return this.get(this.subscriberSession, oid);
    }
    setToBase(oid, value) {
        if (!this.baseSession) {
            return Promise.reject('Base session is not established');
        }
        return this.set(this.baseSession, oid, value);
    }
    setToSubscriber(oid, value) {
        if (!this.subscriberSession) {
            return Promise.reject('Subscriber session is not established');
        }
        return this.set(this.subscriberSession, oid, value);
    }
    get(session, oid) {
        return new Promise((resolve, reject) => {
            session.get([oid], (error, varbinds) => {
                if (error) {
                    return reject(error);
                }
                for (const varbind of varbinds) {
                    if (net_snmp_1.default.isVarbindError(varbind)) {
                        reject(net_snmp_1.default.varbindError(varbind));
                    }
                    else {
                        resolve(varbind.value.toString());
                    }
                }
            });
        });
    }
    set(session, oid, value) {
        return new Promise((resolve, reject) => {
            const varbind = {
                oid: oid,
                type: typeof value === 'number' ? net_snmp_1.default.ObjectType.Integer : net_snmp_1.default.ObjectType.OctetString,
                value: value
            };
            session.set([varbind], (error, varbinds) => {
                if (error) {
                    return reject(error);
                }
                resolve();
            });
        });
    }
    disconnect() {
        if (this.baseSession) {
            this.baseSession.close();
            this.baseSession = null;
        }
        if (this.subscriberSession) {
            this.subscriberSession.close();
            this.subscriberSession = null;
        }
    }
}
exports.SNMPClient = SNMPClient;
// , version: snmp.Version , snmp.Version[`${SNMP_VERSION}`] type: snmp.ObjectType, 
exports.snmpClient = new SNMPClient(BASE_HOST, SUBSCRIBER_HOST, SNMP_COMMUNITY);
