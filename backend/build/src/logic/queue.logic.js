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
Object.defineProperty(exports, "__esModule", { value: true });
exports.queue = exports.Queue = void 0;
const ws_server_1 = require("../ws.server");
class Queue {
    constructor() {
        this.queue = [];
        this.running = false;
        this.stopRequested = false;
    }
    addTest(test) {
        if (!this.queue.includes(test)) {
            this.queue.push(test);
            // queueBroadcast("complete", `now you have ${this.queue.length} tests in queue`);
        }
    }
    // public showContent() {
    //     const queueDescriptions = this.getQueueDescriptions();
    //     console.log(queueDescriptions);
    //     queueBroadcast("content", queueDescriptions);
    // }
    // public removeTest(index: number): void {
    //     if (index >= 0 && index < this.queue.length) {
    //         const removedTest = this.queue.splice(index, 1)[0];
    //         queueBroadcast("removed", "test removed");
    //     } else {
    //         queueBroadcast("warn", "invalid index");
    //     }
    // }
    getQueueDescriptions() {
        return this.queue.map(test => test.jsonParser());
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.running) {
                (0, ws_server_1.broadcaster)(JSON.stringify({ type: "warn", message: "test already running" }));
                return;
            }
            (0, ws_server_1.broadcaster)(JSON.stringify({ type: "sended", test: "queue" }));
            this.stopRequested = false;
            this.running = true;
            this.runNext();
        });
    }
    stop() {
        if (!this.running) {
            (0, ws_server_1.broadcaster)(JSON.stringify({ type: "warn", message: "Test queue is not running." }));
            return;
        }
        this.stopRequested = true;
        this.running = false;
        (0, ws_server_1.broadcaster)(JSON.stringify({ type: "stop", message: "stoping test queue" }));
    }
    runNext() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.queue.length == 0 || this.stopRequested) {
                (0, ws_server_1.broadcaster)(JSON.stringify({ type: "stop", status: "completed" }));
                this.running = false;
                return;
            }
            const nextTest = this.queue.shift();
            if (nextTest) {
                const result = yield nextTest.setBandwidth();
                if (result) {
                    yield nextTest.test();
                    this.runNext();
                }
            }
        });
    }
}
exports.Queue = Queue;
exports.queue = new Queue();
