import * as migration_20260717_150905_m1_base from './20260717_150905_m1_base';

export const migrations = [
  {
    up: migration_20260717_150905_m1_base.up,
    down: migration_20260717_150905_m1_base.down,
    name: '20260717_150905_m1_base'
  },
];
