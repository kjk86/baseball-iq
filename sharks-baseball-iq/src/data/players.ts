/**
 * ROSTER — PVAA Sharks 10U (Coach Green)
 * To add a player: add a line here, then put them in a lineup (Coach Mode or lineups.ts).
 * Only first names are shown on the field.
 */
export interface Player {
  id: string;
  firstName: string;
  /** Last initial (that's all the roster shows). */
  lastName: string;
  /** Jersey number. */
  number: string;
  /** Other names the lineup sheet might use. */
  nicknames?: string[];
}

const p = (firstName: string, lastName: string, number: string, nicknames?: string[]): Player => ({
  id: `${firstName}-${lastName}`.toLowerCase(),
  firstName,
  lastName,
  number,
  nicknames,
});

export const PLAYERS: Player[] = [
  p('Alex', 'C', '3'),
  p('Beckett', 'K', '12'),
  p('Camden', 'G', '10', ['Cam']),
  p('Cash', 'L', '7'),
  p('Eric', 'E', '14'),
  p('Ethan', 'P', '19'),
  p('Finn', 'G', '9'),
  p('Hank', 'B', '99'),
  p('James', 'P', '13'),
  p('Levi', 'N', '18'),
  p('Mason', 'K', '22'),
  p('Ray', 'T', '36'),
];

export const fullName = (pl: Player) => `${pl.firstName} ${pl.lastName}`;
export const playerById = (id: string) => PLAYERS.find((pl) => pl.id === id);

/** Find a player from whatever is on the lineup sheet: "Cam", "Camden", "Camden G", "#10"… */
export function findPlayer(name: string): Player | undefined {
  const n = name.trim().toLowerCase().replace(/\.$/, '');
  if (!n) return undefined;
  const num = n.match(/^#(\d+)$/);
  if (num) return PLAYERS.find((pl) => pl.number === num[1]);
  const exact = PLAYERS.find(
    (pl) =>
      pl.firstName.toLowerCase() === n ||
      fullName(pl).toLowerCase() === n ||
      `${pl.firstName} #${pl.number}`.toLowerCase() === n ||
      pl.nicknames?.some((k) => k.toLowerCase() === n),
  );
  if (exact) return exact;
  const prefix = PLAYERS.filter((pl) => pl.firstName.toLowerCase().startsWith(n));
  return prefix.length === 1 ? prefix[0] : undefined;
}
