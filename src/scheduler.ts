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
  label(): string {
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
