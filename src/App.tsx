import React, { useState } from "react";
import "./App.css";
import { Routes, BrowserRouter, Route } from "react-router-dom";
import { Link, useParams } from "react-router-dom";
import Select from "react-select";

import { DATA } from "./data";
import type { Grid, Team, Award, AwardId } from "./baseball";
import {
  gridForPlayer,
  playerMatchesSquare,
  SEASON_AWARDS_BY_ID,
  CAREER_AWARDS_BY_ID,
} from "./baseball";

const SEEN_INSTRUCTIONS_KEY = "seenInstructions";
function markInstructionsSeen() {
  localStorage.setItem(SEEN_INSTRUCTIONS_KEY, "1");
}
function hasSeenInstruction() {
  return localStorage.getItem(SEEN_INSTRUCTIONS_KEY) !== null;
}

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
          <th className="bl">
            <Logo team={grid.columns[0]} />
          </th>
          <th className="bl">
            <Logo team={grid.columns[1]} />
          </th>
          <th className="bl">
            <TeamOrAward teamOrAward={grid.columns[2]} />
          </th>
        </tr>
        <tr>
          <th className="bt">
            <Logo team={grid.rows[0]} />
          </th>
          <td className="b-all">{contentForRowAndCol(0, 0)}</td>
          <td className="b-all">{contentForRowAndCol(0, 1)}</td>
          <td className="bt">{contentForRowAndCol(0, 2)}</td>
        </tr>
        <tr>
          <th className="bt">
            <Logo team={grid.rows[1]} />
          </th>
          <td className="b-all">{contentForRowAndCol(1, 0)}</td>
          <td className="b-all">{contentForRowAndCol(1, 1)}</td>
          <td className="bt">{contentForRowAndCol(1, 2)}</td>
        </tr>
        <tr>
          <th className="bt">
            <TeamOrAward teamOrAward={grid.rows[2]} />
          </th>
          <td className="bt bl">{contentForRowAndCol(2, 0)}</td>
          <td className="bt bl">{contentForRowAndCol(2, 1)}</td>
          <td className="bt bl">{contentForRowAndCol(2, 2)}</td>
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
  const options = DATA.map((playerData) => {
    return { value: playerData.id, label: playerData.name };
  });
  return (
    <div className="guess-select">
      <Select
        noOptionsMessage={(inputVal) => {
          return (
            <>
              Player not found. Though they may be a valid MLB player, players
              only show up in these results if they are a valid answer to one of
              the possible grids. See{" "}
              <Link to="/instructions">instructions</Link> for more info
            </>
          );
        }}
        placeholder="Guess a player..."
        className="guess-select"
        id="guess"
        options={options}
        value={curGuess ? curGuess.id : undefined}
        onChange={({ value }) => {
          // TODO: faster lookup
          const playerData = DATA.find((playerData) => playerData.id === value);
          if (playerData) {
            onGuess(playerData);
          }
        }}
      />
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
    return lastActiveYear >= yearFilter;
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
      <InstructionsModal />
      <center>
        <div className="year-select">
          <label htmlFor="year">Only play for players active during:</label>
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
          {" • "}
          <Link to="/instructions">Instructions + FAQ</Link>
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
          {" • "}
          <Link to="/instructions">Instructions + FAQ</Link>
        </footer>
      </center>
    </div>
  );
}

function Instructions() {
  return (
    <div>
      <h1>Singular Grid: Instructions</h1>
      <p>
        Singular Grid is a game based heavily on{" "}
        <a href="https://www.immaculategrid.com/">Immaculate Grid</a>. If you
        are not familiar with Immaculate Grid, you will want to check that out
        before playing.
      </p>

      <p>
        Singular Grid takes the same grid structure as and rules as Immaculate
        Grid. However, instead of guessing a unique player for each square, you
        guess the player who would be a valid answer for <i>any</i> of the
        squares in the grid.
      </p>

      <p>
        Only {DATA.length} players in MLB history have careers which make them
        valid "singular grids." This is because it requires a player to achieve
        difficult career/season accolades <i>and</i> play for a large number of
        teams.
      </p>

      <p>
        You can view a list of all players who meet the necessary criteria{" "}
        <Link to="/players">here</Link>. Clicking on an individual name will
        bring up their grid.
      </p>

      <p>
        <b>Why doesn't this player show up in the search?</b>
        <br />
        The search only covers players with a valid grid associated with them.
        Though this is not ideal, the alternative would be downloading/scraping
        the requried data for every player in MLB history, which is not feasible
        at this time.
      </p>

      <p>
        <b>Who made this? Is it open source?</b>
        <br />
        <a href="https://twitter.com/benmusch">Ben Muschol</a>. The code is
        available on{" "}
        <a href="https://github.com/benmusch/singular-grid">GitHub</a>
      </p>

      <p>
        <b>
          I found an issue not addressed in the instructions. Where should I
          report it?
        </b>
        <br />
        You can <a href="mailto:benmuschol@gmail.com">email me</a> or open an
        issue on{" "}
        <a href="https://github.com/BenMusch/singular-grid/issues/new">
          GitHub
        </a>
      </p>
    </div>
  );
}

function InstructionsPage() {
  return (
    <div>
      <div className="instructions-container">
        <Instructions />
      </div>
    </div>
  );
}

function InstructionsModal() {
  const [visible, setVisible] = useState(!hasSeenInstruction());

  if (!visible) {
    return null;
  }

  return (
    <div className="instructions-modal-container">
      <div className="instructions-content">
        <Instructions />
        <button
          onClick={() => {
            setVisible(false);
            markInstructionsSeen();
          }}
        >
          Close
        </button>
      </div>
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
        {" • "}
        <Link to="/instructions">Instructions + FAQ</Link>
      </footer>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="instructions" element={<InstructionsPage />} />
        <Route path="players" element={<All />} />
        <Route path="players/:id" element={<Player />} />
        <Route index element={<Game />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
