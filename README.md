# Discord AFK Voice Bot

بوت Discord يقوم بالدخول تلقائياً إلى روم صوتي ويبقى متصلاً به بشكل دائم.

## Features

- Auto Join Voice Channel
- Self Mute
- Self Deaf
- Auto Reconnect
- Works on Render.com
- Uses Environment Variables
- Error Handling
- Ready for Production

---

## Environment Variables

```
TOKEN=
GUILD_ID=
CHANNEL_ID=
```

---

## Install

```bash
npm install
```

Run

```bash
npm start
```

---

## Deploy to Render

1. Push project to GitHub.
2. Create Worker Service.
3. Connect repository.
4. Add:

```
TOKEN
GUILD_ID
CHANNEL_ID
```

5. Deploy.

---

## Permissions Required

- View Channels
- Connect
- Speak (optional)
- Read Messages

---

## Node Version

Node 22+

---

## Libraries

- discord.js v14
- @discordjs/voice
- 
