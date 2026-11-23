CREATE TABLE IF NOT EXISTS kpi_priority_actions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 title text NOT NULL, owner text NOT NULL, due_date date,
 status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','blocked','done')),
 notes text NOT NULL DEFAULT '',
 created_by uuid NOT NULL REFERENCES users(id), updated_by uuid NOT NULL REFERENCES users(id),
 version integer NOT NULL DEFAULT 1,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS kpi_target_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 cell text NOT NULL, metric text NOT NULL,
 expected_formatted text NOT NULL, new_value numeric NOT NULL,
 rationale text NOT NULL, status text NOT NULL DEFAULT 'pending'
 CHECK (status IN ('pending','approved','rejected','needs_review')),
 requested_by uuid NOT NULL REFERENCES users(id), reviewed_by uuid REFERENCES users(id),
 created_at timestamptz NOT NULL DEFAULT now(), reviewed_at timestamptz
);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS kpi_target_requests_status_idx ON kpi_target_requests(status,created_at);
