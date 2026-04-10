/**
 * Migration: Deal Room - Projects & Messages
 * Project workflow: Inquiry → Proposal → Active → Completed
 */

const up = `
  -- Enum for project status
  CREATE TYPE project_status AS ENUM ('inquiry', 'proposal', 'active', 'completed', 'cancelled', 'disputed');

  -- Projects (Deal Room)
  CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(300) NOT NULL,
    description TEXT,
    client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    producer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status project_status NOT NULL DEFAULT 'inquiry',
    budget DECIMAL(10, 2),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    deadline TIMESTAMPTZ,
    deliverables JSONB DEFAULT '[]',
    proposal_details TEXT,
    proposal_amount DECIMAL(10, 2),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- Project messages (Deal Room chat)
  CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    message_type VARCHAR(20) NOT NULL DEFAULT 'text',
    attachment_url TEXT,
    attachment_name VARCHAR(255),
    is_system_message BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- Project status history
  CREATE TABLE project_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    from_status project_status,
    to_status project_status NOT NULL,
    changed_by UUID NOT NULL REFERENCES users(id),
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- Indexes
  CREATE INDEX idx_projects_client ON projects(client_id);
  CREATE INDEX idx_projects_producer ON projects(producer_id);
  CREATE INDEX idx_projects_status ON projects(status);
  CREATE INDEX idx_projects_created ON projects(created_at DESC);
  CREATE INDEX idx_messages_project ON messages(project_id);
  CREATE INDEX idx_messages_sender ON messages(sender_id);
  CREATE INDEX idx_messages_created ON messages(created_at);
  CREATE INDEX idx_project_status_history_project ON project_status_history(project_id);

  -- Triggers
  CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

const down = `
  DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
  DROP TABLE IF EXISTS project_status_history;
  DROP TABLE IF EXISTS messages;
  DROP TABLE IF EXISTS projects;
  DROP TYPE IF EXISTS project_status;
`;

module.exports = { up, down };
