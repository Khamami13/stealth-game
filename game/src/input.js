// Whisper Vault — keyboard and mouse. One file, one job: turn raw device
// events into one clean "what does the thief want to do" answer per frame.
// WASD or arrows walk, Shift sneaks, Enter starts/restarts, and a mouse
// click sets a walk target the thief follows on its own.
export function createInput(canvas) {
  const keys = new Set();
  const input = {
    keys,
    clickTarget: null, // {x, y} in canvas pixels, or null
    clicked: false, // a fresh mouse press this frame (for buttons)
    clickX: 0,
    clickY: 0,
    anyKey: false,
  };

  const KEYMAP = {
    KeyW: 'up', ArrowUp: 'up',
    KeyS: 'down', ArrowDown: 'down',
    KeyA: 'left', ArrowLeft: 'left',
    KeyD: 'right', ArrowRight: 'right',
  };

  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
    keys.add(event.code);
    input.anyKey = true;
  });
  window.addEventListener('keyup', (event) => keys.delete(event.code));
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    input.clickTarget = { x, y };
    input.clicked = true;
    input.clickX = x;
    input.clickY = y;
  });

  return input;
}

// The walk direction for this frame: keys first (they override the mouse),
// otherwise toward the click target until the thief arrives.
export function readMoveDirection(input, player) {
  let dx = 0;
  let dy = 0;
  if (input.keys.has('KeyW') || input.keys.has('ArrowUp')) dy -= 1;
  if (input.keys.has('KeyS') || input.keys.has('ArrowDown')) dy += 1;
  if (input.keys.has('KeyA') || input.keys.has('ArrowLeft')) dx -= 1;
  if (input.keys.has('KeyD') || input.keys.has('ArrowRight')) dx += 1;
  if (dx !== 0 || dy !== 0) {
    input.clickTarget = null; // keys take over from the mouse
    return { dx, dy };
  }
  if (input.clickTarget) {
    const tx = input.clickTarget.x - player.x;
    const ty = input.clickTarget.y - player.y;
    if (Math.hypot(tx, ty) < 10) {
      input.clickTarget = null;
      return { dx: 0, dy: 0 };
    }
    return { dx: tx, dy: ty };
  }
  return { dx: 0, dy: 0 };
}

export function readSneaking(input) {
  return input.keys.has('ShiftLeft') || input.keys.has('ShiftRight');
}

export function readConfirm(input) {
  return input.keys.has('Enter') || input.keys.has('Space') || input.clicked;
}

// After a confirm has driven a screen change, swallow it so the same
// press cannot drive the next screen too (one Enter must not skip past
// the title screen straight into play).
export function consumeConfirm(input) {
  input.keys.delete('Enter');
  input.keys.delete('Space');
  input.clicked = false;
}

// Call once per frame after the game has read the click, so a press is
// never handled twice.
export function consumeClick(input) {
  input.clicked = false;
}
