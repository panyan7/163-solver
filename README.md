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

## Web UI

A browser-based playable version lives in `web/`. Build the TypeScript bundle:

```bash
npm run build:web
```

Then open `web/index.html` in a browser (or serve the `web/` folder with any static file server) to play either 163 mode (six cards) or 24 mode (four cards). Each deal draws cards uniformly from a standard 52-card deck.

## Usage

```ts
import { findFirstSolution, findSolutions } from "./src/solver.js";

const numbers = [5, 8, 13, 4, 2, 1];
const first = findFirstSolution(numbers, { target: 163 });
console.log(first?.expression); // (5 + 8) * 13 - (4 + 2) * 1

const all = findSolutions(numbers, { target: 163, maxSolutions: 10 });
```