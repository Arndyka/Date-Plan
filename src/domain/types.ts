export interface PlanData {
  title: string;
  date: string;
  start: string;
  end: string;
  location: string;
  budget: number;
  share: number;
  status: 'draft' | 'terjadwal' | 'selesai' | 'dibatalkan';
  note: string;
  rain: string;
}
export interface ActivityData {
  title: string;
  start: string;
  end: string;
  place: string;
  address: string;
  maps: string;
  category: string;
  estimate: number;
  actual: number;
  paidFirst: number;
  position: number;
  done: boolean;
  note: string;
}
export interface NoteData {
  title: string;
  date: string;
  note: string;
}
export interface InspirationData {
  title: string;
  url: string;
  category: string;
  note: string;
}
export interface WishlistData {
  title: string;
  category: string;
  estimate: number;
  place: string;
  note: string;
}
export interface ChecklistData {
  title: string;
  done: boolean;
  assignee: string;
}
export interface MemoryData {
  content: string;
  favorite: string;
  rating: number;
}
export interface DataMap {
  plans: PlanData;
  activities: ActivityData;
  calendar_notes: NoteData;
  inspirations: InspirationData;
  wishlist_items: WishlistData;
  wishlist_votes: Record<string, never>;
  checklist_items: ChecklistData;
  memories: MemoryData;
}
export type EntityName = keyof DataMap;
export interface Row<K extends EntityName = EntityName> {
  id: string;
  space_id: string;
  author_id: string;
  plan_id: string | null;
  item_id: string | null;
  data: DataMap[K];
  version: number;
  created_at: string;
  updated_at: string;
}
export type Tables = { [K in EntityName]: Row<K>[] };
export interface Space {
  id: string;
  name: string;
  sweet_note: string;
  created_by: string;
  version: number;
}
export interface Member {
  user_id: string;
  space_id: string;
  nickname: string;
  slot: number;
}
export interface Snapshot {
  space: Space;
  members: Member[];
  tables: Tables;
}
export const entities: EntityName[] = [
  'plans',
  'activities',
  'calendar_notes',
  'inspirations',
  'wishlist_items',
  'wishlist_votes',
  'checklist_items',
  'memories',
];
export const emptyTables = (): Tables => ({
  plans: [],
  activities: [],
  calendar_notes: [],
  inspirations: [],
  wishlist_items: [],
  wishlist_votes: [],
  checklist_items: [],
  memories: [],
});
export const categories = ['Kuliner', 'Outdoor', 'Seni', 'Santai', 'Petualangan'];
