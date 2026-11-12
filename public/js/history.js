// история хранит снимки схемы в виде строк JSON
export function createHistory(initial, limit = 100) {
  let stack = [initial];
  let pos = 0;

  return {
    push(snapshot) {
      if (snapshot === stack[pos]) return;
      stack = stack.slice(0, pos + 1);
      stack.push(snapshot);
      if (stack.length > limit) stack.shift();
      pos = stack.length - 1;
    },
    undo() {
      if (pos > 0) pos--;
      return stack[pos];
    },
    redo() {
      if (pos < stack.length - 1) pos++;
      return stack[pos];
    },
    get canUndo() {
      return pos > 0;
    },
    get canRedo() {
      return pos < stack.length - 1;
    },
  };
}
