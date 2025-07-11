import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

// === COLOR & STYLE CONSTANTS ===
const COLORS = {
  primary: '#2ecc40',    // board bg / snake
  accent: '#ff4136',     // food
  secondary: '#ffdc00',  // score, some highlights
  boardBorder: '#eaeaea', // subtle board border
  bg: '#fff'             // container bg
};
const BOARD_SIZE = 20;     // 20x20 grid
const INITIAL_SNAKE = [
  { x: 8, y: 10 }, { x: 7, y: 10 }, { x: 6, y: 10 }
];
const INITIAL_DIR = { x: 1, y: 0 }; // right
const SPEED = 100; // ms, lower=faster

// PUBLIC_INTERFACE
function App() {
  // -- Game state
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIR);
  const [food, setFood] = useState(randomFood(INITIAL_SNAKE));
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [started, setStarted] = useState(false);

  // To avoid stale closure, useRef for latest direction
  const directionRef = useRef(direction);
  useEffect(() => { directionRef.current = direction; }, [direction]);

  // Keyboard listeners
  useEffect(() => {
    const handleKey = (e) => {
      if (e.repeat) return; // ignore key hold
      let newDir;
      if (e.key === "ArrowUp" || e.key === "w")      newDir = { x: 0, y: -1 };
      else if (e.key === "ArrowDown" || e.key === "s") newDir = { x: 0, y: 1 };
      else if (e.key === "ArrowLeft" || e.key === "a")  newDir = { x: -1, y: 0 };
      else if (e.key === "ArrowRight" || e.key === "d") newDir = { x: 1, y: 0 };
      else return;
      // prevent 180 reverse
      const curr = directionRef.current;
      if (curr.x !== -newDir.x || curr.y !== -newDir.y) setDirection(newDir);
      setStarted(true);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Main game loop (timer)
  useEffect(() => {
    if (gameOver || !started) return;
    const interval = setInterval(() => {
      setSnake(prevSnake => {
        const newHead = {
          x: prevSnake[0].x + directionRef.current.x,
          y: prevSnake[0].y + directionRef.current.y
        };
        // Check collisions
        if (
          outOfBounds(newHead) ||
          collisionWithSelf(newHead, prevSnake)
        ) {
          setGameOver(true);
          setStarted(false);
          return prevSnake;
        }
        // Eat food?
        let newSnake;
        if (newHead.x === food.x && newHead.y === food.y) {
          newSnake = [newHead, ...prevSnake];
          setScore(s => s + 1);
          setFood(randomFood([newHead, ...prevSnake]));
        } else {
          newSnake = [newHead, ...prevSnake.slice(0, -1)];
        }
        return newSnake;
      });
    }, SPEED);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [food, started, gameOver]);

  // PUBLIC_INTERFACE
  const restartGame = useCallback(() => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIR);
    setScore(0);
    setFood(randomFood(INITIAL_SNAKE));
    setGameOver(false);
    setStarted(false);
  }, []);

  // Responsive board size
  const boardPx = Math.max(
    Math.min(window.innerWidth, window.innerHeight) * 0.7, 320
  );
  const cellPx = boardPx / BOARD_SIZE;

  return (
    <div
      className="snake-app"
      style={{
        minHeight: '100vh',
        background: COLORS.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <main
        className="snake-main"
        style={{
          display: 'flex',
          flexDirection: window.innerWidth > 700 ? 'row' : 'column',
          gap: 40,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Score panel */}
        <section className="score-panel"
          style={{
            minWidth: 200,
            textAlign: 'center',
            marginBottom: window.innerWidth > 700 ? 0 : 20,
          }}>
          <h1 style={{
            fontWeight: 700,
            fontSize: 36,
            marginBottom: 8,
            color: COLORS.primary,
            letterSpacing: '.01em'
          }}>Snake</h1>
          <div style={{
            background: COLORS.secondary,
            color: '#222',
            padding: '8px 0',
            borderRadius: 12,
            fontWeight: 600,
            fontSize: 20,
            marginBottom: 14,
          }}>Score: <span>{score}</span></div>
          <div style={{
            color: "#444",
            fontSize: 16,
            opacity: 0.85,
            marginBottom: 16
          }}>
            {gameOver
              ? <b style={{ color: COLORS.accent }}>Game Over!</b>
              : (started ? 'Use arrow keys or WASD' : 'Press any arrow key or WASD to start')}
          </div>
          <button
            onClick={restartGame}
            className="restart-btn"
            style={{
              background: COLORS.primary,
              color: "#fff",
              fontWeight: 600,
              border: 0,
              borderRadius: 8,
              fontSize: 16,
              padding: '10px 18px',
              cursor: 'pointer',
              marginBottom: 10,
              opacity: (gameOver || score > 0) ? 1 : 0.9,
              boxShadow: (gameOver) ? `0 2px 8px ${COLORS.accent}33` : 'none',
              transition: '0.2s opacity, 0.22s box-shadow'
            }}
          >{gameOver ? "Restart" : "Reset"}</button>
          <ControlsVisual />
        </section>
        {/* Game board */}
        <section
          className="snake-board"
          style={{
            width: boardPx,
            height: boardPx,
            background: "#fff",
            border: `2.2px solid ${COLORS.boardBorder}`,
            borderRadius: 18,
            boxShadow: "0 4px 32px rgba(60,60,60,0.08)",
            position: "relative",
            display: "grid",
            gridTemplateColumns: `repeat(${BOARD_SIZE},1fr)`,
            gridTemplateRows: `repeat(${BOARD_SIZE},1fr)`,
            overflow: "hidden",
            touchAction: 'none'
          }}
        >
          {/* Render snake cells */}
          {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, idx) => {
            const x = idx % BOARD_SIZE, y = Math.floor(idx / BOARD_SIZE);
            const isSnake = snake.some(c => c.x === x && c.y === y);
            const isHead = (snake[0].x === x && snake[0].y === y);
            const isFood = (food.x === x && food.y === y);
            return (
              <div key={idx}
                style={{
                  width: '100%',
                  height: '100%',
                  background: isHead
                    ? COLORS.primary
                    : isSnake
                      ? `${COLORS.primary}BB`
                      : isFood
                        ? COLORS.accent
                        : "transparent",
                  borderRadius: isSnake ? 6 : (isFood ? '50%' : 0),
                  boxShadow: isHead
                    ? `0 1px 5px ${COLORS.primary}44`
                    : isFood
                      ? `0 1px 5px ${COLORS.accent}44`
                      : 'none',
                  border: isFood ? `2px solid ${COLORS.secondary}` : '',
                  transition: 'background 0.16s, box-shadow 0.16s',
                  margin: '1.5px'
                }}
              />
            );
          })}
          {/* Overlay Game Over */}
          {gameOver &&
            <div style={{
              position: "absolute", zIndex: 4,
              left: 0, top: 0, width: '100%', height: '100%',
              background: "#fff9",
              display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
              fontWeight: 700, fontSize: 40, color: COLORS.accent, letterSpacing: "0.04em"
            }}>
              Game Over
              <span style={{
                fontWeight: 500, fontSize: 20, marginTop: 12, color: "#222"
              }}>Score: {score}</span>
              <button
                className="restart-btn"
                style={{
                  marginTop: 18,
                  background: COLORS.primary, color: "#fff", fontWeight: 600,
                  border: 0, borderRadius: 8, fontSize: 18, padding: '12px 28px', cursor: 'pointer',
                  boxShadow: `0 1.5px 6px ${COLORS.accent}33`
                }}
                onClick={restartGame}
              >
                Restart
              </button>
            </div>
          }
        </section>
      </main>
      <footer style={{
        position: 'fixed', bottom: 0, left: 0, width: '100%',
        textAlign: 'center', color: "#bbb", background: 'none',
        fontSize: 14, padding: 14, letterSpacing: '0.01em'
      }}>
        &copy; {new Date().getFullYear()} Minimal Snake Game — Powered by React
      </footer>
    </div>
  );
}

// PUBLIC_INTERFACE
function ControlsVisual() {
  // Simple display for controls (keyboard keys)
  return (
    <div className="controls-visual" style={{
      marginTop: 18,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      opacity: 0.80
    }}>
      <div style={{ display: 'flex', gap: 6 }}>
        <KeyCap>W</KeyCap>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <KeyCap>A</KeyCap>
        <KeyCap>S</KeyCap>
        <KeyCap>D</KeyCap>
      </div>
      <div style={{
        fontSize: 12,
        color: "#676767",
        marginTop: 4,
        opacity: 0.75
      }}>
        or use Arrow Keys
      </div>
    </div>
  );
}
// PUBLIC_INTERFACE
function KeyCap({ children }) {
  return (
    <span style={{
      display: "inline-block",
      minWidth: 22, minHeight: 22,
      padding: "2px 8px",
      borderRadius: 6,
      background: "#f3f3f3",
      border: "1.5px solid #ddd",
      boxShadow: "0 1px 1.5px #cccccc88",
      color: "#222",
      fontFamily: "monospace",
      fontSize: 15,
      fontWeight: 600,
      margin: "1px 3px",
      lineHeight: 1.2,
      textAlign: "center",
      letterSpacing: ".06em"
    }}>{children}</span>
  );
}

// --- Game Logic helpers ---
function outOfBounds({ x, y }) {
  return x < 0 || y < 0 || x >= BOARD_SIZE || y >= BOARD_SIZE;
}
function collisionWithSelf(head, snakeArr) {
  return snakeArr.some(seg => seg.x === head.x && seg.y === head.y);
}
function randomFood(snakeArr) {
  let pos;
  do {
    pos = {
      x: Math.floor(Math.random() * BOARD_SIZE),
      y: Math.floor(Math.random() * BOARD_SIZE),
    };
  } while (snakeArr.some(seg => seg.x === pos.x && seg.y === pos.y));
  return pos;
}

export default App;
