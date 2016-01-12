import React = require("react");

import {Mutator} from "./mutator";
import {Scheduler} from "./scheduler";
import {Graph} from "./component-graph";

class DetailsProps {
  mutators: Mutator [];
  schedulers: Scheduler [];
  gcSpeed: number;
  floatingGarbageRatio: number;
  step: number;
}

class DetailsState {
  mutatorIndex: number;
  running: boolean;
  runCount: number;
}

export class Details extends React.Component<DetailsProps, DetailsState> {
  state = new DetailsState();
  schedulers: Scheduler [];
  componentWillMount() {
    this.state.mutatorIndex = 0;
    this.state.running = false;
    this.state.runCount = 0;
    this.setState(this.state);
    this.schedulers = this.props.schedulers.map(x => x);
  }
  componentWillReceiveProps(newProps: DetailsProps) {
    let changed = false;
    if (newProps.schedulers.length !== this.schedulers.length) {
      changed = true;
    } else {
      for (let i = 0; i < this.schedulers.length; i++) {
        if (this.schedulers[i] !== newProps.schedulers[i]) {
          changed = true;
        }
      }
    }
    if (this.props.floatingGarbageRatio !== newProps.floatingGarbageRatio) {
      changed = true;
    }
    if (this.props.gcSpeed !== newProps.gcSpeed) {
      changed = true;
    }
    if (changed) {
      this.state.runCount += 1;
      this.setState(this.state);
    }
  }
  onMutatorChange(event) {
    this.state.mutatorIndex = parseInt((event.target as any).value);
    this.state.runCount += 1;
    this.setState(this.state);
  }
  onRunButtonClick(event) {
    this.state.running = !this.state.running;
    this.state.runCount += 1;
    this.setState(this.state);
  }
  render() {
    let count = Math.max(this.props.schedulers.length, 1);
    let width = Math.floor(90 / count).toString() + "%";
    let mutator = this.props.mutators[this.state.mutatorIndex];
    return (
      <div>
          <p>
          Application: <select onChange={this.onMutatorChange.bind(this)} value={this.state.mutatorIndex.toString()}>
          {
            this.props.mutators.map((m: any, i: number) =>
              <option key={i} value={i.toString()}>{m.label}</option>
            )
          }
          </select> <button onClick={event => this.onRunButtonClick(event)}>{this.state.running ? "Stop" : "Run"}</button>
          </p>
          <p>Thick lines in the graph show the heap size and the total size of live objects.
          A thin line is the heap limit. </p>
          <div> {
            this.props.schedulers.map((scheduler: any, i: number) =>
              <div key={i} style={{display: "inline-block", width : width}}>
                <Graph width={300} height={150}
                       duration={mutator.duration}
                       gcSpeed={this.props.gcSpeed}
                       floatingGarbageRatio={this.props.floatingGarbageRatio}
                       step={this.props.step}
                       mutator={mutator}
                       scheduler={scheduler}
                       running={this.state.running}
                       runCount={this.state.runCount}/>
              </div>
            )}
          </div>
      </div>
    );
  }
}
