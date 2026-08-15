import { randomBytes } from "crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CITIES = [
  { name: "Tokyo", country: "Japan", flag: "🇯🇵", lat: 35.7, lon: 139.7 },
  { name: "Mumbai", country: "India", flag: "🇮🇳", lat: 19.1, lon: 72.9 },
  { name: "São Paulo", country: "Brazil", flag: "🇧🇷", lat: -23.5, lon: -46.6 },
  { name: "New York", country: "United States", flag: "🇺🇸", lat: 40.7, lon: -74.0 },
  { name: "Seoul", country: "South Korea", flag: "🇰🇷", lat: 37.6, lon: 127.0 },
  { name: "Lagos", country: "Nigeria", flag: "🇳🇬", lat: 6.5, lon: 3.4 },
  { name: "Jakarta", country: "Indonesia", flag: "🇮🇩", lat: -6.2, lon: 106.8 },
  { name: "London", country: "United Kingdom", flag: "🇬🇧", lat: 51.5, lon: -0.1 },
  { name: "Mexico City", country: "Mexico", flag: "🇲🇽", lat: 19.4, lon: -99.1 },
  { name: "Sydney", country: "Australia", flag: "🇦🇺", lat: -33.9, lon: 151.2 },
  { name: "Cairo", country: "Egypt", flag: "🇪🇬", lat: 30.0, lon: 31.2 },
  { name: "Buenos Aires", country: "Argentina", flag: "🇦🇷", lat: -34.6, lon: -58.4 },
  { name: "Cape Town", country: "South Africa", flag: "🇿🇦", lat: -33.9, lon: 18.4 },
  { name: "Porto", country: "Portugal", flag: "🇵🇹", lat: 41.1, lon: -8.6 },
  { name: "Reykjavík", country: "Iceland", flag: "🇮🇸", lat: 64.1, lon: -21.9 },
];

// (nickname, home city name) — spread across cities so every city's water
// has at least one resident reading/writing bottles.
const BOTS: Array<[string, string]> = [
  ["nightbus_", "Tokyo"],
  ["kotori", "Tokyo"],
  ["saltmoth", "Tokyo"],
  ["farlight", "Mumbai"],
  ["tin_can", "Mumbai"],
  ["driftwood_", "São Paulo"],
  ["riogrey", "São Paulo"],
  ["coldwater", "Reykjavík"],
  ["lowsun", "Reykjavík"],
  ["azulejo", "Porto"],
  ["gullwing", "Porto"],
  ["eastriver", "New York"],
  ["stoop_light", "New York"],
  ["hanok_blue", "Seoul"],
  ["lagos_late", "Lagos"],
  ["monsoon", "Jakarta"],
  ["thameside", "London"],
  ["zocalo", "Mexico City"],
  ["harbourhaze", "Sydney"],
  ["nileflow", "Cairo"],
  ["porteno", "Buenos Aires"],
  ["tablemtn", "Cape Town"],
];

async function main() {
  console.log("Seeding cities…");
  const cityByName = new Map<string, string>();
  for (const c of CITIES) {
    const city = await prisma.city.upsert({
      where: { name: c.name },
      update: {},
      create: { ...c, isSeedHome: true },
    });
    cityByName.set(c.name, city.id);
  }

  console.log("Seeding bot personas…");
  for (const [nickname, cityName] of BOTS) {
    const homeCityId = cityByName.get(cityName);
    if (!homeCityId) continue;
    const city = CITIES.find((c) => c.name === cityName)!;
    await prisma.user.upsert({
      where: { deviceId: `bot:${nickname}` },
      update: {},
      create: {
        deviceId: `bot:${nickname}`,
        token: randomBytes(24).toString("hex"),
        nickname,
        flag: city.flag,
        homeCityId,
        isBot: true,
      },
    });
  }

  console.log(`Seeded ${CITIES.length} cities and ${BOTS.length} bot personas.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
