export enum AwardPosition {
  PITCHING,
  BATTING,
}

export enum AwardTimespan {
  SEASON,
  CAREER,
}

export enum AwardStatistic {
  BA,
  SB,
  SV,
  W,
  SO,
  RBI,
  HR,
  H,
}

export type Award = {
  timespan: AwardTimespan;
  statistic?: AwardStatistic;
  name: string;
};

type SeasonAward = Award & { timespan: AwardTimespan.SEASON };
type CareerAward = Award & { timespan: AwardTimespan.CAREER };
export type QualifiedStatus = "qualified" | "unqualified";

export const CAREER_AWARDS_BY_ID: { [k: string]: CareerAward } = {
  career_p_sv_300: {
    name: "300+ Saves Career",
    timespan: AwardTimespan.CAREER,
    statistic: AwardStatistic.SV,
  },
  career_p_so_3000: {
    name: "3000+ Strikeouts Career",
    timespan: AwardTimespan.CAREER,
    statistic: AwardStatistic.SO,
  },
  career_p_w_300: {
    name: "300+ Wins Career",
    timespan: AwardTimespan.CAREER,
    statistic: AwardStatistic.W,
  },
  career_b_avg_300: {
    name: ".300+ Career Avg",
    timespan: AwardTimespan.CAREER,
    statistic: AwardStatistic.BA,
  },
  career_b_h_3000: {
    name: ".300+ Career Avg",
    timespan: AwardTimespan.CAREER,
    statistic: AwardStatistic.H,
  },
  career_b_hr_500: {
    name: ".500+ HR Career",
    timespan: AwardTimespan.CAREER,
    statistic: AwardStatistic.HR,
  },
  career_award_hof: {
    name: "Hall of Fame",
    timespan: AwardTimespan.CAREER,
  },
};

export const SEASON_AWARDS_BY_ID: { [k: string]: SeasonAward } = {
  ws_champ: { timespan: AwardTimespan.SEASON, name: "World Series" },
  season_allstar: { timespan: AwardTimespan.SEASON, name: "All-Star" },
  season_award_gold_glove: {
    timespan: AwardTimespan.SEASON,
    name: "Gold Glove",
  },
  season_award_silver_slugger: {
    timespan: AwardTimespan.SEASON,
    name: "Silver Slugger",
  },
  season_award_cy_young: {
    timespan: AwardTimespan.SEASON,
    name: "Cy Young",
  },
  season_b_avg_300: {
    timespan: AwardTimespan.SEASON,
    name: ".300+ Avg Season",
    statistic: AwardStatistic.BA,
  },
  season_b_rbi_100: {
    timespan: AwardTimespan.SEASON,
    name: "100+ RBI Season",
    statistic: AwardStatistic.RBI,
  },
  season_b_h_200: {
    timespan: AwardTimespan.SEASON,
    name: "200+ Hit Season",
    statistic: AwardStatistic.H,
  },
  season_b_hr_40: {
    timespan: AwardTimespan.SEASON,
    name: "40+ Home Run Season",
    statistic: AwardStatistic.HR,
  },
  season_p_sv_40: {
    name: "40+ Save Season",
    timespan: AwardTimespan.SEASON,
    statistic: AwardStatistic.SV,
  },
  season_p_w_20: {
    name: "20+ Win Season",
    timespan: AwardTimespan.SEASON,
    statistic: AwardStatistic.W,
  },
  season_p_so_200: {
    name: "200+ Strikeout Season",
    timespan: AwardTimespan.SEASON,
    statistic: AwardStatistic.SO,
  },
  season_b_sb_30: {
    name: "30+ Steal Season",
    timespan: AwardTimespan.SEASON,
    statistic: AwardStatistic.SB,
  },
  season_award_mvp: {
    name: "MVP",
    timespan: AwardTimespan.SEASON,
  },
};

type SeasonAwardId = keyof typeof SEASON_AWARDS_BY_ID;
type CareerAwardId = keyof typeof CAREER_AWARDS_BY_ID;
export type AwardId = CareerAwardId | SeasonAwardId;

// string represents team for now, should be enum
export type Team = string;

export type Grid = {
  columns: [Team, Team, AwardId];
  rows: [Team, Team, AwardId | Team];
};

export type AugmentedGrid = {
  columns: [Team, Team, [AwardId, QualifiedStatus]];
  rows: [Team, Team, [AwardId, QualifiedStatus] | Team];
};

function getCareerAwards(obj: any): Set<CareerAwardId> {
  const awards = new Set<CareerAwardId>();
  for (const [key, val] of Object.entries(obj)) {
    if (val && CAREER_AWARDS_BY_ID[key]) {
      awards.add(key);
    }
  }
  return awards;
}

function combine<T>(items: Array<T>, numSubItems: number): Array<Array<T>> {
  let result = [];
  let indexes = new Array(numSubItems);
  for (let i = 0; i < numSubItems; i++) {
    indexes[i] = i;
  }
  while (indexes[0] < items.length - numSubItems + 1) {
    let v = [];
    for (let i = 0; i < numSubItems; i++) {
      v.push(items[indexes[i]]);
    }
    result.push(v);
    indexes[numSubItems - 1]++;
    let l = numSubItems - 1; // reference always is the last position at beginning
    while (
      indexes[numSubItems - 1] >= items.length &&
      indexes[0] < items.length - numSubItems + 1
    ) {
      l--; // the last position is reached
      indexes[l]++;
      for (let i = l + 1; i < numSubItems; i++) {
        indexes[i] = indexes[l] + (i - l);
      }
    }
  }
  return result;
}

function generateGridsForPlayer(playerData: any): Grid[] {
  const grids: Grid[] = [];
  const careerAwards = getCareerAwards(playerData);
  const teamsBySeasonAward = new Map<SeasonAwardId, Set<Team>>();
  const allTeams = new Set<Team>();
  for (const team of playerData.teams) {
    allTeams.add(team.id);
    for (const [maybeSeasonAward, val] of Object.entries(team)) {
      if (!val || !SEASON_AWARDS_BY_ID[maybeSeasonAward]) {
        continue;
      }

      if (!teamsBySeasonAward.has(maybeSeasonAward)) {
        teamsBySeasonAward.set(maybeSeasonAward, new Set());
      }
      teamsBySeasonAward.get(maybeSeasonAward)!.add(team.id);
    }
  }

  // See if 6-team grid is possible
  if (playerData.teams.length >= 6) {
    // Try 6-team season award grid
    for (const [seasonAward, teams] of teamsBySeasonAward.entries()) {
      if (teams.size >= 3) {
        for (const teamCombination of combine([...teams], 3)) {
          const rows = teamCombination;
          const columns = [];

          for (const team of allTeams) {
            if (columns.length === 2) {
              break;
            }

            if (rows.includes(team)) {
              continue;
            }

            columns.push(team);
          }
          columns.push(seasonAward);

          grids.push({ rows, columns } as Grid);
        }
      }
    }

    // Try 6 team career award grid
    if (careerAwards.size >= 1) {
      for (const careerAward of careerAwards) {
        const teams = [...allTeams];
        grids.push({
          rows: teams.slice(0, 3) as [Team, Team, Team],
          columns: [
            ...(teams.slice(3, 5) as [Team, Team]),
            careerAward as unknown as AwardId,
          ],
        });
      }
    }
  }

  // 4 teams, 2 season awards
  // TODO: iterate *less*, we double-generate pairs here. should use an i, j
  // loop
  for (const [seasonAward1, teams1] of teamsBySeasonAward.entries()) {
    for (const [seasonAward2, teams2] of teamsBySeasonAward.entries()) {
      if (seasonAward1 === seasonAward2) {
        continue;
      }

      if (teams1.size < 2 || teams2.size < 2) {
        continue;
      }

      const allTeamAwards = new Set([...teams1, ...teams2]);
      if (allTeamAwards.size < 4) {
        continue;
      }

      if (teams1.size > teams2.size) {
        for (const teams2Pairing of combine([...teams2], 2)) {
          const rows = [...teams2Pairing, seasonAward1];

          for (const teams1Pairing of combine([...teams1], 2)) {
            const columns = [];
            for (const team of teams1Pairing) {
              if (rows.includes(team)) {
                continue;
              }

              columns.push(team);
            }

            if (columns.length < 2) {
              // Could not generate a valid grid with this team pairing,
              // likely overlap between the teams being used
              continue;
            }

            columns.push(seasonAward2);
            grids.push({ rows, columns } as Grid);
          }
        }
      } else {
        for (const teams1Pairing of combine([...teams1], 2)) {
          const rows = [...teams1Pairing, seasonAward2];

          for (const teams2Pairing of combine([...teams2], 2)) {
            const columns = [];
            for (const team of teams2Pairing) {
              if (rows.includes(team)) {
                continue;
              }

              columns.push(team);
            }

            if (columns.length < 2) {
              // Could not generate a valid grid with this team pairing,
              // likely overlap between the teams being used
              continue;
            }

            columns.push(seasonAward1);
            grids.push({ rows, columns } as Grid);
          }
        }
      }
    }
  }

  // Try for 1-career 1-season award grids
  for (const careerAward of careerAwards) {
    for (const [seasonAward, teams] of teamsBySeasonAward.entries()) {
      if (teams.size >= 2) {
        for (const teamsPairing of combine([...teams], 2)) {
          const rows = [...teamsPairing, careerAward];
          const columns = [];

          // theoretically could iterate here to generate every possible grid,
          // put there's no need since qualificaiton status doesn't change based
          // on team for career awards, and the teams here are affected by the
          // career award grid
          for (const team of allTeams) {
            if (columns.length === 2) {
              break;
            }

            if (rows.includes(team)) {
              continue;
            }

            columns.push(team);
          }

          columns.push(seasonAward);
          grids.push({ rows, columns } as Grid);
        }
      }
    }
  }

  if (careerAwards.size >= 2) {
    for (const careerAwardPairing of combine([...careerAwards], 2)) {
      const careerAward1 = careerAwardPairing[0]!;
      const careerAward2 = careerAwardPairing[1]!;
      const teams = [...allTeams];

      grids.push({
        rows: [...teams.slice(0, 2), careerAward1],
        columns: [...teams.slice(2, 4), careerAward2],
      } as unknown as Grid);
    }
  }

  return grids;
}

function isAward(teamOrAward: Team | AwardId) {
  return !!(
    SEASON_AWARDS_BY_ID[teamOrAward] || CAREER_AWARDS_BY_ID[teamOrAward]
  );
}

function getAward(awardId: AwardId) {
  return SEASON_AWARDS_BY_ID[awardId] ?? CAREER_AWARDS_BY_ID[awardId];
}

/**
 * Simple scoring mechanism to determine the "preferable" grid that exists for a
 * player
 */
function scoreGrid(grid: AugmentedGrid): number {
  let score = 0;

  const awardIdsAndStatus = [grid.columns[2]];
  if (typeof grid.rows[2] !== "string") {
    awardIdsAndStatus.push(grid.rows[2]);
  }

  if (grid.columns.length < 3 || grid.rows.length < 3) {
    // too lazy to fix whatever caused this
    return -100000000000000;
  }

  for (const [awardId, qualifiedStatus] of awardIdsAndStatus) {
    const award = getAward(awardId);
    // prefer qualified awards
    if (qualifiedStatus === "unqualified") {
      score -= 10000;
    }

    // Prefer season awards
    if (award.timespan === AwardTimespan.SEASON) {
      score += 2;
    }
    // Prefer statistic awards
    if (award.statistic) {
      score += 1;
    }
  }

  // Prefer 6-team grids
  if (awardIdsAndStatus.length === 1) {
    score += 10;
  } else {
    // Slightly prefer mixing career + season awards
    const award1 = getAward(awardIdsAndStatus[0][0]);
    const award2 = getAward(awardIdsAndStatus[1][0]);
    if (award1.timespan === award2.timespan) {
      score -= 4;
    }

    if (
      award1.statistic === award2.statistic &&
      award1.statistic !== undefined
    ) {
      // Heavily de-prioritize grids for the same statistic
      score -= 50;
    }
  }

  return score;
}

function getStatisticQualifiedStatus(
  affectedTeams: Team[],
  playerData: any,
  awardId: AwardId
): QualifiedStatus {
  if (CAREER_AWARDS_BY_ID[awardId]) {
    return playerData[awardId] as QualifiedStatus;
  } else if (SEASON_AWARDS_BY_ID[awardId]) {
    const allQualified = playerData.teams.every((teamData: any) => {
      return (
        !affectedTeams.includes(teamData.id) ||
        teamData[awardId] === "qualified"
      );
    });

    return allQualified ? "qualified" : "unqualified";
  } else {
    throw new Error("Not an awardID: " + awardId);
  }
}

function augmentGridWithQualifiedStatus(
  grid: Grid,
  playerData: any
): AugmentedGrid {
  const rowTeams = grid.rows.filter((rowItem) => !isAward(rowItem)) as Team[];
  const colTeams = grid.columns.filter(
    (colItem) => !isAward(colItem)
  ) as Team[];

  let augmentedRows;
  if (
    !!(CAREER_AWARDS_BY_ID[grid.rows[2]] ?? SEASON_AWARDS_BY_ID[grid.rows[2]])
  ) {
    augmentedRows = [
      ...rowTeams,
      [
        grid.rows[2],
        getStatisticQualifiedStatus(colTeams, playerData, grid.rows[2]),
      ],
    ];
  } else {
    augmentedRows = grid.rows;
  }

  const augmentedCols = [
    ...colTeams,
    [
      grid.columns[2],
      getStatisticQualifiedStatus(rowTeams, playerData, grid.columns[2]),
    ],
  ];

  return {
    rows: augmentedRows,
    columns: augmentedCols,
  } as AugmentedGrid;
}

export function gridsForPlayer(playerData: any): AugmentedGrid[] {
  const allGrids = generateGridsForPlayer(playerData);
  const augmentedGrids = allGrids.map((grid) =>
    augmentGridWithQualifiedStatus(grid, playerData)
  );

  return augmentedGrids.sort((a, b) => scoreGrid(b) - scoreGrid(a));
}

export function playerMatchesSquare(
  playerData: any,
  row: Team | [AwardId, QualifiedStatus],
  col: Team | [AwardId, QualifiedStatus]
) {
  if (typeof row === "string" && typeof col === "string") {
    return (
      playerData.teams.some((team: any) => team.id === row) &&
      playerData.teams.some((team: any) => team.id === col)
    );
  } else if (typeof row === "string" || typeof col === "string") {
    const awardId = typeof row === "string" ? col[0] : row[0];
    const award = getAward(awardId);
    const team = typeof row === "string" ? row : col;

    if (!playerData.teams.some((t: any) => t.id === team)) {
      return false;
    }

    if (award.timespan === AwardTimespan.SEASON) {
      return playerData.teams.some((t: any) => t.id === team && t[awardId]);
    } else {
      return playerData[awardId];
    }
  } else {
    for (const awardIdAndStatus of [row, col]) {
      const awardId = awardIdAndStatus[0];
      const award = getAward(awardId);
      if (award.timespan === AwardTimespan.SEASON) {
        if (!playerData.teams.some((t: any) => t[awardId])) {
          return false;
        }
      } else {
        if (!playerData[awardId]) {
          return false;
        }
      }
    }
    return true;
  }
}
