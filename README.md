# CG Miner Web UI 
A Webpage Interface that shows live stats, change and or set settings while live mining through the CGMiner API

# Features:

Multi-miner detection

Live stats refresh every 2 seconds

Hashrate graph

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

# 🟦 Windows Setup
1. Backend
cd 
npm install
npm run dev:all

Open the dashboard:
[http://localhost:5173/]

# 🐧 Linux Setup (Ubuntu / Debian / Armbian)
1. Backend
cd backend
npm install
npm run dev:all

Open:
[http://localhost:5173/]

# 🐋 Docker Deployment

This runs backend + frontend together behind a single container.

Build & Run
docker compose up --build


Then open:
[http://localhost:5173/]

# 💡 Configuration



# 💻 Development Notes

Frontend + Backend loads automatically with npm run dev:all

Vite dev server supports hot-module-reload

Help made By Bolt.new AI and ChatGPT
