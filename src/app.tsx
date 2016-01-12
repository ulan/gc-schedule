/// <reference path="../typings/tsd.d.ts" />

import React = require("react");
import ReactDOM = require("react-dom");

import {Details} from "./component-details";
import {Editor} from "./component-editor";
import {Results} from "./component-results";

import {Mutator} from "./mutator";
import {Scheduler} from "./scheduler";

import Mutators = require("./data-mutator");
import Schedulers = require("./data-scheduler");

class AppState {
  mutators: Mutator[];
  sources: string[];
  schedulers: Scheduler[];
  gcSpeed: number;
  floatingGarbageRatio: number;
  step: number;
  constructor() {
    this.mutators = Mutators.mutators();
    this.sources = Schedulers.sources();
    this.schedulers = this.sources.map(source => eval("(" + source + ")"));
    this.gcSpeed = 1000000;
    this.floatingGarbageRatio = 0.0;
    this.step = 300;
  }
}

class App extends React.Component<{}, AppState> {
  state = new AppState();
  onSchedulerChange(index: number) {
    this.setState(this.state);
  }
  onFloatingGarbageChange(event) {
    this.state.floatingGarbageRatio = event.target.valueAsNumber / 100.0;
    this.setState(this.state);
  }
  onGcSpeedChange(event) {
    this.state.gcSpeed = event.target.valueAsNumber;
    this.setState(this.state);
  }
  render() {
    let count = Math.max(this.state.schedulers.length, 1);
    let width = Math.floor(90 / count).toString() + "%";
    let floatingGarbagePercentage = Math.round(this.state.floatingGarbageRatio * 100);
    return (
      <div>
        <h3>Source Code</h3>
        <Editor sources={this.state.sources}
                schedulers={this.state.schedulers}
                onSchedulerChange={index => this.onSchedulerChange(index)}/>
        <h3>Garbage Collector Parameters</h3>
        <table>
        <tbody>
        <tr><td><label>Floating Garbage Percentage</label></td><td><input type="range" min="0" max="100" value={floatingGarbagePercentage.toString()} onChange={event => this.onFloatingGarbageChange(event)}/></td><td>{floatingGarbagePercentage}%</td></tr>
        <tr><td><label>Garbage Collection Speed</label></td><td><input type="range" min="102400" max="10485760" value={this.state.gcSpeed.toString()} onChange={event => this.onGcSpeedChange(event)}/></td><td>{Math.round(this.state.gcSpeed / 1024 / 1024 * 10) / 10} MB/ms</td></tr>
        </tbody>
        </table>
        <h3>Results</h3>
        <div>
          {this.state.sources.map((source, index) =>
            <div key={index} style={{display: "inline-block", width : width}}>
              <Results mutators={this.state.mutators}
                       gcSpeed={this.state.gcSpeed}
                       floatingGarbageRatio={this.state.floatingGarbageRatio}
                       step={this.state.step}
                       source={source}/>
            </div>)}
        </div>
        <h3>Details</h3>
        <div>
         <Details schedulers={this.state.schedulers}
                  mutators={this.state.mutators}
                  gcSpeed={this.state.gcSpeed}
                  floatingGarbageRatio={this.state.floatingGarbageRatio}
                  step={this.state.step}/>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<div> <App/> </div>, document.getElementById("app"));
