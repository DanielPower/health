-- migrate:up
CREATE TABLE calorie_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date DATE NOT NULL,
  meal TEXT NOT NULL CHECK (meal IN ('breakfast', 'lunch', 'dinner', 'snack')),
  description TEXT NOT NULL CHECK (length(description) BETWEEN 1 AND 200),
  calories INTEGER NOT NULL CHECK (calories > 0 AND calories <= 10000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX calorie_entries_entry_date_idx ON calorie_entries (entry_date, created_at);

-- migrate:down
DROP TABLE calorie_entries;
