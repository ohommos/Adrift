import { prisma } from "../lib/prisma";
import { DIALS } from "./dials";
import { createBottle, listInbox, openBottle, replyToBottle, resolveFate } from "../services/bottleActions";

// Bot personas act through the exact same mechanics a real user would —
// real bottles, real opens, real break/pass votes — on a timer. This is
// what keeps a lone tester's inbox and tracker alive without the system
// ever fabricating a person or an event (spec section 8's cold-start rule).

const BOTTLE_LINES = [
  "If you're reading this, I hope wherever you are, the coffee's good today.",
  "I keep rewriting the same message to someone and never sending it. This is easier.",
  "Some nights the water here is so loud it drowns out my thoughts. I think that's why I like it.",
  "I never learned my grandmother's language before she passed. Sending this in case someone out there still speaks it.",
  "Does anyone else miss the smell of rain on hot pavement?",
  "I've been carrying a decision for months. Writing it down and sending it away feels like the first step toward putting it down.",
  "Rode the last train all the way to the end of the line tonight just to not go home yet.",
  "I got the job. I have nobody to tell who'd actually be happy about it.",
  "Every tourist photographs my street. Nobody's ever knocked.",
  "It hasn't gotten properly dark here in weeks. I've forgotten how to be tired.",
  "Writing to a stranger is easier than writing to anyone who knows me.",
  "I keep a list of things I'd say to my father if he called. It's four pages now.",
  "Today was ordinary and I wanted someone, anyone, to know it happened.",
  "I moved somewhere new and haven't told anyone how much I miss the old place.",
  "Sometimes I think the ocean is the only thing patient enough to hold all of this.",
];

const REPLY_LINES = [
  "I don't know why but this found me at exactly the right moment.",
  "For what it's worth, a stranger out here is glad you wrote this down.",
  "I've felt exactly this. Thank you for putting it into words.",
  "Sending something back into the water felt like the right thing to do.",
  "Hope things are lighter for you soon.",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function actAsBot(botId: string) {
  const inbox = await listInbox(botId);
  const unresolved = inbox[Math.floor(Math.random() * inbox.length)];

  if (unresolved) {
    await openBottle(unresolved.id, botId);
    const kind = Math.random() < DIALS.BOT_BREAK_WEIGHT ? "break" : "pass";
    await resolveFate(unresolved.id, botId, kind);
    if (Math.random() < DIALS.BOT_REPLY_CHANCE) {
      await replyToBottle(unresolved.id, botId, pick(REPLY_LINES));
    }
    return;
  }

  // Nothing to read right now — occasionally seed fresh supply instead.
  if (Math.random() < 0.3) {
    await createBottle(botId, {
      text: pick(BOTTLE_LINES),
      scope: Math.random() < 0.5 ? "global" : "city",
    });
  }
}

export async function runBotTick() {
  const bots = await prisma.user.findMany({ where: { isBot: true }, select: { id: true } });
  for (const bot of bots) {
    if (Math.random() > DIALS.BOT_ACTION_CHANCE) continue;
    try {
      await actAsBot(bot.id);
    } catch {
      // A bot losing a race (e.g. bottle already resolved by another bot) is fine — skip it.
    }
  }
}
