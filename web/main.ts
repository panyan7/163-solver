type GameMode = "163" | "24";
type Operation = "+" | "-" | "*" | "/";

const NUMBERS_PER_MODE: Record<GameMode, number> = {
  "163": 6,
  "24": 4,
};

const TARGET_PER_MODE: Record<GameMode, number> = {
  "163": 163,
  "24": 24,
};

const operations: Operation[] = ["+", "-", "*", "/"];

type GameState = {
  mode: GameMode;
  numbers: number[];
  initialNumbers: number[];
  history: string[];
  selectedIndices: number[];
  selectedOperation: Operation | null;
  status: "idle" | "success" | "error";
  statusMessage: string;
};

const numbersContainer = document.getElementById("numbers-container") as HTMLElement;
const operationsContainer = document.getElementById("operations-container") as HTMLElement;
const statusContainer = document.getElementById("status-message") as HTMLElement | null;
const historyList = document.getElementById("history-list") as HTMLOListElement;
const targetDisplay = document.getElementById("target-value") as HTMLElement;
const newGameButton = document.getElementById("new-game") as HTMLButtonElement | null;
const restartButton = document.getElementById("restart-game") as HTMLButtonElement | null;
const modeInputs = document.querySelectorAll<HTMLInputElement>('input[name="mode"]');

let state: GameState = {
  mode: "163",
  numbers: [],
  initialNumbers: [],
  history: [],
  selectedIndices: [],
  selectedOperation: null,
  status: "idle",
  statusMessage: "Click two numbers, then choose an operation.",
};

if (document.readyState === "loading") {
  console.log("[game] waiting for DOMContentLoaded");
  document.addEventListener("DOMContentLoaded", () => {
    console.log("[game] DOMContentLoaded");
    initialize();
  });
} else {
  console.log("[game] DOM already ready");
  initialize();
}

function initialize(): void {
  console.log("[game] initialize()");
  setupOperationButtons();
  setupModeToggle();
  console.log("[game] buttons", {
    hasNew: !!newGameButton,
    hasRestart: !!restartButton,
  });
  newGameButton?.addEventListener("click", () => {
    console.log("[game] New Deal clicked");
    resetState(state.mode);
  });
  restartButton?.addEventListener("click", () => {
    console.log("[game] Restart clicked");
    restartSameHand();
  });
  resetState(state.mode);
}

function setupModeToggle(): void {
  modeInputs.forEach((input) => {
    input.addEventListener("change", () => {
      if (input.checked) {
        const newMode = input.value as GameMode;
        resetState(newMode);
      }
    });
  });
}

function setupOperationButtons(): void {
  operationsContainer.innerHTML = "";
  for (const op of operations) {
    const button = document.createElement("button");
    button.className = "operation-btn";
    button.textContent = op;
    button.addEventListener("click", () => handleOperationClick(op, button));
    operationsContainer.appendChild(button);
  }
}

function resetState(mode: GameMode): void {
  const cards = drawCards(mode);
  console.log("[game] resetState()", { mode, cards });
  state = {
    mode,
    numbers: cards,
    initialNumbers: [...cards],
    history: [],
    selectedIndices: [],
    selectedOperation: null,
    status: "idle",
    statusMessage: "Click two numbers, then choose an operation.",
  };
  targetDisplay.textContent = TARGET_PER_MODE[mode].toString();
  render();
}

function restartSameHand(): void {
  console.log("[game] restartSameHand()", { initial: state.initialNumbers });
  const cards = state.initialNumbers.length ? [...state.initialNumbers] : drawCards(state.mode);
  state.numbers = cards;
  state.history = [];
  state.selectedIndices = [];
  state.selectedOperation = null;
  state.status = "idle";
  state.statusMessage = "Click two numbers, then choose an operation.";
  render();
}

function drawCards(mode: GameMode): number[] {
  const deck = createDeck();
  shuffle(deck);
  return deck.slice(0, NUMBERS_PER_MODE[mode]);
}

function createDeck(): number[] {
  const deck: number[] = [];
  for (let value = 1; value <= 13; value += 1) {
    for (let suit = 0; suit < 4; suit += 1) {
      deck.push(value);
    }
  }
  return deck;
}

function shuffle(values: number[]): void {
  for (let i = values.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }
}

function handleNumberClick(index: number): void {
  console.log("[game] number click", { index, value: state.numbers[index] });
  if (state.status === "success") {
    return;
  }

  // If no operation is selected, only allow selecting a single number at a time.
  if (!state.selectedOperation) {
    const current = state.selectedIndices[0];
    if (current === index) {
      // Clicking the same number toggles it off
      state.selectedIndices = [];
    } else {
      // Replace previous selection with the new one
      state.selectedIndices = [index];
    }
    updateSelectedHighlight();
    return;
  }

  // If an operation is selected:
  // - first click selects the first operand
  // - second click selects the second operand and immediately applies
  if (state.selectedIndices.length === 0) {
    state.selectedIndices = [index];
    updateSelectedHighlight();
    return;
  }

  const firstIndex = state.selectedIndices[0];
  if (firstIndex === index) {
    // Ignore clicking the same number as first operand when operation is selected
    return;
  }
  state.selectedIndices = [firstIndex, index];
  applyOperation();
}

function handleOperationClick(operation: Operation, button: HTMLButtonElement): void {
  console.log("[game] operation click", { operation });
  if (state.selectedOperation === operation) {
    state.selectedOperation = null;
    highlightSelectedOperation(null);
  } else {
    state.selectedOperation = operation;
    highlightSelectedOperation(operation);
  }

  render();
  maybeApplyOperation();
}

function highlightSelectedOperation(operation: Operation | null): void {
  const buttons = operationsContainer.querySelectorAll<HTMLButtonElement>(".operation-btn");
  buttons.forEach((btn) => {
    if (btn.textContent === operation) {
      btn.classList.add("selected");
      btn.setAttribute("aria-pressed", "true");
    } else {
      btn.classList.remove("selected");
      btn.setAttribute("aria-pressed", "false");
    }
  });
}

function maybeApplyOperation(): void {
  if (state.selectedIndices.length === 2 && state.selectedOperation) {
    applyOperation();
  }
}

function applyOperation(): void {
  const [firstIndex, secondIndex] = state.selectedIndices;
  const firstValue = state.numbers[firstIndex];
  const secondValue = state.numbers[secondIndex];
  const operation = state.selectedOperation;
  console.log("[game] applyOperation()", {
    firstIndex,
    secondIndex,
    firstValue,
    secondValue,
    operation,
  });

  if (!operation) {
    return;
  }

  const result = compute(firstValue, secondValue, operation);
  if (result === null) {
    state.status = "error";
    state.statusMessage = "Invalid operation (division by zero). Try again.";
    state.selectedOperation = null;
    state.selectedIndices = [];
    highlightSelectedOperation(null);
    render();
    return;
  }

  const expression = `${formatNumber(firstValue)} ${operation} ${formatNumber(secondValue)} = ${formatNumber(result)}`;
  state.history.push(expression);

  const remaining = state.numbers.filter((_, idx) => idx !== firstIndex && idx !== secondIndex);
  remaining.push(result);

  state.numbers = remaining;
  state.selectedIndices = [];
  state.selectedOperation = null;
  state.status = "idle";
  state.statusMessage = "Click two numbers, then choose an operation.";
  highlightSelectedOperation(null);

  if (state.numbers.length === 1) {
    const finalValue = state.numbers[0];
    const target = TARGET_PER_MODE[state.mode];
    if (Math.abs(finalValue - target) < 1e-6) {
      state.status = "success";
      state.statusMessage = `Success! Reached ${target}.`;
    } else {
      state.status = "error";
      state.statusMessage = `Reached ${formatNumber(finalValue)}, not ${target}.`;
    }
  }

  render();
}

function compute(a: number, b: number, operation: Operation): number | null {
  switch (operation) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "*":
      return a * b;
    case "/":
      if (Math.abs(b) < 1e-9) {
        return null;
      }
      return a / b;
    default:
      return null;
  }
}

function formatNumber(value: number): string {
  if (Number.isInteger(value)) {
    return value.toString();
  }
  return value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
}

function render(): void {
  renderNumbers();
  renderStatus();
  renderHistory();
}

function renderNumbers(): void {
  numbersContainer.innerHTML = "";
  if (!state.numbers || state.numbers.length === 0) {
    // Safety: if numbers were not initialized for any reason, deal a new hand.
    console.warn("[game] renderNumbers(): empty numbers; redealing");
    resetState(state.mode);
    return;
  }
  console.log("[game] renderNumbers()", state.numbers);
  state.numbers.forEach((value, idx) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "number-card";
    card.dataset.index = String(idx);
    card.textContent = formatNumber(value);
    numbersContainer.appendChild(card);
  });
  // Delegate clicks to container for stability across re-renders
  numbersContainer.onclick = (ev) => {
    const target = ev.target as HTMLElement | null;
    if (!target) return;
    const card = target.closest(".number-card") as HTMLElement | null;
    if (!card || !numbersContainer.contains(card)) return;
    const idxStr = card.dataset.index;
    if (idxStr == null) return;
    const idx = Number(idxStr);
    if (!Number.isFinite(idx)) return;
    handleNumberClick(idx);
  };
  updateSelectedHighlight();
}

function renderStatus(): void {
  if (!statusContainer) return;
  statusContainer.textContent = state.statusMessage;
  statusContainer.parentElement?.classList.remove("success", "error");
  if (state.status === "success") {
    statusContainer.parentElement?.classList.add("success");
  } else if (state.status === "error") {
    statusContainer.parentElement?.classList.add("error");
  }
}

function renderHistory(): void {
  historyList.innerHTML = "";
  state.history.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    historyList.appendChild(li);
  });
}

function updateSelectedHighlight(): void {
  const cards = numbersContainer.querySelectorAll<HTMLElement>(".number-card");
  cards.forEach((el) => {
    const idx = Number(el.dataset.index ?? "-1");
    if (state.selectedIndices.includes(idx)) {
      el.classList.add("selected");
    } else {
      el.classList.remove("selected");
    }
  });
}


