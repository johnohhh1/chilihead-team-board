# ChiliHead Team Task Board

A beautiful, real-time team task board that receives tasks pushed from your local ChiliHead OpsManager system. Built with Next.js 15, TypeScript, and Tailwind CSS.

## Features

- 🎨 Dark mode with Chili's red branding
- ⚡ Real-time updates (auto-refresh every 30s)
- 🔄 Click status icons to cycle: todo → in_progress → completed
- 🎯 Filter by status (All, To Do, In Progress, Completed)
- 📱 Responsive design
- 🔐 API key authentication for secure task pushing

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` and set your `API_SECRET_KEY` (same key as in your local OpsManager)

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   http://localhost:3000

## Deploy to Vercel

### Step 1: Push to GitHub

Your repository is already set up at: https://github.com/johnohhh1/chilihead-team-board

```bash
git add .
git commit -m "Initial team board deployment"
git push origin main
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import `johnohhh1/chilihead-team-board`
4. **Add Environment Variable:**
   - Name: `API_SECRET_KEY`
   - Value: `lRioy6vK8l5LWFSOsI5vRWpLdHIsqaXSMyqAmBK+OPo=`
5. Click "Deploy"

### Step 3: Update Local OpsManager

After deployment, update your local `server/.env`:

```bash
TEAM_BOARD_URL=https://your-app-name.vercel.app
TEAM_BOARD_API_KEY=lRioy6vK8l5LWFSOsI5vRWpLdHIsqaXSMyqAmBK+OPo=
```

Your team can now view tasks at: `https://your-app-name.vercel.app`

## API Endpoints

### POST /api/tasks
Push a new task from your local system.

**Headers:**
```
x-api-key: lRioy6vK8l5LWFSOsI5vRWpLdHIsqaXSMyqAmBK+OPo=
Content-Type: application/json
```

**Body:**
```json
{
  "id": "unique-task-id",
  "title": "Task name",
  "description": "Task details",
  "priority": "urgent",
  "due_date": "2025-10-31",
  "assigned_to": "Team Member Name",
  "status": "todo"
}
```

### GET /api/tasks
Get all tasks (no authentication required for viewing).

### PUT /api/tasks?id=task-id
Update task status (no authentication required for team updates).

**Body:**
```json
{
  "status": "in_progress"
}
```

## Storage

**Development:** In-memory storage (resets on restart)

**Production (Optional):** Upgrade to Vercel KV for persistent storage:

1. Create a KV store in Vercel dashboard
2. Add environment variables: `KV_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `KV_REST_API_READ_ONLY_TOKEN`
3. Uncomment Vercel KV code in `lib/kv.ts`

## Tech Stack

- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Hosting:** Vercel
- **Storage:** In-memory (upgradeable to Vercel KV)

## Team Usage

1. Manager pushes tasks from local OpsManager using the purple "Push to Team" button
2. Team members view tasks at the Vercel URL
3. Team members click status icons to update progress
4. Board auto-refreshes every 30 seconds
5. Filter by status to focus on specific tasks
