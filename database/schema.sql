-- ChiliHead Team Board - PostgreSQL Schema
-- Run this to create the tasks table in your existing database

CREATE TABLE IF NOT EXISTS team_tasks (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    priority VARCHAR(20) NOT NULL DEFAULT 'normal',
    due_date TIMESTAMP,
    assigned_to VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'todo',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    pushed_by VARCHAR(255) NOT NULL DEFAULT 'ChiliHead System',
    
    CONSTRAINT check_priority CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    CONSTRAINT check_status CHECK (status IN ('todo', 'in_progress', 'completed'))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_team_tasks_status ON team_tasks(status);
CREATE INDEX IF NOT EXISTS idx_team_tasks_due_date ON team_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_team_tasks_created_at ON team_tasks(created_at DESC);

-- Add trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_team_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_team_tasks_updated_at
    BEFORE UPDATE ON team_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_team_tasks_updated_at();

-- Optional: Add some sample data for testing
INSERT INTO team_tasks (id, title, description, priority, status, pushed_by)
VALUES 
    ('task_sample_1', 'Complete inventory count', 'Check all dry storage and walk-in coolers', 'high', 'todo', 'ChiliHead System'),
    ('task_sample_2', 'Review weekend schedule', 'Ensure adequate coverage for Saturday dinner rush', 'urgent', 'in_progress', 'Manager')
ON CONFLICT (id) DO NOTHING;
