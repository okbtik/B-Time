/**
 * B-Time — Chess Engine & UI Controller
 * Standard 8x8 Local 2-Player Chess
 */

window.ChessGame = (() => {
  // Board dimensions
  const ROWS = 8;
  const COLS = 8;

  // Initial standard setup
  const INITIAL_BOARD = [
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
  ];

  // SVG Piece Icons for ultra-crisp minimalist rendering
  const PIECE_SVGS = {
    // White Pieces
    'P': `<svg viewBox="0 0 45 45"><path d="m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 l 23,0 c 0,-7.92 -4.41,-12.41 -7.41,-13.47 C 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z" fill="#ffffff" stroke="#1e293b" stroke-width="1.6" stroke-linecap="round"/></svg>`,
    'N': `<svg viewBox="0 0 45 45"><path d="m 22,10 c 10.5,1 16.5,8 16,29 L 15,39 C 15,30 9.5,24 9.5,24 l 4.5,-2.5 C 13.5,18 15,12 22,10 z" fill="#ffffff" stroke="#1e293b" stroke-width="1.6"/><path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 c -1.5,1 -4,2 -4,2 l 1,-4 c 3,-2 6,-4 8,-6.5 2,-2.5 3,-1 3,-0.5 z" fill="#1e293b"/><circle cx="15" cy="14.5" r="1.5" fill="#1e293b"/></svg>`,
    'B': `<svg viewBox="0 0 45 45"><g fill="#ffffff" stroke="#1e293b" stroke-width="1.6" stroke-linejoin="round"><path d="m 9,36 c 3.39,-0.97 10.11,0.43 13.5,-2 3.39,2.43 10.11,1.03 13.5,2 0,0 1.65,0.54 3,2 -0.68,0.97 -1.65,0.99 -3,1 -3.39,-0.21 -10.11,0.43 -13.5,-2 -3.39,2.43 -10.11,1.79 -13.5,2 -1.35,-0.01 -2.32,-0.03 -3,-1 1.35,-1.46 3,-2 3,-2 z"/><path d="m 15,32 c 2.5,2.5 12.5,2.5 15,0 0.5,-1.5 0,-2 0,-2 0,-2.5 -2.5,-4 -2.5,-4 5.5,-1.5 6,-11.5 -5,-15.5 -11,4 -10.5,14 -5,15.5 0,0 -2.5,1.5 -2.5,4 0,0 -0.5,0.5 0,2 z"/><path d="m 25,8 a 2.5,2.5 0 1 1 -5,0 2.5,2.5 0 1 1 5,0 z"/></g><path d="m 17.5,26 10,0 M 22.5,21.5 l 0,9" stroke="#1e293b" stroke-width="1.5"/></svg>`,
    'R': `<svg viewBox="0 0 45 45"><g fill="#ffffff" stroke="#1e293b" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M 9,39 L 36,39 L 36,36 L 9,36 z"/><path d="M 12,36 L 12,32 L 33,32 L 33,36 z"/><path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14 z"/><path d="M 12,14 L 33,14 L 31,32 L 14,32 z"/></g></svg>`,
    'Q': `<svg viewBox="0 0 45 45"><g fill="#ffffff" stroke="#1e293b" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38,14 L 31,25 L 22.5,10 L 14,25 L 7,14 L 9,26 z"/><path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 10.5,36 10.5,36 C 9,37.5 11,38.5 11,38.5 L 34,38.5 C 34,38.5 36,37.5 34.5,36 C 34.5,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 L 9,26 z"/><circle cx="6" cy="12" r="2"/><circle cx="14" cy="9" r="2"/><circle cx="22.5" cy="8" r="2"/><circle cx="31" cy="9" r="2"/><circle cx="39" cy="12" r="2"/></g></svg>`,
    'K': `<svg viewBox="0 0 45 45"><g fill="#ffffff" stroke="#1e293b" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M 22.5,11.63 L 22.5,6 M 20,8 L 25,8"/><path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 24,11.5 21,11.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25"/><path d="M 12.5,37 C 15,40.5 30,40.5 32.5,37 C 32.5,30 38.5,25.5 38.5,19.5 C 38.5,14 34,14 34,14 C 34,14 31,19 22.5,19 C 14,19 11,14 11,14 C 11,14 6.5,14 6.5,19.5 C 6.5,25.5 12.5,30 12.5,37 z"/><path d="M 11.5,37 L 33.5,37"/></g></svg>`,

    // Black Pieces
    'p': `<svg viewBox="0 0 45 45"><path d="m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 l 23,0 c 0,-7.92 -4.41,-12.41 -7.41,-13.47 C 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z" fill="#1e293b" stroke="#1e293b" stroke-width="1.5"/></svg>`,
    'n': `<svg viewBox="0 0 45 45"><path d="m 22,10 c 10.5,1 16.5,8 16,29 L 15,39 C 15,30 9.5,24 9.5,24 l 4.5,-2.5 C 13.5,18 15,12 22,10 z" fill="#1e293b" stroke="#1e293b" stroke-width="1.5"/><circle cx="15" cy="14.5" r="1.5" fill="#ffffff"/><path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 c -1.5,1 -4,2 -4,2 l 1,-4 c 3,-2 6,-4 8,-6.5 2,-2.5 3,-1 3,-0.5 z" fill="#ffffff" opacity="0.3"/></svg>`,
    'b': `<svg viewBox="0 0 45 45"><g fill="#1e293b" stroke="#1e293b" stroke-width="1.5" stroke-linejoin="round"><path d="m 9,36 c 3.39,-0.97 10.11,0.43 13.5,-2 3.39,2.43 10.11,1.03 13.5,2 0,0 1.65,0.54 3,2 -0.68,0.97 -1.65,0.99 -3,1 -3.39,-0.21 -10.11,0.43 -13.5,-2 -3.39,2.43 -10.11,1.79 -13.5,2 -1.35,-0.01 -2.32,-0.03 -3,-1 1.35,-1.46 3,-2 3,-2 z"/><path d="m 15,32 c 2.5,2.5 12.5,2.5 15,0 0.5,-1.5 0,-2 0,-2 0,-2.5 -2.5,-4 -2.5,-4 5.5,-1.5 6,-11.5 -5,-15.5 -11,4 -10.5,14 -5,15.5 0,0 -2.5,1.5 -2.5,4 0,0 -0.5,0.5 0,2 z"/><path d="m 25,8 a 2.5,2.5 0 1 1 -5,0 2.5,2.5 0 1 1 5,0 z"/></g><path d="m 17.5,26 10,0 M 22.5,21.5 l 0,9" stroke="#ffffff" stroke-width="1.5"/></svg>`,
    'r': `<svg viewBox="0 0 45 45"><g fill="#1e293b" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M 9,39 L 36,39 L 36,36 L 9,36 z"/><path d="M 12,36 L 12,32 L 33,32 L 33,36 z"/><path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14 z"/><path d="M 12,14 L 33,14 L 31,32 L 14,32 z"/></g><path d="M 14,16 L 31,16" stroke="#ffffff" stroke-width="1" opacity="0.3"/></svg>`,
    'q': `<svg viewBox="0 0 45 45"><g fill="#1e293b" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38,14 L 31,25 L 22.5,10 L 14,25 L 7,14 L 9,26 z"/><path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 10.5,36 10.5,36 C 9,37.5 11,38.5 11,38.5 L 34,38.5 C 34,38.5 36,37.5 34.5,36 C 34.5,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 L 9,26 z"/><circle cx="6" cy="12" r="2"/><circle cx="14" cy="9" r="2"/><circle cx="22.5" cy="8" r="2"/><circle cx="31" cy="9" r="2"/><circle cx="39" cy="12" r="2"/></g></svg>`,
    'k': `<svg viewBox="0 0 45 45"><g fill="#1e293b" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M 22.5,11.63 L 22.5,6 M 20,8 L 25,8" stroke="#ffffff"/><path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 24,11.5 21,11.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25"/><path d="M 12.5,37 C 15,40.5 30,40.5 32.5,37 C 32.5,30 38.5,25.5 38.5,19.5 C 38.5,14 34,14 34,14 C 34,14 31,19 22.5,19 C 14,19 11,14 11,14 C 11,14 6.5,14 6.5,19.5 C 6.5,25.5 12.5,30 12.5,37 z"/><path d="M 11.5,37 L 33.5,37"/></g></svg>`
  };

  // State variables
  let board = [];
  let currentTurn = 'w'; // 'w' (White) or 'b' (Black)
  let selectedSquare = null; // { r, c }
  let legalMoves = []; // Array of { r, c, flag }
  let history = []; // Undo stack
  let capturedWhite = []; // Pieces captured from White
  let capturedBlack = []; // Pieces captured from Black
  let lastMove = null; // { from: {r, c}, to: {r, c} }
  let castlingRights = {
    w: { k: true, q: true },
    b: { k: true, q: true }
  };
  let enPassantTarget = null; // { r, c } or null
  let pendingPromotion = null; // Callback or data waiting for promotion choice
  let isGameOver = false;
  // --- localStorage への自動保存と復元 ---
  const STORAGE_KEY = 'btime_chess_state';

  function saveState() {
    const data = {
      board,
      currentTurn,
      castlingRights,
      enPassantTarget,
      capturedWhite,
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
      castlingRights = data.castlingRights;
      enPassantTarget = data.enPassantTarget;
      capturedWhite = data.capturedWhite || [];
      capturedBlack = data.capturedBlack || [];
      lastMove = data.lastMove;
      history = data.history || [];
      isGameOver = data.isGameOver || false;
      return true;
    } catch (e) {
      console.error('Failed to load Chess state:', e);
      return false;
    }
  }

  // Helpers
  function isWhite(piece) {
    return piece && piece === piece.toUpperCase();
  }

  function isBlack(piece) {
    return piece && piece === piece.toLowerCase();
  }

  function getPieceColor(piece) {
    if (!piece) return null;
    return isWhite(piece) ? 'w' : 'b';
  }

  function inBounds(r, c) {
    return r >= 0 && r < ROWS && c >= 0 && c < COLS;
  }

  function cloneBoard(b) {
    return b.map(row => [...row]);
  }

  // Generate pseudo-legal moves (not checking if own King is left in check)
  function getPseudoMoves(b, r, c, castling, ep) {
    const piece = b[r][c];
    if (!piece) return [];
    const color = getPieceColor(piece);
    const type = piece.toUpperCase();
    const moves = [];

    const addMove = (tr, tc, flag = null) => {
      if (!inBounds(tr, tc)) return false;
      const target = b[tr][tc];
      if (!target) {
        moves.push({ r: tr, c: tc, flag });
        return true; // Continue sliding
      } else if (getPieceColor(target) !== color) {
        moves.push({ r: tr, c: tc, flag: 'capture' });
        return false; // Block sliding
      }
      return false; // Blocked by friendly piece
    };

    if (type === 'P') {
      const dir = color === 'w' ? -1 : 1;
      const startRow = color === 'w' ? 6 : 1;

      // 1 square forward
      if (inBounds(r + dir, c) && !b[r + dir][c]) {
        moves.push({ r: r + dir, c, flag: 'quiet' });
        // 2 squares forward
        if (r === startRow && !b[r + 2 * dir][c]) {
          moves.push({ r: r + 2 * dir, c, flag: 'double-pawn' });
        }
      }

      // Diagonal captures
      for (const dc of [-1, 1]) {
        const tr = r + dir;
        const tc = c + dc;
        if (inBounds(tr, tc)) {
          const target = b[tr][tc];
          if (target && getPieceColor(target) !== color) {
            moves.push({ r: tr, c: tc, flag: 'capture' });
          } else if (ep && ep.r === tr && ep.c === tc) {
            // En Passant capture
            moves.push({ r: tr, c: tc, flag: 'en-passant' });
          }
        }
      }
    } else if (type === 'N') {
      const knightOffsets = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
      ];
      for (const [dr, dc] of knightOffsets) {
        addMove(r + dr, c + dc);
      }
    } else if (type === 'B' || type === 'R' || type === 'Q') {
      const directions = [];
      if (type === 'B' || type === 'Q') {
        directions.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
      }
      if (type === 'R' || type === 'Q') {
        directions.push([-1, 0], [1, 0], [0, -1], [0, 1]);
      }

      for (const [dr, dc] of directions) {
        let step = 1;
        while (true) {
          const tr = r + dr * step;
          const tc = c + dc * step;
          if (!inBounds(tr, tc)) break;
          const continued = addMove(tr, tc);
          if (!continued) break;
          step++;
        }
      }
    } else if (type === 'K') {
      // 1-step in any 8 directions
      const kingOffsets = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1]
      ];
      for (const [dr, dc] of kingOffsets) {
        addMove(r + dr, c + dc);
      }

      // Castling
      const rights = castling[color];
      const backRank = color === 'w' ? 7 : 0;
      if (r === backRank && c === 4) {
        // King-side
        if (rights.k && !b[backRank][5] && !b[backRank][6]) {
          const rook = b[backRank][7];
          if (rook && rook.toUpperCase() === 'R' && getPieceColor(rook) === color) {
            moves.push({ r: backRank, c: 6, flag: 'castling-kingside' });
          }
        }
        // Queen-side
        if (rights.q && !b[backRank][3] && !b[backRank][2] && !b[backRank][1]) {
          const rook = b[backRank][0];
          if (rook && rook.toUpperCase() === 'R' && getPieceColor(rook) === color) {
            moves.push({ r: backRank, c: 2, flag: 'castling-queenside' });
          }
        }
      }
    }

    return moves;
  }

  // Check if square (r, c) is attacked by opponent
  function isSquareAttacked(b, r, c, attackerColor) {
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const piece = b[row][col];
        if (!piece || getPieceColor(piece) !== attackerColor) continue;

        const type = piece.toUpperCase();

        if (type === 'P') {
          const dir = attackerColor === 'w' ? -1 : 1;
          if (row + dir === r && (col - 1 === c || col + 1 === c)) return true;
        } else if (type === 'N') {
          const dRow = Math.abs(row - r);
          const dCol = Math.abs(col - c);
          if ((dRow === 1 && dCol === 2) || (dRow === 2 && dCol === 1)) return true;
        } else if (type === 'K') {
          if (Math.abs(row - r) <= 1 && Math.abs(col - c) <= 1) return true;
        } else if (type === 'B' || type === 'R' || type === 'Q') {
          const dRow = r - row;
          const dCol = c - col;
          const isDiag = Math.abs(dRow) === Math.abs(dCol);
          const isStraight = dRow === 0 || dCol === 0;

          if (isDiag && (type === 'B' || type === 'Q')) {
            const stepR = dRow > 0 ? 1 : -1;
            const stepC = dCol > 0 ? 1 : -1;
            let clear = true;
            for (let step = 1; step < Math.abs(dRow); step++) {
              if (b[row + step * stepR][col + step * stepC]) {
                clear = false;
                break;
              }
            }
            if (clear) return true;
          }

          if (isStraight && (type === 'R' || type === 'Q')) {
            const stepR = dRow === 0 ? 0 : (dRow > 0 ? 1 : -1);
            const stepC = dCol === 0 ? 0 : (dCol > 0 ? 1 : -1);
            const dist = Math.max(Math.abs(dRow), Math.abs(dCol));
            let clear = true;
            for (let step = 1; step < dist; step++) {
              if (b[row + step * stepR][col + step * stepC]) {
                clear = false;
                break;
              }
            }
            if (clear) return true;
          }
        }
      }
    }
    return false;
  }

  // Find King square
  function findKing(b, color) {
    const targetKing = color === 'w' ? 'K' : 'k';
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (b[r][c] === targetKing) return { r, c };
      }
    }
    return null;
  }

  // Is King in check
  function isKingInCheck(b, color) {
    const kingPos = findKing(b, color);
    if (!kingPos) return false;
    const opponentColor = color === 'w' ? 'b' : 'w';
    return isSquareAttacked(b, kingPos.r, kingPos.c, opponentColor);
  }

  // Full legal move generator (filters out king check violations & invalid castling path)
  function getStrictLegalMoves(b, r, c, color, castling, ep) {
    const pseudo = getPseudoMoves(b, r, c, castling, ep);
    const opponent = color === 'w' ? 'b' : 'w';
    const strictlyLegal = [];

    for (const m of pseudo) {
      // Castling rules: cannot castle out of, through, or into check
      if (m.flag === 'castling-kingside') {
        const backRank = color === 'w' ? 7 : 0;
        if (isSquareAttacked(b, backRank, 4, opponent) ||
          isSquareAttacked(b, backRank, 5, opponent) ||
          isSquareAttacked(b, backRank, 6, opponent)) {
          continue;
        }
      } else if (m.flag === 'castling-queenside') {
        const backRank = color === 'w' ? 7 : 0;
        if (isSquareAttacked(b, backRank, 4, opponent) ||
          isSquareAttacked(b, backRank, 3, opponent) ||
          isSquareAttacked(b, backRank, 2, opponent)) {
          continue;
        }
      }

      // Simulate move
      const sim = cloneBoard(b);
      const piece = sim[r][c];
      sim[r][c] = '';
      sim[m.r][m.c] = piece;

      if (m.flag === 'en-passant') {
        const capRow = color === 'w' ? m.r + 1 : m.r - 1;
        sim[capRow][m.c] = '';
      }

      // Does this move leave self in check?
      if (!isKingInCheck(sim, color)) {
        strictlyLegal.push(m);
      }
    }

    return strictlyLegal;
  }

  // Check if player has any legal moves available
  function hasAnyLegalMoves(b, color, castling, ep) {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const piece = b[r][c];
        if (piece && getPieceColor(piece) === color) {
          const moves = getStrictLegalMoves(b, r, c, color, castling, ep);
          if (moves.length > 0) return true;
        }
      }
    }
    return false;
  }

  // Execute move
  function makeMove(from, to, promoPiece = null) {
    const piece = board[from.r][from.c];
    const color = getPieceColor(piece);
    const targetPiece = board[to.r][to.c];
    const isPawn = piece.toUpperCase() === 'P';
    const isKing = piece.toUpperCase() === 'K';
    const isRook = piece.toUpperCase() === 'R';

    // Save history snapshot for undo
    history.push({
      board: cloneBoard(board),
      currentTurn,
      castlingRights: JSON.parse(JSON.stringify(castlingRights)),
      enPassantTarget: enPassantTarget ? { ...enPassantTarget } : null,
      capturedWhite: [...capturedWhite],
      capturedBlack: [...capturedBlack],
      lastMove: lastMove ? JSON.parse(JSON.stringify(lastMove)) : null,
      isGameOver
    });

    let captured = targetPiece;
    let isEnPassant = false;

    // Check en passant capture
    if (isPawn && enPassantTarget && to.r === enPassantTarget.r && to.c === enPassantTarget.c) {
      isEnPassant = true;
      const epCapRow = color === 'w' ? to.r + 1 : to.r - 1;
      captured = board[epCapRow][to.c];
      board[epCapRow][to.c] = '';
    }

    // Castling rook move
    if (isKing && Math.abs(to.c - from.c) === 2) {
      if (to.c === 6) { // Kingside
        board[from.r][5] = board[from.r][7];
        board[from.r][7] = '';
      } else if (to.c === 2) { // Queenside
        board[from.r][3] = board[from.r][0];
        board[from.r][0] = '';
      }
    }

    // Track captured pieces
    if (captured) {
      if (isWhite(captured)) capturedWhite.push(captured);
      else capturedBlack.push(captured);
      if (window.SoundFx) window.SoundFx.playCapture();
    } else {
      if (window.SoundFx) window.SoundFx.playMove();
    }

    // Place piece (apply promotion if provided)
    board[to.r][to.c] = promoPiece ? (color === 'w' ? promoPiece.toUpperCase() : promoPiece.toLowerCase()) : piece;
    board[from.r][from.c] = '';

    // Update En Passant Target
    if (isPawn && Math.abs(to.r - from.r) === 2) {
      enPassantTarget = { r: (from.r + to.r) / 2, c: from.c };
    } else {
      enPassantTarget = null;
    }

    // Update Castling Rights
    if (isKing) {
      castlingRights[color].k = false;
      castlingRights[color].q = false;
    }
    if (isRook) {
      if (from.r === 7 && from.c === 0) castlingRights.w.q = false;
      if (from.r === 7 && from.c === 7) castlingRights.w.k = false;
      if (from.r === 0 && from.c === 0) castlingRights.b.q = false;
      if (from.r === 0 && from.c === 7) castlingRights.b.k = false;
    }
    // Also if rook is captured
    if (to.r === 7 && to.c === 0) castlingRights.w.q = false;
    if (to.r === 7 && to.c === 7) castlingRights.w.k = false;
    if (to.r === 0 && to.c === 0) castlingRights.b.q = false;
    if (to.r === 0 && to.c === 7) castlingRights.b.k = false;

    lastMove = { from, to };
    selectedSquare = null;
    legalMoves = [];

    // Switch turn
    currentTurn = currentTurn === 'w' ? 'b' : 'w';

    // Verify Check / Checkmate / Stalemate
    const oppKingInCheck = isKingInCheck(board, currentTurn);
    const hasLegal = hasAnyLegalMoves(board, currentTurn, castlingRights, enPassantTarget);

    const noticeEl = document.getElementById('game-state-notice');
    if (oppKingInCheck) {
      if (!hasLegal) {
        isGameOver = true;
        noticeEl.textContent = `Checkmate! ${color === 'w' ? 'White' : 'Black'} wins!`;
        noticeEl.classList.add('show');
        if (window.SoundFx) window.SoundFx.playCheckmate();
      } else {
        noticeEl.textContent = 'Check!';
        noticeEl.classList.add('show');
        if (window.SoundFx) window.SoundFx.playCheck();
      }
    } else {
      if (!hasLegal) {
        isGameOver = true;
        noticeEl.textContent = 'Stalemate! Game is a draw.';
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

  // Handle Square Click
  function onSquareClick(r, c) {
    if (isGameOver) return;

    // Check if clicked square is a legal move for selected piece
    if (selectedSquare) {
      const matchMove = legalMoves.find(m => m.r === r && m.c === c);
      if (matchMove) {
        const piece = board[selectedSquare.r][selectedSquare.c];
        const isPawn = piece.toUpperCase() === 'P';
        const promoRow = currentTurn === 'w' ? 0 : 7;

        // Check if pawn reaches promotion rank
        if (isPawn && r === promoRow) {
          openPromotionModal(selectedSquare, { r, c });
          return;
        }

        makeMove(selectedSquare, { r, c });
        return;
      }
    }

    // Otherwise, select piece if it belongs to current player
    const clickedPiece = board[r][c];
    if (clickedPiece && getPieceColor(clickedPiece) === currentTurn) {
      if (selectedSquare && selectedSquare.r === r && selectedSquare.c === c) {
        // Deselect
        selectedSquare = null;
        legalMoves = [];
      } else {
        selectedSquare = { r, c };
        legalMoves = getStrictLegalMoves(board, r, c, currentTurn, castlingRights, enPassantTarget);
      }
      render();
    } else {
      selectedSquare = null;
      legalMoves = [];
      render();
    }
  }

  // Promotion Dialog Modal
  function openPromotionModal(from, to) {
    const modal = document.getElementById('promotion-modal');
    const title = document.getElementById('modal-promo-title');
    const subtitle = document.getElementById('modal-promo-subtitle');
    const optionsContainer = document.getElementById('promo-options');

    title.textContent = 'Pawn Promotion';
    subtitle.textContent = 'Select a piece to promote your Pawn:';
    optionsContainer.innerHTML = '';

    const promoChoices = [
      { key: 'Q', name: 'Queen' },
      { key: 'R', name: 'Rook' },
      { key: 'B', name: 'Bishop' },
      { key: 'N', name: 'Knight' }
    ];

    promoChoices.forEach(choice => {
      const btn = document.createElement('button');
      btn.className = 'promo-btn';
      const iconKey = currentTurn === 'w' ? choice.key : choice.key.toLowerCase();
      btn.innerHTML = `
        <div class="promo-btn-piece" style="width:36px;height:36px">${PIECE_SVGS[iconKey]}</div>
        <span class="promo-btn-label">${choice.name}</span>
      `;
      btn.addEventListener('click', () => {
        modal.classList.add('hidden');
        makeMove(from, to, choice.key);
      });
      optionsContainer.appendChild(btn);
    });

    modal.classList.remove('hidden');
  }

  // Undo Move
  function undo() {
    if (history.length === 0) return;
    const prev = history.pop();
    board = prev.board;
    currentTurn = prev.currentTurn;
    castlingRights = prev.castlingRights;
    enPassantTarget = prev.enPassantTarget;
    capturedWhite = prev.capturedWhite;
    capturedBlack = prev.capturedBlack;
    lastMove = prev.lastMove;
    isGameOver = prev.isGameOver;

    selectedSquare = null;
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

  // Restart Game
  function restart() {
    localStorage.removeItem(STORAGE_KEY);
    board = cloneBoard(INITIAL_BOARD);
    currentTurn = 'w';
    selectedSquare = null;
    legalMoves = [];
    history = [];
    capturedWhite = [];
    capturedBlack = [];
    lastMove = null;
    castlingRights = {
      w: { k: true, q: true },
      b: { k: true, q: true }
    };
    enPassantTarget = null;
    isGameOver = false;

    const noticeEl = document.getElementById('game-state-notice');
    noticeEl.textContent = '';
    noticeEl.classList.remove('show');

    render();
    updateMetaDisplay();
  }

  // Render UI
  function render() {
    const boardEl = document.getElementById('chess-board');
    if (!boardEl) return;
    boardEl.innerHTML = '';

    const checkKing = isKingInCheck(board, currentTurn) ? findKing(board, currentTurn) : null;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const sq = document.createElement('div');
        sq.className = `chess-sq ${(r + c) % 2 === 0 ? 'light' : 'dark'}`;

        if (selectedSquare && selectedSquare.r === r && selectedSquare.c === c) {
          sq.classList.add('selected');
        }

        if (lastMove && ((lastMove.from.r === r && lastMove.from.c === c) || (lastMove.to.r === r && lastMove.to.c === c))) {
          sq.classList.add('last-move');
        }

        if (checkKing && checkKing.r === r && checkKing.c === c) {
          sq.classList.add('in-check');
        }

        // Piece rendering
        const piece = board[r][c];
        if (piece && PIECE_SVGS[piece]) {
          const pieceEl = document.createElement('div');
          pieceEl.className = 'chess-piece';
          pieceEl.innerHTML = PIECE_SVGS[piece];
          sq.appendChild(pieceEl);
        }

        // Legal move hint
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

    renderCapturedStrips();
  }

  function renderCapturedStrips() {
    const whiteStrip = document.getElementById('chess-captured-white');
    const blackStrip = document.getElementById('chess-captured-black');

    if (whiteStrip) {
      whiteStrip.innerHTML = capturedWhite.map(p => `<span class="cap-piece" style="width:20px;height:20px">${PIECE_SVGS[p]}</span>`).join('');
    }
    if (blackStrip) {
      blackStrip.innerHTML = capturedBlack.map(p => `<span class="cap-piece" style="width:20px;height:20px">${PIECE_SVGS[p]}</span>`).join('');
    }
  }

  function updateMetaDisplay() {
    const turnDot = document.getElementById('turn-dot');
    const turnText = document.getElementById('turn-text');
    const lastMoveDesc = document.getElementById('last-move-desc');

    if (turnDot && turnText) {
      turnDot.className = 'turn-dot' + (currentTurn === 'b' ? ' black-turn' : '');
      turnText.textContent = currentTurn === 'w' ? "White's turn" : "Black's turn";
    }

    if (lastMoveDesc) {
      if (lastMove) {
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const fromCoord = `${files[lastMove.from.c]}${8 - lastMove.from.r}`;
        const toCoord = `${files[lastMove.to.c]}${8 - lastMove.to.r}`;
        lastMoveDesc.textContent = `${fromCoord} → ${toCoord}`;
      } else {
        lastMoveDesc.textContent = 'Ready for first move';
      }
    }
  }

  // Initialize
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
