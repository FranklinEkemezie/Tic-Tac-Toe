/* ----------------------------------
# Helper Functions
------------------------------------- */
class HelperFunctions {
  static select = (selectors, all=false) => all ? [...document.querySelectorAll(selectors)] : document.querySelector(selectors);

  static children = (element) => [...element.children];
}

/* ----------------------------------
# GAME properties and methods
------------------------------------- */
class GAME {
  static #board;
  static #original_board_status;
  static current_board_status;
  static #next_player;
  static #ai_initiated;
  static #player1;
  static #player2;
  static #win_combos = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 4, 8],
    [2, 4, 6],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8]
  ];

  static start() {
    //  Set initial values
    this.#original_board_status = Array.from(Array(9).keys());
    this.current_board_status = [...this.#original_board_status];

    this.#board = HelperFunctions.select("main .board");

    // Initiate players
    [this.#player1, this.#player2] = this.#initiatePlayers();
    this.#next_player = this.#player1;

    // Add eventlisteners
    HelperFunctions.select("header .restart-btn").addEventListener("click",this.#restartGame);
    HelperFunctions.select("footer .ai-btn").addEventListener("click", this.#initiateAI);

    // List the player
    // console.log(this.#player1, this.#player2);

    // Display turn
    this.#displayTurn(this.#next_player);

    //  Create cells
    this.#createCells();
  }

  static #restartGame = () => {
    //  Set initial values
    this.#original_board_status = Array.from(Array(9).keys());
    this.current_board_status = [...this.#original_board_status];

    this.#next_player = this.#player1;

    // List the player
    // console.log(this.#player1, this.#player2);

    // Remove banner, if it its there
    let banner = HelperFunctions.select(".banner");
    if(banner) banner.parentElement.removeChild(banner);

    // Display turn
    this.#displayTurn(this.#next_player);

    //  Create cells
    this.#createCells();

  }

  static #createCells() {
    // Check if the board already has cells
    if(this.#board.children.length > 0) {
      HelperFunctions.children(this.#board).forEach(cell => {
        cell.addEventListener("click", this.#handleCellClick);
        cell.innerHTML = "";
        cell.classList.remove("won");
        cell.classList.remove("tie");
      });
      return;
    }

    for (let i = 0; i < this.#original_board_status.length; i++) {
      let cell = document.createElement("div");
      cell.classList.add("cell");
      cell.addEventListener("click", this.#handleCellClick);
  
      this.#board.append(cell);
    }
  }

  static #hideAIBtn() {
    const ai_btn = HelperFunctions.select("footer .ai-btn");

    ai_btn.removeEventListener("click", this.#initiateAI);
    ai_btn.animate(
      [{opacity: 1, opacity: 0}],
      {
        duration: 400,
        fill: 'forwards',
        easing: 'linear'
      }
    )
    setTimeout(() => ai_btn.style.display = "none", 400);
  }

  static #initiateAI = () => {
    if(!this.#ai_initiated) this.#ai_initiated = true;

    // Hide the AI button
    this.#hideAIBtn();

    // Restart game
    this.start();
  }

  static #initiatePlayers() {
    let player1 = prompt("Enter a name for Player O: ", "Player 1") || "Player 1";

    if(this.#ai_initiated) return [new PlayerHU('O', player1), new PlayerAI('X', 'AI')];

    let player2 = prompt("Enter a name for Player X: ", "Player 2") || "Player 2";

    return [new PlayerHU('O', player1), new PlayerHU('X', player2)]
  }

  static #displayTurn = (next_player) => HelperFunctions.select("header .turn-display").innerHTML = `${next_player.playerID}'s Turn`;

  static oponent = (me) => [this.#player1, this.#player2].filter(player => player.playerID !== me.playerID)[0];

  static #switchPlayers = () => {
    this.#next_player = this.#next_player === this.#player1 ? this.#player2 : this.#player1;

    this.#displayTurn(this.#next_player);
  }


  static #handleCellClick = (event) => {
    let clicked_cell = event.target;
    let clicked_cell_index = HelperFunctions.children(clicked_cell.parentElement).indexOf(clicked_cell);
    let player = this.#next_player;

    // Hide the AI btn
    if(!this.#ai_initiated) this.#ai_initiated = false;
    this.#hideAIBtn();

    // Call the player's play() method
    player.play(clicked_cell);

    // Remove EventListener
    clicked_cell.removeEventListener("click", this.#handleCellClick);

    // Update current board status
    this.current_board_status[clicked_cell_index] = player.playerID;

    // Check win or tie
    if(this.checkWin(undefined, player) || this.checkTie()) {
      // Send the object as argument to gameOver
      this.#gameOver(this.checkWin(undefined, player));
      return; // stop the game
    }

    // Switch players
    this.#switchPlayers();

    // Check if nextplayer is AI: for HU VS. AI
    if(this.#next_player.playerName === 'AI') this.#next_player.click();
  }

  static #plays = (board_state=this.current_board_status, player) => board_state.reduce((prev, curr, index) => (curr === player.playerID) ? prev.concat(index) : prev, []);

  static emptySquares = () => this.current_board_status.filter(e => typeof e === "number");

  static checkWin(board_state=this.current_board_status, player) {
    let plays = this.#plays(board_state, player);

    for(let win_combo of this.#win_combos) {
      if(win_combo.every(win_combo_index => plays.includes(win_combo_index))) return {player, win_combo};
    }
    return false;
  }

  static checkTie = () => this.emptySquares().length === 0 ? true : false;

  static #declareWinner(win) {
    let board_cells = HelperFunctions.children(this.#board);

    // Highlight the win_combo cells
    win ? win.win_combo.forEach(index => board_cells[index].classList.add("won")) : board_cells.forEach(cell => cell.classList.add("tie"));

    // Display banner
    this.#displayBanner(win.player);
  }

  static #displayBanner(winner) {
    // If 'winner' is undefined, then it's a tie

    let banner = document.createElement("div");
    banner.classList.add("banner");
    banner.innerHTML = `
    <h1>Game Over!</h1>
    <em><b>${this.#player1.playerName}</b> vs <b>${this.#player2.playerName}</b></em>
    <p>${!winner ? "It's a Tie" : winner.playerName === "AI" ? 'You lose' : `<strong>${winner.playerName}</strong> won`}</p>
    <span>Restart Game</span>
    `;

    HelperFunctions.select("main").append(banner);
    banner.animate([
      {transform: 'translate(-50%, -50%) scale(0)'},
      {transform: 'translate(-50%, -50%) scale(1.2)'},
      {transform: 'translate(-50%, -50%) scale(0.8)'},
      {transform: 'translate(-50%, -50%)scale(1.08)'},
      {transform: 'translate(-50%, -50%) scale(1)'}
    ],
    {
      duration: 1000,
      easing: 'ease-in-out',
      fill: 'forwards'
    });

    banner.addEventListener("click", this.#restartGame);
  }

  static #gameOver(win) {
    //The 'win' parameter holds an object containing the details if the game ends by winning else it is false, which means it is by 'tie'

    // Remove all eventlisteners
    HelperFunctions.children(this.#board).forEach(cell => cell.removeEventListener("click", this.#handleCellClick));

    // Remove turn display
    HelperFunctions.select(".turn-display").innerHTML = '';

    // Declare winner
    this.#declareWinner(win);
  }

}

/* ----------------------------------
# Player Class
------------------------------------- */
class Player {
  constructor(playerID, playerName) {
    this.playerID = playerID;
    this.playerName = playerName;
  }

  play(cell) {
    // This function does the actual stuff of:
    // - displaying
    cell.innerHTML = this.playerID;
  }
}

/* ----------------------------------
# Player HU Class
------------------------------------- */
class PlayerHU extends Player {
  play(cell) {
    super.play(cell);
  }
}

/* ----------------------------------
# Player AI Class
------------------------------------- */
class PlayerAI extends Player {
  play = (cell) => super.play(cell);
  click = () => this.move().click();

  move() {
    let best_spot = PlayerAI.#minimax(GAME.current_board_status, this, this, GAME.oponent(this));
    return HelperFunctions.select("main .board").children[best_spot.index];
  }

  static #minimax(virt_curr_board_stat, current_player, maximizing_player, minimizing_player) {
    let avail_spots = GAME.emptySquares();

    if(GAME.checkWin(virt_curr_board_stat, minimizing_player)) {
      return {score: -1000}
    } else if (GAME.checkWin(virt_curr_board_stat, maximizing_player)) {
      return {score: 1000}
    } else if(avail_spots.length === 0) {
      return {score: 0}
    }

    let moves = [];
    for(let i = 0; i < avail_spots.length; i++) {
      let move = {};

      // Track the index of the current cell in the available spots
      move.index = virt_curr_board_stat[avail_spots[i]];

      // Replacing with the player's id to mimic playing it by occupying the space available
      virt_curr_board_stat[avail_spots[i]] = current_player.playerID;

      // Under the hood, alternate turns to see the final result
      if(current_player.playerID === maximizing_player.playerID) {
        let result = this.#minimax(virt_curr_board_stat, minimizing_player, maximizing_player, minimizing_player);

        move.score = result.score;
      } else {
        let result = this.#minimax(virt_curr_board_stat, maximizing_player, maximizing_player, minimizing_player);

        move.score = result.score;
      }

      // Replace back with original index
      virt_curr_board_stat[avail_spots[i]] = move.index;

      moves.push(move);
    }

    let best_move;
    if(current_player.playerID === maximizing_player.playerID) {
      let best_score = -Infinity;
      for(let i = 0; i < moves.length; i++) {
        if(moves[i].score > best_score) {
          best_score = moves[i].score;
          best_move = i;
        }
      }
    } else {
      let best_score = Infinity;
      for(let i = 0; i < moves.length; i++) {
        if(moves[i].score < best_score) {
          best_score = moves[i].score;
          best_move = i;
        }
      }
    }

    return moves[best_move];
  }
}

// Start the game: Load features
GAME.start();