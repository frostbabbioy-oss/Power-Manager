const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require("discord.js");

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// Slash command
const commands = [
  new SlashCommandBuilder()
    .setName("power")
    .setDescription("Set your power level")
    .addStringOption(option =>
      option.setName("value")
        .setDescription("Example: 31.78B")
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
    console.log("Slash command registered");
  } catch (err) {
    console.error(err);
  }
}

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
  registerCommands();
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "power") {

    const value = interaction.options.getString("value");
    const power = parseFloat(value.replace(/[^0-9.]/g, "")) || 0;

    const guild = interaction.guild;
    const member = interaction.member;

    const roles = [
      { limit: 2000000000, name: "2B Power" },
      { limit: 5000000000, name: "5B Power" },
      { limit: 10000000000, name: "10B Power" },
      { limit: 50000000000, name: "50B Power" },
      { limit: 100000000000, name: "100B+ Power" }
    ];

    // remove old roles
    for (const r of roles) {
      const role = guild.roles.cache.find(x => x.name === r.name);
      if (role) {
        await member.roles.remove(role).catch(() => {});
      }
    }

    // find correct role
    let roleToGive = null;

    for (const r of roles) {
      if (power >= r.limit) {
        roleToGive = r.name;
      }
    }

    // create + assign role
    if (roleToGive) {
      let role = guild.roles.cache.find(r => r.name === roleToGive);

      if (!role) {
        role = await guild.roles.create({
          name: roleToGive,
          reason: "Auto-created by Power Bot"
        });
      }

      await member.roles.add(role).catch(console.error);
    }

    await interaction.reply(`⚡ Power set to: ${value}`);
  }
});

client.login(TOKEN);

