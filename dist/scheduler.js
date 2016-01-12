var FactorBasedScheduler = (function () {
    function FactorBasedScheduler(factor) {
        this.timeLimit = 0;
        this.heapLimit = 0;
        this.factor = factor;
    }
    FactorBasedScheduler.prototype.label = function () {
        return "Factor Based (" + this.factor.toString() + ")";
    };
    FactorBasedScheduler.prototype.onStart = function (time, heap) {
        this.timeLimit = 0;
        this.heapLimit = Math.max(30000, heap * this.factor);
    };
    FactorBasedScheduler.prototype.onHeapLimit = function (time, heap) {
        return true;
    };
    FactorBasedScheduler.prototype.onTimeLimit = function (time, heap) {
        throw "unreachable";
    };
    FactorBasedScheduler.prototype.onGarbageCollection = function (time, duration, heapBefore, heapAfter) {
        this.heapLimit = heapAfter * this.factor;
    };
    return FactorBasedScheduler;
})();
var PeriodicScheduler = (function () {
    function PeriodicScheduler(period) {
        this.timeLimit = 0;
        this.heapLimit = 0;
        this.period = period;
    }
    PeriodicScheduler.prototype.label = function () {
        return "Periodic (" + this.period.toString() + ")";
    };
    PeriodicScheduler.prototype.onStart = function (time, heap) {
        this.timeLimit = time + this.period;
        this.heapLimit = 0;
    };
    PeriodicScheduler.prototype.onHeapLimit = function (time, heap) {
        throw "unreachable";
    };
    PeriodicScheduler.prototype.onTimeLimit = function (time, heap) {
        return true;
    };
    PeriodicScheduler.prototype.onGarbageCollection = function (time, duration, heapBefore, heapAfter) {
        this.timeLimit = time + this.period;
    };
    return PeriodicScheduler;
})();
var TimeBasedScheduler = (function () {
    function TimeBasedScheduler(period) {
        this.timeLimit = 0;
        this.heapLimit = 0;
        this.period = period;
    }
    TimeBasedScheduler.prototype.label = function () {
        return "Time Based (" + this.period.toString() + ")";
    };
    TimeBasedScheduler.prototype.onStart = function (time, heap) {
        this.timeLimit = time + this.period;
        this.heapLimit = 0;
    };
    TimeBasedScheduler.prototype.onHeapLimit = function (time, heap) {
        throw "unreachable";
    };
    TimeBasedScheduler.prototype.onTimeLimit = function (time, heap) {
        return true;
    };
    TimeBasedScheduler.prototype.onGarbageCollection = function (time, duration, heapBefore, heapAfter) {
        var survived = heapAfter / heapBefore * 100;
        if (survived > 90) {
            this.period = this.period * 2;
        }
        else if (survived > 70) {
            this.period = this.period * 1.5;
        }
        else if (survived < 30) {
            this.period = this.period * 0.75;
        }
        this.timeLimit = time + this.period;
    };
    return TimeBasedScheduler;
})();
function factorBased(factor) {
    return new FactorBasedScheduler(factor);
}
exports.factorBased = factorBased;
function periodic(period) {
    return new PeriodicScheduler(period);
}
exports.periodic = periodic;
function timeBased(period) {
    return new TimeBasedScheduler(period);
}
exports.timeBased = timeBased;
