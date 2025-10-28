/**
 * Task storage using PostgreSQL instead of Vercel Blob
 * Much more reliable, no duplication issues, instant updates
 */

import { Pool } from 'pg';

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
  pushed_by: string;
}

// For serverless, we need to create a new pool or reuse existing
let pool: any = null;

function getPool(): any {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL or POSTGRES_URL environment variable not configured');
    }

    console.log('Creating new PostgreSQL connection pool');

    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      },
      max: 1, // For serverless, use minimal connections
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    pool.on('error', (err: Error) => {
      console.error('Unexpected database error:', err);
      pool = null; // Reset pool on error
    });
  }

  return pool;
}

export const dbStore = {
  /**
   * Get all tasks, optionally filtered by status
   */
  async getTasks(status?: string): Promise<Task[]> {
    console.log('[getTasks] Starting fetch...');
    
    try {
      const pool = getPool();
      console.log('[getTasks] Got pool');
      
      let query = 'SELECT * FROM team_tasks';
      const params: any[] = [];

      if (status) {
        query += ' WHERE status = $1';
        params.push(status);
      }

      query += ' ORDER BY created_at DESC';
      console.log('[getTasks] Executing query:', query);

      const result = await pool.query(query, params);
      console.log('[getTasks] Query success, rows:', result.rows.length);
      
      return result.rows.map((row: any) => ({
        ...row,
        due_date: row.due_date ? row.due_date.toISOString() : undefined,
        created_at: row.created_at.toISOString(),
        updated_at: row.updated_at.toISOString(),
      }));
    } catch (error: any) {
      console.error('[getTasks] Error:', error);
      console.error('[getTasks] Error message:', error?.message);
      console.error('[getTasks] Error code:', error?.code);
      console.error('[getTasks] Error stack:', error?.stack);
      throw new Error(`Failed to fetch tasks from database: ${error?.message}`);
    }
  },

  /**
   * Add a new task
   */
  async addTask(task: Omit<Task, 'created_at' | 'updated_at'>): Promise<Task> {
    const pool = getPool();
    
    try {
      const query = `
        INSERT INTO team_tasks (
          id, title, description, priority, due_date, 
          assigned_to, status, pushed_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const values = [
        task.id,
        task.title,
        task.description || null,
        task.priority,
        task.due_date ? new Date(task.due_date) : null,
        task.assigned_to || null,
        task.status,
        task.pushed_by,
      ];

      const result = await pool.query(query, values);
      const row = result.rows[0];

      return {
        ...row,
        due_date: row.due_date ? row.due_date.toISOString() : undefined,
        created_at: row.created_at.toISOString(),
        updated_at: row.updated_at.toISOString(),
      };
    } catch (error) {
      console.error('Error adding task:', error);
      throw new Error('Failed to add task to database');
    }
  },

  /**
   * Update an existing task
   */
  async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    const pool = getPool();
    
    try {
      // Build dynamic update query
      const fields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (updates.title !== undefined) {
        fields.push(`title = $${paramCount++}`);
        values.push(updates.title);
      }
      if (updates.description !== undefined) {
        fields.push(`description = $${paramCount++}`);
        values.push(updates.description || null);
      }
      if (updates.priority !== undefined) {
        fields.push(`priority = $${paramCount++}`);
        values.push(updates.priority);
      }
      if (updates.due_date !== undefined) {
        fields.push(`due_date = $${paramCount++}`);
        values.push(updates.due_date ? new Date(updates.due_date) : null);
      }
      if (updates.assigned_to !== undefined) {
        fields.push(`assigned_to = $${paramCount++}`);
        values.push(updates.assigned_to || null);
      }
      if (updates.status !== undefined) {
        fields.push(`status = $${paramCount++}`);
        values.push(updates.status);
      }
      if (updates.pushed_by !== undefined) {
        fields.push(`pushed_by = $${paramCount++}`);
        values.push(updates.pushed_by);
      }

      if (fields.length === 0) {
        // No updates provided
        return this.getTaskById(id);
      }

      values.push(id); // Add id as last parameter

      const query = `
        UPDATE team_tasks 
        SET ${fields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        ...row,
        due_date: row.due_date ? row.due_date.toISOString() : undefined,
        created_at: row.created_at.toISOString(),
        updated_at: row.updated_at.toISOString(),
      };
    } catch (error) {
      console.error('Error updating task:', error);
      throw new Error('Failed to update task in database');
    }
  },

  /**
   * Get a single task by ID
   */
  async getTaskById(id: string): Promise<Task | null> {
    const pool = getPool();
    
    try {
      const result = await pool.query(
        'SELECT * FROM team_tasks WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        ...row,
        due_date: row.due_date ? row.due_date.toISOString() : undefined,
        created_at: row.created_at.toISOString(),
        updated_at: row.updated_at.toISOString(),
      };
    } catch (error) {
      console.error('Error fetching task by ID:', error);
      throw new Error('Failed to fetch task from database');
    }
  },

  /**
   * Delete a task
   */
  async deleteTask(id: string): Promise<boolean> {
    const pool = getPool();
    
    try {
      const result = await pool.query(
        'DELETE FROM team_tasks WHERE id = $1',
        [id]
      );

      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw new Error('Failed to delete task from database');
    }
  },

  /**
   * Get task statistics
   */
  async getTaskStats(): Promise<{
    total: number;
    todo: number;
    in_progress: number;
    completed: number;
    overdue: number;
  }> {
    const pool = getPool();
    
    try {
      const result = await pool.query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END) as todo,
          SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN due_date < NOW() AND status != 'completed' THEN 1 ELSE 0 END) as overdue
        FROM team_tasks
      `);

      const row = result.rows[0];
      return {
        total: parseInt(row.total) || 0,
        todo: parseInt(row.todo) || 0,
        in_progress: parseInt(row.in_progress) || 0,
        completed: parseInt(row.completed) || 0,
        overdue: parseInt(row.overdue) || 0,
      };
    } catch (error) {
      console.error('Error fetching task stats:', error);
      return { total: 0, todo: 0, in_progress: 0, completed: 0, overdue: 0 };
    }
  },

  /**
   * Close the connection pool (call on shutdown)
   */
  async close(): Promise<void> {
    if (pool) {
      await pool.end();
      pool = null;
    }
  }
};

// Export for compatibility with existing code
export const kvStore = dbStore;
