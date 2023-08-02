import React, { useState } from "react";
import "./App.css";
import { Routes, BrowserRouter, Route } from "react-router-dom";
import { Link, useParams } from "react-router-dom";
import Select from "react-select";

import { DATA } from "./data";
import type {
  AugmentedGrid,
  Team,
  Award,
  AwardId,
  QualifiedStatus,
} from "./baseball";
import {
  gridsForPlayer,
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

function AwardDisplay(props: {
  award: Award;
  qualifiedStatus: QualifiedStatus;
}) {
  const { award, qualifiedStatus } = props;
  return (
    <span>
      <p>{award.name}</p>
      {qualifiedStatus === "unqualified" && <small>(Unqualified)</small>}
    </span>
  );
}

function TeamOrAward(props: {
  teamOrAward: Team | [AwardId, QualifiedStatus];
}) {
  const { teamOrAward } = props;
  if (typeof teamOrAward === "string") {
    return <Logo team={teamOrAward as Team} />;
  }
  const award: Award | undefined =
    SEASON_AWARDS_BY_ID[teamOrAward[0]] || CAREER_AWARDS_BY_ID[teamOrAward[0]];
  return <AwardDisplay award={award} qualifiedStatus={teamOrAward[1]} />;
}

function GridDisplay(props: { grid: AugmentedGrid; guess: any | null }) {
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

function gridHasUnqualifiedStats(grid: AugmentedGrid): boolean {
  let hasUnqualified = grid.columns[2][1] === "unqualified";
  if (!hasUnqualified && typeof grid.rows[2] !== "string") {
    hasUnqualified = grid.rows[2][1] === "unqualified";
  }
  return hasUnqualified;
}

function shuffleArray<T>(array: Array<T>): Array<T> {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function playerMatchesYearFilter(playerData: any, minYear: number): boolean {
  const lastActiveYear = parseInt(playerData.years.split("-")[1]);
  return lastActiveYear >= minYear;
}

function getRandomPlayerAndGrid(
  allowUnqualified: boolean,
  minYear: number
): { player: any; grid: AugmentedGrid } {
  const eligiblePlayers = shuffleArray(
    DATA.filter((playerData: any) => {
      return playerMatchesYearFilter(playerData, minYear);
    })
  );

  for (const player of eligiblePlayers) {
    const grids = gridsForPlayer(player);
    const grid = grids[0];
    if (allowUnqualified || !gridHasUnqualifiedStats(grid)) {
      return { player, grid };
    }
  }

  throw new Error("Could not find eligible player");
}

function GameImpl(props: {
  guess: any | null;
  onGuess: (g: any) => void;
  grid: AugmentedGrid;
  playerData: any;
  allowUnqualified: boolean;
  onAllowUnqualifiedToggle: () => void;
  yearFilter: number;
  onYearFilterChange: (y: number) => void;
  onNext: () => void;
}) {
  const {
    guess,
    onGuess,
    playerData,
    allowUnqualified,
    grid,
    onAllowUnqualifiedToggle,
    yearFilter,
    onYearFilterChange,
    onNext,
  } = props;
  const [showYears, setShowYears] = useState<boolean>(false);
  const [showLength, setShowLength] = useState<boolean>(false);

  // TODO: handle grids that could apply to multiple players
  const isCorrect = guess && guess.id === playerData.id;

  const notYetCorrectHeader = (
    <>
      <GuessSelect onGuess={onGuess} curGuess={guess} />
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
          <button className="link" onClick={() => onGuess(playerData)}>
            Give Up
          </button>
        </div>
      </div>
    </>
  );

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
              onYearFilterChange(parseInt(e.target.value));
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
        <div className="unqualified-select">
          <label htmlFor="unqualified">
            Allow unqualified seasons/statistics:
          </label>
          <input
            type="checkbox"
            id="unqualified"
            checked={allowUnqualified}
            onChange={(e) => {
              onAllowUnqualifiedToggle();
            }}
          />
        </div>
        <br />
        {isCorrect ? (
          <CorrectGuessDisplay
            player={guess}
            onNext={() => {
              setShowYears(false);
              setShowLength(false);
              onNext();
            }}
          />
        ) : (
          notYetCorrectHeader
        )}
        <GridDisplay grid={grid!} guess={guess} />
        <footer>
          <Link to="/players">Browse all players</Link>
          {" • "}
          <Link to="/instructions">Instructions + FAQ</Link>
        </footer>
      </center>
    </div>
  );
}

function Game() {
  const [allowUnqualified, setAllowUnqualified] = useState<boolean>(false);
  const [yearFilter, setYearFilter] = useState<number>(0);

  const [playerDataAndGrid, setPlayerDataAndGrid] = useState<{
    player: any;
    grid: AugmentedGrid;
  }>(getRandomPlayerAndGrid(allowUnqualified, yearFilter));
  const [guess, setGuess] = useState<any>(null);

  if (
    !(guess !== null && guess.id === playerDataAndGrid.player.id) &&
    (!playerMatchesYearFilter(playerDataAndGrid.player, yearFilter) ||
      (!allowUnqualified && gridHasUnqualifiedStats(playerDataAndGrid.grid)))
  ) {
    const newPlayerAndGrid = getRandomPlayerAndGrid(
      allowUnqualified,
      yearFilter
    );
    setPlayerDataAndGrid(newPlayerAndGrid);
  }

  return (
    <GameImpl
      playerData={playerDataAndGrid.player}
      grid={playerDataAndGrid.grid}
      guess={guess}
      onGuess={setGuess}
      allowUnqualified={allowUnqualified}
      yearFilter={yearFilter}
      onYearFilterChange={setYearFilter}
      onAllowUnqualifiedToggle={() => setAllowUnqualified(!allowUnqualified)}
      onNext={() => {
        setPlayerDataAndGrid(
          getRandomPlayerAndGrid(allowUnqualified, yearFilter)
        );
        setGuess(null);
      }}
    />
  );
}

function Player() {
  const { id } = useParams();
  const player = DATA.find((playerData: any) => playerData.id === id)!;
  const grids = gridsForPlayer(player);
  const grid = grids[0];

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
        <b>What does the "unqualified statistics" filter mean</b>
        <br />
        "Qualified" stats mean a player played enough to be eligible for
        year-end titles. Filtering it out mostly excludes pitchers from batting
        average awards. Read more{" "}
        <a href="https://www.baseball-reference.com/bullpen/Qualifier#:~:text=A%20player%20qualifies%20to%20lead,inning%20per%20game%20for%20pitchers.">
          here
        </a>
        .
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
          // this is theoreitcally inefficient and should be pre-calculated, but
          // doesnt seem noticeable on page load
          const grids = gridsForPlayer(playerData);
          const isUnqualified = gridHasUnqualifiedStats(grids[0]!);
          return (
            <li>
              <Link to={`/players/${playerData.id}`}>
                {playerData.name} ({playerData.years})
              </Link>
              {isUnqualified && "*"}
            </li>
          );
        })}
      </ul>
      <p>* = only valid grids contain unqualified stats</p>
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
