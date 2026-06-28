const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder
} = require("discord.js");

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// Slash command
const commands = [
  new SlashCommandBuilder()
    .setName("power")
    .setDescription("Set your power level")
    .addStringOption(option =>
      option
        .setName("value")
        .setDescription("Example: 250M, 5B, 2.5T")
        .setRequired(true)
    )
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

async function registerCommands() {
  try {
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log("Slash command registered.");
  } catch (err) {
    console.error(err);
  }
}

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
  registerCommands();
});

// POWER PARSER (FIXED)
function parsePower(value) {
  const upper = value.toUpperCase().trim();

  let number = parseFloat(upper.replace(/[^0-9.]/g, ""));
  if (isNaN(number)) return 0;

  if (upper.includes("T")) number *= 1e12;
  else if (upper.includes("B")) number *= 1e9;
  else if (upper.includes("M")) number *= 1e6;

  return number;
}

// ROLE LIST
const POWER_ROLES = [
  { min: 200000000, max: 300000000, name: "200-300M" },
  { min: 500000000, max: 600000000, name: "500-600M" },

  { min: 2000000000, max: 4999999999, name: "2B+" },

  { min: 4000000000, max: 9999999999, name: "4-10B" },
  { min: 5000000000, max: 19999999999, name: "5B+" },

  { min: 20000000000, max: 30000000000, name: "20-30B" },
  { min: 30000000000, max: 40000000000, name: "30-40B" },
  { min: 40000000000, max: 50000000000, name: "40-50B" },
  { min: 60000000000, max: 80000000000, name: "60-80B" },

  { min: 110000000000, max: 120000000000, name: "110-120B" },
  { min: 120000000000, max: 130000000000, name: "120-130B" },
  { min: 140000000000, max: 160000000000, name: "140-160B" },
  { min: 160000000000, max: 250000000000, name: "160-250B" },

  { min: 1000000000000, max: 2000000000000, name: "1-2T" },
  { min: 2000000000000, max: 5000000000000, name: "2-5T" },
  { min: 3000000000000, max: 4000000000000, name: "3-4T" },
  { min: 5000000000000, max: 8000000000000, name: "5-8T" },
  { min: 8000000000000, max: 10000000000000, name: "8-10T" }
];

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "power") return;

  const value = interaction.options.getString("value");
  const power = parsePower(value);

  const guild = interaction.guild;
  const member = await guild.members.fetch(interaction.user.id);

  console.log(`${member.user.tag} submitted ${value} (${power})`);

  // PICK HIGHEST MATCHING ROLE
  let matchedRole = null;

  for (let i = POWER_ROLES.length - 1; i >= 0; i--) {
    const r = POWER_ROLES[i];
    if (power >= r.min) {
      matchedRole = r;
      break;
    }
  }

  if (!matchedRole) {
    return interaction.reply("❌ No matching power role found.");
  }

  // REMOVE OLD POWER ROLES
  for (const r of POWER_ROLES) {
    const role = guild.roles.cache.find(x => x.name === r.name);
    if (role && member.roles.cache.has(role.id)) {
      await member.roles.remove(role).catch(() => {});
    }
  }

  // GET OR CREATE ROLE
  let role = guild.roles.cache.find(r => r.name === matchedRole.name);

  if (!role) {
    role = await guild.roles.create({
      name: matchedRole.name,
      reason: "Auto-created Power Role"
    });
  }

  // ASSIGN ROLE
  await member.roles.add(role).catch(console.error);

  return interaction.reply(
    `⚡ Power set to: ${value} → ${matchedRole.name}`
  );
});

// KEEP ALIVE (Railway)
setInterval(() => {
  console.log("Bot is alive");
}, 10000);

client.login(TOKEN);
