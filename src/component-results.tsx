import React = require("react");

import {Mutator} from "./mutator";
import {Scheduler} from "./scheduler";
import {Runner, GarbageCollection} from "./runner";
import Schedulers = require("./scheduler");
let periodic = Schedulers.periodic(1000);

const MB = 1024 * 1024;

class Result {
  mutator: Mutator;
  totalTime: number;
  timeInGC: number;
  averageHeap: number;
  maxHeap: number;
  finalHeap: number;
}

class ResultsState {
  scheduler: Scheduler;
  results: Result[];
  timer: any;
  constructor() {
    this.scheduler = null;
    this.results = [];
  }
}

class ResultsProps {
  mutators: Mutator[];
  source: string;
  step: number;
  gcSpeed: number;
  floatingGarbageRatio: number;
}


export class Results extends React.Component<ResultsProps, ResultsState> {
  state = new ResultsState();
  onTimer(event) {
    if (!this.state.scheduler) return;
    if (this.state.results.length === this.props.mutators.length) return;
    let mutator = this.props.mutators[this.state.results.length];
    let runner = new Runner(mutator.duration,
                            this.props.gcSpeed,
                            this.props.floatingGarbageRatio,
                            mutator,
                            this.state.scheduler);
    runner.start();
    runner.run(this.props.step);
    this.state.results.push({mutator: mutator,
                       totalTime: runner.time,
                       timeInGC: runner.timeInGC,
                       averageHeap: runner.averageHeap(),
                       maxHeap: runner.maxHeap,
                       finalHeap: runner.heap});
    if (this.state.results.length < this.props.mutators.length) {
      this.state.timer = setTimeout(event => this.onTimer(event), 200);
    }
    this.setState(this.state);
  }
  componentWillMount() {
    clearTimeout(this.state.timer);
    this.state.scheduler = eval("(" + this.props.source + ")");
    this.state.timer = setTimeout(event => this.onTimer(event), 200);
    this.setState(this.state);
  }
  componentWillReceiveProps(newProps: ResultsProps) {
    if (this.props.source === newProps.source &&
        this.props.floatingGarbageRatio === newProps.floatingGarbageRatio &&
        this.props.gcSpeed === newProps.gcSpeed) {
      return;
    }
    clearTimeout(this.state.timer);
    this.state.results = [];
    this.state.scheduler = eval("(" + newProps.source + ")");
    this.state.timer = setTimeout(event => this.onTimer(event), 200);
    this.setState(this.state);
  }
  render() {
    return (
      <div>
        {this.state.scheduler.label()}
        <table style={{textAlign:"left"}} cellSpacing={10}>
          <thead>
          <tr><th>Application</th><th>GC</th><th>Avg</th><th>Max</th></tr>
          </thead>
          <tbody>
          {this.state.results.map((result, i) =>
            <tr key={i}>
              <td>{result.mutator.label}</td>
              <td>{Math.round(result.timeInGC)} ms </td>
              <td>{Math.round(result.averageHeap / MB)} MB </td>
              <td>{Math.round(result.maxHeap / MB)} MB </td>
            </tr>
          )}
          </tbody>
        </table>
      </div>);
  }
}
