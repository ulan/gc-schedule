var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Smoothie = require("smoothie");
var React = require("react");
var runner_1 = require("./runner");
var MB = 1024 * 1024;
var GraphProps = (function () {
    function GraphProps() {
    }
    return GraphProps;
})();
var GraphState = (function () {
    function GraphState() {
        this.time = 0;
        this.live = 0;
        this.heap = 0;
        this.maxHeap = 0;
        this.avgHeap = 0;
        this.timeInGC = 0;
        this.garbageCollections = [];
    }
    return GraphState;
})();
function customYRangeFunction(range) {
    return { min: Math.floor(range.min * 0.95), max: Math.floor(range.max * 1.05) };
}
var Graph = (function (_super) {
    __extends(Graph, _super);
    function Graph() {
        _super.apply(this, arguments);
        this.smoothie = new Smoothie.SmoothieChart({
            yRangeFunction: customYRangeFunction,
            grid: { fillStyle: "#f5f7ff", strokeStyle: "#d6d6d6", verticalSections: 4 },
            labels: { fillStyle: "#000000" }
        });
        this.heapSeries = new Smoothie.TimeSeries();
        this.minHeapSeries = new Smoothie.TimeSeries();
        this.heapLimitSeries = new Smoothie.TimeSeries();
        this.state = new GraphState();
        this.initialized = false;
        this.canvas = null;
    }
    Graph.prototype.reset = function (props) {
        clearTimeout(this.timer);
        this.heapSeries.clear();
        this.minHeapSeries.clear();
        this.heapLimitSeries.clear();
        if (!props.running) {
            this.smoothie.stop();
        }
        else {
            this.runner = new runner_1.Runner(props.duration, props.gcSpeed, props.floatingGarbageRatio, props.mutator, props.scheduler);
            this.runner.start();
            this.startTime = (new Date()).valueOf();
            this.timer = setTimeout(this.advance.bind(this), props.step);
            this.smoothie.start();
        }
    };
    Graph.prototype.componentWillMount = function () {
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
    };
    Graph.prototype.componentWillUnmount = function () {
        clearTimeout(this.timer);
    };
    Graph.prototype.onMountCanvas = function (canvas) {
        if (!this.initialized) {
            this.smoothie.streamTo(canvas, 500);
            this.initialized = true;
            this.timer = setTimeout(this.advance.bind(this), 100);
        }
    };
    Graph.prototype.advance = function () {
        if (!this.props.running) {
            this.smoothie.stop();
            return;
        }
        var currentTime = (new Date()).valueOf();
        var nextTime = this.runner.nextTime(this.props.step);
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
        }
        else {
            this.smoothie.stop();
        }
        this.setState(this.state);
    };
    Graph.prototype.componentWillReceiveProps = function (newProps) {
        if (newProps.runCount !== this.props.runCount) {
            this.reset(newProps);
        }
    };
    Graph.prototype.render = function () {
        var _this = this;
        var gc = this.state.garbageCollections[this.state.garbageCollections.length - 1];
        var heapBefore = 0;
        var heapAfter = 0;
        var duration = 0;
        if (gc) {
            heapBefore = gc.heapBefore;
            heapAfter = gc.heapAfter;
            duration = gc.duration;
        }
        return (React.createElement("div", null, React.createElement("div", null, this.props.scheduler.label(), ":"), React.createElement("canvas", {"width": this.props.width, "height": this.props.height, "ref": function (canvas) { return _this.onMountCanvas(canvas); }}), React.createElement("table", null, React.createElement("tbody", null, React.createElement("tr", null, React.createElement("td", null, "Average Heap: "), React.createElement("td", null, Math.round(this.state.avgHeap / MB), " MB")), React.createElement("tr", null, React.createElement("td", null, "Maximum Heap: "), React.createElement("td", null, Math.round(this.state.maxHeap / MB), " MB")), React.createElement("tr", null, React.createElement("td", null, "Current Heap: "), React.createElement("td", null, Math.round(this.state.heap / MB), " MB")), React.createElement("tr", null, React.createElement("td", null, "Live: "), React.createElement("td", null, Math.round(this.state.live / MB), " MB")), React.createElement("tr", null, React.createElement("td", null, "GC Time: "), React.createElement("td", null, Math.round(this.state.timeInGC), " ms")), React.createElement("tr", null, React.createElement("td", null, "GC Count: "), React.createElement("td", null, this.state.garbageCollections.length)), React.createElement("tr", null, React.createElement("td", null, "Last GC: "), React.createElement("td", null, Math.round(heapBefore / MB), " MB => ", Math.round(heapAfter / MB), " MB,", Math.round(duration), " ms")), React.createElement("tr", null, React.createElement("td", null, "Total Time"), React.createElement("td", null, Math.round(this.state.time), " ms "))))));
    };
    return Graph;
})(React.Component);
exports.Graph = Graph;
