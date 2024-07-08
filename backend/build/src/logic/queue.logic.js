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
            (0, ws_server_1.queueBroadcast)("complete", `now you have ${this.queue.length} tests in queue`);
        }
        else {
            (0, ws_server_1.queueBroadcast)("warn", "test already in queue");
        }
    }
    showContent() {
        const queueDescriptions = this.getQueueDescriptions();
        (0, ws_server_1.queueBroadcast)("content", queueDescriptions);
    }
    removeTest(index) {
        if (index >= 0 && index < this.queue.length) {
            const removedTest = this.queue.splice(index, 1)[0];
            (0, ws_server_1.queueBroadcast)("removed", "test removed");
        }
        else {
            (0, ws_server_1.queueBroadcast)("warn", "invalid index");
        }
    }
    getQueueDescriptions() {
        return this.queue.map(test => test.jsonParser());
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.running) {
                (0, ws_server_1.queueBroadcast)("warn", "test already running");
                return;
            }
            this.stopRequested = false;
            this.running = true;
            (0, ws_server_1.queueBroadcast)("start", "starting test queue");
            this.runNext();
        });
    }
    stop() {
        if (!this.running) {
            (0, ws_server_1.queueBroadcast)("warn", "Test queue is not running.");
            return;
        }
        this.stopRequested = true;
        this.running = false;
        (0, ws_server_1.queueBroadcast)("stop", "stoping test queue");
    }
    runNext() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.queue.length == 0 || this.stopRequested) {
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
