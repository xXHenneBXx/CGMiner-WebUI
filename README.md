# CG Miner Web UI 
A Webpage Interface that shows live stats, change and or set settings while live mining through the CGMiner API

# Features:

Multi-miner detection

Live stats refresh every 5 seconds

Per-miner metrics

Clean React UI powered by Vite

Simple Node.js CGMiner bridge API

Windows + Linux compatible

Optional Docker deployment

# 🚀 Setup Instructions
1. Requirements

You need:

Node.js (18+)

npm

CGMiner running on your miner host

Your miners visible at http://<miner-ip>:4028


# 💡 Configuration
change Your CG Miners Host IP in ".env" as well as "backend/server.ts"
Then Run Server !! All Set


# 🟦 Windows Setup
npm install

npm run dev:all

Open the dashboard:
[http://localhost:5173/]

# 🐧 Linux Setup (Ubuntu / Debian / Armbian)
npm install

npm run dev:all

Open:
[http://localhost:5173/]

# 🐋 Docker Deployment
** coming soon **

This runs backend + frontend together behind a single container.

Build & Run

docker compose up --build

Then open:
[http://localhost:5173/]


# 💻 Development Notes

Frontend + Backend loads automatically with npm run dev:all

Vite dev server supports hot-module-reload

Help debug/make By Bolt.new(Sonnet4.5) and ChatGPT(GPT-5) AI

***ALERT***

CGMINER AND USING USB DEVICE(S) BUG- Clicking "Restart" will cause CG Miner to crash and not properly restart, therefore will have to manually restrat CG Miner
working on a fix/workaround

DOES NOT WORK ON FIREFOX !! USE CHROME, EDGE OR SAFARI 

## Support This Project

**Bitcoin(BTC):** `bc1qn9fwsaqfxnj622rvnf83hjy3lmfmtux9mk5e9s`

**Stellar(XLM):** `GCP7GQQLXAOJMDP6ZCVFTZWNW5NGKWE2FZTBJHJ2HRJL4P7G4KIAHOVA` Memo: `293595506`

**Shiba Inu(SHIB) ERC-20:** `0x671902A98F6dE872a79621de5e3c1Ae69543769B`

**XRP:** `roV3VenzynmXXDZypxHdB56bEE8aXsfMP` Tag: `2666387270`

**Dogecoin(DOGE):** `DEgaavUry7V5uV25xh8yWEc9wd44RjdohZ`

**Binance(BNB):** `0x3105c2C7D88aA15f13e7AE57d1E28b7416ba638e`

**BitcoinCash(BCH):** `bitcoincash:qzuheqchqcsp753gqyadhqm97afprvsnugskp30795`

**Solana(SOL):** `6xk4BsWqFbrD3XJb1bCyFQdKHGdQB71PFn4A8qchCNT`

**SushiSwap(SUSHI) ERC-20:** `0x671902A98F6dE872a79621de5e3c1Ae69543769B`
