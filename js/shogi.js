/**
 * B-Time — Shogi (Japanese Chess) Engine & UI Controller
 * 9x9 Local 2-Player Shogi with piece drops, promotions, and anti-nifu
 */
window.ShogiGame = (() => {
  const ROWS = 9;
  const COLS = 9;

  // Sente (先手 / Black / Bottom): Uppercase ('K', 'R', 'B', 'G', 'S', 'N', 'L', 'P')
  // Gote (後手 / White / Top): Lowercase ('k', 'r', 'b', 'g', 's', 'n', 'l', 'p')
  // Promoted pieces prefixed with '+':
  // '+R'/'+r' (竜), '+B'/'+b' (馬), '+S'/'+s' (成銀), '+N'/'+n' (成桂), '+L'/'+l' (成香), '+P'/'+p' (と)

  const KANJI = {
    'K': '玉', 'k': '王',
    'R': '飛', 'r': '飛', '+R': '竜', '+r': '竜',
    'B': '角', 'b': '角', '+B': '馬', '+b': '馬',
    'G': '金', 'g': '金',
    'S': '銀', 's': '銀', '+S': '全', '+s': '全',
    'N': '桂', 'n': '桂', '+N': '圭', '+n': '圭',
    'L': '香', 'l': '香', '+L': '杏', '+l': '杏',
    'P': '歩', 'p': '歩', '+P': 'と', '+p': 'と'
  };

  const PROMOTABLE = ['R', 'B', 'S', 'N', 'L', 'P'];

  const INITIAL_BOARD = [
    ['l', 'n', 's', 'g', 'k', 'g', 's', 'n', 'l'],
    ['', 'r', '', '', '', '', '', 'b', ''],
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    ['', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
    ['', 'B', '', '', '', '', '', 'R', ''],
    ['L', 'N', 'S', 'G', 'K', 'G', 'S', 'N', 'L']
  ];

  let board = [];
  let currentTurn = 'sente'; // 'sente' (bottom) or 'gote' (top)
  let handSente = {}; // { 'P': 0, 'L': 0, ... }
  let handGote = {};  // { 'p': 0, 'l': 0, ... }
  let selectedSquare = null; // { r, c }
  let selectedDropPiece = null; // 'P' or 'p'
  let legalMoves = []; // Array of { r, c, canPromote, mustPromote }
  let history = []; // Undo stack
  let lastMove = null; // { from: {r,c}|'drop', to: {r,c}, piece }
  let isGameOver = false;
  const STORAGE_KEY = 'btime_shogi_state';

  function saveState() {
    const data = {
      board,
      currentTurn,
      handSente,
      handGote,
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
      handSente = data.handSente;
      handGote = data.handGote;
      lastMove = data.lastMove;
      history = data.history || [];
      isGameOver = data.isGameOver || false;
      return true;
    } catch (e) {
      console.error('Failed to load Shogi state:', e);
      return false;
    }
  }
  function initHand() {
    return { 'R': 0, 'B': 0, 'G': 0, 'S': 0, 'N': 0, 'L': 0, 'P': 0 };
  }
  function initGoteHand() {
    return { 'r': 0, 'b': 0, 'g': 0, 's': 0, 'n': 0, 'l': 0, 'p': 0 };
  }

  function inBounds(r, c) {
    return r >= 0 && r < ROWS && c >= 0 && c < COLS;
  }

  function cloneBoard(b) {
    return b.map(row => [...row]);
  }

  function getSide(piece) {
    if (!piece) return null;
    const base = piece.replace('+', '');
    return base === base.toUpperCase() ? 'sente' : 'gote';
  }

  function getBaseType(piece) {
    if (!piece) return null;
    return piece.replace('+', '').toUpperCase();
  }

  function isPromoted(piece) {
    return piece && piece.startsWith('+');
  }

  function demotePiece(piece) {
    return piece ? piece.replace('+', '') : '';
  }

  function promotePiece(piece) {
    if (!piece || piece.startsWith('+')) return piece;
    return '+' + piece;
  }

  // Check if position is in enemy camp (Promotion zone: top 3 rows for Sente, bottom 3 rows for Gote)
  function inEnemyZone(row, side) {
    return side === 'sente' ? row <= 2 : row >= 6;
  }

  function getShogiPieceSVG(pieceKey) {
    if (!pieceKey) return '';

    const side = getSide(pieceKey);
    const promo = isPromoted(pieceKey);
    const kanji = KANJI[pieceKey] || pieceKey;
    const isGote = side === 'gote';

    // 文字色：成駒は赤い文字、通常の駒は濃い墨色
    const textColor = promo ? '#dc2626' : '#1e1b18';

    // 後手（Gote）の場合は五角形と文字を180度回転
    const transform = isGote ? 'transform="rotate(180 20 22.5)"' : '';

    return `
      <div class="shogi-piece">
        <svg viewBox="0 0 40 45">
          <g ${transform}>
            <!-- 五角形の外枠・グラデーション背景 -->
            <polygon points="20,2 38,12 32,43 8,43 2,12" 
                     fill="#fffefb" 
                     stroke="#475569" 
                     stroke-width="1.8" 
                     stroke-linejoin="round" />
            <!-- 内側の面取り・立体感ライン -->
            <polygon points="20,4.5 36,13 30.5,41.5 9.5,41.5 4,13" 
                     fill="none" 
                     stroke="#cbd5e1" 
                     stroke-width="0.8" />
            <!-- 駒の文字 -->
            <text x="20" y="27" 
                  font-family="'Noto Serif JP', 'Source Han Serif', serif" 
                  font-size="17" 
                  font-weight="700" 
                  fill="${textColor}" 
                  text-anchor="middle" 
                  dominant-baseline="middle">${kanji}</text>
          </g>
        </svg>
      </div>
    `;
  }

  // Gold move offsets relative to forward direction
  // Forward: dr = -1 for Sente, dr = 1 for Gote
  function getGoldOffsets(forward) {
    return [
      [forward, 0],           // straight forward
      [forward, -1], [forward, 1], // diagonal forward
      [0, -1], [0, 1],        // sideways
      [-forward, 0]           // straight back
    ];
  }

  // Silver move offsets
  function getSilverOffsets(forward) {
    return [
      [forward, 0],           // straight forward
      [forward, -1], [forward, 1], // diagonal forward
      [-forward, -1], [-forward, 1] // diagonal back
    ];
  }

  // Generate board moves (without drop)
  function getBoardMoves(b, r, c) {
    const piece = b[r][c];
    if (!piece) return [];
    const side = getSide(piece);
    const forward = side === 'sente' ? -1 : 1;
    const isPromo = isPromoted(piece);
    const base = getBaseType(piece);
    const moves = [];

    const tryAdd = (tr, tc) => {
      if (!inBounds(tr, tc)) return false;
      const target = b[tr][tc];
      if (!target) {
        moves.push({ r: tr, c: tc });
        return true;
      }
      if (getSide(target) !== side) {
        moves.push({ r: tr, c: tc });
      }
      return false; // Obstacle
    };

    if (base === 'K') {
      const offsets = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1]
      ];
      for (const [dr, dc] of offsets) tryAdd(r + dr, c + dc);
    } else if (base === 'R') {
      // Orthogonal sliding
      const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (const [dr, dc] of dirs) {
        let step = 1;
        while (true) {
          const tr = r + dr * step;
          const tc = c + dc * step;
          if (!inBounds(tr, tc)) break;
          const cont = tryAdd(tr, tc);
          if (!cont) break;
          step++;
        }
      }
      // Promoted Rook (+R / Dragon) gets 1 diagonal step
      if (isPromo) {
        for (const [dr, dc] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
          tryAdd(r + dr, c + dc);
        }
      }
    } else if (base === 'B') {
      // Diagonal sliding
      const dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
      for (const [dr, dc] of dirs) {
        let step = 1;
        while (true) {
          const tr = r + dr * step;
          const tc = c + dc * step;
          if (!inBounds(tr, tc)) break;
          const cont = tryAdd(tr, tc);
          if (!cont) break;
          step++;
        }
      }
      // Promoted Bishop (+B / Horse) gets 1 orthogonal step
      if (isPromo) {
        for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          tryAdd(r + dr, c + dc);
        }
      }
    } else if (base === 'G' || isPromo) {
      // Gold General and all promoted minors (+S, +N, +L, +P) move like Gold
      const offsets = getGoldOffsets(forward);
      for (const [dr, dc] of offsets) tryAdd(r + dr, c + dc);
    } else if (base === 'S') {
      const offsets = getSilverOffsets(forward);
      for (const [dr, dc] of offsets) tryAdd(r + dr, c + dc);
    } else if (base === 'N') {
      // Knight jumps 2 forward and 1 sideways
      tryAdd(r + 2 * forward, c - 1);
      tryAdd(r + 2 * forward, c + 1);
    } else if (base === 'L') {
      // Lance slides straight forward
      let step = 1;
      while (true) {
        const tr = r + forward * step;
        if (!inBounds(tr, c)) break;
        const cont = tryAdd(tr, c);
        if (!cont) break;
        step++;
      }
    } else if (base === 'P') {
      // Pawn 1 step forward
      tryAdd(r + forward, c);
    }

    return moves;
  }

  // Find King square
  function findKing(b, side) {
    const target = side === 'sente' ? 'K' : 'k';
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (b[r][c] === target) return { r, c };
      }
    }
    return null;
  }

  // Is King currently in check
  function isKingInCheck(b, side) {
    const king = findKing(b, side);
    if (!king) return false;
    const oppSide = side === 'sente' ? 'gote' : 'sente';

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const p = b[r][c];
        if (p && getSide(p) === oppSide) {
          const moves = getBoardMoves(b, r, c);
          if (moves.some(m => m.r === king.r && m.c === king.c)) return true;
        }
      }
    }
    return false;
  }

  // Check promotion possibilities for a move
  function checkPromotionStatus(piece, fromR, toR, side) {
    if (!piece || isPromoted(piece)) return { canPromote: false, mustPromote: false };
    const base = getBaseType(piece);
    if (!PROMOTABLE.includes(base)) return { canPromote: false, mustPromote: false };

    const crossedOrInZone = inEnemyZone(toR, side) || inEnemyZone(fromR, side);
    if (!crossedOrInZone) return { canPromote: false, mustPromote: false };

    // Forced promotions:
    // Pawn & Lance: at row 0 for Sente, row 8 for Gote
    if ((base === 'P' || base === 'L') && (side === 'sente' ? toR === 0 : toR === 8)) {
      return { canPromote: true, mustPromote: true };
    }
    // Knight: at row 0, 1 for Sente, row 7, 8 for Gote
    if (base === 'N' && (side === 'sente' ? toR <= 1 : toR >= 7)) {
      return { canPromote: true, mustPromote: true };
    }

    return { canPromote: true, mustPromote: false };
  }

  // Get strictly legal board moves for piece at (r, c)
  function getStrictLegalBoardMoves(b, r, c, side) {
    const rawMoves = getBoardMoves(b, r, c);
    const piece = b[r][c];
    const legal = [];

    for (const m of rawMoves) {
      const sim = cloneBoard(b);
      sim[m.r][m.c] = piece;
      sim[r][c] = '';

      if (!isKingInCheck(sim, side)) {
        const promoStatus = checkPromotionStatus(piece, r, m.r, side);
        legal.push({
          r: m.r,
          c: m.c,
          canPromote: promoStatus.canPromote,
          mustPromote: promoStatus.mustPromote
        });
      }
    }

    return legal;
  }

  // Get legal drop squares for a piece from hand
  function getStrictLegalDrops(b, dropPieceKey, side) {
    const drops = [];
    const base = dropPieceKey.toUpperCase();

    // Check Nifu (Two pawns in one file rule)
    const pawnColsWithFriendlyPawn = new Set();
    if (base === 'P') {
      const friendlyPawn = side === 'sente' ? 'P' : 'p';
      for (let c = 0; c < COLS; c++) {
        for (let r = 0; r < ROWS; r++) {
          if (b[r][c] === friendlyPawn) {
            pawnColsWithFriendlyPawn.add(c);
            break;
          }
        }
      }
    }

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (b[r][c]) continue; // Square must be empty

        // Nifu prohibition
        if (base === 'P' && pawnColsWithFriendlyPawn.has(c)) continue;

        // Dead piece drops
        if ((base === 'P' || base === 'L') && (side === 'sente' ? r === 0 : r === 8)) continue;
        if (base === 'N' && (side === 'sente' ? r <= 1 : r >= 7)) continue;

        // Simulate drop
        const sim = cloneBoard(b);
        sim[r][c] = side === 'sente' ? base : base.toLowerCase();

        // Own King cannot be left in check
        if (isKingInCheck(sim, side)) continue;

        // Uchifuzume (Drop pawn mate is illegal)
        if (base === 'P') {
          const oppSide = side === 'sente' ? 'gote' : 'sente';
          if (isKingInCheck(sim, oppSide) && !hasAnyLegalMoves(sim, oppSide, side === 'sente' ? handGote : handSente)) {
            continue; // Illegal pawn-drop checkmate!
          }
        }

        drops.push({ r, c, isDrop: true });
      }
    }

    return drops;
  }

  // Check if side has ANY legal moves (board moves or drops)
  function hasAnyLegalMoves(b, side, hand) {
    // Check board moves
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const piece = b[r][c];
        if (piece && getSide(piece) === side) {
          const moves = getStrictLegalBoardMoves(b, r, c, side);
          if (moves.length > 0) return true;
        }
      }
    }
    // Check drops
    for (const [key, count] of Object.entries(hand)) {
      if (count > 0) {
        const drops = getStrictLegalDrops(b, key, side);
        if (drops.length > 0) return true;
      }
    }
    return false;
  }

  function makeBoardMove(from, to, promote = false) {
    const piece = board[from.r][from.c];
    const side = getSide(piece);
    const target = board[to.r][to.c];

    history.push({
      board: cloneBoard(board),
      currentTurn,
      handSente: { ...handSente },
      handGote: { ...handGote },
      lastMove: lastMove ? { ...lastMove } : null,
      isGameOver
    });

    if (target) {
      const rawBase = demotePiece(target).toUpperCase();
      if (side === 'sente') {
        handSente[rawBase] = (handSente[rawBase] || 0) + 1;
      } else {
        const lowerKey = rawBase.toLowerCase();
        handGote[lowerKey] = (handGote[lowerKey] || 0) + 1;
      }
      if (window.SoundFx) window.SoundFx.playCapture(); // ★コマ取り音
    } else {
      if (window.SoundFx) window.SoundFx.playMove(); // ★移動音
    }

    board[to.r][to.c] = promote ? promotePiece(piece) : piece;
    board[from.r][from.c] = '';

    lastMove = { from, to, piece: board[to.r][to.c] };
    finishTurn();
  }

  function makeDropMove(pieceKey, to) {
    const side = currentTurn;

    history.push({
      board: cloneBoard(board),
      currentTurn,
      handSente: { ...handSente },
      handGote: { ...handGote },
      lastMove: lastMove ? { ...lastMove } : null,
      isGameOver
    });

    if (side === 'sente') {
      handSente[pieceKey.toUpperCase()]--;
    } else {
      handGote[pieceKey.toLowerCase()]--;
    }

    board[to.r][to.c] = side === 'sente' ? pieceKey.toUpperCase() : pieceKey.toLowerCase();

    if (window.SoundFx) window.SoundFx.playMove(); // ★駒打ち音

    lastMove = { from: 'drop', to, piece: board[to.r][to.c] };
    finishTurn();
  }

  function finishTurn() {
    selectedSquare = null;
    selectedDropPiece = null;
    legalMoves = [];

    const prevSide = currentTurn;
    currentTurn = currentTurn === 'sente' ? 'gote' : 'sente';

    const oppInCheck = isKingInCheck(board, currentTurn);
    const currentHand = currentTurn === 'sente' ? handSente : handGote;
    const hasLegal = hasAnyLegalMoves(board, currentTurn, currentHand);

    const noticeEl = document.getElementById('game-state-notice');
    if (oppInCheck) {
      if (!hasLegal) {
        isGameOver = true;
        noticeEl.textContent = `Checkmate! ${prevSide === 'sente' ? 'Sente' : 'Gote'} wins!`;
        noticeEl.classList.add('show');
        if (window.SoundFx) window.SoundFx.playCheckmate(); // ★詰み音 (音量25%)
      } else {
        noticeEl.textContent = 'Check!';
        noticeEl.classList.add('show');
        if (window.SoundFx) window.SoundFx.playCheck(); // ★王手音
      }
    } else {
      if (!hasLegal) {
        isGameOver = true;
        noticeEl.textContent = `Checkmate! ${prevSide === 'sente' ? 'Sente' : 'Gote'} wins!`;
        noticeEl.classList.add('show');
        if (window.SoundFx) window.SoundFx.playCheckmate(); // ★ステイルメート/詰み音 (音量25%)
      } else {
        noticeEl.textContent = '';
        noticeEl.classList.remove('show');
      }
    }

    saveState();
    render();
    updateMetaDisplay();
  }

  // Handle board square click
  function onSquareClick(r, c) {
    if (isGameOver) return;

    // Check if clicked square is legal move for selected piece
    if (selectedSquare) {
      const move = legalMoves.find(m => m.r === r && m.c === c);
      if (move) {
        if (move.mustPromote) {
          makeBoardMove(selectedSquare, { r, c }, true);
        } else if (move.canPromote) {
          openPromotionModal(selectedSquare, { r, c });
        } else {
          makeBoardMove(selectedSquare, { r, c }, false);
        }
        return;
      }
    }

    // Check if clicked square is legal for piece drop
    if (selectedDropPiece) {
      const dropMove = legalMoves.find(m => m.r === r && m.c === c);
      if (dropMove) {
        makeDropMove(selectedDropPiece, { r, c });
        return;
      }
    }

    // Otherwise, select piece on board if belongs to current player
    const clickedPiece = board[r][c];
    if (clickedPiece && getSide(clickedPiece) === currentTurn) {
      if (selectedSquare && selectedSquare.r === r && selectedSquare.c === c) {
        selectedSquare = null;
        legalMoves = [];
      } else {
        selectedDropPiece = null;
        selectedSquare = { r, c };
        legalMoves = getStrictLegalBoardMoves(board, r, c, currentTurn);
      }
      render();
    } else {
      selectedSquare = null;
      selectedDropPiece = null;
      legalMoves = [];
      render();
    }
  }

  // Handle Komadai piece click (select piece to drop)
  function onHandPieceClick(pieceKey, side) {
    if (isGameOver || side !== currentTurn) return;

    if (selectedDropPiece === pieceKey) {
      selectedDropPiece = null;
      legalMoves = [];
    } else {
      selectedSquare = null;
      selectedDropPiece = pieceKey;
      legalMoves = getStrictLegalDrops(board, pieceKey, currentTurn);
    }
    render();
  }

  // Promotion choice modal
  function openPromotionModal(from, to) {
    const modal = document.getElementById('promotion-modal');
    const title = document.getElementById('modal-promo-title');
    const subtitle = document.getElementById('modal-promo-subtitle');
    const optionsContainer = document.getElementById('promo-options');

    const piece = board[from.r][from.c];
    const baseKanji = KANJI[piece] || piece;
    const promoKanji = KANJI[promotePiece(piece)] || ('+' + baseKanji);

    title.textContent = 'Piece Promotion (成りますか？)';
    subtitle.textContent = `Promote ${baseKanji} to ${promoKanji}?`;
    optionsContainer.innerHTML = '';

    // Option 1: Promote
    const btnPromote = document.createElement('button');
    btnPromote.className = 'promo-btn';
    btnPromote.innerHTML = `
      <div class="promo-btn-piece" style="color:var(--color-danger);font-family:var(--font-cjk)">${promoKanji}</div>
      <span class="promo-btn-label">Promote (成)</span>
    `;
    btnPromote.addEventListener('click', () => {
      modal.classList.add('hidden');
      makeBoardMove(from, to, true);
    });

    // Option 2: Do Not Promote
    const btnDont = document.createElement('button');
    btnDont.className = 'promo-btn';
    btnDont.innerHTML = `
      <div class="promo-btn-piece" style="font-family:var(--font-cjk)">${baseKanji}</div>
      <span class="promo-btn-label">Stay (不成)</span>
    `;
    btnDont.addEventListener('click', () => {
      modal.classList.add('hidden');
      makeBoardMove(from, to, false);
    });

    optionsContainer.appendChild(btnPromote);
    optionsContainer.appendChild(btnDont);
    modal.classList.remove('hidden');
  }

  function undo() {
    if (history.length === 0) return;
    const prev = history.pop();
    board = prev.board;
    currentTurn = prev.currentTurn;
    handSente = prev.handSente;
    handGote = prev.handGote;
    lastMove = prev.lastMove;
    isGameOver = prev.isGameOver;

    selectedSquare = null;
    selectedDropPiece = null;
    legalMoves = [];

    const noticeEl = document.getElementById('game-state-notice');
    if (isKingInCheck(board, currentTurn)) {
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
    currentTurn = 'sente';
    handSente = initHand();
    handGote = initGoteHand();
    selectedSquare = null;
    selectedDropPiece = null;
    legalMoves = [];
    history = [];
    lastMove = null;
    isGameOver = false;

    const noticeEl = document.getElementById('game-state-notice');
    noticeEl.textContent = '';
    noticeEl.classList.remove('show');

    render();
    updateMetaDisplay();
  }

  function render() {
    const boardEl = document.getElementById('shogi-board');
    if (!boardEl) return;
    boardEl.innerHTML = '';

    const checkKing = isKingInCheck(board, currentTurn) ? findKing(board, currentTurn) : null;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const sq = document.createElement('div');
        sq.className = 'shogi-sq';

        if (selectedSquare && selectedSquare.r === r && selectedSquare.c === c) {
          sq.classList.add('selected');
        }

        if (lastMove && lastMove.to && lastMove.to.r === r && lastMove.to.c === c) {
          sq.classList.add('last-move');
        }

        if (checkKing && checkKing.r === r && checkKing.c === c) {
          sq.classList.add('in-check');
        }

        const piece = board[r][c];
        if (piece) {
          const pieceWrapper = document.createElement('div');
          pieceWrapper.innerHTML = getShogiPieceSVG(piece);
          sq.appendChild(pieceWrapper.firstElementChild);
        }

        const legalMove = legalMoves.find(m => m.r === r && m.c === c);
        if (legalMove) {
          const hint = document.createElement('div');
          hint.className = piece ? 'capture-hint' : 'move-hint';
          sq.appendChild(hint);
        }

        sq.addEventListener('click', () => onSquareClick(r, c));
        boardEl.appendChild(sq);
      }
    }

    renderKomadai();
  }

  function renderKomadai() {
    const senteContainer = document.getElementById('shogi-stand-sente');
    const goteContainer = document.getElementById('shogi-stand-gote');
    const senteCountEl = document.getElementById('shogi-sente-count');
    const goteCountEl = document.getElementById('shogi-gote-count');

    let totalSente = 0;
    let totalGote = 0;

    // Sente Komadai
    if (senteContainer) {
      senteContainer.innerHTML = '';
      for (const [key, count] of Object.entries(handSente)) {
        if (count > 0) {
          totalSente += count;
          const slot = document.createElement('div');
          slot.className = 'komadai-piece-slot';
          if (selectedDropPiece === key && currentTurn === 'sente') {
            slot.classList.add('selected');
          }
          slot.innerHTML = `
            ${getShogiPieceSVG(key)}
            ${count > 1 ? `<span class="komadai-count">${count}</span>` : ''}
          `;
          slot.addEventListener('click', () => onHandPieceClick(key, 'sente'));
          senteContainer.appendChild(slot);
        }
      }
    }

    // Gote Komadai
    if (goteContainer) {
      goteContainer.innerHTML = '';
      for (const [key, count] of Object.entries(handGote)) {
        if (count > 0) {
          totalGote += count;
          const slot = document.createElement('div');
          slot.className = 'komadai-piece-slot';
          if (selectedDropPiece === key && currentTurn === 'gote') {
            slot.classList.add('selected');
          }
          slot.innerHTML = `
            ${getShogiPieceSVG(key.toLowerCase())}
            ${count > 1 ? `<span class="komadai-count">${count}</span>` : ''}
          `;
          slot.addEventListener('click', () => onHandPieceClick(key, 'gote'));
          goteContainer.appendChild(slot);
        }
      }
    }

    if (senteCountEl) senteCountEl.textContent = totalSente;
    if (goteCountEl) goteCountEl.textContent = totalGote;
  }

  function updateMetaDisplay() {
    const turnDot = document.getElementById('turn-dot');
    const turnText = document.getElementById('turn-text');
    const lastMoveDesc = document.getElementById('last-move-desc');

    if (turnDot && turnText) {
      turnDot.className = 'turn-dot' + (currentTurn === 'gote' ? ' black-turn' : '');
      turnText.textContent = currentTurn === 'sente' ? "Sente (先手) to move" : "Gote (後手) to move";
    }

    if (lastMoveDesc) {
      if (lastMove) {
        if (lastMove.from === 'drop') {
          lastMoveDesc.textContent = `Drop ${KANJI[lastMove.piece]} on (${9 - lastMove.to.c},${lastMove.to.r + 1})`;
        } else {
          lastMoveDesc.textContent = `(${9 - lastMove.from.c},${lastMove.from.r + 1}) → (${9 - lastMove.to.c},${lastMove.to.r + 1})`;
        }
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
