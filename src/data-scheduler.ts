export function sources() {
  return [
  `{
    factor: 1.5,
    heapLimit: 0,
    timeLimit: 0,
    label: function () {
      return "Factor Based (" + this.factor.toString() + ")";
    },
    onStart: function (time, heap) {
      this.heapLimit = Math.max(1000, heap * this.factor);
      this.timeLimit = 0;
    },
    onTimeLimit: function (time, heap) {
      throw "unreachable";
    },
    onHeapLimit: function (time, heap) {
      return true;
    },
    onGarbageCollection: function(time, duration, heapBefore, heapAfter) {
      this.heapLimit = Math.max(1000, heapAfter * this.factor);
    }
}`,
`{
    interval: 1000,
    heapLimit: 0,
    timeLimit: 0,
    label: function () {
      return "Time Based (" + this.interval.toString() + "ms)";
    },
    onStart: function (time, heap) {
      this.heapLimit = 0;
      this.timeLimit = time + this.interval;
    },
    onTimeLimit: function (time, heap) {
      return true;
    },
    onHeapLimit: function (time, heap) {
      throw "unreachable";
    },
    onGarbageCollection: function(time, duration, heapBefore, heapAfter) {
      this.timeLimit = time + this.interval;
    }
}`,
`Schedulers.throughputBased()`
];
}
