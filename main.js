const rows = 20;
const cols = 30;

let grid = [];
let startCell = { row: 5, col: 5 };
let endCell = { row: 15, col: 25 };

let isMouseDown = false;
let movingStart = false;
let movingEnd = false;

const gridEl = document.getElementById("grid");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const algorithmSelect = document.getElementById("algorithm");
const speedSlider = document.getElementById("speedSlider");
const pathLengthEl = document.getElementById("pathLength");

// ========== Grid Initialization ==========

function createGrid() {
  gridEl.innerHTML = "";
  grid = [];

  for (let r = 0; r < rows; r++) {
    const row = [];

    for (let c = 0; c < cols; c++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.dataset.row = r;
      cell.dataset.col = c;

      cell.addEventListener("mousedown", onMouseDown);
      cell.addEventListener("mouseenter", onMouseEnter);
      cell.addEventListener("mouseup", onMouseUp);

      gridEl.appendChild(cell);

      row.push({ isWall: false, visited: false, parent: null });
    }

    grid.push(row);
  }

  setCell(startCell, "start");
  setCell(endCell, "end");
}

function setCell({ row, col }, type) {
  const cell = getCellElement(row, col);
  cell.className = "cell";
  if (type) cell.classList.add(type);
}

function getCellElement(row, col) {
  return document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
}

// ========== Mouse Events ==========

function onMouseDown(e) {
  isMouseDown = true;

  const row = +e.target.dataset.row;
  const col = +e.target.dataset.col;

  if (row === startCell.row && col === startCell.col) {
    movingStart = true;
  } else if (row === endCell.row && col === endCell.col) {
    movingEnd = true;
  } else {
    toggleWall(row, col);
  }
}

function onMouseEnter(e) {
  if (!isMouseDown) return;

  const row = +e.target.dataset.row;
  const col = +e.target.dataset.col;

  if (movingStart) {
    startCell = { row, col };
    refreshGrid();
  } else if (movingEnd) {
    endCell = { row, col };
    refreshGrid();
  } else {
    toggleWall(row, col);
  }
}

function onMouseUp() {
  isMouseDown = false;
  movingStart = false;
  movingEnd = false;
}

function toggleWall(row, col) {
  if ((row === startCell.row && col === startCell.col) ||
      (row === endCell.row && col === endCell.col)) return;

  grid[row][col].isWall = !grid[row][col].isWall;
  getCellElement(row, col).classList.toggle("wall");
}

function refreshGrid() {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = getCellElement(r, c);
      cell.className = "cell";
      if (grid[r][c].isWall) cell.classList.add("wall");
    }
  }

  setCell(startCell, "start");
  setCell(endCell, "end");
}

// ========== Visualization Control ==========

async function visualize() {
  clearPath();

  const algorithm = algorithmSelect.value;
  let result;

  if (algorithm === "dijkstra") result = await dijkstra();
  else if (algorithm === "bfs") result = await bfs();
  else if (algorithm === "dfs") result = await dfs();
  else if (algorithm === "astar") result = await astar();

  const path = result || [];

  for (const { row, col } of path) {
    const el = getCellElement(row, col);
    el.classList.remove("visited");
    el.classList.add("path");
    await sleep(speedSlider.value);
  }

  pathLengthEl.textContent = path.length;
}

function clearPath() {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      grid[r][c].visited = false;
      grid[r][c].parent = null;

      const el = getCellElement(r, c);
      el.classList.remove("visited", "path");
    }
  }
}

// ========== Utility ==========

function getNeighbors(row, col) {
  const dirs = [[0,1], [1,0], [-1,0], [0,-1]];
  const neighbors = [];

  for (const [dr, dc] of dirs) {
    const nr = row + dr;
    const nc = col + dc;

    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !grid[nr][nc].isWall) {
      neighbors.push({ row: nr, col: nc });
    }
  }

  return neighbors;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function tracePath(row, col) {
  const path = [];
  let curr = { row, col };

  while (curr && !(curr.row === startCell.row && curr.col === startCell.col)) {
    path.unshift(curr);
    curr = grid[curr.row][curr.col].parent;
  }

  return path;
}

// ========== Algorithms ==========

async function bfs() {
  const queue = [startCell];
  grid[startCell.row][startCell.col].visited = true;

  while (queue.length) {
    const { row, col } = queue.shift();

    if (row === endCell.row && col === endCell.col) return tracePath(row, col);

    for (const n of getNeighbors(row, col)) {
      if (!grid[n.row][n.col].visited) {
        grid[n.row][n.col].visited = true;
        grid[n.row][n.col].parent = { row, col };
        getCellElement(n.row, n.col).classList.add("visited");
        await sleep(speedSlider.value / 2);
        queue.push(n);
      }
    }
  }

  return [];
}

async function dfs() {
  const stack = [startCell];
  grid[startCell.row][startCell.col].visited = true;

  while (stack.length) {
    const { row, col } = stack.pop();

    if (row === endCell.row && col === endCell.col) return tracePath(row, col);

    for (const n of getNeighbors(row, col)) {
      if (!grid[n.row][n.col].visited) {
        grid[n.row][n.col].visited = true;
        grid[n.row][n.col].parent = { row, col };
        getCellElement(n.row, n.col).classList.add("visited");
        await sleep(speedSlider.value / 2);
        stack.push(n);
      }
    }
  }

  return [];
}

async function dijkstra() {
  const dist = Array.from({ length: rows }, () => Array(cols).fill(Infinity));
  dist[startCell.row][startCell.col] = 0;

  const pq = [{ ...startCell, dist: 0 }];

  while (pq.length) {
    pq.sort((a, b) => a.dist - b.dist);
    const { row, col } = pq.shift();

    if (grid[row][col].visited) continue;
    grid[row][col].visited = true;
    getCellElement(row, col).classList.add("visited");

    if (row === endCell.row && col === endCell.col) return tracePath(row, col);

    for (const n of getNeighbors(row, col)) {
      const alt = dist[row][col] + 1;

      if (alt < dist[n.row][n.col]) {
        dist[n.row][n.col] = alt;
        grid[n.row][n.col].parent = { row, col };
        pq.push({ ...n, dist: alt });
      }
    }

    await sleep(speedSlider.value / 2);
  }

  return [];
}

async function astar() {
  const h = (a, b) => Math.abs(a.row - b.row) + Math.abs(a.col - b.col);

  const open = [{ ...startCell, f: 0 }];
  const g = Array.from({ length: rows }, () => Array(cols).fill(Infinity));
  g[startCell.row][startCell.col] = 0;

  while (open.length) {
    open.sort((a, b) => a.f - b.f);
    const { row, col } = open.shift();

    if (grid[row][col].visited) continue;
    grid[row][col].visited = true;
    getCellElement(row, col).classList.add("visited");

    if (row === endCell.row && col === endCell.col) return tracePath(row, col);

    for (const n of getNeighbors(row, col)) {
      const tentativeG = g[row][col] + 1;

      if (tentativeG < g[n.row][n.col]) {
        g[n.row][n.col] = tentativeG;
        const f = tentativeG + h(n, endCell);
        open.push({ ...n, f });
        grid[n.row][n.col].parent = { row, col };
      }
    }

    await sleep(speedSlider.value / 2);
  }

  return [];
}

// ========== Initialize ==========

startBtn.addEventListener("click", visualize);
resetBtn.addEventListener("click", createGrid);

createGrid();
