-- migrate:up
CREATE TABLE ai_configuration (
  singleton BOOLEAN PRIMARY KEY DEFAULT true CHECK (singleton),
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic')),
  model TEXT NOT NULL CHECK (length(model) BETWEEN 1 AND 200),
  api_key_encrypted BYTEA NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- migrate:down
DROP TABLE ai_configuration;
