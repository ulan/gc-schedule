var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var React = require("react");
var runner_1 = require("./runner");
var MB = 1024 * 1024;
var Result = (function () {
    function Result() {
    }
    return Result;
})();
var ResultsState = (function () {
    function ResultsState() {
        this.scheduler = null;
        this.results = [];
    }
    return ResultsState;
})();
var ResultsProps = (function () {
    function ResultsProps() {
    }
    return ResultsProps;
})();
var Results = (function (_super) {
    __extends(Results, _super);
    function Results() {
        _super.apply(this, arguments);
        this.state = new ResultsState();
    }
    Results.prototype.onTimer = function (event) {
        var _this = this;
        if (!this.state.scheduler)
            return;
        if (this.state.results.length === this.props.mutators.length)
            return;
        var mutator = this.props.mutators[this.state.results.length];
        var runner = new runner_1.Runner(mutator.duration, this.props.gcSpeed, this.props.floatingGarbageRatio, mutator, this.state.scheduler);
        runner.start();
        runner.run(this.props.step);
        this.state.results.push({ mutator: mutator,
            totalTime: runner.time,
            timeInGC: runner.timeInGC,
            averageHeap: runner.averageHeap(),
            maxHeap: runner.maxHeap,
            finalHeap: runner.heap });
        if (this.state.results.length < this.props.mutators.length) {
            this.state.timer = setTimeout(function (event) { return _this.onTimer(event); }, 200);
        }
        this.setState(this.state);
    };
    Results.prototype.componentWillMount = function () {
        var _this = this;
        clearTimeout(this.state.timer);
        this.state.scheduler = eval("(" + this.props.source + ")");
        this.state.timer = setTimeout(function (event) { return _this.onTimer(event); }, 200);
        this.setState(this.state);
    };
    Results.prototype.componentWillReceiveProps = function (newProps) {
        var _this = this;
        if (this.props.source === newProps.source &&
            this.props.floatingGarbageRatio === newProps.floatingGarbageRatio &&
            this.props.gcSpeed === newProps.gcSpeed) {
            return;
        }
        clearTimeout(this.state.timer);
        this.state.results = [];
        this.state.scheduler = eval("(" + newProps.source + ")");
        this.state.timer = setTimeout(function (event) { return _this.onTimer(event); }, 200);
        this.setState(this.state);
    };
    Results.prototype.render = function () {
        return (React.createElement("div", null, this.state.scheduler.label(), React.createElement("table", {"style": { textAlign: "left" }, "cellSpacing": 10}, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", null, "Application"), React.createElement("th", null, "GC"), React.createElement("th", null, "Avg"), React.createElement("th", null, "Max"))), React.createElement("tbody", null, this.state.results.map(function (result, i) {
            return React.createElement("tr", {"key": i}, React.createElement("td", null, result.mutator.label), React.createElement("td", null, Math.round(result.timeInGC), " ms "), React.createElement("td", null, Math.round(result.averageHeap / MB), " MB "), React.createElement("td", null, Math.round(result.maxHeap / MB), " MB "));
        })))));
    };
    return Results;
})(React.Component);
exports.Results = Results;
