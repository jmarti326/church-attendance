import Dexie, { type EntityTable } from "dexie";

export interface LocalMember {
  id?: number;
  serverId?: number;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  status: "member" | "visitor" | "members_class" | "inactive" | "pastor" | "fallecido";
  familyId?: number;
  synced?: boolean;
}

export interface LocalFamily {
  id?: number;
  serverId?: number;
  name: string;
  synced?: boolean;
}

export interface LocalAttendance {
  id?: number;
  serverId?: number;
  memberId: number;
  date: string; // ISO date string
  present: boolean;
  synced?: boolean;
}

const db = new Dexie("ChurchAttendanceDB") as Dexie & {
  members: EntityTable<LocalMember, "id">;
  families: EntityTable<LocalFamily, "id">;
  attendance: EntityTable<LocalAttendance, "id">;
};

db.version(1).stores({
  members: "++id, serverId, firstName, lastName, status, familyId, synced",
  families: "++id, serverId, name, synced",
  attendance: "++id, serverId, memberId, date, synced, [memberId+date]",
});

export { db };
