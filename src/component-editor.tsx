import React = require("react");

import {Scheduler} from "./scheduler";

class EditorProps {
  sources: string [];
  schedulers: Scheduler [];
  onSchedulerChange: (index: number) => void;
}

class EditorState {
  source: string;
  compileError: string;
  schedulerIndex: number;
}

export class Editor extends React.Component<EditorProps, EditorState> {
  state = new EditorState();
  componentWillMount() {
    this.state.schedulerIndex = 0;
    this.state.source = this.props.sources[this.state.schedulerIndex];
    this.state.compileError = "";
    this.setState(this.state);
  }
  onApplyChanges(event) {
    let scheduler = null;
    this.state.compileError = "";
    try {
      scheduler = eval("(" + this.state.source + ")");
    } catch (e) {
      this.state.compileError = "Could not compile: " + e.toString();
    }
    if (scheduler) {
      this.props.sources[this.state.schedulerIndex] = this.state.source;
      this.props.schedulers[this.state.schedulerIndex] = scheduler;
      this.props.onSchedulerChange(this.state.schedulerIndex);
    }
    this.setState(this.state);
  }
  onSourceChange(event) {
    this.state.source = event.target.value;
    this.setState(this.state);
  }
  onSchedulerIndexChange(event) {
    this.state.schedulerIndex = parseInt((event.target as any).value);
    this.state.source = this.props.sources[this.state.schedulerIndex];
    this.state.compileError = "";
    this.setState(this.state);
  }
  render() {
    return (
      <div>
        <p>
          Scheduler: <select onChange={event => this.onSchedulerIndexChange(event)}
                             value={this.state.schedulerIndex.toString()}>
          {
            this.props.schedulers.map((s: any, i: number) =>
              <option key={i} value={i.toString()}>{s.label()}</option>)
          }
          </select> <button onClick={event => this.onApplyChanges(event)}>Apply changes</button>
        </p>
        <div>
          <textarea style={{fontFamily:"monospace"}}
                    cols={70} rows={25}
                    value={this.state.source}
                    onChange={event => this.onSourceChange(event)}/>
        </div>
        <p>{this.state.compileError}</p>
      </div>
    );
  }
}
