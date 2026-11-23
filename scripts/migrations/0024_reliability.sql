CREATE TABLE IF NOT EXISTS kpi_write_leases (
 name text PRIMARY KEY,
 holder uuid NOT NULL,
 expires_at timestamptz NOT NULL
);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS kpi_write_receipts (
 operation_id uuid PRIMARY KEY REFERENCES operations(id),
 before_hash text NOT NULL,
 after_hash text NOT NULL,
 verified_at timestamptz NOT NULL DEFAULT now()
);
