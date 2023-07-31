import React, { useState } from "react";
import logo from "./logo.svg";
import "./App.css";

import { DATA } from "./data";
import type { Grid, Team, Award, AwardId } from "./baseball";
import {
  gridForPlayer,
  playerMatchesSquare,
  SEASON_AWARDS_BY_ID,
  CAREER_AWARDS_BY_ID,
} from "./baseball";

function Logo(props: { team: Team }) {
  const { team } = props;
  return (
    <img
      className="logo"
      src={`https://cdn.ssref.net/req/202306191/tlogo/br/ig/light/${team}.svg`}
    />
  );
}

function AwardDisplay(props: { award: Award }) {
  const { award } = props;
  return <p>{award.name}</p>;
}

function TeamOrAward(props: { teamOrAward: Team | AwardId }) {
  const { teamOrAward } = props;
  const award: Award | undefined =
    SEASON_AWARDS_BY_ID[teamOrAward] || CAREER_AWARDS_BY_ID[teamOrAward];
  if (award) {
    return <AwardDisplay award={award} />;
  }
  return <Logo team={teamOrAward as Team} />;
}

function Grid(props: { grid: Grid; player: any; guess: any | null }) {
  const { grid, player, guess } = props;

  const contentForRowAndCol = (rowNum: number, colNum: number) => {
    if (!guess) {
      return "";
    }

    if (playerMatchesSquare(guess, grid.rows[rowNum], grid.columns[colNum])) {
      return "✅";
    }
    return "❌";
  };

  return (
    <div className="grid">
      <center>
        <h2>{player.name}</h2>
        <table>
          <tr>
            <th></th>
            <th>
              <Logo team={grid.columns[0]} />
            </th>
            <th>
              <Logo team={grid.columns[1]} />
            </th>
            <th>
              <TeamOrAward teamOrAward={grid.columns[2]} />
            </th>
          </tr>
          <tr>
            <th>
              <Logo team={grid.rows[0]} />
            </th>
            <td>{contentForRowAndCol(0, 0)}</td>
            <td>{contentForRowAndCol(0, 1)}</td>
            <td>{contentForRowAndCol(0, 2)}</td>
          </tr>
          <tr>
            <th>
              <Logo team={grid.rows[1]} />
            </th>
            <td>{contentForRowAndCol(1, 0)}</td>
            <td>{contentForRowAndCol(1, 1)}</td>
            <td>{contentForRowAndCol(1, 2)}</td>
          </tr>
          <tr>
            <th>
              <TeamOrAward teamOrAward={grid.rows[2]} />
            </th>
            <td>{contentForRowAndCol(2, 0)}</td>
            <td>{contentForRowAndCol(2, 1)}</td>
            <td>{contentForRowAndCol(2, 2)}</td>
          </tr>
        </table>
      </center>
    </div>
  );
}

function GuessSelect(props: { onGuess: (g: any) => void }) {
  const { onGuess } = props;
  return (
    <div>
      <select
        value="blank"
        onChange={(e) => {
          e.preventDefault();
          const id = e.target.value;
          // TODO: faster lookup
          const playerData = DATA.find((playerData) => playerData.id === id);
          if (playerData) {
            onGuess(playerData);
          }
        }}
      >
        <option value="blank" key={-1}>
          ------
        </option>
        {DATA.map((playerData, i) => {
          return (
            <option value={playerData.id} key={i}>
              {playerData.name}
            </option>
          );
        })}
      </select>
    </div>
  );
}

function App() {
  const randPlayer = DATA[Math.floor(Math.random() * DATA.length)]!;
  const [playerData, setPlayerData] = useState<any>(randPlayer);
  const [guess, setGuess] = useState<any>(null);

  const grid = gridForPlayer(playerData);

  return (
    <div>
      <GuessSelect onGuess={setGuess} />
      <Grid player={playerData!} grid={grid} guess={guess} />
    </div>
  );
}

export default App;
