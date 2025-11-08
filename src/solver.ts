type Fraction = {
  numerator: number;
  denominator: number;
};

type Term = {
  value: Fraction;
  expression: string;
};

export type Solution = {
  expression: string;
  value: number;
};

export type SolverOptions = {
  target: number;
  maxSolutions?: number;
};

const MAX_SOLUTIONS_DEFAULT = Infinity;

const ZERO_THRESHOLD = 1e-10;

function makeFraction(numerator: number, denominator = 1): Fraction {
  if (denominator === 0) {
    throw new Error("Denominator cannot be zero");
  }

  if (numerator === 0) {
    return { numerator: 0, denominator: 1 };
  }

  const sign = Math.sign(denominator);
  const normalizedNumerator = sign * numerator;
  const normalizedDenominator = Math.abs(denominator);

  const divisor = gcd(Math.abs(normalizedNumerator), normalizedDenominator);

  return {
    numerator: normalizedNumerator / divisor,
    denominator: normalizedDenominator / divisor,
  };
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);

  while (y !== 0) {
    const temp = y;
    y = x % y;
    x = temp;
  }

  return x;
}

function addFractions(a: Fraction, b: Fraction): Fraction {
  const numerator = a.numerator * b.denominator + b.numerator * a.denominator;
  const denominator = a.denominator * b.denominator;
  return makeFraction(numerator, denominator);
}

function subtractFractions(a: Fraction, b: Fraction): Fraction {
  const numerator = a.numerator * b.denominator - b.numerator * a.denominator;
  const denominator = a.denominator * b.denominator;
  return makeFraction(numerator, denominator);
}

function multiplyFractions(a: Fraction, b: Fraction): Fraction {
  const numerator = a.numerator * b.numerator;
  const denominator = a.denominator * b.denominator;
  return makeFraction(numerator, denominator);
}

function divideFractions(a: Fraction, b: Fraction): Fraction | null {
  if (Math.abs(b.numerator) < ZERO_THRESHOLD) {
    return null;
  }

  const numerator = a.numerator * b.denominator;
  const denominator = a.denominator * b.numerator;
  if (Math.abs(denominator) < ZERO_THRESHOLD) {
    return null;
  }

  return makeFraction(numerator, denominator);
}

function fractionsEqual(a: Fraction, b: Fraction): boolean {
  return a.numerator === b.numerator && a.denominator === b.denominator;
}

function fractionToNumber(f: Fraction): number {
  return f.numerator / f.denominator;
}

function fractionToString(f: Fraction): string {
  if (f.denominator === 1) {
    return `${f.numerator}`;
  }
  return `${f.numerator}/${f.denominator}`;
}

function combineTerms(a: Term, b: Term): Term[] {
  const results: Term[] = [];

  // Addition (commutative)
  const add = addFractions(a.value, b.value);
  results.push({
    value: add,
    expression: `(${a.expression} + ${b.expression})`,
  });

  // Multiplication (commutative)
  const mult = multiplyFractions(a.value, b.value);
  results.push({
    value: mult,
    expression: `(${a.expression} * ${b.expression})`,
  });

  // Subtraction (non-commutative)
  const subAB = subtractFractions(a.value, b.value);
  results.push({
    value: subAB,
    expression: `(${a.expression} - ${b.expression})`,
  });
  const subBA = subtractFractions(b.value, a.value);
  results.push({
    value: subBA,
    expression: `(${b.expression} - ${a.expression})`,
  });

  // Division (non-commutative)
  const divAB = divideFractions(a.value, b.value);
  if (divAB) {
    results.push({
      value: divAB,
      expression: `(${a.expression} / ${b.expression})`,
    });
  }
  const divBA = divideFractions(b.value, a.value);
  if (divBA) {
    results.push({
      value: divBA,
      expression: `(${b.expression} / ${a.expression})`,
    });
  }

  return results;
}

function makeInitialTerms(numbers: number[]): Term[] {
  return numbers.map((num, index) => ({
    value: makeFraction(num),
    expression: `${num}`,
  }));
}

export function findSolutions(
  numbers: number[],
  options: SolverOptions
): Solution[] {
  const targetValue = options.target;
  const maxSolutions = options.maxSolutions ?? MAX_SOLUTIONS_DEFAULT;

  if (!Array.isArray(numbers) || numbers.length === 0) {
    throw new Error("The numbers array must contain at least one entry.");
  }
  if (!Number.isFinite(targetValue)) {
    throw new Error("Target must be a finite number.");
  }
  if (maxSolutions <= 0) {
    throw new Error("maxSolutions must be greater than zero.");
  }

  const targetFraction = makeFraction(targetValue);
  const initialTerms = makeInitialTerms(numbers);
  const solutions: Solution[] = [];
  const seenExpressions = new Set<string>();

  searchSolutions(initialTerms, targetFraction, maxSolutions, solutions, seenExpressions);

  return solutions;
}

export function findFirstSolution(
  numbers: number[],
  options: SolverOptions
): Solution | null {
  const solutions = findSolutions(numbers, { target: options.target, maxSolutions: 1 });
  return solutions.length > 0 ? solutions[0] : null;
}

function searchSolutions(
  terms: Term[],
  target: Fraction,
  maxSolutions: number,
  solutions: Solution[],
  seenExpressions: Set<string>
): void {
  if (solutions.length >= maxSolutions) {
    return;
  }

  if (terms.length === 1) {
    if (fractionsEqual(terms[0].value, target)) {
      const normalizedExpression = normalizeExpression(terms[0].expression);
      if (!seenExpressions.has(normalizedExpression)) {
        seenExpressions.add(normalizedExpression);
        solutions.push({
          expression: normalizedExpression,
          value: fractionToNumber(terms[0].value),
        });
      }
    }
    return;
  }

  for (let i = 0; i < terms.length; i += 1) {
    for (let j = i + 1; j < terms.length; j += 1) {
      const first = terms[i];
      const second = terms[j];

      const remaining: Term[] = [];
      for (let k = 0; k < terms.length; k += 1) {
        if (k !== i && k !== j) {
          remaining.push(terms[k]);
        }
      }

      const combinedTerms = combineTerms(first, second);
      for (const next of combinedTerms) {
        if (solutions.length >= maxSolutions) {
          return;
        }
        searchSolutions([...remaining, next], target, maxSolutions, solutions, seenExpressions);
      }
    }
  }
}

function normalizeExpression(expression: string): string {
  // Remove redundant outer parentheses if present.
  let result = expression.trim();
  while (result.startsWith("(") && result.endsWith(")")) {
    const candidate = result.slice(1, -1);
    if (isBalanced(candidate)) {
      result = candidate.trim();
    } else {
      break;
    }
  }
  return result;
}

function isBalanced(expression: string): boolean {
  let balance = 0;
  for (const char of expression) {
    if (char === "(") {
      balance += 1;
    } else if (char === ")") {
      balance -= 1;
      if (balance < 0) {
        return false;
      }
    }
  }
  return balance === 0;
}

