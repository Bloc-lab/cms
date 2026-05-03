-- Short-lived tokens for public preview of draft content on the live site (?previewToken=…).

CREATE TABLE content_preview_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  page_id TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT content_preview_tokens_token_hash_key UNIQUE (token_hash)
);

CREATE INDEX idx_content_preview_tokens_tenant_expires
  ON content_preview_tokens(tenant_id, expires_at);

ALTER TABLE content_preview_tokens ENABLE ROW LEVEL SECURITY;

-- No policies: anon JWT cannot read this table; service role bypasses RLS for backend.
