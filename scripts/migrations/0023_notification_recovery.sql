CREATE TABLE IF NOT EXISTS kpi_password_reset_tokens (
 token_hash text PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 expires_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS kpi_password_reset_tokens_expiry_idx ON kpi_password_reset_tokens(expires_at);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS kpi_notification_deliveries (
 message_key text PRIMARY KEY,
 recipient text NOT NULL,
 category text NOT NULL,
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent')),
 created_at timestamptz NOT NULL DEFAULT now(),
 sent_at timestamptz
);
