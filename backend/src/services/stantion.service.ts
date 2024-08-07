import snmp from "net-snmp";
import { Buffer } from "buffer";
import ping from "ping";

const BASE_HOST = process.env.BASE_DEFAULT!;
const SUBSCRIBER_HOST = process.env.SUBS_DEFAULT!;
const SNMP_COMMUNITY = process.env.SNMP_COMMUNITY || "public";
// const SNMP_VERSION = process.env.SNMP_VERSION || '2c';

export class SNMPClient {
  private baseHost: string;
  private subscriberHost: string;
  private baseSession: snmp.Session | null = null;
  private subscriberSession: snmp.Session | null = null;
  private community: string;
  private version: snmp.Version;

  constructor(baseHost: string, subscriberHost: string, community: string) {
    this.community = community;
    this.version = snmp.Version.snmp2c;
    this.baseHost = baseHost;
    this.subscriberHost = subscriberHost;
  }

  public async connect(): Promise<boolean> {
    try {
      this.subscriberSession = snmp.createSession(
        this.subscriberHost,
        this.community,
        { version: this.version }
      );
      this.baseSession = snmp.createSession(this.baseHost, this.community, {
        version: this.version,
      });
      const [res0, res1] = await this.checkConnect();
      return res0 && res1;
    } catch (error) {
      console.error(`Failed to create SNMP sessions: ${error}`);
      this.baseSession = null;
      this.subscriberSession = null;
      return false;
    }
  }

  public changeIp(baseHost: string, subscriberHost: string): void {
    this.disconnect();
    this.baseHost = baseHost;
    this.subscriberHost = subscriberHost;
    // this.connect();
  }

  // public async checkConnect(): Promise<[boolean, boolean]> {
  //   try {
  //     const res0 = await ping.promise.probe(this.baseHost);
  //     const res1 = await ping.promise.probe(this.subscriberHost);
  //     return [res0.alive && (this.baseSession != null), res1.alive && (this.subscriberSession != null)];
  //   } catch (error) {
  //     console.error(`Ping error: ${error}`);
  //     return [false, false];
  //   }
  // }

  public async checkConnect(): Promise<[boolean, boolean]> {
    const maxAttempts = 5;
    const delayBetweenPings = 1000;

    const pingHost = async (host: string): Promise<boolean> => {
      const res = await ping.promise.probe(host);
      return res.alive;
    };

    try {
      let attempt = 0;
      let res0 = false;
      let res1 = false;

      while (attempt < maxAttempts) {
        if (!res0) {
          res0 = await pingHost(this.baseHost);
        }
        if (!res1) {
          res1 = await pingHost(this.subscriberHost);
        }

        if (res0 && res1) {
          break;
        }

        attempt++;
        await new Promise((resolve) => setTimeout(resolve, delayBetweenPings));
      }

      return [
        res0 && this.baseSession != null,
        res1 && this.subscriberSession != null,
      ];
    } catch (error) {
      console.error(`Ping error: ${error}`);
      return [false, false];
    }
  }
  // public async checkBaseConnect(): Promise<boolean> {
  //   return this.checkConnect(this.baseHost);
  // }

  // public async checkSubscriberConnect(): Promise<boolean> {
  //   return this.checkConnect(this.subscriberHost);
  // }

  public getFromBase(oid: string): Promise<string> {
    if (!this.baseSession) {
      return Promise.reject("Base session is not established");
    }
    return this.get(this.baseSession, oid);
  }

  public getFromSubscriber(oid: string): Promise<string> {
    if (!this.subscriberSession) {
      return Promise.reject("Subscriber session is not established");
    }
    return this.get(this.subscriberSession, oid);
  }

  public setToBase(oid: string, value: number): Promise<void> {
    if (!this.baseSession) {
      return Promise.reject("Base session is not established");
    }
    return this.set(this.baseSession, oid, value);
  }

  public setToSubscriber(oid: string, value: number): Promise<void> {
    if (!this.subscriberSession) {
      return Promise.reject("Subscriber session is not established");
    }
    return this.set(this.subscriberSession, oid, value);
  }

  private get(session: snmp.Session, oid: string): Promise<string> {
    return new Promise((resolve, reject) => {
      session.get([oid], (error, varbinds) => {
        if (error) {
          console.error(`SNMP SET error: ${error}`);
          return reject(error);
        }

        for (const varbind of varbinds) {
          if (snmp.isVarbindError(varbind)) {
            reject(snmp.varbindError(varbind));
          } else {
            if (varbind.type === snmp.ObjectType.Opaque) {
              const valueBuffer = varbind.value;
              if (Buffer.isBuffer(valueBuffer)) {
                const floatBuffer = valueBuffer.slice(-4);
                const floatValue = floatBuffer.readFloatBE(0);
                resolve(floatValue.toString());
              } else {
                console.error("Expected a Buffer for the opaque float value.");
              }
            } else {
              resolve(varbind.value.toString());
            }
          }
        }
      });
    });
  }

  private set(session: snmp.Session, oid: string, value: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const varbind = {
        oid: oid,
        type:
          typeof value === "number"
            ? snmp.ObjectType.Integer
            : snmp.ObjectType.OctetString,
        value: value,
      };

      session.set([varbind], (error, varbinds) => {
        if (error) {
          reject(error);
        }
      });

      resolve();
    });
  }

  public disconnect(): void {
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

// , version: snmp.Version , snmp.Version[`${SNMP_VERSION}`] type: snmp.ObjectType,

export const snmpClient = new SNMPClient(
  BASE_HOST,
  SUBSCRIBER_HOST,
  SNMP_COMMUNITY
);
