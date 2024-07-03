import { ExpressTest } from './expresstest.logic';
import { FullTest } from './fulltest.logic';
import { queueBroadcast } from '../ws.server';

export class Queue {
    private queue: (FullTest | ExpressTest)[] = [];
    private running: boolean = false;
    private stopRequested: boolean = false;
    
    
    public addTest(test: FullTest | ExpressTest): void {
        
        if (!this.queue.includes(test)) {
            this.queue.push(test);
            queueBroadcast("complete", `now you have ${this.queue.length} tests in queue`);
        } else {
            queueBroadcast("warn", "test already in queue");
        }

    }
    
    public showContent() {
        const queueDescriptions = this.getQueueDescriptions();
        queueBroadcast("content", JSON.stringify(queueDescriptions));

    }

    private getQueueDescriptions(): { name: string; duration: number; bandwidth: number; offset: number; baseAtt: number; }[] {
        return this.queue.map(test => test.jsonParser());
    }

    public async start(): Promise<void> {

        if (this.running) {
            queueBroadcast("warn", "test already running");
            return;
        }

        this.stopRequested = false;
        this.running = true;
        queueBroadcast("start", "starting test queue");
        this.runNext();



    }

    public stop(): void {
        if (!this.running) {
          queueBroadcast("warn", "Test queue is not running.");
          return;
        }
    
        this.stopRequested = true;
        this.running = false;
        queueBroadcast("stop", "stoping test queue");
      }

    private async runNext(): Promise<void> {
        if (this.queue.length == 0 || this.stopRequested) {
            return;
        }
    
        const nextTest = this.queue.shift();
        if (nextTest) {
            await nextTest.test();
            this.runNext();
        }
    }

}

export const queue = new Queue();
