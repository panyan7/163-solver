# 163 Solver

TypeScript solver for the card game variant “163”, similar to “24”.  
Given six numbers you can combine them with addition, subtraction, multiplication, and division to make 163.

## Getting Started

Install dependencies (requires Node.js with `npm` available):

```bash
npm install
```

Run the example tests:

```bash
npm test
```

## Usage

```ts
import { findFirstSolution, findSolutions } from "./src/solver.js";

const numbers = [5, 8, 13, 4, 2, 1];
const first = findFirstSolution(numbers, { target: 163 });
console.log(first?.expression); // (5 + 8) * 13 - (4 + 2) * 1

const all = findSolutions(numbers, { target: 163, maxSolutions: 10 });
```