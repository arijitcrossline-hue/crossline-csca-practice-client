CREATE TABLE IF NOT EXISTS api_rate_limits (
  key TEXT NOT NULL,
  window_start TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (key, window_start)
);

CREATE INDEX IF NOT EXISTS idx_api_rate_limits_window ON api_rate_limits(window_start);
