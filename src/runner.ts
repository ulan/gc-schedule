import Mutator = require("./mutator");
import Scheduler = require("./scheduler");

export class GarbageCollection {
  time: number;
  duration: number;
  heapBefore: number;
  heapAfter: number;
  constructor(time: number, duration: number, heapBefore: number, heapAfter: number) {
    this.time = time;
    this.duration = duration;
    this.heapBefore = heapBefore;
    this.heapAfter = heapAfter;
  }
}

export class Runner {
  mutator: Mutator.Mutator;
  scheduler: Scheduler.Scheduler;
  duration: number;
  time: number;
  timeLimit: number;
  timeInGC: number;
  heap: number;
  dead: number;
  heapLimit: number;
  timeOfHeapLimit: number;
  inGC: boolean;
  timeOfGC: number;
  durationOfGC: number;
  garbageCollections: GarbageCollection [];
  maxHeap: number;
  avgHeap: number;
  gcSpeed: number;
  floatingGarbage: number;
  floatingGarbageRatio: number;
  constructor(duration: number, gcSpeed: number, floatingGarbageRatio: number, mutator: Mutator.Mutator, scheduler: Scheduler.Scheduler) {
    this.mutator = mutator;
    this.scheduler = scheduler;
    this.duration = duration;
    this.time = 0;
    this.timeLimit = duration;
    this.timeInGC = 0;
    this.heap = 0;
    this.dead = 0;
    this.floatingGarbage = 0;
    this.heapLimit = 0;
    this.timeOfHeapLimit = duration;
    this.inGC = false;
    this.timeOfGC = 0;
    this.durationOfGC = 0;
    this.maxHeap = 0;
    this.avgHeap = 0;
    this.garbageCollections = [];
    this.gcSpeed = gcSpeed;
    this.floatingGarbageRatio = floatingGarbageRatio;
  }
  start() {
    this.scheduler.onStart(0, 0);
    this.updateLimits();
  }
  run(step: number) {
    let next = this.nextTime(step);
    while (next < this.duration) {
      this.advance(next);
      next = this.nextTime(step);
    }
  }
  nextTime(step: number): number {
    let result = Math.min(this.time + step, this.duration);
    if (this.inGC) {
      result = Math.min(result, this.timeOfGC);
    } else {
      result = Math.min(result, this.timeLimit);
      result = Math.min(result, this.timeOfHeapLimit);
    }
    return result;
  }
  updateLimits(): void {
    if (this.scheduler.timeLimit <= this.time) {
      this.timeLimit = this.duration;
    } else {
      this.timeLimit = this.scheduler.timeLimit;
    }
    this.heapLimit = this.scheduler.heapLimit;
    if (this.scheduler.heapLimit <= this.heap) {
      this.timeOfHeapLimit = this.duration;
    } else {
      this.timeOfHeapLimit = this.findTimeToGrowHeapBy(this.heapLimit - this.heap);
    }
    if (this.timeLimit < this.time + 1) {
      this.timeLimit = this.time + 1;
    }
    if (this.timeOfHeapLimit < this.time + 1) {
      this.timeOfHeapLimit = this.time + 1;
    }
  }
  findTimeToGrowHeapBy(bytes: number): number {
    const kMaxIterations = 20;
    let start = this.time;
    let lower = this.time;
    let upper = this.duration;
    let skip = this.timeInGC;
    for (let i = 0; i < kMaxIterations; i++) {
      let middle = (lower + upper) / 2;
      if (this.mutator.bornBetween(start - skip, middle - skip) < bytes) {
        lower = middle;
      } else {
        upper = middle;
      }
    }
    return upper;
  }
  advance(newTime: number) {
    if (this.inGC && this.timeOfGC > newTime) {
      this.avgHeap += (newTime - this.time) * (this.heap);
      this.time = newTime;
      return;
    }
    if (this.inGC) {
      let newFloatingGarbage = this.dead * this.floatingGarbageRatio;
      let actuallyDead = this.dead - newFloatingGarbage;
      let newHeap = this.heap - actuallyDead - this.floatingGarbage;
      this.floatingGarbage = newFloatingGarbage;
      this.dead = 0;
      this.avgHeap += (this.timeOfGC - this.time) * (this.heap);
      this.time = this.timeOfGC;
      this.scheduler.onGarbageCollection(this.timeOfGC, this.durationOfGC, this.heap, newHeap);
      this.garbageCollections.push(new GarbageCollection(this.timeOfGC - this.durationOfGC, this.durationOfGC, this.heap, newHeap));
      this.heap = newHeap;
      this.timeInGC += this.durationOfGC;
      this.timeOfGC = 0;
      this.durationOfGC = 0;
      this.inGC = false;
      this.updateLimits();
    }
    if (this.time < newTime) {
      let skip = this.timeInGC;
      let newBorn = this.mutator.bornBetween(this.time - skip, newTime - skip);
      let newDead = this.mutator.diedBetween(this.time - skip, newTime - skip);
      let newHeap = this.heap + newBorn;
      let avgHeap = (this.heap + this.heap + newBorn) / 2;
      this.avgHeap += (newTime - this.time) * avgHeap;
      this.heap = newHeap;
      this.maxHeap = Math.max(this.maxHeap, this.heap);
      this.dead += newDead;
      this.time = newTime;
      let gc = false;
      if (this.scheduler.heapLimit > 0 && this.scheduler.heapLimit <= newHeap) {
        gc = this.scheduler.onHeapLimit(newTime, newHeap);
      }
      if (this.scheduler.timeLimit > 0 && this.scheduler.timeLimit <= newTime) {
        gc = this.scheduler.onTimeLimit(newTime, newHeap) || gc;
      }
      if (gc) {
        this.inGC = true;
        this.durationOfGC = this.computeDurationOfGC(this.heap, this.dead);
        this.timeOfGC = this.time + this.durationOfGC;
        this.duration += this.durationOfGC;
      }
      this.updateLimits();
    }
  }
  averageHeap() {
    return this.avgHeap / this.time;
  }
  computeDurationOfGC(heap: number, dead: number): number {
    return Math.max(1, heap / this.gcSpeed);
  }
}
