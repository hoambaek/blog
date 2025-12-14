-- ═══════════════════════════════════════════════════
-- Newsletters Table - 뉴스레터 관리
-- ═══════════════════════════════════════════════════

CREATE TABLE newsletters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject VARCHAR(255) NOT NULL,
  preview_text VARCHAR(255),
  html_content TEXT NOT NULL,
  plain_text_content TEXT,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent', 'failed')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,

  -- Analytics
  total_recipients INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  bounced_count INTEGER DEFAULT 0,
  unsubscribed_count INTEGER DEFAULT 0,

  -- Resend batch info
  resend_batch_id VARCHAR(255),

  -- Metadata
  created_by VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_newsletters_status ON newsletters(status);
CREATE INDEX idx_newsletters_sent_at ON newsletters(sent_at DESC);
CREATE INDEX idx_newsletters_created_at ON newsletters(created_at DESC);

-- Enable RLS
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;

-- Apply updated_at trigger
CREATE TRIGGER update_newsletters_updated_at
  BEFORE UPDATE ON newsletters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
