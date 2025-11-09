type Fraction = {
  numerator: number;
  denominator: number;
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

interface ExpressionNode {
  readonly fraction: Fraction;
  repr(): string;
}

class NumericExpression implements ExpressionNode {
  readonly fraction: Fraction;
  private readonly display: string;

  constructor(value: number) {
    this.fraction = makeFraction(value);
    this.display = formatNumber(value);
  }

  repr(): string {
    return this.display;
  }
}

class AddGroup implements ExpressionNode {
  readonly fraction: Fraction;
  readonly positives: ExpressionNode[];
  readonly negatives: ExpressionNode[];

  constructor(positives: ExpressionNode[], negatives: ExpressionNode[]) {
    this.positives = [...positives];
    this.negatives = [...negatives];
    this.fraction = calculateAddGroupFraction(this.positives, this.negatives);
  }

  repr(): string {
    const positives = sortExpressions(this.positives);
    const negatives = sortExpressions(this.negatives);
    const parts: string[] = [];

    for (const expr of positives) {
      parts.push(`+${expr.repr()}`);
    }

    for (const expr of negatives) {
      const needsParens = expr instanceof AddGroup;
      const repr = needsParens ? `(${expr.repr()})` : expr.repr();
      parts.push(`-${repr}`);
    }

    const result = parts.join("");
    return result.startsWith("+") ? result.slice(1) : result;
  }
}

class MulGroup implements ExpressionNode {
  readonly fraction: Fraction;
  readonly positives: ExpressionNode[];
  readonly negatives: ExpressionNode[];

  constructor(positives: ExpressionNode[], negatives: ExpressionNode[]) {
    this.positives = [...positives];
    this.negatives = [...negatives];
    const value = calculateMulGroupFraction(this.positives, this.negatives);
    if (!value) {
      throw new Error("Invalid multiplication group with division by zero");
    }
    this.fraction = value;
  }

  repr(): string {
    const positives = sortExpressions(this.positives);
    const negatives = sortExpressions(this.negatives);
    const parts: string[] = [];

    for (const expr of positives) {
      const repr = expr instanceof NumericExpression ? expr.repr() : `(${expr.repr()})`;
      parts.push(`*${repr}`);
    }

    for (const expr of negatives) {
      const repr = expr instanceof NumericExpression ? expr.repr() : `(${expr.repr()})`;
      parts.push(`/${repr}`);
    }

    const combined = parts.join("");
    return combined.startsWith("*") ? combined.slice(1) : combined;
  }
}

function formatNumber(value: number): string {
  if (Number.isInteger(value)) {
    return value.toString();
  }
  return value.toString();
}

function calculateAddGroupFraction(
  positives: ExpressionNode[],
  negatives: ExpressionNode[]
): Fraction {
  let result = makeFraction(0);
  for (const expr of positives) {
    result = addFractions(result, expr.fraction);
  }
  for (const expr of negatives) {
    result = subtractFractions(result, expr.fraction);
  }
  return result;
}

function calculateMulGroupFraction(
  positives: ExpressionNode[],
  negatives: ExpressionNode[]
): Fraction | null {
  let result = makeFraction(1);
  for (const expr of positives) {
    result = multiplyFractions(result, expr.fraction);
  }
  for (const expr of negatives) {
    const divided = divideFractions(result, expr.fraction);
    if (!divided) {
      return null;
    }
    result = divided;
  }
  return result;
}

function compareFractions(a: Fraction, b: Fraction): number {
  const diff = a.numerator * b.denominator - b.numerator * a.denominator;
  if (diff < 0) {
    return -1;
  }
  if (diff > 0) {
    return 1;
  }
  return 0;
}

function compareExpressions(a: ExpressionNode, b: ExpressionNode): number {
  const valueComparison = compareFractions(a.fraction, b.fraction);
  if (valueComparison !== 0) {
    return valueComparison;
  }
  const reprComparison = a.repr().localeCompare(b.repr());
  return reprComparison;
}

function sortExpressions(expressions: ExpressionNode[]): ExpressionNode[] {
  return [...expressions].sort(compareExpressions);
}

function joinAddGroup(
  first: ExpressionNode,
  second: ExpressionNode,
  negateSecond: boolean
): AddGroup {
  const positives: ExpressionNode[] = [];
  const negatives: ExpressionNode[] = [];

  if (first instanceof AddGroup) {
    positives.push(...first.positives);
    negatives.push(...first.negatives);
  } else {
    positives.push(first);
  }

  if (second instanceof AddGroup) {
    if (negateSecond) {
      positives.push(...second.negatives);
      negatives.push(...second.positives);
    } else {
      positives.push(...second.positives);
      negatives.push(...second.negatives);
    }
  } else if (negateSecond) {
    negatives.push(second);
  } else {
    positives.push(second);
  }

  return new AddGroup(positives, negatives);
}

function joinMulGroup(
  first: ExpressionNode,
  second: ExpressionNode,
  invertSecond: boolean
): MulGroup | null {
  const positives: ExpressionNode[] = [];
  const negatives: ExpressionNode[] = [];

  if (first instanceof MulGroup) {
    positives.push(...first.positives);
    negatives.push(...first.negatives);
  } else {
    positives.push(first);
  }

  if (second instanceof MulGroup) {
    if (invertSecond) {
      positives.push(...second.negatives);
      negatives.push(...second.positives);
    } else {
      positives.push(...second.positives);
      negatives.push(...second.negatives);
    }
  } else if (invertSecond) {
    negatives.push(second);
  } else {
    positives.push(second);
  }

  const value = calculateMulGroupFraction(positives, negatives);
  if (!value) {
    return null;
  }
  return new MulGroup(positives, negatives);
}

function makeInitialExpressions(numbers: number[]): ExpressionNode[] {
  return numbers.map((num) => new NumericExpression(num));
}

function combineExpressions(
  first: ExpressionNode,
  second: ExpressionNode
): ExpressionNode[] {
  const results: ExpressionNode[] = [];

  // Addition (commutative)
  results.push(joinAddGroup(first, second, false));

  // Multiplication (commutative)
  const product = joinMulGroup(first, second, false);
  if (product) {
    results.push(product);
  }

  // Subtraction (non-commutative)
  results.push(joinAddGroup(first, second, true));
  results.push(joinAddGroup(second, first, true));

  // Division (non-commutative)
  const divisionForward = joinMulGroup(first, second, true);
  if (divisionForward) {
    results.push(divisionForward);
  }
  const divisionBackward = joinMulGroup(second, first, true);
  if (divisionBackward) {
    results.push(divisionBackward);
  }

  return results;
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
  const initialTerms = makeInitialExpressions(numbers);
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
  terms: ExpressionNode[],
  target: Fraction,
  maxSolutions: number,
  solutions: Solution[],
  seenExpressions: Set<string>
): void {
  if (solutions.length >= maxSolutions) {
    return;
  }

  if (terms.length === 1 && fractionsEqual(terms[0].fraction, target)) {
    const representation = terms[0].repr();
    if (!seenExpressions.has(representation)) {
      seenExpressions.add(representation);
      solutions.push({
        expression: representation,
        value: fractionToNumber(terms[0].fraction),
      });
    }
    return;
  }

  for (let i = 0; i < terms.length; i += 1) {
    for (let j = i + 1; j < terms.length; j += 1) {
      const first = terms[i];
      const second = terms[j];

      const remaining: ExpressionNode[] = [];
      for (let k = 0; k < terms.length; k += 1) {
        if (k !== i && k !== j) {
          remaining.push(terms[k]);
        }
      }

      const combinedTerms = combineExpressions(first, second);
      for (const next of combinedTerms) {
        if (solutions.length >= maxSolutions) {
          return;
        }
        searchSolutions([...remaining, next], target, maxSolutions, solutions, seenExpressions);
      }
    }
  }
}

