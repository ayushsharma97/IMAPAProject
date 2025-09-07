# Lucid Growth — ESP Analyzer (Backend)

Minimal NestJS-based backend skeleton that:
- Connects to an IMAP mailbox (imapflow)
- Polls for messages matching a subject prefix
- Parses messages (mailparser)
- Runs simple ESP detection heuristics and stores results in MongoDB

## Run (development)
1. Copy `.env.example` to `.env` and fill values.
2. `npm install`
3. `npm run start:dev`

Note: This is a minimal skeleton for the assignment. For production build, run `npm run build` and `npm start`.
