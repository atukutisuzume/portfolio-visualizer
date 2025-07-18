-- Create trade_history table
CREATE TABLE IF NOT EXISTS trade_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  trade_date DATE NOT NULL,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  market TEXT,
  account_type TEXT,
  trade_type TEXT,
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  quantity NUMERIC NOT NULL,
  price NUMERIC NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'JPY',
  source TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trade_history_user_id ON trade_history(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_history_symbol ON trade_history(symbol);
CREATE INDEX IF NOT EXISTS idx_trade_history_trade_date ON trade_history(trade_date);
CREATE INDEX IF NOT EXISTS idx_trade_history_side ON trade_history(side);

-- Add RLS (Row Level Security) policies if needed
-- ALTER TABLE trade_history ENABLE ROW LEVEL SECURITY;
