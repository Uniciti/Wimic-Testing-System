import { ExpressTest } from './expresstest.logic';
import { FullTest } from './fulltest.logic';
import { broadcaster } from '../ws.server';

export class Queue {
    private queue: (FullTest | ExpressTest)[] = [];
    private running: boolean = false;
    private stopRequested: boolean = false;
    
    
    public addTest(test: FullTest | ExpressTest): void {
        
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

    private getQueueDescriptions(): { name: string; duration: number; bandwidth: number; offset: number; baseAtt: number; }[] {
        return this.queue.map(test => test.jsonParser());
    }

    public async start(): Promise<void> {

        if (this.running) {
            broadcaster(JSON.stringify({type: "warn", message: "test already running"}));
            return;
        }

        broadcaster(JSON.stringify({type: "sended", test: "queue"}));
        this.stopRequested = false;
        this.running = true;
        
        this.runNext();



    }

    public stop(): void {
        if (!this.running) {
            broadcaster(JSON.stringify({type: "warn", message: "Test queue is not running."}));
            return;
        }
    
        this.stopRequested = true;
        this.running = false;
        broadcaster(JSON.stringify({type: "stop", message: "stoping test queue"}));
      }

    private async runNext(): Promise<void> {
        if (this.queue.length == 0 || this.stopRequested) {
            broadcaster(JSON.stringify({type: "stop", status: "completed"}));
            this.running = false;
            return;
        }
    
        const nextTest = this.queue.shift();
        if (nextTest) {
            const result = await nextTest.setBandwidth();
            if (result) {
                await nextTest.test();
                this.runNext();
            }
        }
    }

}

export const queue = new Queue();
