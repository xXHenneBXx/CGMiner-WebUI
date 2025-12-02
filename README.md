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
change to Your CG Miners Host IP in ".env" as well as "backend/server.ts"
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

This runs backend + frontend together behind a single container.

Build & Run

docker compose up --build

Then open:
[http://localhost:5173/]


# 💻 Development Notes

Frontend + Backend loads automatically with npm run dev:all

Vite dev server supports hot-module-reload

Help made By Bolt.new AI and ChatGPT

SAFARI DOES NOT WORK !! USE CHROME OR EDGE
