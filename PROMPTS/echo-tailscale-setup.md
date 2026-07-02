# Tailscale VPS Setup — SideQuest HQ

## Context
We're deploying the SideQuest HQ (SQHQ) Next.js app to the VPS at **2.24.118.123**. Right now it runs on Cyony's host machine via a temporary Cloudflare tunnel. We want it permanently on the VPS, accessible via Tailscale so Eddie and Cyony can both reach it from anywhere — phones, laptops, whatever.

## What needs to happen

### 1. Install Tailscale on the VPS
```bash
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up
```
- Auth key may be needed — check with Eddie if it requires approval
- Get the Tailscale IP after join (usually 100.x.x.x)

### 2. Install Node.js on the VPS (if not already there)
- Need Node 22+ for Next.js 15
- Check: `node --version`
- If missing: `curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt install -y nodejs`

### 3. Clone/deploy SQHQ to the VPS
- Repo: `https://github.com/emitchell109/SideQuestHQ.git` (or whichever repo Eddie has)
- Clone to `/opt/sqhq/` or similar
- Run `npm install` and `npm run build`

### 4. Set up as a systemd service
- Create `/etc/systemd/system/sqhq.service`
- Run `npx next start -p 3000` from the app directory
- Enable and start: `systemctl enable --now sqhq`

### 5. Tailscale access
- Eddie needs Tailscale installed on his phone (iOS/Android app) and laptop
- Cyony (Hermes agent) needs `tailscale status` to confirm connectivity
- App will be accessible at `http://<tailscale-ip>:3000`
- Optionally set up Tailscale funnel or HTTPS cert for clean access

### 6. Database
- Cyony will migrate the existing SQLite DB from the host machine to the VPS
- Just need the app running and accessible first

## VPS Info
- IP: 2.24.118.123
- OS: Ubuntu/Debian (Linux 6.x)
- Root access available
- SSH key for Cyony already configured
- Docker already running (Tripp.Mind + Traefik)
- Disk: 57% used (42GB free after today's cleanup)

## What Eddie needs to do
- Install Tailscale app on phone: https://tailscale.com/download
- Log in with the same account used on the VPS
- Accept the VPS device on the Tailscale admin console if prompted

## What Cyony needs
- Tailscale installed on her host machine so she can reach the VPS over the private network
- Or just SSH access (already configured) to manage the app

## Goal
- SQHQ running on VPS, accessible via Tailscale at all times
- Eddie can open it on his phone from anywhere
- Cyony can manage it remotely
- No exposed public ports — Tailscale handles the networking
- When ready to go public, we can add a Cloudflare tunnel or custom domain on top
