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

function getCareerAwards(obj: any): Set<CareerAwardId> {
  const awards = new Set<CareerAwardId>();
  for (const [key, val] of Object.entries(obj)) {
    if (val && CAREER_AWARDS_BY_ID[key]) {
      awards.add(key);
    }
  }
  return awards;
}

export function gridsForPlayer(playerData: any): Grid[] {
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
        const rows = [...teams].slice(0, 3);
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

    // Try 6 team career award grid
    if (careerAwards.size >= 1) {
      const careerAward = [...careerAwards][0]!;
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
        const rows = [...[...teams2].slice(0, 2), seasonAward1];
        const columns = [];

        for (const team of teams1) {
          if (columns.length === 2) {
            break;
          }

          if (rows.includes(team)) {
            continue;
          }

          columns.push(team);
        }
        columns.push(seasonAward2);

        grids.push({ rows, columns } as Grid);
      } else {
        const rows = [...[...teams1].slice(0, 2), seasonAward2];
        const columns = [];

        for (const team of teams2) {
          if (columns.length === 2) {
            break;
          }

          if (rows.includes(team)) {
            continue;
          }

          columns.push(team);
        }
        columns.push(seasonAward1);

        grids.push({ rows, columns } as Grid);
      }
    }
  }

  // TODO iterate more
  if (careerAwards.size >= 1) {
    for (const [seasonAward, teams] of teamsBySeasonAward.entries()) {
      if (teams.size >= 2) {
        const rows = [...[...teams].slice(0, 2), [...careerAwards][0]!];
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

  if (careerAwards.size >= 2) {
    const careerAward1 = [...careerAwards][0]!;
    const careerAward2 = [...careerAwards][1]!;
    const teams = [...allTeams];

    // TODO iterate more, we can generate every single combination of 2 awards
    grids.push({
      rows: [...teams.slice(0, 2), careerAward1],
      columns: [...teams.slice(2, 4), careerAward2],
    } as unknown as Grid);
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
function scoreGrid(grid: Grid): number {
  let score = 0;

  const awards = [getAward(grid.columns[2])];
  if (isAward(grid.rows[2])) {
    awards.push(getAward(grid.rows[2]));
  }

  if (grid.columns.length < 3 || grid.rows.length < 3) {
    // too lazy to fix whatever caused this
    return -1000000000000;
  }

  for (const award of awards) {
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
  if (awards.length === 1) {
    score += 10;
  } else {
    // Slightly prefer mixing career + season awards
    if (awards[0].timespan === awards[1].timespan) {
      score -= 4;
    }

    if (
      awards[0].statistic === awards[1].statistic &&
      awards[0].statistic !== undefined
    ) {
      // Heavily de-prioritize grids for the same statistic
      score -= 50;
    }
  }

  return score;
}

export function gridForPlayer(playerData: any): Grid {
  let maxScore = Number.NEGATIVE_INFINITY;
  let maxGrid: Grid | null = null;
  for (const grid of gridsForPlayer(playerData)) {
    const curScore = scoreGrid(grid);
    console.log(grid, curScore);
    if (curScore > maxScore) {
      maxScore = curScore;
      maxGrid = grid;
    }
  }
  if (maxGrid) {
    return maxGrid;
  }

  if (maxGrid) {
    return maxGrid;
  }

  console.log(playerData);
  throw new Error(
    "Could not generate grid for player! This should never happen"
  );
}

export function playerMatchesSquare(
  playerData: any,
  row: Team | AwardId,
  col: Team | AwardId
) {
  if (!isAward(row) && !isAward(col)) {
    return (
      playerData.teams.some((team: any) => team.id === row) &&
      playerData.teams.some((team: any) => team.id === col)
    );
  } else if (isAward(row) && isAward(col)) {
    for (const awardId of [row, col]) {
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
  } else {
    const awardId = isAward(row) ? row : col;
    const award = getAward(awardId);
    const team = isAward(row) ? col : row;

    if (!playerData.teams.some((t: any) => t.id === team)) {
      return false;
    }

    if (award.timespan === AwardTimespan.SEASON) {
      return playerData.teams.some((t: any) => t.id === team && t[awardId]);
    } else {
      return playerData[awardId];
    }
  }
}
