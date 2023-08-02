import requests
import itertools
import json
from unidecode import unidecode
from datetime import datetime

BASE_URL = "https://api.sports-reference.com/v1/br/players"
SEEN_IDS = set()

CAREER_STAT_PREFIX = 'career_'
SEASON_STAT_PREFIX = 'season_'

ONE_STAT_GRID_POSSIBLE = 2
TWO_STAT_GRID_POSSIBLE = 1
NOT_POSSIBLE = 0

IMMACULATE_GRID_TEAM_TO_MLB_TEAM = {
    "BAL": 110,
    "NYY": 147,
    "TBD": 139, # uses this instead of TBR
    "BOS": 111,
    "TOR": 141,

    "MIN": 142,
    "CLE": 114,
    "DET": 116,
    "CHW": 145,
    "KCR": 118,

    "ANA": 108, # immaculate grid uses this instead of LAA
    "TEX": 140,
    "HOU": 117,
    "SEA": 136,
    "OAK": 133,

    "ATL": 144,
    "FLA": 146, # uses this instead of MIA
    "PHI": 143,
    "NYM": 121,
    "WSN": 120,

    "CIN": 113,
    "MIL": 158,
    "CHC": 112,
    "PIT": 134,
    "STL": 138,

    "LAD": 119,
    "SFG": 137,
    "ARI": 109,
    "SDP": 135,
    "COL": 115,
}

def awards_with_prefix(data, prefix):
    awards = []
    for k in data.keys():
        if k.startswith(prefix) and data[k] != 0:
            awards.append(k)
    return awards

def season_awards(team_data):
    return awards_with_prefix(team_data, SEASON_STAT_PREFIX) + awards_with_prefix(team_data, "ws_champ")

def career_awards(player_data):
    return awards_with_prefix(player_data, CAREER_STAT_PREFIX)

def get_mlb_player_data_from_immaculate_grid_data(player_data):
    mlb_resp = requests.get(
        "https://statsapi.mlb.com/api/v1/people/search",
        params={'names': unidecode(player_data['name']), 'hydrate': 'awards,stats(group=[hitting,pitching],type=[career,yearByYear])'}
    ).json()
    player_in_mlb_resp = None
    for mlb_player_data in mlb_resp.get('people', []):
        if 'mlbDebutDate' not in mlb_player_data:
            continue
        if unidecode(mlb_player_data['fullName']) != unidecode(player_data['name']):
            continue
        start_date = mlb_player_data['mlbDebutDate']
        end_date = mlb_player_data.get('lastPlayedDate') or '2023-08-02'
        start_year = start_date.split('-')[0]
        end_year = end_date.split('-')[0]
        years_active_str = start_year + "-" + end_year
        if years_active_str == player_data['years']:
            player_in_mlb_resp = mlb_player_data
            break
    # try again without end date
    for mlb_player_data in mlb_resp.get('people', []):
        if player_in_mlb_resp:
            continue
        if 'mlbDebutDate' not in mlb_player_data:
            continue
        if unidecode(mlb_player_data['fullName']) != unidecode(player_data['name']):
            continue
        start_date = mlb_player_data['mlbDebutDate']
        start_year = start_date.split('-')[0]
        if start_year == player_data['years'].split('-')[0]:
            player_in_mlb_resp = mlb_player_data
            break
    return player_in_mlb_resp

"""
All star team only applies to the person who represented the team
"""
def filter_all_star_teams(mlb_player_data, immaculate_grid_player_data):
    new_teams = []
    mlb_all_star_teams = set()
    for award in mlb_player_data.get('awards', []):
        if 'All-Star' in award['name']:
            mlb_all_star_teams.add(award['team']['id'])

    for team_data in immaculate_grid_player_data['teams']:
        if IMMACULATE_GRID_TEAM_TO_MLB_TEAM[team_data['id']] not in mlb_all_star_teams:
            team_data.pop('season_allstar', None)
        new_teams.append(team_data)
    return new_teams

"""
For checking if a stat is qualified

Look. I know that this isn't perfect, but if someone slips through by this
metric i dont give a fuck
"""
def get_games_in_season(year):
    if year == 2020:
        return 60
    elif year == 1994:
        return 112
    elif year == 1995:
        return 144
    elif year >= 1962:
        return 162
    else:
        return 154

"""
TODO: This is objectionable in how it handles splits when traded

Example: Player is traded mid-season and maintains a .300 BA. This considers
them unqualified for both. I believe this is how immaculate grid works, but it
could be work considering them valid for both in this instance
"""
def is_season_stat_qualified(stat, season_data):
    if stat == 'season_b_avg_300':
        at_bats = int(season_data['stat'].get('atBats', 0))
        plate_appearances = int(season_data['stat'].get('plateAppearances', 0))
        if plate_appearances < get_games_in_season(int(season_data['season'])) * 3.1:
            at_bats = get_games_in_season(int(season_data['season'])) * 3.1
            new_avg = season_data['stat'].get('hits') / at_bats
            if new_avg < 0.3:
                return False
    return True

def is_career_stat_qualified(stat, career_data):
    if stat == 'career_b_avg_300':
        at_bats = career_data.get('plateAppearances', 3000)
        return at_bats >= 3000
    return True

"""
Counting stat only applies if they accrued the stat at that team for the season
"""
def set_qualified_status_for_stats(mlb_player_data, immaculate_grid_player_data):
    mlb_stats_data = mlb_player_data['stats']

    # dont need pitching data since all pitching season stats are counting
    # stats
    # TODO: Change this if they add back ERA
    career_hitting_data = {}
    season_hitting_data = []

    for grouped_stats_data in mlb_stats_data:
        if grouped_stats_data['group']['displayName'] != 'hitting':
            continue
        if grouped_stats_data['type']['displayName'] == 'career':
            career_hitting_data = grouped_stats_data['splits'][0]['stat']
        elif grouped_stats_data['type']['displayName'] == 'yearByYear':
            season_hitting_data = grouped_stats_data['splits']

    for team_data in immaculate_grid_player_data['teams']:
        mlb_team = IMMACULATE_GRID_TEAM_TO_MLB_TEAM[team_data['id']]

        seasons_with_team = [
            stat for stat in season_hitting_data
            if 'season' in stat and 'team' in stat and stat['team']['id'] == mlb_team
        ]

        for season_stat in season_awards(team_data):
            qualified = season_stat != 'season_b_avg_300'
            for season in seasons_with_team:
                if is_season_stat_qualified(season_stat, season):
                    qualified = True
                    break
            team_data[season_stat] = 'qualified' if qualified else 'unqualified'

    for career_stat in career_awards(immaculate_grid_player_data):
        qualified = is_career_stat_qualified(career_stat, career_hitting_data)
        immaculate_grid_player_data[career_stat] = 'qualified' if qualified else 'unqualified'

def is_singular_grid_possible(player_data):
    player_data['teams'] = [t for t in player_data['teams'] if t.get('id', 'foo') in IMMACULATE_GRID_TEAM_TO_MLB_TEAM]
    teams = player_data['teams']
    if len(teams) < 4:
        return False

    career = set(career_awards(player_data))
    teams_by_season_award = {}
    for team in teams:
        for season_award in season_awards(team):
            if season_award not in teams_by_season_award:
                teams_by_season_award[season_award] = set()
            teams_by_season_award[season_award].add(team['id'])

    possible_grid_awards = []

    # first check if we can have a three-team one-award grid
    # since it's harder
    if len(teams) >= 6:
        if career:
            return ONE_STAT_GRID_POSSIBLE

        for season_award in teams_by_season_award.keys():
            if len(teams_by_season_award[season_award]) >= 3:
                return ONE_STAT_GRID_POSSIBLE


    if len(career) > 2:
        return TWO_STAT_GRID_POSSIBLE

    # look for a season award with at least 2 teams
    if career:
        for season_award in teams_by_season_award.keys():
            if len(teams_by_season_award[season_award]) >= 2:
                return TWO_STAT_GRID_POSSIBLE

    # this is the trickiest case, need to find a season stat with two separate
    # pairs of teams that they've accomplished it with
    for season_award_1 in teams_by_season_award.keys():
        for season_award_2 in teams_by_season_award.keys():
            if season_award_1 == season_award_2:
                continue

            teams_1 = teams_by_season_award[season_award_1]
            teams_2 = teams_by_season_award[season_award_2]

            if len(teams_1) < 2 or len(teams_2) < 2:
                continue

            if len(teams_1.union(teams_2)) >= 4:
                return ONE_STAT_GRID_POSSIBLE

    return NOT_POSSIBLE



def get_player_stats(name):
    response = requests.get(
        BASE_URL,
        params={"search": unidecode(name)},
    ).json()

    if response is None or response.get('players') is None:
        print('got none for ' + name)
        return

    for player in response['players']:
        if player['id'] in SEEN_IDS:
            continue

        SEEN_IDS.add(player['id'])
        if is_singular_grid_possible(player):
            # this is clunky, but basically it's better to calculate the grid
            # twice to reduce MLB API calls
            mlb_player_data = get_mlb_player_data_from_immaculate_grid_data(player)
            if not mlb_player_data:
                print("Could not find MLB data for " + player['name'])
                continue

            player['teams'] = filter_all_star_teams(mlb_player_data, player)
            if is_singular_grid_possible(player):
                set_qualified_status_for_stats(mlb_player_data, player)
                print(json.dumps(player))
            else:
                print('player ' + player['name'] + ' filtered after all-star check')

with open('all_players_2.json') as f:
    data = json.load(f)
    for player in data:
        get_player_stats(player)
