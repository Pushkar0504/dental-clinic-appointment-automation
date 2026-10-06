# Dr. Bhosale's Shree Dental Clinic – WhatsApp Appointment Automation

React + Node/Express + MongoDB + node-cron + Evolution API. No external automation platform.

## 1. Database
Start your local MongoDB service. The app connects to `mongodb://127.0.0.1:27017` and uses the `dental_clinic` database by default. MongoDB creates the database and `appointments` collection automatically when the app first saves an appointment.

## 2. Configure
```powershell
Set-Location backend
Copy-Item .env.example .env
```
Then edit `.env` and set the Evolution API values below.
```env
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=dental_clinic
EVOLUTION_API_URL=http://localhost:4000
EVOLUTION_INSTANCE_TOKEN=your-evolution-instance-token
EVOLUTION_INSTANCE_NAME=dental-clinic
PORT=5000
TIMEZONE=Asia/Kolkata
```
Existing appointments in PostgreSQL are not migrated automatically.

## 3. Run locally (development)
```powershell
# terminal 1
Set-Location backend
npm install
npm run dev

# terminal 2
Set-Location frontend
npm install
npm run dev
```
Open http://localhost:5173

## 4. Run on your server (production)
```powershell
Set-Location frontend
npm install
npm run build
Set-Location ..\backend
npm install
npm start
```
Express serves the built dashboard and the API on PORT (5000). Point your Cloudflare
tunnel/proxy at that port. Keep it alive with `pm2 start server.js --name dental`.

> There is no login in this first version, so protect the dashboard URL
> (e.g. Cloudflare Access) before exposing it publicly.
