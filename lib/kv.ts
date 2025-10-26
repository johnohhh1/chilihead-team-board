/**
 * Task storage using Vercel Blob
 */

import { put, head } from '@vercel/blob';

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

const BLOB_KEY = 'team-tasks.json';

// In-memory cache for local development
let tasksCache: Task[] = [];
let cacheTimestamp = 0;
const CACHE_TTL = 5000; // 5 seconds

async function getBlobUrl(): Promise<string | null> {
  try {
    const blob = await head(BLOB_KEY);
    return blob.url;
  } catch (error) {
    return null;
  }
}

async function readTasksFromBlob(): Promise<Task[]> {
  try {
    const url = await getBlobUrl();
    if (!url) {
      return [];
    }

    const response = await fetch(url);
    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.tasks || [];
  } catch (error) {
    console.error('Error reading from Blob:', error);
    return [];
  }
}

async function writeTasksToBlob(tasks: Task[]): Promise<void> {
  try {
    const data = JSON.stringify({ tasks, updated_at: new Date().toISOString() });
    await put(BLOB_KEY, data, {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false // Overwrite existing blob instead of creating new one
    });

    // Clear cache to force re-read
    tasksCache = tasks;
    cacheTimestamp = Date.now();
  } catch (error) {
    console.error('Error writing to Blob:', error);
    throw error;
  }
}

export const kvStore = {
  async getTasks(): Promise<Task[]> {
    // Use cache for recent reads
    const now = Date.now();
    if (tasksCache.length > 0 && now - cacheTimestamp < CACHE_TTL) {
      return tasksCache;
    }

    const tasks = await readTasksFromBlob();
    tasksCache = tasks;
    cacheTimestamp = now;
    return tasks;
  },

  async addTask(task: Task): Promise<Task> {
    const tasks = await this.getTasks();
    tasks.push(task);
    await writeTasksToBlob(tasks);

    // Update cache
    tasksCache = tasks;
    cacheTimestamp = Date.now();

    return task;
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    const tasks = await this.getTasks();
    const index = tasks.findIndex(t => t.id === id);

    if (index === -1) {
      return null;
    }

    tasks[index] = {
      ...tasks[index],
      ...updates,
      updated_at: new Date().toISOString()
    };

    await writeTasksToBlob(tasks);

    // Update cache
    tasksCache = tasks;
    cacheTimestamp = Date.now();

    return tasks[index];
  },

  async deleteTask(id: string): Promise<boolean> {
    const tasks = await this.getTasks();
    const filtered = tasks.filter(t => t.id !== id);

    if (filtered.length === tasks.length) {
      return false;
    }

    await writeTasksToBlob(filtered);

    // Update cache
    tasksCache = filtered;
    cacheTimestamp = Date.now();

    return true;
  }
};
