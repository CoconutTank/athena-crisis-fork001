export enum Crystal {
  Power = 0,
  Help = 1,
  Phantom = 2,
  Command = 3,
  Super = 5,
  Memory = 4,
}

export const Crystals = [
  Crystal.Power,
  Crystal.Help,
  Crystal.Phantom,
  Crystal.Command,
  Crystal.Memory,
  Crystal.Super,
] as const;

export type CrystalList = ReadonlyArray<[Crystal, number]>;
export type CrystalMap = Map<Crystal, number>;

export const CrystalAttackEffect = 0.1;

export const CrystalCosts: Record<Crystal, number> = {
  [Crystal.Command]: 7,
  [Crystal.Help]: 3,
  [Crystal.Phantom]: 5,
  [Crystal.Power]: 2,
  [Crystal.Super]: -1,
  [Crystal.Memory]: -1,
};

export const MaxChaosStars: Record<Crystal, number> = {
  [Crystal.Command]: 20,
  [Crystal.Help]: 20,
  [Crystal.Phantom]: 25,
  [Crystal.Power]: 20,
  [Crystal.Super]: 0,
  [Crystal.Memory]: 0,
};
