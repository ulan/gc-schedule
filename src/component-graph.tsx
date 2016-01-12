import Smoothie = require("smoothie");
import React = require("react");

import {Mutator} from "./mutator";
import {Scheduler} from "./scheduler";
import {Runner, GarbageCollection} from "./runner";

const MB = 1024 * 1024;

class GraphProps {
  public width: number;
  public height: number;
  public duration: number;
  public gcSpeed: number;
  public floatingGarbageRatio: number;
  public mutator: Mutator;
  public scheduler: Scheduler;
  public step: number;
  public running: boolean;
  public runCount: number;
}

class GraphState {
  public time: number;
  public live: number;
  public heap: number;
  public maxHeap: number;
  public avgHeap: number;
  public timeInGC: number;
  public garbageCollections: GarbageCollection [];
  constructor() {
    this.time = 0;
    this.live = 0;
    this.heap = 0;
    this.maxHeap = 0;
    this.avgHeap = 0;
    this.timeInGC = 0;
    this.garbageCollections = [];
  }
}

function customYRangeFunction(range: {min: number, max: number}) {
  return {min: Math.floor(range.min * 0.95), max: Math.floor(range.max * 1.05)};
}

export class Graph extends React.Component<GraphProps, GraphState> {
  runner: Runner;
  smoothie = new Smoothie.SmoothieChart({
    yRangeFunction: customYRangeFunction,
    grid: {fillStyle: "#f5f7ff", strokeStyle: "#d6d6d6", verticalSections: 4},
    labels: {fillStyle: "#000000"}
  });
  heapSeries = new Smoothie.TimeSeries();
  minHeapSeries = new Smoothie.TimeSeries();
  heapLimitSeries = new Smoothie.TimeSeries();
  state = new GraphState();
  initialized = false;
  canvas = null;
  timer: number;
  startTime: number;

  reset(props: GraphProps) {
    clearTimeout(this.timer);
    this.heapSeries.clear();
    this.minHeapSeries.clear();
    this.heapLimitSeries.clear();
    if (!props.running) {
      this.smoothie.stop();
    } else {
      this.runner = new Runner(props.duration, props.gcSpeed, props.floatingGarbageRatio, props.mutator, props.scheduler);
      this.runner.start();
      this.startTime = (new Date()).valueOf();
      this.timer = setTimeout(this.advance.bind(this), props.step);
      this.smoothie.start();
    }
  }
  componentWillMount() {
    this.smoothie.addTimeSeries(this.minHeapSeries, {
      strokeStyle: "#603030",
      fillStyle: "rgba(183,128,123,0.30)",
      lineWidth: 4
    });
    this.smoothie.addTimeSeries(this.heapSeries, {
      strokeStyle: "#f06060",
      fillStyle: "rgba(183,128,123,0.30)",
      lineWidth: 4
    });
    this.smoothie.addTimeSeries(this.heapLimitSeries, {
      strokeStyle: "#906060",
      lineWidth: 1
    });
    this.reset(this.props);
  }
  componentWillUnmount() {
    clearTimeout(this.timer);
  }
  onMountCanvas(canvas) {
    if (!this.initialized) {
      this.smoothie.streamTo(canvas, 500);
      this.initialized = true;
      this.timer = setTimeout(this.advance.bind(this), 100);
    }
  }
  advance() {
    if (!this.props.running) {
      this.smoothie.stop();
      return;
    }
    let currentTime = (new Date()).valueOf();
    let nextTime = this.runner.nextTime(this.props.step);
    while (this.startTime + nextTime < currentTime && nextTime < this.runner.duration) {
      this.runner.advance(nextTime);
      nextTime = this.runner.nextTime(this.props.step);
    }
    this.state.time = this.runner.time;
    this.state.live = this.runner.heap - this.runner.dead - this.runner.floatingGarbage;
    this.state.heap = this.runner.heap;
    this.state.maxHeap = this.runner.maxHeap;
    this.state.avgHeap = this.runner.averageHeap();
    this.state.timeInGC = this.runner.timeInGC;
    this.state.garbageCollections = this.runner.garbageCollections;
    if (nextTime < this.runner.duration) {
      this.timer = setTimeout(this.advance.bind(this), this.props.step);
      this.minHeapSeries.append(currentTime, this.state.live);
      this.heapSeries.append(currentTime, this.state.heap);
      if (this.runner.scheduler.heapLimit > 0) {
        this.heapLimitSeries.append(currentTime, this.runner.scheduler.heapLimit);
      }
    } else {
      this.smoothie.stop();
    }
    this.setState(this.state);
  }
  componentWillReceiveProps(newProps: GraphProps) {
    if (newProps.runCount !== this.props.runCount) {
      this.reset(newProps);
    }
  }
  render() {
    let gc = this.state.garbageCollections[this.state.garbageCollections.length - 1];
    let heapBefore = 0;
    let heapAfter = 0;
    let duration = 0;
    if (gc) {
      heapBefore = gc.heapBefore;
      heapAfter = gc.heapAfter;
      duration = gc.duration;
    }
    return (
      <div>
        <div>
        {this.props.scheduler.label()}:
        </div>
        <canvas width={this.props.width}
                height={this.props.height}
                ref={canvas => this.onMountCanvas(canvas)}/>
        <table>
        <tbody>
        <tr><td>Average Heap: </td><td>{Math.round(this.state.avgHeap / MB)} MB</td></tr>
        <tr><td>Maximum Heap: </td><td>{Math.round(this.state.maxHeap / MB)} MB</td></tr>
        <tr><td>Current Heap: </td><td>{Math.round(this.state.heap / MB)} MB</td></tr>
        <tr><td>Live: </td><td>{Math.round(this.state.live / MB)} MB</td></tr>
        <tr><td>GC Time: </td><td>{Math.round(this.state.timeInGC)} ms</td></tr>
        <tr><td>GC Count: </td><td>{this.state.garbageCollections.length}</td></tr>
        <tr><td>Last GC: </td><td>
          {Math.round(heapBefore / MB)} MB => {Math.round(heapAfter / MB)} MB,
          {Math.round(duration)} ms</td></tr>
        <tr><td>Total Time</td><td>{Math.round(this.state.time)} ms </td></tr>
        </tbody>
        </table>
      </div>
    );
  }
}
