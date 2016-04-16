export interface Scheduler {
  timeLimit: number;
  heapLimit: number;
  label(): string;
  onStart(time: number, heap: number): void;
  onHeapLimit(time: number, heap: number): boolean;
  onTimeLimit(time: number, heap: number): boolean;
  onGarbageCollection(time: number, duration: number,
                      heapBefore: number, heapAfter: number): void;
}

class FactorBasedScheduler {
  timeLimit: number;
  heapLimit: number;
  factor: number;
  constructor(factor: number) {
    this.timeLimit = 0;
    this.heapLimit = 0;
    this.factor = factor;
  }
  label() {
    return "Factor Based (" + this.factor.toString() + ")";
  }
  onStart(time: number, heap: number): void {
    this.timeLimit = 0;
    this.heapLimit = Math.max(30000, heap * this.factor);
  }
  onHeapLimit(time: number, heap: number): boolean {
    return true;
  }
  onTimeLimit(time: number, heap: number): boolean {
    throw "unreachable";
  }
  onGarbageCollection(time: number, duration: number,
                      heapBefore: number, heapAfter: number): void {
    this.heapLimit = heapAfter * this.factor;
  }
}

class PeriodicScheduler {
  timeLimit: number;
  heapLimit: number;
  period: number;
  constructor(period: number) {
    this.timeLimit = 0;
    this.heapLimit = 0;
    this.period = period;
  }
  label() {
    return "Periodic (" + this.period.toString() + ")";
  }
  onStart(time: number, heap: number): void {
    this.timeLimit = time + this.period;
    this.heapLimit = 0;
  }
  onHeapLimit(time: number, heap: number): boolean {
    throw "unreachable";
  }
  onTimeLimit(time: number, heap: number): boolean {
    return true;
  }
  onGarbageCollection(time: number, duration: number,
                      heapBefore: number, heapAfter: number): void {
    this.timeLimit = time + this.period;
  }
}

class BytesAndDuration {
  bytes: number;
  duration: number;
  constructor(bytes: number, duration: number) {
    this.bytes = bytes;
    this.duration = duration;
  }
}

class ThroughputTracker {
  buffer: BytesAndDuration[];
  bufferSize: number;
  constructor(bufferSize: number) {
    this.buffer = [];
    this.bufferSize = bufferSize;
  }
  add(bytes: number, duration: number): void {
    this.buffer.push(new BytesAndDuration(bytes, duration));
    if (this.buffer.length > this.bufferSize) {
      this.buffer = this.buffer.slice(1);
    }
  }
  throughput(time: number) {
    const initial = 10000;
    let sumBytes = 0;
    let sumDuration = 0;
    for (let i = 0; i < this.buffer.length; i++) {
      sumBytes += this.buffer[i].bytes;
      sumDuration += this.buffer[i].duration;
      if (sumDuration >= time) break;
    }
    if (sumDuration == 0) return initial;
    return sumBytes / sumDuration
  }
}

class ThroughputBasedScheduler {
  timeLimit: number;
  heapLimit: number;
  period: number;
  factor: number;
  allocations: ThroughputTracker;
  collections: ThroughputTracker;
  lastHeap: number;
  lastTime: number;
  constructor() {
    this.timeLimit = 0;
    this.heapLimit = 0;
    this.period = 1000;
    this.factor = 1.5;
    this.allocations = new ThroughputTracker(10);
    this.collections = new ThroughputTracker(10);
    this.lastHeap = 0;
    this.lastTime = 0;
  }
  label(): string {
    return "ThroughputBased";
  }
  onStart(time: number, heap: number): void {
    this.timeLimit = time + this.period;
    this.heapLimit = Math.max(heap * this.factor, 1000);
    this.lastHeap = heap;
    this.lastTime = time;
  }
  onHeapLimit(time: number, heap: number): boolean {
    this.allocations.add(heap - this.lastHeap, time - this.lastTime);
    this.lastHeap = heap;
    this.lastTime = time;
    return true;
  }
  onTimeLimit(time: number, heap: number): boolean {
    this.allocations.add(heap - this.lastHeap, time - this.lastTime);
    this.timeLimit = time + this.period;
    this.lastHeap = heap;
    this.lastTime = time;
    return false;
  }
  onGarbageCollection(time: number, duration: number,
                      heapBefore: number, heapAfter: number): void {
    this.timeLimit = time + this.period;
    this.heapLimit = Math.max(heapAfter * this.factor, 1000);
    this.lastHeap = heapAfter;
    this.lastTime = time;
    this.collections.add(heapBefore, duration);
  }
}

class TimeBasedScheduler {
  timeLimit: number;
  heapLimit: number;
  period: number;
  constructor(period: number) {
    this.timeLimit = 0;
    this.heapLimit = 0;
    this.period = period;
  }
  label(): string {
    return "Time Based (" + this.period.toString() + ")";
  }
  onStart(time: number, heap: number): void {
    this.timeLimit = time + this.period;
    this.heapLimit = 0;
  }
  onHeapLimit(time: number, heap: number): boolean {
    throw "unreachable";
  }
  onTimeLimit(time: number, heap: number): boolean {
    return true;
  }
  onGarbageCollection(time: number, duration: number,
                      heapBefore: number, heapAfter: number): void {
    let survived = heapAfter / heapBefore * 100;
    if (survived > 90) {
      this.period = this.period * 2;
    } else if (survived > 70) {
      this.period = this.period * 1.5;
    } else if (survived < 30) {
      this.period = this.period * 0.75;
    }
    this.timeLimit = time + this.period;
  }
}

export function factorBased(factor: number) {
  return new FactorBasedScheduler(factor);
}

export function periodic(period: number) {
  return new PeriodicScheduler(period);
}

export function timeBased(period: number) {
  return new TimeBasedScheduler(period);
}

export function throughputBased() {
  return new ThroughputBasedScheduler();
}
