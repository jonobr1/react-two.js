export interface CanvasCommand<TState> {
  label: string;
  before: TState;
  after: TState;
}

export interface CanvasHistory<TState> {
  past: Array<CanvasCommand<TState>>;
  future: Array<CanvasCommand<TState>>;
  limit: number;
}

export interface CanvasHistoryResult<TState> {
  history: CanvasHistory<TState>;
  state: TState;
}

export function createCanvasHistory<TState>(limit = 200): CanvasHistory<TState> {
  return {
    past: [],
    future: [],
    limit,
  };
}

export function pushCanvasCommand<TState>(
  history: CanvasHistory<TState>,
  command: CanvasCommand<TState>,
): CanvasHistoryResult<TState> {
  const past =
    history.past.length >= history.limit
      ? [...history.past.slice(1), command]
      : [...history.past, command];

  return {
    history: {
      ...history,
      past,
      future: [],
    },
    state: command.after,
  };
}

export function undoCanvasCommand<TState>(
  history: CanvasHistory<TState>,
  currentState: TState,
): CanvasHistoryResult<TState> | null {
  const command = history.past.at(-1);

  if (!command) {
    return null;
  }

  return {
    history: {
      ...history,
      past: history.past.slice(0, -1),
      future: [
        ...history.future,
        {
          label: command.label,
          before: currentState,
          after: command.after,
        },
      ],
    },
    state: command.before,
  };
}

export function redoCanvasCommand<TState>(
  history: CanvasHistory<TState>,
  currentState: TState,
): CanvasHistoryResult<TState> | null {
  const command = history.future.at(-1);

  if (!command) {
    return null;
  }

  return {
    history: {
      ...history,
      past: [
        ...history.past,
        {
          label: command.label,
          before: currentState,
          after: command.after,
        },
      ],
      future: history.future.slice(0, -1),
    },
    state: command.after,
  };
}
