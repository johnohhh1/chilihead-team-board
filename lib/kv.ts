/**
 * Simple in-memory store for development
 * On Vercel, replace with @vercel/kv
 */

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  due_date?: string;
  assigned_to?: string;
  status: 'todo' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
  pushed_by: string; // Who pushed it from local system
}

// In-memory store (for local development)
let tasks: Task[] = [];

// When deploying to Vercel, uncomment this and install @vercel/kv:
// import { kv } from '@vercel/kv';

export const kvStore = {
  async getTasks(): Promise<Task[]> {
    // Local development - use in-memory
    if (process.env.NODE_ENV !== 'production') {
      return tasks;
    }

    // Production - use Vercel KV
    // Uncomment when deploying:
    // const storedTasks = await kv.get<Task[]>('team:tasks') || [];
    // return storedTasks;

    return tasks;
  },

  async addTask(task: Task): Promise<Task> {
    // Local development
    if (process.env.NODE_ENV !== 'production') {
      tasks.push(task);
      return task;
    }

    // Production - use Vercel KV
    // const currentTasks = await this.getTasks();
    // currentTasks.push(task);
    // await kv.set('team:tasks', currentTasks);

    return task;
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    // Local development
    if (process.env.NODE_ENV !== 'production') {
      const index = tasks.findIndex(t => t.id === id);
      if (index === -1) return null;

      tasks[index] = { ...tasks[index], ...updates, updated_at: new Date().toISOString() };
      return tasks[index];
    }

    // Production
    // const currentTasks = await this.getTasks();
    // const index = currentTasks.findIndex(t => t.id === id);
    // if (index === -1) return null;

    // currentTasks[index] = { ...currentTasks[index], ...updates, updated_at: new Date().toISOString() };
    // await kv.set('team:tasks', currentTasks);
    // return currentTasks[index];

    return null;
  },

  async deleteTask(id: string): Promise<boolean> {
    // Local development
    if (process.env.NODE_ENV !== 'production') {
      const initialLength = tasks.length;
      tasks = tasks.filter(t => t.id !== id);
      return tasks.length < initialLength;
    }

    // Production
    // const currentTasks = await this.getTasks();
    // const filtered = currentTasks.filter(t => t.id !== id);
    // await kv.set('team:tasks', filtered);
    // return filtered.length < currentTasks.length;

    return false;
  }
};
