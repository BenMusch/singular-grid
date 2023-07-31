export enum AwardPosition {
  PITCHING,
  BATTING,
}

export enum AwardTimespan {
  SEASON,
  CAREER,
}

export type Award = {
  timespan: AwardTimespan;
  position?: AwardPosition;
  name: string;
};

type SeasonAward = Award & { timespan: AwardTimespan.SEASON };
type CareerAward = Award & { timespan: AwardTimespan.CAREER };

export const CAREER_AWARDS_BY_ID: { [k: string]: CareerAward } = {
  career_p_sv_300: {
    name: "300+ Saves Career",
    position: AwardPosition.PITCHING,
    timespan: AwardTimespan.CAREER,
  },
  career_p_so_3000: {
    name: "3000+ Strikeouts Career",
    position: AwardPosition.PITCHING,
    timespan: AwardTimespan.CAREER,
  },
  career_p_w_300: {
    name: "300+ Wins Career",
    position: AwardPosition.PITCHING,
    timespan: AwardTimespan.CAREER,
  },
  career_b_avg_300: {
    name: ".300+ Career Avg",
    position: AwardPosition.BATTING,
    timespan: AwardTimespan.CAREER,
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
    position: AwardPosition.BATTING,
  },
  season_award_cy_young: {
    timespan: AwardTimespan.SEASON,
    name: "Cy Young",
  },
  season_b_avg_300: {
    timespan: AwardTimespan.SEASON,
    name: ".300+ Avg Season",
    position: AwardPosition.BATTING,
  },
  season_b_rbi_100: {
    timespan: AwardTimespan.SEASON,
    name: "100+ RBI Season",
    position: AwardPosition.BATTING,
  },
  season_b_h_200: {
    timespan: AwardTimespan.SEASON,
    name: "200+ Hit Season",
    position: AwardPosition.BATTING,
  },
  season_b_hr_40: {
    timespan: AwardTimespan.SEASON,
    name: "40+ Home Run Season",
    position: AwardPosition.BATTING,
  },
  season_p_sv_40: {
    name: "40+ Save Season",
    position: AwardPosition.PITCHING,
    timespan: AwardTimespan.SEASON,
  },
  season_p_w_20: {
    name: "20+ Win Season",
    position: AwardPosition.PITCHING,
    timespan: AwardTimespan.SEASON,
  },
  season_b_sb_30: {
    name: "30+ Steal Season",
    position: AwardPosition.BATTING,
    timespan: AwardTimespan.SEASON,
  },
  season_award_mvp: {
    name: "MVP",
    timespan: AwardTimespan.SEASON,
  },
};

type SeasonAwardId = keyof typeof SEASON_AWARDS_BY_ID;
type CareerAwardId = keyof typeof CAREER_AWARDS_BY_ID;
type AwardId = CareerAwardId | SeasonAwardId;

// string represents team for now, should be enum
type Team = string;

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

export function gridForPlayer(playerData: any): Grid {
  // Generate the "most-specific" possible grid, meaning:
  //  1. Prefer 6-team grids over 4-team grids
  //  2. Prefer season awards over career awards
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

        return { rows, columns } as Grid;
      }
    }

    // Try 6 team career award grid
    if (careerAwards.size >= 1) {
      const careerAward = [...careerAwards][0]!;
      const teams = [...allTeams];
      return {
        rows: teams.slice(0, 3) as [Team, Team, Team],
        columns: [
          ...(teams.slice(3, 5) as [Team, Team]),
          careerAward as unknown as AwardId,
        ],
      };
    }
  }

  // 4 teams, 2 season awards
  for (const [seasonAward1, teams1] of teamsBySeasonAward.entries()) {
    for (const [seasonAward2, teams2] of teamsBySeasonAward.entries()) {
      if (seasonAward1 === seasonAward2) {
        continue;
      }

      const allTeamAwards = new Set([...teams1, ...teams2]);
      if (allTeamAwards.size < 4) {
        continue;
      }

      if (teams1.size > teams2.size) {
        const rows = [...[...teams2].slice(0, 2), seasonAward2];
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
        columns.push(seasonAward1);

        return { rows, columns } as Grid;
      } else {
        const rows = [...[...teams1].slice(0, 2), seasonAward1];
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
        columns.push(seasonAward2);

        return { rows, columns } as Grid;
      }
    }
  }

  if (careerAwards.size >= 1) {
    for (const [seasonAward, teams] of teamsBySeasonAward.entries()) {
      if (teams.size >= 2) {
        const rows = [...[...teams].slice(0, 2), seasonAward];
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
        columns.push([...careerAwards][0]!);

        return { rows, columns } as Grid;
      }
    }
  }

  if (careerAwards.size >= 2) {
    const careerAward1 = [...careerAwards][0]!;
    const careerAward2 = [...careerAwards][0]!;
    const teams = [...allTeams];

    return {
      rows: [...teams.slice(0, 2), careerAward1],
      columns: [...teams.slice(2, 4), careerAward2],
    } as unknown as Grid;
  }

  console.log(playerData);
  throw new Error(
    "Could not generate grid for player! This should never happen"
  );
}
