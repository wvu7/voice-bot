const { Client, GatewayIntentBits } = require("discord.js");
const { joinVoiceChannel } = require("@discordjs/voice");
const TOKEN = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const CHANNEL_ID = process.env.CHANNEL_ID;
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});
client.once("ready", () => {
  console.log(Logged in as ${client.user.tag});
  const guild = client.guilds.cache.get(GUILD_ID);
  joinVoiceChannel({
    channelId: CHANNEL_ID,
    guildId: GUILD_ID,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: true,
    selfMute: true,
  });
  console.log("تم الدخول للروم الصوتي");
});
client.login(TOKEN);
