function sum(f, xs) {
    var result = 0;
    for (var i = 0; i < xs.length; i++) {
        result += f(xs[i]);
    }
    return result;
}
var LoggedMutator = (function () {
    function LoggedMutator(time, born, died, label) {
        this.time = time;
        this.steps = this.time.length;
        var n = this.steps;
        this.duration = this.time[n - 1];
        this.sumBorn = [born[0]];
        for (var i = 1; i < n; i++) {
            this.sumBorn.push(this.sumBorn[i - 1] + born[i]);
        }
        this.sumBorn.push(this.sumBorn[n - 1]);
        this.sumDied = [died[0]];
        for (var i = 1; i < n; i++) {
            this.sumDied.push(this.sumDied[i - 1] + died[i]);
        }
        this.sumDied.push(this.sumDied[n - 1]);
        this.totalBorn = this.sumBorn[n];
        this.totalDied = this.sumDied[n];
        this.label = label;
    }
    LoggedMutator.prototype.findTime = function (time) {
        if (time >= this.time[this.steps - 1]) {
            return { index: this.steps - 1, remainder: 0 };
        }
        var lower = 0, upper = this.steps - 1;
        while (lower + 1 < upper) {
            var middle = (lower + upper) >> 1;
            if (this.time[middle] <= time) {
                lower = middle;
            }
            else {
                upper = middle;
            }
        }
        // this.log[lower].time <= time < this.log[upper].time
        var lowerTime = this.time[lower];
        var upperTime = this.time[upper];
        var remainder = (time - lowerTime) / (upperTime - lowerTime);
        return { index: lower, remainder: remainder };
    };
    LoggedMutator.prototype.before = function (sums, time) {
        var over = sums[time.index + 1] - sums[time.index];
        return sums[time.index] + over * time.remainder;
    };
    LoggedMutator.prototype.bornBetween = function (fromTime, toTime) {
        var fr = this.before(this.sumBorn, this.findTime(fromTime));
        var to = this.before(this.sumBorn, this.findTime(toTime));
        return to - fr;
    };
    LoggedMutator.prototype.diedBetween = function (fromTime, toTime) {
        var fr = this.before(this.sumDied, this.findTime(fromTime));
        var to = this.before(this.sumDied, this.findTime(toTime));
        return to - fr;
    };
    return LoggedMutator;
})();
var RepeatedMutator = (function () {
    function RepeatedMutator(repeat, mutator) {
        this.mutator = mutator;
        this.duration = mutator.duration * repeat;
        this.totalBorn = mutator.totalBorn * repeat;
        this.totalDied = mutator.totalDied * repeat;
        this.label = mutator.label + "*";
    }
    RepeatedMutator.prototype.bornBetween = function (fromTime, toTime) {
        if (fromTime >= this.duration)
            return 0;
        toTime = Math.min(toTime, this.duration);
        var f = this.mutator.bornBetween.bind(this.mutator);
        return this.compute(f, this.mutator.totalBorn, fromTime, toTime);
    };
    RepeatedMutator.prototype.diedBetween = function (fromTime, toTime) {
        if (fromTime >= this.duration)
            return 0;
        toTime = Math.min(toTime, this.duration);
        var f = this.mutator.diedBetween.bind(this.mutator);
        return this.compute(f, this.mutator.totalDied, fromTime, toTime);
    };
    RepeatedMutator.prototype.compute = function (f, totalPerCycle, fromTime, toTime) {
        var period = this.mutator.duration;
        var fromCycle = Math.floor(fromTime / period);
        var fromRemainder = fromTime - fromCycle * period;
        var toCycle = Math.floor(toTime / period);
        var toRemainder = toTime - toCycle * period;
        if (fromCycle === toCycle) {
            return f(fromRemainder, toRemainder);
        }
        else {
            var fullCycles = toCycle - fromCycle - 1;
            return fullCycles * totalPerCycle + f(fromRemainder, period) + f(0, toRemainder);
        }
    };
    return RepeatedMutator;
})();
var ShiftedMutator = (function () {
    function ShiftedMutator(shift, mutator) {
        this.mutator = mutator;
        this.shift = shift;
        this.duration = mutator.duration + shift;
        this.totalBorn = mutator.totalBorn;
        this.totalDied = mutator.totalDied;
        this.label = mutator.label;
    }
    ShiftedMutator.prototype.bornBetween = function (fromTime, toTime) {
        fromTime = Math.max(0, fromTime - this.shift);
        toTime = Math.max(0, toTime - this.shift);
        return this.mutator.bornBetween(fromTime, toTime);
    };
    ShiftedMutator.prototype.diedBetween = function (fromTime, toTime) {
        fromTime = Math.max(0, fromTime - this.shift);
        toTime = Math.min(toTime, this.duration);
        return this.mutator.diedBetween(fromTime, toTime);
    };
    return ShiftedMutator;
})();
var ScaledMutator = (function () {
    function ScaledMutator(scale, mutator) {
        this.mutator = mutator;
        this.scale = scale;
        this.duration = mutator.duration * scale;
        this.totalBorn = mutator.totalBorn;
        this.totalDied = mutator.totalDied;
        this.label = mutator.label;
    }
    ScaledMutator.prototype.bornBetween = function (fromTime, toTime) {
        fromTime = fromTime / this.scale;
        toTime = toTime / this.scale;
        return this.mutator.bornBetween(fromTime, toTime);
    };
    ScaledMutator.prototype.diedBetween = function (fromTime, toTime) {
        fromTime = fromTime / this.scale;
        toTime = toTime / this.scale;
        return this.mutator.diedBetween(fromTime, toTime);
    };
    return ScaledMutator;
})();
var AddedMutator = (function () {
    function AddedMutator(mutators) {
        this.mutators = mutators;
        this.totalBorn = sum(function (x) { return x.totalBorn; }, mutators);
        this.totalDied = sum(function (x) { return x.totalDied; }, mutators);
        this.label = mutators.map(function (x) { return x.label; }).join(", ");
    }
    AddedMutator.prototype.bornBetween = function (fromTime, toTime) {
        return sum(function (x) { return x.bornBetween(fromTime, toTime); }, this.mutators);
    };
    AddedMutator.prototype.diedBetween = function (fromTime, toTime) {
        return sum(function (x) { return x.diedBetween(fromTime, toTime); }, this.mutators);
    };
    return AddedMutator;
})();
function create(duration, born, died) {
    var n = born.length;
    var interval = duration / n;
    var time = [];
    for (var i = 0; i <= n; i++) {
        time.push(interval * i);
    }
    return new LoggedMutator(time, [0].concat(born), [0].concat(died), "");
}
exports.create = create;
var LogEntry = (function () {
    function LogEntry() {
    }
    return LogEntry;
})();
function fromJSON(json, label) {
    var entries = JSON.parse(json).data;
    var time = entries.map(function (x) { return x.time; });
    var born = entries.map(function (x) { return x.born; });
    var died = entries.map(function (x) { return x.died; });
    return new LoggedMutator(time, born, died, label);
}
exports.fromJSON = fromJSON;
function fromLog(data, label) {
    var entries = data.data;
    var time = entries.map(function (x) { return x.time; });
    var born = entries.map(function (x) { return x.born; });
    var died = entries.map(function (x) { return x.died; });
    return new LoggedMutator(time, born, died, label);
}
exports.fromLog = fromLog;
function repeat(repeatCount, mutator) {
    return new RepeatedMutator(repeatCount, mutator);
}
exports.repeat = repeat;
function shift(shiftTime, mutator) {
    return new ShiftedMutator(shiftTime, mutator);
}
exports.shift = shift;
function scale(scaleTime, mutator) {
    return new ScaledMutator(scaleTime, mutator);
}
exports.scale = scale;
function add(mutator1, mutator2) {
    var mutators = [mutator1, mutator2];
    return new AddedMutator(mutators);
}
exports.add = add;
