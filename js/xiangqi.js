/**
 * B-Time — Xiangqi (Chinese Chess) Engine & UI Controller
 * 9x10 Local 2-Player Xiangqi with strict legal moves & Flying General rule
 */

window.XiangqiGame = (() => {
  const ROWS = 10;
  const COLS = 9;

  // Piece representation:
  // Red (lowercase or prefix 'r'):
  // 'rk' (帥 - General), 'ra' (仕 - Advisor), 're' (相 - Elephant),
  // 'rh' (傌 - Horse), 'rc' (俥 - Chariot), 'rn' (炮 - Cannon), 'rs' (兵 - Soldier)
  //
  // Black (lowercase or prefix 'b'):
  // 'bk' (將 - General), 'ba' (士 - Advisor), 'be' (象 - Elephant),
  // 'bh' (馬 - Horse), 'bc' (車 - Chariot), 'bn' (砲 - Cannon), 'bs' (卒 - Soldier)

  const PIECE_LABELS = {
    'rk': '帥', 'ra': '仕', 're': '相', 'rh': '傌', 'rc': '俥', 'rn': '炮', 'rs': '兵',
    'bk': '將', 'ba': '士', 'be': '象', 'bh': '馬', 'bc': '車', 'bn': '砲', 'bs': '卒'
  };

  const INITIAL_BOARD = [
    ['bc', 'bh', 'be', 'ba', 'bk', 'ba', 'be', 'bh', 'bc'],
    ['', '', '', '', '', '', '', '', ''],
    ['', 'bn', '', '', '', '', '', 'bn', ''],
    ['bs', '', 'bs', '', 'bs', '', 'bs', '', 'bs'],
    ['', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['rs', '', 'rs', '', 'rs', '', 'rs', '', 'rs'],
    ['', 'rn', '', '', '', '', '', 'rn', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['rc', 'rh', 're', 'ra', 'rk', 'ra', 're', 'rh', 'rc']
  ];

  let board = [];
  let currentTurn = 'r'; // 'r' (Red goes first in Xiangqi) or 'b' (Black)
  let selectedPoint = null; // { r, c }
  let legalMoves = [];
  let history = [];
  let capturedRed = [];
  let capturedBlack = [];
  let lastMove = null;
  let isGameOver = false;
  // --- localStorage への自動保存と復元 ---
  const STORAGE_KEY = 'btime_xiangqi_state';

  function saveState() {
    const data = {
      board,
      currentTurn,
      capturedRed,
      capturedBlack,
      lastMove,
      history,
      isGameOver
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return false;
    try {
      const data = JSON.parse(saved);
      board = data.board;
      currentTurn = data.currentTurn;
      capturedRed = data.capturedRed || [];
      capturedBlack = data.capturedBlack || [];
      lastMove = data.lastMove;
      history = data.history || [];
      isGameOver = data.isGameOver || false;
      return true;
    } catch (e) {
      console.error('Failed to load Xiangqi state:', e);
      return false;
    }
  }
  function inBounds(r, c) {
    return r >= 0 && r < ROWS && c >= 0 && c < COLS;
  }

  function cloneBoard(b) {
    return b.map(row => [...row]);
  }

  function getColor(piece) {
    if (!piece) return null;
    return piece.charAt(0); // 'r' or 'b'
  }

  function getType(piece) {
    if (!piece) return null;
    return piece.charAt(1);
  }

  function inPalace(r, c, color) {
    if (c < 3 || c > 5) return false;
    return color === 'b' ? (r >= 0 && r <= 2) : (r >= 7 && r <= 9);
  }

  // Generate pseudo-legal moves for Xiangqi piece
  function getPseudoMoves(b, r, c) {
    const piece = b[r][c];
    if (!piece) return [];
    const color = getColor(piece);
    const type = getType(piece);
    const moves = [];

    const tryAdd = (tr, tc) => {
      if (!inBounds(tr, tc)) return false;
      const target = b[tr][tc];
      if (!target) {
        moves.push({ r: tr, c: tc });
        return true;
      }
      if (getColor(target) !== color) {
        moves.push({ r: tr, c: tc });
      }
      return false; // Obstacle reached
    };

    if (type === 'k') {
      // General: 1 step orthogonally within Palace
      const offsets = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (const [dr, dc] of offsets) {
        const tr = r + dr;
        const tc = c + dc;
        if (inPalace(tr, tc, color)) {
          tryAdd(tr, tc);
        }
      }
    } else if (type === 'a') {
      // Advisor: 1 step diagonally within Palace
      const offsets = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
      for (const [dr, dc] of offsets) {
        const tr = r + dr;
        const tc = c + dc;
        if (inPalace(tr, tc, color)) {
          tryAdd(tr, tc);
        }
      }
    } else if (type === 'e') {
      // Elephant: 2 steps diagonally, cannot cross River, subject to eye blocking
      const offsets = [
        { dr: -2, dc: -2, eyeR: -1, eyeC: -1 },
        { dr: -2, dc: 2, eyeR: -1, eyeC: 1 },
        { dr: 2, dc: -2, eyeR: 1, eyeC: -1 },
        { dr: 2, dc: 2, eyeR: 1, eyeC: 1 }
      ];
      for (const o of offsets) {
        const tr = r + o.dr;
        const tc = c + o.dc;
        if (!inBounds(tr, tc)) continue;

        // River boundary
        if (color === 'b' && tr > 4) continue;
        if (color === 'r' && tr < 5) continue;

        // Elephant eye check
        if (!b[r + o.eyeR][c + o.eyeC]) {
          tryAdd(tr, tc);
        }
      }
    } else if (type === 'h') {
      // Horse: 1 orthogonal + 1 diagonal, subject to leg blocking
      const horseSteps = [
        { legR: -1, legC: 0, tr: -2, tc: -1 },
        { legR: -1, legC: 0, tr: -2, tc: 1 },
        { legR: 1, legC: 0, tr: 2, tc: -1 },
        { legR: 1, legC: 0, tr: 2, tc: 1 },
        { legR: 0, legC: -1, tr: -1, tc: -2 },
        { legR: 0, legC: -1, tr: 1, tc: -2 },
        { legR: 0, legC: 1, tr: -1, tc: 2 },
        { legR: 0, legC: 1, tr: 1, tc: 2 }
      ];
      for (const step of horseSteps) {
        const legR = r + step.legR;
        const legC = c + step.legC;
        if (!inBounds(legR, legC)) continue;
        // If horse leg is not blocked
        if (!b[legR][legC]) {
          tryAdd(r + step.tr, c + step.tc);
        }
      }
    } else if (type === 'c') {
      // Chariot: straight line orthogonal
      const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (const [dr, dc] of dirs) {
        let step = 1;
        while (true) {
          const tr = r + dr * step;
          const tc = c + dc * step;
          if (!inBounds(tr, tc)) break;
          const target = b[tr][tc];
          if (!target) {
            moves.push({ r: tr, c: tc });
          } else {
            if (getColor(target) !== color) {
              moves.push({ r: tr, c: tc });
            }
            break; // Stop at first piece
          }
          step++;
        }
      }
    } else if (type === 'n') {
      // Cannon: moves like chariot without capture; jumps exactly 1 piece to capture
      const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (const [dr, dc] of dirs) {
        let step = 1;
        let jumped = false;
        while (true) {
          const tr = r + dr * step;
          const tc = c + dc * step;
          if (!inBounds(tr, tc)) break;
          const target = b[tr][tc];

          if (!jumped) {
            if (!target) {
              moves.push({ r: tr, c: tc });
            } else {
              jumped = true; // Found screen/platform
            }
          } else {
            // Already jumped 1 piece
            if (target) {
              if (getColor(target) !== color) {
                moves.push({ r: tr, c: tc });
              }
              break; // Cannon can only jump one piece
            }
          }
          step++;
        }
      }
    } else if (type === 's') {
      // Soldier: forward 1 step; after river crossing, can also step left/right
      const forward = color === 'r' ? -1 : 1;
      const crossedRiver = color === 'r' ? r <= 4 : r >= 5;

      // Always forward
      tryAdd(r + forward, c);

      // Horizontal after river
      if (crossedRiver) {
        tryAdd(r, c - 1);
        tryAdd(r, c + 1);
      }
    }

    return moves;
  }

  // Find General position
  function findGeneral(b, color) {
    const target = color + 'k';
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (b[r][c] === target) return { r, c };
      }
    }
    return null;
  }

  // Flying General rule check:
  // Are both Generals in the same column with no pieces in between?
  function isFlyingGeneralFaceOff(b) {
    const redK = findGeneral(b, 'r');
    const blackK = findGeneral(b, 'b');
    if (!redK || !blackK) return false;
    if (redK.c !== blackK.c) return false;

    // Check pieces in between
    const start = Math.min(blackK.r, redK.r) + 1;
    const end = Math.max(blackK.r, redK.r);
    for (let r = start; r < end; r++) {
      if (b[r][redK.c]) return false; // Blocked
    }
    return true; // Flying general confrontation!
  }

  // Is general in check by opponent
  function isGeneralInCheck(b, color) {
    const gen = findGeneral(b, color);
    if (!gen) return false;
    const opp = color === 'r' ? 'b' : 'r';

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const piece = b[r][c];
        if (piece && getColor(piece) === opp) {
          const pseudo = getPseudoMoves(b, r, c);
          if (pseudo.some(m => m.r === gen.r && m.c === gen.c)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // Filter legal moves (cannot leave own general in check, cannot cause Flying General)
  function getStrictLegalMoves(b, r, c, color) {
    const pseudo = getPseudoMoves(b, r, c);
    const valid = [];

    for (const m of pseudo) {
      const sim = cloneBoard(b);
      const piece = sim[r][c];
      sim[r][c] = '';
      sim[m.r][m.c] = piece;

      // Cannot face opponent general directly
      if (isFlyingGeneralFaceOff(sim)) continue;

      // Cannot leave self general in check
      if (isGeneralInCheck(sim, color)) continue;

      valid.push(m);
    }

    return valid;
  }

  function hasAnyLegalMoves(b, color) {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const piece = b[r][c];
        if (piece && getColor(piece) === color) {
          const moves = getStrictLegalMoves(b, r, c, color);
          if (moves.length > 0) return true;
        }
      }
    }
    return false;
  }

  // Execute move
  function makeMove(from, to) {
    const piece = board[from.r][from.c];
    const color = getColor(piece);
    const targetPiece = board[to.r][to.c];

    // Undo state snapshot
    history.push({
      board: cloneBoard(board),
      currentTurn,
      capturedRed: [...capturedRed],
      capturedBlack: [...capturedBlack],
      lastMove: lastMove ? { ...lastMove } : null,
      isGameOver
    });

    if (targetPiece) {
      if (getColor(targetPiece) === 'r') capturedRed.push(targetPiece);
      else capturedBlack.push(targetPiece);
      if (window.SoundFx) window.SoundFx.playCapture();
    } else {
      if (window.SoundFx) window.SoundFx.playMove();
    }

    board[to.r][to.c] = piece;
    board[from.r][from.c] = '';

    lastMove = { from, to };
    selectedPoint = null;
    legalMoves = [];

    // Switch turn
    currentTurn = currentTurn === 'r' ? 'b' : 'r';

    const oppInCheck = isGeneralInCheck(board, currentTurn);
    const hasLegal = hasAnyLegalMoves(board, currentTurn);

    const noticeEl = document.getElementById('game-state-notice');
    if (oppInCheck) {
      if (!hasLegal) {
        isGameOver = true;
        noticeEl.textContent = `Checkmate! ${color === 'r' ? 'Red' : 'Black'} wins!`;
        noticeEl.classList.add('show');
        if (window.SoundFx) window.SoundFx.playCheckmate();
      } else {
        noticeEl.textContent = 'Check!';
        noticeEl.classList.add('show');
        if (window.SoundFx) window.SoundFx.playCheck();
      }
    } else {
      if (!hasLegal) {
        // In Xiangqi, having no legal moves (stalemate) is a loss for the side to move
        isGameOver = true;
        noticeEl.textContent = `Stalemate! ${color === 'r' ? 'Red' : 'Black'} wins!`;
        noticeEl.classList.add('show');
        if (window.SoundFx) window.SoundFx.playCheckmate();
      } else {
        noticeEl.textContent = '';
        noticeEl.classList.remove('show');
      }
    }
    saveState();
    render();
    updateMetaDisplay();
  }

  function onPointClick(r, c) {
    if (isGameOver) return;

    if (selectedPoint) {
      const matchMove = legalMoves.find(m => m.r === r && m.c === c);
      if (matchMove) {
        makeMove(selectedPoint, { r, c });
        return;
      }
    }

    const clickedPiece = board[r][c];
    if (clickedPiece && getColor(clickedPiece) === currentTurn) {
      if (selectedPoint && selectedPoint.r === r && selectedPoint.c === c) {
        selectedPoint = null;
        legalMoves = [];
      } else {
        selectedPoint = { r, c };
        legalMoves = getStrictLegalMoves(board, r, c, currentTurn);
      }
      render();
    } else {
      selectedPoint = null;
      legalMoves = [];
      render();
    }
  }

  function undo() {
    if (history.length === 0) return;
    const prev = history.pop();
    board = prev.board;
    currentTurn = prev.currentTurn;
    capturedRed = prev.capturedRed;
    capturedBlack = prev.capturedBlack;
    lastMove = prev.lastMove;
    isGameOver = prev.isGameOver;

    selectedPoint = null;
    legalMoves = [];

    const noticeEl = document.getElementById('game-state-notice');
    if (isGeneralInCheck(board, currentTurn)) {
      noticeEl.textContent = 'Check!';
      noticeEl.classList.add('show');
    } else {
      noticeEl.textContent = '';
      noticeEl.classList.remove('show');
    }
    saveState();
    render();
    updateMetaDisplay();
  }

  function restart() {
    localStorage.removeItem(STORAGE_KEY);
    board = cloneBoard(INITIAL_BOARD);
    currentTurn = 'r';
    selectedPoint = null;
    legalMoves = [];
    history = [];
    capturedRed = [];
    capturedBlack = [];
    lastMove = null;
    isGameOver = false;

    const noticeEl = document.getElementById('game-state-notice');
    noticeEl.textContent = '';
    noticeEl.classList.remove('show');

    render();
    updateMetaDisplay();
  }

  function render() {
    const gridEl = document.getElementById('xiangqi-grid');
    if (!gridEl) return;
    gridEl.innerHTML = '';

    const checkGen = isGeneralInCheck(board, currentTurn) ? findGeneral(board, currentTurn) : null;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const pt = document.createElement('div');
        pt.className = 'xq-point';

        if (selectedPoint && selectedPoint.r === r && selectedPoint.c === c) {
          pt.classList.add('selected');
        }

        if (lastMove && ((lastMove.from.r === r && lastMove.from.c === c) || (lastMove.to.r === r && lastMove.to.c === c))) {
          pt.classList.add('last-move');
        }

        if (checkGen && checkGen.r === r && checkGen.c === c) {
          pt.classList.add('in-check');
        }

        const piece = board[r][c];
        if (piece) {
          const pieceEl = document.createElement('div');
          const color = getColor(piece);
          pieceEl.className = `xq-piece ${color === 'r' ? 'red' : 'black'}`;
          pieceEl.textContent = PIECE_LABELS[piece] || '';
          pt.appendChild(pieceEl);
        }

        const legalMove = legalMoves.find(m => m.r === r && m.c === c);
        if (legalMove) {
          const hint = document.createElement('div');
          hint.className = piece ? 'capture-hint' : 'move-hint';
          pt.appendChild(hint);
        }

        pt.addEventListener('click', () => onPointClick(r, c));
        gridEl.appendChild(pt);
      }
    }

    renderCapturedStrips();
  }

  function renderCapturedStrips() {
    const redStrip = document.getElementById('xiangqi-captured-red');
    const blackStrip = document.getElementById('xiangqi-captured-black');

    if (redStrip) {
      redStrip.innerHTML = capturedRed.map(p => `<span class="cap-piece red">${PIECE_LABELS[p]}</span>`).join('');
    }
    if (blackStrip) {
      blackStrip.innerHTML = capturedBlack.map(p => `<span class="cap-piece">${PIECE_LABELS[p]}</span>`).join('');
    }
  }

  function updateMetaDisplay() {
    const turnDot = document.getElementById('turn-dot');
    const turnText = document.getElementById('turn-text');
    const lastMoveDesc = document.getElementById('last-move-desc');

    if (turnDot && turnText) {
      turnDot.className = 'turn-dot' + (currentTurn === 'r' ? ' red-turn' : ' black-turn');
      turnText.textContent = currentTurn === 'r' ? "Red to move" : "Black to move";
    }

    if (lastMoveDesc) {
      if (lastMove) {
        lastMoveDesc.textContent = `(${lastMove.from.r},${lastMove.from.c}) → (${lastMove.to.r},${lastMove.to.c})`;
      } else {
        lastMoveDesc.textContent = 'Ready for first move';
      }
    }
  }

  function init() {
    if (!loadState()) {
      restart();
    } else {
      render();
      updateMetaDisplay();
    }
  }

  return {
    init,
    restart,
    undo,
    updateMetaDisplay
  };
})();
