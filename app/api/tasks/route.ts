import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
};

// Verify API key (manager key or team key)
function verifyApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key');
  const managerKey = process.env.API_SECRET_KEY;
  const teamKey = process.env.NEXT_PUBLIC_TEAM_API_KEY || 'team-member-access';

  if (!managerKey) {
    console.error('API_SECRET_KEY not configured');
    return false;
  }

  // Allow either manager key or team key
  return apiKey === managerKey || apiKey === teamKey;
}

// Handle OPTIONS preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET /api/tasks - List all team tasks
export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get('status');
    const tasks = await dbStore.getTasks(status || undefined);

    return NextResponse.json({
      success: true,
      tasks: tasks,
      count: tasks.length
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tasks' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST /api/tasks - Push a new task from local system
export async function POST(request: NextRequest) {
  // Verify API key
  if (!verifyApiKey(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized - Invalid API key' },
      { status: 401, headers: corsHeaders }
    );
  }

  try {
    const body = await request.json();

    // Validate required fields
    if (!body.title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Create task
    const task = {
      id: body.id || `task_${Date.now()}`,
      title: body.title,
      description: body.description || '',
      priority: body.priority || 'normal',
      due_date: body.due_date,
      assigned_to: body.assigned_to,
      status: body.status || 'todo',
      pushed_by: body.pushed_by || 'ChiliHead System'
    };

    const savedTask = await dbStore.addTask(task);

    return NextResponse.json({
      success: true,
      task: savedTask,
      message: 'Task pushed to team board'
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create task' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// PUT /api/tasks?id=xxx - Update task status (for team members)
export async function PUT(request: NextRequest) {
  try {
    const taskId = request.nextUrl.searchParams.get('id');
    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'Task ID required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const updates = await request.json();
    const updatedTask = await dbStore.updateTask(taskId, updates);

    if (!updatedTask) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json({
      success: true,
      task: updatedTask
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update task' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// DELETE /api/tasks?id=xxx - Delete a task
export async function DELETE(request: NextRequest) {
  // Verify API key (manager only)
  if (!verifyApiKey(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized - Invalid API key' },
      { status: 401, headers: corsHeaders }
    );
  }

  try {
    const taskId = request.nextUrl.searchParams.get('id');
    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'Task ID required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const deleted = await dbStore.deleteTask(taskId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Task deleted'
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete task' },
      { status: 500, headers: corsHeaders }
    );
  }
}
