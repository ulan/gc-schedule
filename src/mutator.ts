export interface Mutator {
  duration: number;
  totalBorn: number;
  totalDied: number;
  label: string;
  bornBetween(fromTime: number, toTime: number): number;
  diedBetween(fromTime: number, toTime: number): number;
}

function sum<T>(f: (x: T) => number, xs: T[]): number {
  let result = 0;
  for (let i = 0; i < xs.length; i++) {
    result += f(xs[i]);
  }
  return result;
}

class LoggedMutator implements Mutator {
  duration: number;
  totalBorn: number;
  totalDied: number;
  steps: number;
  time: number[];
  sumBorn: number [];
  sumDied: number [];
  label: string;
  constructor(time: number[], born: number[], died: number[], label: string) {
    this.time = time;
    this.steps = this.time.length;
    let n = this.steps;
    this.duration = this.time[n - 1];
    this.sumBorn = [born[0]];
    for (let i = 1; i < n; i++) {
      this.sumBorn.push(this.sumBorn[i - 1] + born[i]);
    }
    this.sumBorn.push(this.sumBorn[n - 1]);
    this.sumDied = [died[0]];
    for (let i = 1; i < n; i++) {
      this.sumDied.push(this.sumDied[i - 1] + died[i]);
    }
    this.sumDied.push(this.sumDied[n - 1]);
    this.totalBorn = this.sumBorn[n];
    this.totalDied = this.sumDied[n];
    this.label = label;
  }
  findTime(time: number): {index: number, remainder: number} {
    if (time >= this.time[this.steps - 1]) {
      return {index: this.steps - 1, remainder: 0};
    }
    let lower = 0, upper = this.steps - 1;
    while (lower + 1 < upper) {
      let middle = (lower + upper) >> 1;
      if (this.time[middle] <= time) {
        lower = middle;
      } else {
        upper = middle;
      }
    }
    // this.log[lower].time <= time < this.log[upper].time
    let lowerTime = this.time[lower];
    let upperTime = this.time[upper];
    let remainder = (time - lowerTime) / (upperTime - lowerTime);
    return {index: lower, remainder: remainder};
  }
  before(sums: number[], time: {index: number, remainder: number}): number {
    let over = sums[time.index + 1] - sums[time.index];
    return sums[time.index] + over * time.remainder;
  }
  bornBetween(fromTime: number, toTime: number) {
    let fr = this.before(this.sumBorn, this.findTime(fromTime));
    let to = this.before(this.sumBorn, this.findTime(toTime));
    return to - fr;
  }
  diedBetween(fromTime: number, toTime: number) {
    let fr = this.before(this.sumDied, this.findTime(fromTime));
    let to = this.before(this.sumDied, this.findTime(toTime));
    return to - fr;
  }
}


class RepeatedMutator implements Mutator {
  duration: number;
  totalBorn: number;
  totalDied: number;
  label: string;
  mutator: Mutator;
  constructor(repeat: number, mutator: Mutator) {
    this.mutator = mutator;
    this.duration = mutator.duration * repeat;
    this.totalBorn = mutator.totalBorn * repeat;
    this.totalDied = mutator.totalDied * repeat;
    this.label = mutator.label + "*";
  }
  bornBetween(fromTime: number, toTime: number) {
    if (fromTime >= this.duration) return 0;
    toTime = Math.min(toTime, this.duration);
    let f = this.mutator.bornBetween.bind(this.mutator);
    return this.compute(f, this.mutator.totalBorn, fromTime, toTime);
  }
  diedBetween(fromTime: number, toTime: number) {
    if (fromTime >= this.duration) return 0;
    toTime = Math.min(toTime, this.duration);
    let f = this.mutator.diedBetween.bind(this.mutator);
    return this.compute(f, this.mutator.totalDied, fromTime, toTime);
  }
  compute(f: (fromTime: number, toTime: number) => number,
          totalPerCycle: number, fromTime: number, toTime: number) {
    let period = this.mutator.duration;
    let fromCycle = Math.floor(fromTime / period);
    let fromRemainder = fromTime - fromCycle * period;
    let toCycle = Math.floor(toTime / period);
    let toRemainder = toTime - toCycle * period;
    if (fromCycle === toCycle) {
      return f(fromRemainder, toRemainder);
    } else {
      let fullCycles = toCycle - fromCycle - 1;
      return fullCycles * totalPerCycle + f(fromRemainder, period) + f(0, toRemainder);
    }
  }
}

class ShiftedMutator implements Mutator {
  duration: number;
  totalBorn: number;
  totalDied: number;
  mutator: Mutator;
  label: string;
  shift: number;
  constructor(shift: number, mutator: Mutator) {
    this.mutator = mutator;
    this.shift = shift;
    this.duration = mutator.duration + shift;
    this.totalBorn = mutator.totalBorn;
    this.totalDied = mutator.totalDied;
    this.label = mutator.label;
  }
  bornBetween(fromTime: number, toTime: number) {
    fromTime = Math.max(0, fromTime - this.shift);
    toTime = Math.max(0, toTime - this.shift);
    return this.mutator.bornBetween(fromTime, toTime);
  }
  diedBetween(fromTime: number, toTime: number) {
    fromTime = Math.max(0, fromTime - this.shift);
    toTime = Math.min(toTime, this.duration);
    return this.mutator.diedBetween(fromTime, toTime);
  }
}

class ScaledMutator implements Mutator {
  duration: number;
  totalBorn: number;
  totalDied: number;
  label: string;
  mutator: Mutator;
  scale: number;
  constructor(scale: number, mutator: Mutator) {
    this.mutator = mutator;
    this.scale = scale;
    this.duration = mutator.duration * scale;
    this.totalBorn = mutator.totalBorn;
    this.totalDied = mutator.totalDied;
    this.label = mutator.label;
  }
  bornBetween(fromTime: number, toTime: number) {
    fromTime = fromTime / this.scale;
    toTime = toTime / this.scale;
    return this.mutator.bornBetween(fromTime, toTime);
  }
  diedBetween(fromTime: number, toTime: number) {
    fromTime = fromTime / this.scale;
    toTime = toTime / this.scale;
    return this.mutator.diedBetween(fromTime, toTime);
  }
}

class AddedMutator implements Mutator {
  duration: number;
  totalBorn: number;
  totalDied: number;
  label: string;
  mutators: Mutator[];
  constructor(mutators: Mutator[]) {
    this.mutators = mutators;
    this.totalBorn = sum(x => x.totalBorn, mutators);
    this.totalDied = sum(x => x.totalDied, mutators);
    this.label = mutators.map(x => x.label).join(", ");
  }
  bornBetween(fromTime: number, toTime: number) {
    return sum(x => x.bornBetween(fromTime, toTime), this.mutators);
  }
  diedBetween(fromTime: number, toTime: number) {
    return sum(x => x.diedBetween(fromTime, toTime), this.mutators);
  }
}

export function create(duration: number, born: number[], died: number[]): Mutator {
  let n = born.length;
  let interval = duration / n;
  let time = [];
  for (let i = 0; i <= n; i++) {
    time.push(interval * i);
  }
  return new LoggedMutator(time, [0].concat(born), [0].concat(died), "");
}

class LogEntry {
  time: number;
  born: number;
  died: number;
}

export function fromJSON(json: string, label: string) {
  let entries = JSON.parse(json).data as LogEntry[];
  let time = entries.map(x => x.time);
  let born = entries.map(x => x.born);
  let died = entries.map(x => x.died);
  return new LoggedMutator(time, born, died, label);
}

export function fromLog(data: {data: LogEntry[]}, label: string) {
  let entries = data.data;
  let time = entries.map(x => x.time);
  let born = entries.map(x => x.born);
  let died = entries.map(x => x.died);
  return new LoggedMutator(time, born, died, label);
}

export function repeat(repeatCount: number, mutator: Mutator): Mutator {
  return new RepeatedMutator(repeatCount, mutator);
}

export function shift(shiftTime: number, mutator: Mutator): Mutator {
  return new ShiftedMutator(shiftTime, mutator);
}

export function scale(scaleTime: number, mutator: Mutator): Mutator {
  return new ScaledMutator(scaleTime, mutator);
}

export function add(mutator1: Mutator, mutator2: Mutator): Mutator {
  let mutators = [mutator1, mutator2];
  return new AddedMutator(mutators);
}
