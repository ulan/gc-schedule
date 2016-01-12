import chai = require("chai");

import Mutator = require("./mutator");

let expect = chai.expect;

describe("Mutator Tests", () => {
    it("should create", () => {
      let simple = Mutator.create(6, [1, 2, 3, 0, 0, 1], [0, 0, 0, 1, 2, 3]);
      expect(simple.bornBetween(0, 0)).to.equals(0);
      expect(simple.bornBetween(0, 0.5)).to.equals(0.5);
      expect(simple.bornBetween(0.5, 0.75)).to.equals(0.25);
      expect(simple.bornBetween(0.5, 1.5)).to.equals(1.5);
      expect(simple.bornBetween(0, 1)).to.equals(1);
      expect(simple.bornBetween(0, 6)).to.equals(7);
      expect(simple.bornBetween(1, 2)).to.equals(2);
      expect(simple.bornBetween(2, 3)).to.equals(3);
      expect(simple.bornBetween(5.5, 6)).to.equals(0.5);
      expect(simple.bornBetween(6, 10)).to.equals(0);
      expect(simple.diedBetween(0, 6)).to.equals(6);
      expect(simple.diedBetween(3, 4)).to.equals(1);
    });
    it("should repeat", () => {
      let simple = Mutator.create(6, [1, 2, 3, 0, 0, 1], [0, 0, 0, 1, 2, 3]);
      let repeated = Mutator.repeat(10, simple);
      expect(repeated.bornBetween(0, 0)).to.equals(0);
      expect(repeated.bornBetween(0, 12)).to.equals(14);
      expect(repeated.bornBetween(6, 7)).to.equals(1);
      expect(repeated.bornBetween(5, 7)).to.equals(2);
      expect(repeated.bornBetween(5.5, 6.5)).to.equals(1);
      expect(repeated.bornBetween(5.5, 11.5)).to.equals(7);
      expect(repeated.bornBetween(5.5, 12.5)).to.equals(8);
      expect(repeated.diedBetween(0, 60)).to.equals(60);
      expect(repeated.diedBetween(0, 80)).to.equals(60);
    });
    it("should shift", () => {
      let simple = Mutator.create(6, [1, 2, 3, 0, 0, 1], [0, 0, 0, 1, 2, 3]);
      let repeated = Mutator.shift(1, simple);
      expect(repeated.bornBetween(0, 0)).to.equals(0);
      expect(repeated.bornBetween(0, 7)).to.equals(7);
      expect(repeated.bornBetween(0, 1)).to.equals(0);
      expect(repeated.bornBetween(0.5, 1.5)).to.equals(0.5);
      expect(repeated.diedBetween(0.5, 1.5)).to.equals(0);
    });
    it("should scale", () => {
      let simple = Mutator.create(6, [1, 2, 3, 0, 0, 1], [0, 0, 0, 1, 2, 3]);
      let repeated = Mutator.scale(2, simple);
      expect(repeated.bornBetween(0, 0)).to.equals(0);
      expect(repeated.bornBetween(0, 6)).to.equals(6);
      expect(repeated.bornBetween(0, 12)).to.equals(7);
      expect(repeated.bornBetween(6, 12)).to.equals(1);
      expect(repeated.bornBetween(2, 4)).to.equals(2);
      expect(repeated.bornBetween(1, 5)).to.equals(4);
      expect(repeated.diedBetween(6, 8)).to.equals(1);
    });
    it("should add", () => {
      let simple = Mutator.create(6, [1, 2, 3, 0, 0, 1], [0, 0, 0, 1, 2, 3]);
      let added = Mutator.add(simple, simple);
      expect(added.bornBetween(0, 6)).to.equals(14);
      expect(added.bornBetween(0, 1)).to.equals(2);
      expect(added.bornBetween(0, 0.5)).to.equals(1);
      expect(added.diedBetween(3, 5)).to.equals(6);
    });

});
