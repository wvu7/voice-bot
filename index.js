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
    console.error("TOKEN, GUILD_ID and CHANNEL_ID are required.");
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
            console.error("❌ GUILD_ID is invalid or the bot is not inside this server.");
            return;
        }

        const channel = await guild.channels.fetch(CHANNEL_ID).catch(() => null);

        if (!channel) {
            console.error("❌ CHANNEL_ID does not exist.");
            return;
        }

        if (channel.type !== ChannelType.GuildVoice) {
            console.error("❌ CHANNEL_ID is not a voice channel.");
            return;
        }

        const oldConnection = getVoiceConnection(guild.id);

        if (oldConnection) {
            try {
                oldConnection.destroy();
            } catch {}
        }

        console.log("🔊 Connecting to voice channel...");

        const connection = joinVoiceChannel({

            channelId: channel.id,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,

            selfMute: true,
            selfDeaf: true

        });

        connection.on("error", (err) => {

            console.error("Voice Connection Error:", err.message);

        });

        connection.on(VoiceConnectionStatus.Disconnected, async () => {

            console.warn("⚠️ Voice disconnected.");

            try {

                await Promise.race([

                    entersState(connection, VoiceConnectionStatus.Signalling, 5000),

                    entersState(connection, VoiceConnectionStatus.Connecting, 5000)

                ]);

            } catch {

                console.log("♻️ Reconnecting...");

                connection.destroy();

                scheduleReconnect();

            }

        });

        connection.on(VoiceConnectionStatus.Destroyed, () => {

            console.warn("Connection destroyed.");

            scheduleReconnect();

        });

        await entersState(connection, VoiceConnectionStatus.Ready, 15000);

        console.log(`✅ Connected to: ${channel.name}`);

    }

    catch (err) {

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

client.login(TOKEN).catch(err => {

    console.error("Login Failed:", err);

});
