declare module 'net-snmp' {
  export interface Options {
    port?: number;
    retries?: number;
    timeout?: number;
    backoff?: number;
    transport?: string;
    trapPort?: number;
    version?: Version;
    idBitsSize?: number;
    context?: string;
    transportClass?: any;
  }

  export enum Version {
    snmp1 = 0,
    snmp2c = 1,
    snmp3 = 3
  }

  export interface Session {
    get(oids: string[], callback: (error: Error | null, varbinds: Varbind[]) => void): void;
    set(varbinds: Varbind[], callback: (error: Error | null, varbinds: Varbind[]) => void): void;
    close(): void;
  }

  export interface Varbind {
    oid: string;
    type: ObjectType;
    value: any;
  }

  export enum ObjectType {
    Boolean = 1,
    Integer = 2,
    OctetString = 4,
    Null = 5,
    OID = 6,
    IpAddress = 64,
    Counter = 65,
    Gauge = 66,
    TimeTicks = 67,
    Opaque = 68,
    NSAP = 69,
    Counter64 = 70,
    Uinteger32 = 71,
    NoSuchObject = 128,
    NoSuchInstance = 129,
    EndOfMibView = 130
  }

  export function createSession(target: string, community: string, options?: Options): Session;
  export function isVarbindError(varbind: Varbind): boolean;
  export function varbindError(varbind: Varbind): Error;
}