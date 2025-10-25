import { NextRequest, NextResponse } from 'next/server';
import { kvStore } from '@/lib/kv';

// Verify API key
function verifyApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key');
  const expectedKey = process.env.API_SECRET_KEY;

  if (!expectedKey) {
    console.error('API_SECRET_KEY not configured');
    return false;
  }

  return apiKey === expectedKey;
}

// GET /api/tasks - List all team tasks
export async function GET(request: NextRequest) {
  try {
    const tasks = await kvStore.getTasks();

    // Optional: Filter by status
    const status = request.nextUrl.searchParams.get('status');
    const filteredTasks = status
      ? tasks.filter(t => t.status === status)
      : tasks;

    return NextResponse.json({
      success: true,
      tasks: filteredTasks,
      count: filteredTasks.length
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Push a new task from local system
export async function POST(request: NextRequest) {
  // Verify API key
  if (!verifyApiKey(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized - Invalid API key' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    // Validate required fields
    if (!body.title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      pushed_by: body.pushed_by || 'ChiliHead System'
    };

    const savedTask = await kvStore.addTask(task);

    return NextResponse.json({
      success: true,
      task: savedTask,
      message: 'Task pushed to team board'
    });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create task' },
      { status: 500 }
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
        { status: 400 }
      );
    }

    const updates = await request.json();
    const updatedTask = await kvStore.updateTask(taskId, updates);

    if (!updatedTask) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      task: updatedTask
    });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update task' },
      { status: 500 }
    );
  }
}
