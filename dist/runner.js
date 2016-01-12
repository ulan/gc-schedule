var GarbageCollection = (function () {
    function GarbageCollection(time, duration, heapBefore, heapAfter) {
        this.time = time;
        this.duration = duration;
        this.heapBefore = heapBefore;
        this.heapAfter = heapAfter;
    }
    return GarbageCollection;
})();
exports.GarbageCollection = GarbageCollection;
var Runner = (function () {
    function Runner(duration, gcSpeed, floatingGarbageRatio, mutator, scheduler) {
        this.mutator = mutator;
        this.scheduler = scheduler;
        this.duration = duration;
        this.time = 0;
        this.timeLimit = duration;
        this.timeInGC = 0;
        this.heap = 0;
        this.dead = 0;
        this.floatingGarbage = 0;
        this.heapLimit = 0;
        this.timeOfHeapLimit = duration;
        this.inGC = false;
        this.timeOfGC = 0;
        this.durationOfGC = 0;
        this.maxHeap = 0;
        this.avgHeap = 0;
        this.garbageCollections = [];
        this.gcSpeed = gcSpeed;
        this.floatingGarbageRatio = floatingGarbageRatio;
    }
    Runner.prototype.start = function () {
        this.scheduler.onStart(0, 0);
        this.updateLimits();
    };
    Runner.prototype.run = function (step) {
        var next = this.nextTime(step);
        while (next < this.duration) {
            this.advance(next);
            next = this.nextTime(step);
        }
    };
    Runner.prototype.nextTime = function (step) {
        var result = Math.min(this.time + step, this.duration);
        if (this.inGC) {
            result = Math.min(result, this.timeOfGC);
        }
        else {
            result = Math.min(result, this.timeLimit);
            result = Math.min(result, this.timeOfHeapLimit);
        }
        return result;
    };
    Runner.prototype.updateLimits = function () {
        if (this.scheduler.timeLimit <= this.time) {
            this.timeLimit = this.duration;
        }
        else {
            this.timeLimit = this.scheduler.timeLimit;
        }
        this.heapLimit = this.scheduler.heapLimit;
        if (this.scheduler.heapLimit <= this.heap) {
            this.timeOfHeapLimit = this.duration;
        }
        else {
            this.timeOfHeapLimit = this.findTimeToGrowHeapBy(this.heapLimit - this.heap);
        }
        if (this.timeLimit < this.time + 1) {
            this.timeLimit = this.time + 1;
        }
        if (this.timeOfHeapLimit < this.time + 1) {
            this.timeOfHeapLimit = this.time + 1;
        }
    };
    Runner.prototype.findTimeToGrowHeapBy = function (bytes) {
        var kMaxIterations = 20;
        var start = this.time;
        var lower = this.time;
        var upper = this.duration;
        var skip = this.timeInGC;
        for (var i = 0; i < kMaxIterations; i++) {
            var middle = (lower + upper) / 2;
            if (this.mutator.bornBetween(start - skip, middle - skip) < bytes) {
                lower = middle;
            }
            else {
                upper = middle;
            }
        }
        return upper;
    };
    Runner.prototype.advance = function (newTime) {
        if (this.inGC && this.timeOfGC > newTime) {
            this.avgHeap += (newTime - this.time) * (this.heap);
            this.time = newTime;
            return;
        }
        if (this.inGC) {
            var newFloatingGarbage = this.dead * this.floatingGarbageRatio;
            var actuallyDead = this.dead - newFloatingGarbage;
            var newHeap = this.heap - actuallyDead - this.floatingGarbage;
            this.floatingGarbage = newFloatingGarbage;
            this.dead = 0;
            this.avgHeap += (this.timeOfGC - this.time) * (this.heap);
            this.time = this.timeOfGC;
            this.scheduler.onGarbageCollection(this.timeOfGC, this.durationOfGC, this.heap, newHeap);
            this.garbageCollections.push(new GarbageCollection(this.timeOfGC - this.durationOfGC, this.durationOfGC, this.heap, newHeap));
            this.heap = newHeap;
            this.timeInGC += this.durationOfGC;
            this.timeOfGC = 0;
            this.durationOfGC = 0;
            this.inGC = false;
            this.updateLimits();
        }
        if (this.time < newTime) {
            var skip = this.timeInGC;
            var newBorn = this.mutator.bornBetween(this.time - skip, newTime - skip);
            var newDead = this.mutator.diedBetween(this.time - skip, newTime - skip);
            var newHeap = this.heap + newBorn;
            var avgHeap = (this.heap + this.heap + newBorn) / 2;
            this.avgHeap += (newTime - this.time) * avgHeap;
            this.heap = newHeap;
            this.maxHeap = Math.max(this.maxHeap, this.heap);
            this.dead += newDead;
            this.time = newTime;
            var gc = false;
            if (this.scheduler.heapLimit > 0 && this.scheduler.heapLimit <= newHeap) {
                gc = this.scheduler.onHeapLimit(newTime, newHeap);
            }
            if (this.scheduler.timeLimit > 0 && this.scheduler.timeLimit <= newTime) {
                gc = this.scheduler.onTimeLimit(newTime, newHeap) || gc;
            }
            if (gc) {
                this.inGC = true;
                this.durationOfGC = this.computeDurationOfGC(this.heap, this.dead);
                this.timeOfGC = this.time + this.durationOfGC;
                this.duration += this.durationOfGC;
            }
            this.updateLimits();
        }
    };
    Runner.prototype.averageHeap = function () {
        return this.avgHeap / this.time;
    };
    Runner.prototype.computeDurationOfGC = function (heap, dead) {
        return Math.max(1, heap / this.gcSpeed);
    };
    return Runner;
})();
exports.Runner = Runner;
