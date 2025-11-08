import { findFirstSolution, findSolutions } from "../src/solver.js";

function run() {
  testFindFirstSolution();
  testFindSolutions();
  testFindSolutionsLimit();
  testUnsolvableInput();
  console.log("All tests passed.");
}

function testFindFirstSolution() {
  const numbers = [5, 8, 13, 4, 2, 1];
  const solution = findFirstSolution(numbers, { target: 163 });
  assertTruthy(solution, "Expected at least one solution");
  assertEqual(solution?.value, 163, "Solution should equal 163");
}

function testFindSolutions() {
  const numbers = [5, 8, 13, 4, 2, 1];
  const solutions = findSolutions(numbers, { target: 163 });
  assertTruthy(solutions.length > 0, "Expected at least one solution");
  console.log(solutions);
}

function testFindSolutionsLimit() {
  const numbers = [5, 8, 13, 4, 2, 1];
  const solutions = findSolutions(numbers, { target: 163, maxSolutions: 1 });
  assertEqual(solutions.length, 1, "Should respect maxSolutions limit");
  console.log(solutions);
}

function testUnsolvableInput() {
  const numbers = [1, 1, 1, 1, 1, 1];
  const solution = findFirstSolution(numbers, { target: 163 });
  assertEqual(solution, null, "Unsolvable input should return null");
}

function assertTruthy<T>(value: T, message: string): asserts value {
  if (!value) {
    throw new Error(message);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}. Expected ${expected} but received ${actual}.`);
  }
}

run();

