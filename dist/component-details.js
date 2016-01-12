var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var React = require("react");
var component_graph_1 = require("./component-graph");
var DetailsProps = (function () {
    function DetailsProps() {
    }
    return DetailsProps;
})();
var DetailsState = (function () {
    function DetailsState() {
    }
    return DetailsState;
})();
var Details = (function (_super) {
    __extends(Details, _super);
    function Details() {
        _super.apply(this, arguments);
        this.state = new DetailsState();
    }
    Details.prototype.componentWillMount = function () {
        this.state.mutatorIndex = 0;
        this.state.running = false;
        this.state.runCount = 0;
        this.setState(this.state);
        this.schedulers = this.props.schedulers.map(function (x) { return x; });
    };
    Details.prototype.componentWillReceiveProps = function (newProps) {
        var changed = false;
        if (newProps.schedulers.length !== this.schedulers.length) {
            changed = true;
        }
        else {
            for (var i = 0; i < this.schedulers.length; i++) {
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
    };
    Details.prototype.onMutatorChange = function (event) {
        this.state.mutatorIndex = parseInt(event.target.value);
        this.state.runCount += 1;
        this.setState(this.state);
    };
    Details.prototype.onRunButtonClick = function (event) {
        this.state.running = !this.state.running;
        this.state.runCount += 1;
        this.setState(this.state);
    };
    Details.prototype.render = function () {
        var _this = this;
        var count = Math.max(this.props.schedulers.length, 1);
        var width = Math.floor(90 / count).toString() + "%";
        var mutator = this.props.mutators[this.state.mutatorIndex];
        return (React.createElement("div", null, React.createElement("p", null, "Application: ", React.createElement("select", {"onChange": this.onMutatorChange.bind(this), "value": this.state.mutatorIndex.toString()}, this.props.mutators.map(function (m, i) {
            return React.createElement("option", {"key": i, "value": i.toString()}, m.label);
        })), " ", React.createElement("button", {"onClick": function (event) { return _this.onRunButtonClick(event); }}, this.state.running ? "Stop" : "Run")), React.createElement("div", null, " ", this.props.schedulers.map(function (scheduler, i) {
            return React.createElement("div", {"key": i, "style": { display: "inline-block", width: width }}, React.createElement(component_graph_1.Graph, {"width": 300, "height": 150, "duration": mutator.duration, "gcSpeed": _this.props.gcSpeed, "floatingGarbageRatio": _this.props.floatingGarbageRatio, "step": _this.props.step, "mutator": mutator, "scheduler": scheduler, "running": _this.state.running, "runCount": _this.state.runCount}));
        }))));
    };
    return Details;
})(React.Component);
exports.Details = Details;
