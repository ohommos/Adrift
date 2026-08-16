import { randomUUID } from "crypto";
import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  boolean,
  real,
  integer,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const id = () => text("id").primaryKey().$defaultFn(() => randomUUID());
const createdAt = () => timestamp("createdAt").notNull().defaultNow();

// ---------------------------------------------------------------------------
// City
// ---------------------------------------------------------------------------
export const cityTable = pgTable("City", {
  id: id(),
  name: text("name").notNull().unique(),
  country: text("country").notNull(),
  flag: text("flag").notNull(),
  lat: real("lat").notNull(),
  lon: real("lon").notNull(),
  isSeedHome: boolean("isSeedHome").notNull().default(false),
  createdAt: createdAt(),
});

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------
export const userTable = pgTable(
  "User",
  {
    id: id(),
    deviceId: text("deviceId").unique(),
    token: text("token").notNull().unique(),
    nickname: text("nickname").notNull(),
    flag: text("flag").notNull(),
    homeCountry: text("homeCountry").notNull().default("Unknown"),
    // The shore the user picked as theirs. Chosen, not inferred — sending
    // here is free, so a guess is not good enough.
    homeCityId: text("homeCityId"),
    homeCityChangedAt: timestamp("homeCityChangedAt"),
    isPro: boolean("isPro").notNull().default(false),
    credits: integer("credits").notNull().default(0),
    usedFreeReply: boolean("usedFreeReply").notNull().default(false),
    isBot: boolean("isBot").notNull().default(false),
    createdAt: createdAt(),
  },
  // Nicknames are claimed case-insensitively. Enforced in the database so a
  // check-then-insert race can't hand the same name to two signups.
  (t) => [uniqueIndex("User_nickname_lower_key").on(sql`lower(${t.nickname})`)]
);

// ---------------------------------------------------------------------------
// Bottle
// ---------------------------------------------------------------------------
export const bottleTable = pgTable("Bottle", {
  id: id(),
  authorId: text("authorId")
    .notNull()
    .references(() => userTable.id),
  text: text("text").notNull(),
  scope: text("scope").notNull(), // "city" | "global"
  targetCityId: text("targetCityId").references(() => cityTable.id),
  state: text("state").notNull().default("sealed"), // sealed|drifting|nearing|opened|lost
  originLat: real("originLat").notNull(),
  originLon: real("originLon").notNull(),
  currentLat: real("currentLat").notNull(),
  currentLon: real("currentLon").notNull(),
  progress: real("progress").notNull().default(0),
  passOnCount: integer("passOnCount").notNull().default(0),
  breakVotes: integer("breakVotes").notNull().default(0),
  createdAt: createdAt(),
  lastEventAt: timestamp("lastEventAt").notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// BottleInteraction — one row per (bottle, reader)
// ---------------------------------------------------------------------------
export const bottleInteractionTable = pgTable(
  "BottleInteraction",
  {
    id: id(),
    bottleId: text("bottleId")
      .notNull()
      .references(() => bottleTable.id),
    readerId: text("readerId")
      .notNull()
      .references(() => userTable.id),
    openedAt: timestamp("openedAt").notNull().defaultNow(),
    action: text("action"), // "break" | "pass" | null
    actedAt: timestamp("actedAt"),
  },
  (t) => [uniqueIndex("BottleInteraction_bottleId_readerId_key").on(t.bottleId, t.readerId)]
);

// ---------------------------------------------------------------------------
// BottleOpen — sender-visible open events (country agg, never reader identity)
// ---------------------------------------------------------------------------
export const bottleOpenTable = pgTable("BottleOpen", {
  id: id(),
  bottleId: text("bottleId")
    .notNull()
    .references(() => bottleTable.id),
  readerId: text("readerId").notNull(),
  country: text("country").notNull(),
  openedAt: timestamp("openedAt").notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Reply
// ---------------------------------------------------------------------------
export const replyTable = pgTable("Reply", {
  id: id(),
  bottleId: text("bottleId")
    .notNull()
    .references(() => bottleTable.id),
  fromUserId: text("fromUserId")
    .notNull()
    .references(() => userTable.id),
  toUserId: text("toUserId")
    .notNull()
    .references(() => userTable.id),
  text: text("text").notNull(),
  createdAt: createdAt(),
});

// ---------------------------------------------------------------------------
// Correspondence — one private channel per (bottle, stranger who answered).
// A single bottle can open several, one per person who wrote back.
// ---------------------------------------------------------------------------
export const correspondenceTable = pgTable(
  "Correspondence",
  {
    id: id(),
    bottleId: text("bottleId")
      .notNull()
      .references(() => bottleTable.id),
    /** The bottle's author. Always free to answer their own bottle. */
    authorId: text("authorId")
      .notNull()
      .references(() => userTable.id),
    /** The stranger who answered it. Pays to keep the channel open. */
    correspondentId: text("correspondentId")
      .notNull()
      .references(() => userTable.id),
    /** False until the stranger has paid to continue past the first letter. */
    channelOpen: boolean("channelOpen").notNull().default(false),
    lastAt: timestamp("lastAt").notNull().defaultNow(),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("Correspondence_bottle_correspondent_key").on(t.bottleId, t.correspondentId),
  ]
);

// ---------------------------------------------------------------------------
// Letter — one message in a correspondence, in transit until deliverAt.
// ---------------------------------------------------------------------------
export const letterTable = pgTable("Letter", {
  id: id(),
  correspondenceId: text("correspondenceId")
    .notNull()
    .references(() => correspondenceTable.id),
  fromUserId: text("fromUserId")
    .notNull()
    .references(() => userTable.id),
  text: text("text").notNull(),
  sentAt: timestamp("sentAt").notNull().defaultNow(),
  /** When it lands. Distance between the two home shores decides this. */
  deliverAt: timestamp("deliverAt").notNull(),
  /** Set by the engine when it lands, so the arrival notifies exactly once. */
  deliveredAt: timestamp("deliveredAt"),
  readAt: timestamp("readAt"),
});

// ---------------------------------------------------------------------------
// Notification
// ---------------------------------------------------------------------------
export const notificationTable = pgTable("Notification", {
  id: id(),
  userId: text("userId")
    .notNull()
    .references(() => userTable.id),
  bottleId: text("bottleId").references(() => bottleTable.id),
  kind: text("kind").notNull(), // opened|passed|country|shore|lost|reply
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: createdAt(),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------
export type City = typeof cityTable.$inferSelect;
export type User = typeof userTable.$inferSelect;
export type Bottle = typeof bottleTable.$inferSelect;
export type BottleInteraction = typeof bottleInteractionTable.$inferSelect;
export type BottleOpen = typeof bottleOpenTable.$inferSelect;
export type Reply = typeof replyTable.$inferSelect;
export type Notification = typeof notificationTable.$inferSelect;
export type Correspondence = typeof correspondenceTable.$inferSelect;
export type Letter = typeof letterTable.$inferSelect;
