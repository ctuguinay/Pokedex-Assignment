/*
 * Name: Caesar Tuguinay
 * Date: February 6, 2022
 * Section: CSE 154
 *
 * This is the injex.js for my javascript code. It provides
 * code to handle the appropriate events in my index.html.
 */

"use strict";
(function() {
  const BASE_URL = "https://courses.cs.washington.edu/courses/cse154/webservices/";
  let GUID;
  let PID;
  let SHORT_NAME;
  let SHORT_NAME_TWO;
  let HP;

  window.addEventListener("load", init);

  /**
   * Sets up event listener for the button in the index page.
   */
  function init() {
    getPokemon();
    document.getElementById("start-btn").addEventListener("click", startClicked);
    document.getElementById("endgame").addEventListener("click", endGame);
    document.getElementById("flee-btn").addEventListener("click", fleeButton);
  }

  /**
   * Gets pokemon and places them in the pokedex
   */
  function getPokemon() {
    const url = BASE_URL + "pokedex/pokedex.php?pokedex=all";
    fetch(url)
      .then(statusCheck)
      .then(resp => resp.text())
      .then(fillPokedex)
      .catch(handleError);
  }

  /**
   * Fills the pokedex with the relevant data and
   * found pokemon.
   */
  function fillPokedex(dataPoke) {
    let pokedex = document.getElementById("pokedex-view");
    let arrayData = dataPoke.split("\n");
    for (let i = 0; i < arrayData.length; i++) {
      let data = arrayData[i];
      let img = document.createElement("img");
      let dSplit = data.split(":");
      img.src = BASE_URL + "pokedex/sprites/" + dSplit[1] + ".png";
      img.alt = dSplit[1];
      img.classList.add("sprite");
      pokedex.appendChild(img);
    }
    foundPokemon("bulbasaur");
    foundPokemon("charmander");
    foundPokemon("squirtle");
  }

  /**
   * Adds a found pokemon to the pokedex.
   */
  function foundPokemon(name) {
    let img = document.querySelector('img[alt=' + name + ']');
    img.classList.add("found");
    img.addEventListener("click", function() {
      clickFound(img.alt);
    });
  }

  /**
   * Ensures that clicking a found pokemon will edit the p1
   * card appropriately.
   */
  function clickFound(name) {
    const url = BASE_URL + "pokedex/pokedex.php?pokemon=" + name;
    fetch(url)
      .then(statusCheck)
      .then(resp => resp.json())
      .then(cardEdit)
      .catch(handleError);
  }

  /**
   * Edits card data to match a clicked found pokemon
   * specifically for p1.
   */
  function cardEdit(data) {
    cardEditChoose(data, "p1");
  }

  /**
   * Edits card data to match a clicked found pokemon
   * for both p1 and p2.
   */
  function cardEditChoose(data, player) {
    let card = document.getElementById(player);
    card.getElementsByClassName("name")[0].textContent = data.name;
    card.getElementsByClassName("pokepic")[0].src = BASE_URL + "pokedex/" +
     data.images.photo;
    card.getElementsByClassName("type")[0].src = BASE_URL + "pokedex/" +
      data.images.typeIcon;
    card.getElementsByClassName("weakness")[0].src = BASE_URL + "pokedex/" +
      data.images.weaknessIcon;
    card.getElementsByClassName("hp")[0].textContent = data.hp + "HP";
    card.getElementsByClassName("info")[0].textContent = data.info.description;
    if (player === "p1") {
      HP = data.hp;
      removeMoveListeners();
      SHORT_NAME = data.shortname;
      let moveCards = card.getElementsByClassName("moves")[0]
        .getElementsByTagName("button");
      let moves = data.moves;
      for (let i = 0; i < moveCards.length; i++) {
        let moveCard = moveCards[i];
        if (moves[i]) {
          cardExists(moveCard, moves[i], player);
        } else {
          moveCard.classList.add("hidden");
        }
      }
    } else if (player === "p2") {
      SHORT_NAME_TWO = data.shortname;
    }
  }

  /**
   * Sets up a move card if that move card actually exists.
   */
  function cardExists(moveCard, move, player) {
    moveCard.classList.remove("hidden");
    moveCard.getElementsByClassName("move")[0].textContent = move.name;
    moveCard.getElementsByClassName("dp")[0].textContent = "";
    if (move.dp) {
      moveCard.getElementsByClassName("dp")[0].textContent = move.dp + " DP";
    }
    moveCard.getElementsByTagName("img")[0].src = BASE_URL + "pokedex/icons/" +
      move.type + ".jpg";
    moveCard.addEventListener("click", function() {
      moveSelected(move);
    });
    if (player === "p1") {
      document.getElementById("start-btn").classList.remove("hidden");
    }
  }

  /**
   * Sets up the game state for when start is clicked.
   */
  function startClicked() {
    document.getElementById("pokedex-view").classList.add("hidden");
    document.getElementById("endgame").classList.add("hidden");
    document.getElementById("p2").classList.remove("hidden");
    document.getElementsByClassName("hp-info")[0].classList.remove("hidden");
    document.getElementById("results-container").classList.remove("hidden");
    document.getElementById("p1-turn-results").classList.remove("hidden");
    document.getElementById("p2-turn-results").classList.remove("hidden");
    document.getElementById("flee-btn").classList.remove("hidden");
    document.getElementById("start-btn").classList.add("hidden");
    document.getElementsByTagName("header")[0].getElementsByTagName("h1")[0]
      .textContent = "Pokemon Battle!";
    let buttons = document.getElementById("p1").getElementsByClassName("moves")[0]
      .getElementsByTagName("button");
    for (let i = 0; i < buttons.length; i++) {
      buttons[i].disabled = false;
    }
    startClickedFetch();
  }

  /**
   * Handles the fetching of the data and the subsequent
   * changes that need to occur on the game board with said
   * data when the start button is clicked.
   */
  function startClickedFetch() {
    let data = new FormData();
    data.append("startgame", true);
    data.append("mypokemon", SHORT_NAME);
    const url = BASE_URL + "pokedex/game.php";
    fetch(url, {method: "POST", body: data})
      .then(statusCheck)
      .then(resp => resp.json())
      .then(opponentData)
      .catch(handleError);
  }

  /**
   * Handles the opponent data by placing it into the p2 card
   * and saves both the pid and guid for later use.
   */
  function opponentData(data) {
    GUID = data.guid;
    PID = data.pid;
    cardEditChoose(data.p2, "p2");
  }

  /**
   * Handles when a move is selected by changing the game board
   * based on the actions of both parties.
   */
  function moveSelected(move) {
    document.getElementById("loading").classList.remove("hidden");
    let data = new FormData();
    data.append("guid", GUID);
    data.append("pid", PID);
    data.append("movename", move.name.toLowerCase());
    const url = BASE_URL + "pokedex/game.php";
    fetch(url, {method: "POST", body: data})
      .then(statusCheck)
      .then(resp => resp.json())
      .then(postMove)
      .catch(handleError);
  }

  /**
   * Handles the move data by editing both cards and their results.
   */
  function postMove(data) {
    let oneMove = document.createElement("p");
    let twoMove = document.createElement("p");
    oneMove.textContent = "Player 1 played " + data.results["p1-move"] +
      " and " + data.results["p1-result"] + "!";
    twoMove.textContent = "Player 2 played " + data.results["p2-move"] +
      " and " + data.results["p2-result"] + "!";
    document.getElementById("p1-turn-results").innerHTML = "";
    document.getElementById("p2-turn-results").innerHTML = "";
    document.getElementById("p1-turn-results").appendChild(oneMove);
    document.getElementById("p2-turn-results").appendChild(twoMove);
    if (data.results["p2-move"] === null || data.results["p2-result"] === null) {
      document.getElementById("p2-turn-results").classList.add("hidden");
    }
    handleHealth(data);
    document.getElementById("loading").classList.add("hidden");
  }

  /**
   * Handles the editing of the health data on both cards when
   * a move has been clicked.
   */
  function handleHealth(data) {
    const hundred = 100;
    const twenty = 20;
    let healthOne = document.getElementById("p1")
      .getElementsByClassName("hp-info")[0];
    let healthTwo = document.getElementById("p2")
      .getElementsByClassName("hp-info")[0];
    document.getElementById("p1").getElementsByClassName("hp")[0].textContent =
      data.p1["current-hp"] + "HP";
    document.getElementById("p2").getElementsByClassName("hp")[0].textContent = 
      data.p2["current-hp"] + "HP";
    healthOne.getElementsByClassName("health-bar")[0].style.width =
      (data.p1["current-hp"] / data.p1["hp"] * hundred) + "%";
    healthTwo.getElementsByClassName("health-bar")[0].style.width =
      (data.p2["current-hp"] / data.p2["hp"] * hundred) + "%";
    if (data.p1["current-hp"] / data.p1["hp"] * hundred < 20) {
      healthOne.getElementsByClassName("health-bar")[0]
        .classList.add("low-health");
    }
    if (data.p2["current-hp"] / data.p2["hp"] * hundred < twenty) {
      healthTwo.getElementsByClassName("health-bar")[0]
        .classList.add("low-health");
    }
    if (data.p1["current-hp"] === 0) {
      lostGame();
    } else if (data.p2["current-hp"] === 0) {
      wonGame();
    }
  }

  /**
   * Handles when the first player has won the game by ending the
   * game and adding a new pokemon to the pokedex.
   */
  function wonGame() {
    foundPokemon(SHORT_NAME_TWO);
    gameDone();
    document.getElementsByTagName("header")[0].getElementsByTagName("h1")[0]
      .textContent = "You Won!";
  }

  /**
   * Handles when the first player has lost the game by ending the game.
   */
  function lostGame() {
    gameDone();
    document.getElementsByTagName("header")[0].getElementsByTagName("h1")[0]
      .textContent = "You Lost!";
  }

  /**
   * Shows that the game is done by disabling the move buttons and showing
   * the end game button and removing the flee button.
   */
  function gameDone() {
    disableButtons();
    document.getElementById("endgame").classList.remove("hidden");
    document.getElementById("flee-btn").classList.add("hidden");
  }

  /**
   * Ends the game by returning the game back to the state where it was
   * just the p1 card and the pokedex.
   */
  function endGame() {
    document.getElementById("endgame").classList.add("hidden");
    document.getElementById("p1").getElementsByClassName("health-bar")[0]
      .classList.remove("low-health");
    document.getElementById("p2").getElementsByClassName("health-bar")[0]
      .classList.remove("low-health");
    document.getElementById("p1").getElementsByClassName("hp")[0].textContent =
      HP + "HP";
    document.getElementById("results-container").classList.add("hidden");
    document.getElementById("p2").classList.add("hidden");
    document.getElementById("p1").getElementsByClassName("hp-info")[0]
      .classList.add("hidden");
    document.getElementById("start-btn").classList.remove("hidden");
    document.getElementsByTagName("header")[0].getElementsByTagName("h1")[0]
      .textContent = "Your Pokedex";
    document.getElementById("pokedex-view").classList.remove("hidden");
    document.getElementById("flee-btn").classList.add("hidden");
    let healthOne = document.getElementById("p1")
      .getElementsByClassName("hp-info")[0];
    healthOne.getElementsByClassName("health-bar")[0].style.width = "100%";
    let healthTwo = document.getElementById("p2")
      .getElementsByClassName("hp-info")[0];
    healthTwo.getElementsByClassName("health-bar")[0].style.width = "100%";
    document.getElementById("p1-turn-results").textContent = "";
    document.getElementById("p2-turn-results").textContent = "";
    disableButtons();
  }

  /**
   * Disables the move button.
   */
  function disableButtons() {
    let buttons = document.getElementById("p1").getElementsByClassName("moves")[0]
      .getElementsByTagName("button");
    for (let i = 0; i < buttons.length; i++) {
      buttons[i].disabled = true;
    }
  }

  /**
   * Handles the flee button click by making the first player lose the
   * game and giving their pokemon zero health.
   */
  function fleeButton() {
    document.getElementById("loading").classList.remove("hidden");
    let data = new FormData();
    data.append("guid", GUID);
    data.append("pid", PID);
    data.append("movename", "flee");
    const url = BASE_URL + "pokedex/game.php";
    fetch(url, {method: "POST", body: data})
      .then(statusCheck)
      .then(resp => resp.json())
      .then(postMove)
      .catch(handleError);
  }

  /**
   * Remove event listeners for all the moves of p1.
   */
  function removeMoveListeners() {
    let buttons = document.getElementById("p1")
      .getElementsByClassName("moves")[0].getElementsByTagName("button");
    for (let i = 0; i < buttons.length; i++) {
      let button = buttons[i];
      let buttonClone = button.cloneNode(true);
      button.parentNode.replaceChild(buttonClone, button);
    }
  }

  /**
   * Status check to handle the response from a fetch request.
   */
  async function statusCheck(res) {
    if (!res.ok) {
      throw new Error(await res.text());
    }
    return res;
  }

  /**
   * Handles any error done with a fetch request and the actions
   * done using the data of the fetch request.
   */
  function handleError(error) {
    document.getElementsByTagName("h1")[0].textContent = error;
  }
})();
