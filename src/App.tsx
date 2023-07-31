import React from "react";
import logo from "./logo.svg";
import "./App.css";

import { DATA } from "./data";
import type { Grid } from "./baseball";
import { gridForPlayer } from "./baseball";

function Grid(props: { grid: Grid; player: any }) {
  const { grid, player } = props;
  return (
    <div>
      <h2>{player.name}</h2>
      <table>
        <tr>
          <th>-</th>
          <th>{grid.columns[0]}</th>
          <th>{grid.columns[1]}</th>
          <th>{grid.columns[2]}</th>
        </tr>
        <tr>
          <th>{grid.rows[0]}</th>
          <td>-</td>
          <td>-</td>
          <td>-</td>
        </tr>
        <tr>
          <th>{grid.rows[1]}</th>
          <td>-</td>
          <td>-</td>
          <td>-</td>
        </tr>
        <tr>
          <th>{grid.rows[2]}</th>
          <td>-</td>
          <td>-</td>
          <td>-</td>
        </tr>
      </table>
    </div>
  );
}

function App() {
  return (
    <div>
      {DATA.map((player) => (
        <Grid player={player} grid={gridForPlayer(player)} />
      ))}
    </div>
  );
}

export default App;
