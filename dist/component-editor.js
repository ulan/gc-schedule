var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var React = require("react");
var EditorProps = (function () {
    function EditorProps() {
    }
    return EditorProps;
})();
var EditorState = (function () {
    function EditorState() {
    }
    return EditorState;
})();
var Editor = (function (_super) {
    __extends(Editor, _super);
    function Editor() {
        _super.apply(this, arguments);
        this.state = new EditorState();
    }
    Editor.prototype.componentWillMount = function () {
        this.state.schedulerIndex = 0;
        this.state.source = this.props.sources[this.state.schedulerIndex];
        this.state.compileError = "";
        this.setState(this.state);
    };
    Editor.prototype.onApplyChanges = function (event) {
        var scheduler = null;
        this.state.compileError = "";
        try {
            scheduler = eval("(" + this.state.source + ")");
        }
        catch (e) {
            this.state.compileError = "Could not compile: " + e.toString();
        }
        if (scheduler) {
            this.props.sources[this.state.schedulerIndex] = this.state.source;
            this.props.schedulers[this.state.schedulerIndex] = scheduler;
            this.props.onSchedulerChange(this.state.schedulerIndex);
        }
        this.setState(this.state);
    };
    Editor.prototype.onSourceChange = function (event) {
        this.state.source = event.target.value;
        this.setState(this.state);
    };
    Editor.prototype.onSchedulerIndexChange = function (event) {
        this.state.schedulerIndex = parseInt(event.target.value);
        this.state.source = this.props.sources[this.state.schedulerIndex];
        this.state.compileError = "";
        this.setState(this.state);
    };
    Editor.prototype.render = function () {
        var _this = this;
        return (React.createElement("div", null, React.createElement("p", null, "Scheduler: ", React.createElement("select", {"onChange": function (event) { return _this.onSchedulerIndexChange(event); }, "value": this.state.schedulerIndex.toString()}, this.props.schedulers.map(function (s, i) {
            return React.createElement("option", {"key": i, "value": i.toString()}, s.label());
        })), " ", React.createElement("button", {"onClick": function (event) { return _this.onApplyChanges(event); }}, "Apply changes")), React.createElement("div", null, React.createElement("textarea", {"style": { fontFamily: "monospace" }, "cols": 70, "rows": 25, "value": this.state.source, "onChange": function (event) { return _this.onSourceChange(event); }})), React.createElement("p", null, this.state.compileError)));
    };
    return Editor;
})(React.Component);
exports.Editor = Editor;
