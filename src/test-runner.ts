import chai = require("chai");

import Mutator = require("./mutator");
import Scheduler = require("./scheduler");
import {Runner} from "./runner";

let expect = chai.expect;

describe("Runner Tests", () => {
    it("should run 1", () => {
      let simple = Mutator.create(6, [1, 2, 3, 0, 0, 1], [0, 0, 0, 1, 2, 3]);
      let scheduler = Scheduler.periodic(2);
      let runner = new Runner(6, 1, 0.0, simple, scheduler);
      runner.start();
      expect(runner.nextTime(100)).to.equals(2);
      runner.advance(2);
      expect(runner.nextTime(100)).to.equals(5);
      runner.advance(5);
      expect(runner.nextTime(100)).to.equals(7);
      runner.advance(7);
      expect(runner.nextTime(100)).to.equals(13);
      expect(runner.heap).to.equals(6);
      runner.advance(13);
      expect(runner.heap).to.equals(5);
      expect(runner.nextTime(100)).to.equals(15);
      runner.advance(15);
      expect(runner.heap).to.equals(6);
      expect(runner.timeInGC).to.equals(9);
      expect(runner.nextTime(100)).to.equals(21);
      runner.advance(21);
      expect(runner.timeInGC).to.equals(15);
      expect(runner.nextTime(100)).to.equals(21);
      expect(runner.heap).to.equals(1);
    });
    it("should run 1", () => {
      let simple = Mutator.create(6, [1, 2, 3, 0, 0, 1], [0, 0, 0, 1, 2, 3]);
      let scheduler = Scheduler.periodic(2);
      let runner = new Runner(6, 1, 0.0, simple, scheduler);
      runner.start();
      expect(runner.nextTime(1)).to.equals(1);
      runner.advance(1);
      expect(runner.heap).to.equals(1);
      expect(runner.nextTime(1)).to.equals(2);
      runner.advance(2);
      expect(runner.heap).to.equals(3);
      expect(runner.nextTime(1)).to.equals(3);
      runner.advance(3);
      expect(runner.heap).to.equals(3);
      expect(runner.nextTime(1)).to.equals(4);
      runner.advance(4);
      expect(runner.heap).to.equals(3);
      expect(runner.nextTime(1)).to.equals(5);
      runner.advance(5);
      expect(runner.heap).to.equals(3);
      expect(runner.nextTime(1)).to.equals(6);
      runner.advance(6);
      expect(runner.heap).to.equals(6);
    });
});
