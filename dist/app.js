/// <reference path="../typings/tsd.d.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var React = require("react");
var ReactDOM = require("react-dom");
var component_details_1 = require("./component-details");
var component_editor_1 = require("./component-editor");
var component_results_1 = require("./component-results");
var Mutators = require("./data-mutator");
var Schedulers = require("./data-scheduler");
var AppState = (function () {
    function AppState() {
        this.mutators = Mutators.mutators();
        this.sources = Schedulers.sources();
        this.schedulers = this.sources.map(function (source) { return eval("(" + source + ")"); });
        this.gcSpeed = 1000000;
        this.floatingGarbageRatio = 0.0;
        this.step = 300;
    }
    return AppState;
})();
var App = (function (_super) {
    __extends(App, _super);
    function App() {
        _super.apply(this, arguments);
        this.state = new AppState();
    }
    App.prototype.onSchedulerChange = function (index) {
        this.setState(this.state);
    };
    App.prototype.onFloatingGarbageChange = function (event) {
        this.state.floatingGarbageRatio = event.target.valueAsNumber / 100.0;
        this.setState(this.state);
    };
    App.prototype.onGcSpeedChange = function (event) {
        this.state.gcSpeed = event.target.valueAsNumber;
        this.setState(this.state);
    };
    App.prototype.render = function () {
        var _this = this;
        var count = Math.max(this.state.schedulers.length, 1);
        var width = Math.floor(90 / count).toString() + "%";
        var floatingGarbagePercentage = Math.round(this.state.floatingGarbageRatio * 100);
        return (React.createElement("div", null, React.createElement("h3", null, "Scheduler"), React.createElement("div", {"style": { width: width }}, React.createElement("p", null, " A scheduler sets the heap limit and/or the time limit in the ", React.createElement("code", null, "onStart"), " callback." + ' ' + "Whenever one of the limits is reached, the corresponding", React.createElement("code", null, "onHeapLimit/onTimeLimit"), " callback of the scheduler is invoked with" + ' ' + "the current heap size and the current time." + ' ' + "If the callback returns ", React.createElement("code", null, "true"), " then garbage collection is triggered."), React.createElement("p", null, " After garbage collection the ", React.createElement("code", null, "onGarbageCollection"), " callback gives the" + ' ' + "scheduler chance to update the limits."), React.createElement("p", null, "Setting a limit to 0 disables the limit.")), React.createElement(component_editor_1.Editor, {"sources": this.state.sources, "schedulers": this.state.schedulers, "onSchedulerChange": function (index) { return _this.onSchedulerChange(index); }}), React.createElement("h3", null, "Garbage Collector Parameters"), React.createElement("table", null, React.createElement("tbody", null, React.createElement("tr", null, React.createElement("td", null, React.createElement("label", null, "Floating Garbage Percentage")), React.createElement("td", null, React.createElement("input", {"type": "range", "min": "0", "max": "100", "value": floatingGarbagePercentage.toString(), "onChange": function (event) { return _this.onFloatingGarbageChange(event); }})), React.createElement("td", null, floatingGarbagePercentage, "% - the percentage of dead objects that stay in the heap until the next garbage collection.")), React.createElement("tr", null, React.createElement("td", null, React.createElement("label", null, "Garbage Collection Speed")), React.createElement("td", null, React.createElement("input", {"type": "range", "min": "102400", "max": "10485760", "value": this.state.gcSpeed.toString(), "onChange": function (event) { return _this.onGcSpeedChange(event); }})), React.createElement("td", null, Math.round(this.state.gcSpeed / 1024 / 1024 * 10) / 10, " MB/ms")))), React.createElement("h3", null, "Results"), React.createElement("div", null, this.state.sources.map(function (source, index) {
            return React.createElement("div", {"key": index, "style": { display: "inline-block", width: width }}, React.createElement(component_results_1.Results, {"mutators": _this.state.mutators, "gcSpeed": _this.state.gcSpeed, "floatingGarbageRatio": _this.state.floatingGarbageRatio, "step": _this.state.step, "source": source}));
        })), React.createElement("h3", null, "Details"), React.createElement("div", null, React.createElement(component_details_1.Details, {"schedulers": this.state.schedulers, "mutators": this.state.mutators, "gcSpeed": this.state.gcSpeed, "floatingGarbageRatio": this.state.floatingGarbageRatio, "step": this.state.step}))));
    };
    return App;
})(React.Component);
ReactDOM.render(React.createElement("div", null, " ", React.createElement(App, null), " "), document.getElementById("app"));
