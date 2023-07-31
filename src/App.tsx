import React, { useState } from "react";
import "./App.css";
import { Routes, BrowserRouter, Route } from "react-router-dom";
import { Link, useParams } from "react-router-dom";

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
      alt={team}
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

function GridDisplay(props: { grid: Grid; guess: any | null }) {
  const { grid, guess } = props;

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
    </div>
  );
}

function GuessSelect(props: {
  onGuess: (g: any) => void;
  curGuess: any | null;
}) {
  const { onGuess, curGuess } = props;
  return (
    <div className="guess-select">
      <select
        value={curGuess ? curGuess.id : "blank"}
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
          Guess player
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

function CorrectGuessDisplay(props: { player: any; onNext: () => void }) {
  const { player, onNext } = props;
  return (
    <div className="player-display">
      <img
        alt={player.name}
        src={`https://www.baseball-reference.com/req/${player.headshot_url}`}
      />
      <br />
      <h3>
        <a href={`https://baseball-reference.com/${player.link}`}>
          {player.name}
        </a>
      </h3>
      <br />
      <button onClick={onNext}>Play Again</button>
    </div>
  );
}

function Game() {
  const [yearFilter, setYearFilter] = useState<number>(0);
  const playerMatchesFilter = (playerData: any) => {
    const lastActiveYear = parseInt(playerData.years.split("-")[1]);
    return lastActiveYear > yearFilter;
  };
  const randPlayer = () => {
    const eligiblePlayers = DATA.filter(playerMatchesFilter);
    return eligiblePlayers[Math.floor(Math.random() * eligiblePlayers.length)]!;
  };
  const [playerData, setPlayerData] = useState<any>(randPlayer());
  const [guess, setGuess] = useState<any>(null);
  const [showYears, setShowYears] = useState<boolean>(false);
  const [showLength, setShowLength] = useState<boolean>(false);

  // TODO: handle grids that could apply to multiple players
  const isCorrect = guess && guess.id === playerData.id;
  const grid = gridForPlayer(playerData);

  const notYetCorrectHeader = (
    <>
      <GuessSelect onGuess={setGuess} curGuess={guess} />
      <div className="player-info">
        <div className="player-name">
          Name:{" "}
          {showLength ? (
            playerData.name.replace(/\S/g, "?")
          ) : (
            <>
              <button className="link" onClick={() => setShowLength(true)}>
                Reveal Length
              </button>
            </>
          )}
        </div>
        <div className="player-years-active">
          <span>
            Years Active:{" "}
            {showYears ? (
              playerData.years
            ) : (
              <button className="link" onClick={() => setShowYears(true)}>
                Reveal
              </button>
            )}
          </span>
        </div>
        <div className="give-up">
          <button className="link" onClick={() => setGuess(playerData)}>
            Give Up
          </button>
        </div>
      </div>
    </>
  );

  if (!playerMatchesFilter(playerData)) {
    setPlayerData(randPlayer());
    setGuess(null);
    setShowYears(false);
    setShowLength(false);
  }

  return (
    <div>
      <center>
        <div className="year-select">
          <label htmlFor="year">Filter by year</label>
          <select
            id="year"
            value={yearFilter ? yearFilter : "0"}
            onChange={(e) => {
              e.preventDefault();
              setYearFilter(parseInt(e.target.value));
            }}
          >
            <option value="0" key={-1}>
              All years
            </option>
            {[
              1900, 1910, 1920, 1930, 1940, 1950, 1960, 1970, 1980, 1990, 2000,
              2010, 2020,
            ].map((year) => {
              return (
                <option value={year} key={year}>
                  {year} and later
                </option>
              );
            })}
          </select>
        </div>
        <br />
        {isCorrect ? (
          <CorrectGuessDisplay
            player={guess}
            onNext={() => {
              setGuess(null);
              setShowYears(false);
              setShowLength(false);
              setPlayerData(randPlayer());
            }}
          />
        ) : (
          notYetCorrectHeader
        )}
        <GridDisplay grid={grid} guess={guess} />
        <footer>
          <Link to="/players">Browse all players</Link>
        </footer>
      </center>
    </div>
  );
}

function Player() {
  const { id } = useParams();
  const player = DATA.find((playerData: any) => playerData.id === id)!;
  const grid = gridForPlayer(player);

  return (
    <div>
      <center>
        <div className="player-display">
          <img
            alt={player.name}
            src={`https://www.baseball-reference.com/req/${player.headshot_url}`}
          />
          <br />
          <h3>
            <a href={`https://baseball-reference.com/${player.link}`}>
              {player.name}
            </a>
          </h3>
          <br />
        </div>
        <GridDisplay grid={grid} guess={null} />
        <footer>
          <Link to="/">Play the game</Link>
        </footer>
      </center>
    </div>
  );
}

function All() {
  return (
    <div>
      <h1>All possible players</h1>
      <ul>
        {DATA.map((playerData: any) => {
          return (
            <li>
              <Link to={`/players/${playerData.id}`}>
                {playerData.name} ({playerData.years})
              </Link>
            </li>
          );
        })}
      </ul>
      <footer>
        <Link to="/">Play the game</Link>
      </footer>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="players" element={<All />} />
        <Route path="players/:id" element={<Player />} />
        <Route index element={<Game />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
