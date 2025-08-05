import Dexie, { type EntityTable } from 'dexie';

interface Refers {
  id: number;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

const db = new Dexie('ReferDB') as Dexie & {
  refers: EntityTable<
    Refers,
    'id' // primary key "id" (for the typings only)
  >;
};

// Schema declaration:
db.version(1).stores({
  refers: '++id, &title, content, createdAt, updatedAt' // primary key "id" (for the runtime!)
});

export { db };
export type { Refers };

