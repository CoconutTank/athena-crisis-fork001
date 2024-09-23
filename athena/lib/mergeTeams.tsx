import { Teams } from '../map/Team.tsx';
import MapData from '../MapData.tsx';

export default function mergeTeams(map: MapData, newTeams: Teams | undefined) {
  let { teams } = map;
  if (!newTeams) {
    return map;
  }

  for (const [id, newTeam] of newTeams) {
    let team = teams.get(id) || newTeam;
    if (teams.has(id)) {
      for (const [playerId, player] of newTeam.players) {
        if (player.teamId !== id) {
          throw new Error(
            `mergeTeams: 'player.teamId' does not match the team's 'id'.`,
          );
        }

        const maybePlayer = map.maybeGetPlayer(playerId);
        if (
          maybePlayer &&
          (maybePlayer.type === player.type || maybePlayer.teamId !== id)
        ) {
          throw new Error(
            `mergeTeams: player '${playerId}' is already defined.`,
          );
        }

        team = team.copy({
          players: team.players.set(playerId, player),
        });
      }
    }
    teams = teams.set(id, team);
  }
  return map.copy({ teams });
}
