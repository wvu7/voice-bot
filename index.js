const {
    Client,
    GatewayIntentBits,
    ChannelType,
    Events
} = require("discord.js");

const {
    joinVoiceChannel,
    entersState,
    VoiceConnectionStatus,
    getVoiceConnection
} = require("@discordjs/voice");

// =========================================
// Environment Variables
// =========================================

const TOKEN = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const CHANNEL_ID = process.env.CHANNEL_ID;

if (!TOKEN || !GUILD_ID || !CHANNEL_ID) {
    console.error("❌ Missing required environment variables.");
    console.error("Required: TOKEN, GUILD_ID, CHANNEL_ID");
    process.exit(1);
}

// =========================================
// Discord Client
// =========================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});

let reconnectTimeout = null;

// =========================================
// Join Voice Channel
// =========================================

async function connectVoice() {
    try {

        const guild = await client.guilds.fetch(GUILD_ID).catch(() => null);

        if (!guild) {
            console.error("❌ Invalid GUILD_ID or bot is not in the server.");
            return;
        }

        const channel = await guild.channels.fetch(CHANNEL_ID).catch(() => null);

        if (!channel) {
            console.error("❌ Invalid CHANNEL_ID.");
            return;
        }

        if (channel.type !== ChannelType.GuildVoice) {
            console.error("❌ CHANNEL_ID is not a voice channel.");
            return;
        }

        const oldConnection = getVoiceConnection(guild.id);

        if (oldConnection) {
            oldConnection.destroy();
        }

        console.log(`🔊 Joining ${channel.name}...`);

        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfMute: true,
            selfDeaf: true
        });

        connection.on("error", (err) => {
            console.error("Voice Error:", err);
        });

        connection.on(VoiceConnectionStatus.Disconnected, async () => {

            console.warn("⚠️ Voice disconnected.");

            try {

                await Promise.race([
                    entersState(connection, VoiceConnectionStatus.Signalling, 5000),
                    entersState(connection, VoiceConnectionStatus.Connecting, 5000)
                ]);

            } catch {

                console.log("♻️ Trying to reconnect...");

                connection.destroy();

                scheduleReconnect();

            }

        });

        connection.on(VoiceConnectionStatus.Destroyed, () => {

            console.warn("Connection destroyed.");

            scheduleReconnect();

        });

        await entersState(connection, VoiceConnectionStatus.Ready, 15000);

        console.log(`✅ Connected to ${channel.name}`);

    } catch (err) {

        console.error("Connect Error:", err);

        scheduleReconnect();

    }
}

// =========================================
// Reconnect
// =========================================

function scheduleReconnect() {

    if (reconnectTimeout) return;

    reconnectTimeout = setTimeout(async () => {

        reconnectTimeout = null;

        await connectVoice();

    }, 5000);

}

// =========================================
// Ready
// =========================================

client.once(Events.ClientReady, async () => {

    console.log(`✅ Logged in as ${client.user.tag}`);

    await connectVoice();

});

// =========================================
// Detect Kick / Move
// =========================================

client.on(Events.VoiceStateUpdate, async (oldState, newState) => {

    if (newState.id !== client.user.id) return;

    if (newState.channelId !== CHANNEL_ID) {

        console.warn("⚠️ Bot left the target voice channel.");

        scheduleReconnect();

    }

});

// =========================================
// Error Handling
// =========================================

process.on("unhandledRejection", (err) => {
    console.error("Unhandled Rejection:", err);
});

process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
});

client.on("error", (err) => {
    console.error("Client Error:", err);
});

// =========================================
// Debug (Temporary)
// =========================================

console.log("========== ENV ==========");
console.log("TOKEN exists :", !!TOKEN);
console.log("TOKEN length :", TOKEN.length);
console.log("TOKEN start  :", TOKEN.substring(0, 8));
console.log("TOKEN end    :", TOKEN.substring(TOKEN.length - 5));
console.log("GUILD_ID     :", GUILD_ID);
console.log("CHANNEL_ID   :", CHANNEL_ID);
console.log("=========================");

// =========================================
// Login
// =========================================

client.login(TOKEN).catch((err) => {
    console.error("Login Failed:", err);
});
