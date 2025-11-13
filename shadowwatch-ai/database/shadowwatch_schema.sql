-- ShadowWatch AI Database Schema
-- GDPR-compliant schema with encryption support for ethical AI monitoring

-- ==========================================
-- EXTENSIONS
-- ==========================================

-- Required extensions for advanced features
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- TABLES
-- ==========================================

-- Users table (links to main game users)
CREATE TABLE users (
    user_id UUID PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    shadowwatch_enabled BOOLEAN DEFAULT false,
    shadowwatch_consent_given TIMESTAMP WITH TIME ZONE,
    shadowwatch_consent_version VARCHAR(50),
    gdpr_data_processing BOOLEAN DEFAULT false,
    data_retention_override_days INTEGER,
    last_activity TIMESTAMP WITH TIME ZONE,
    tutorial_completed BOOLEAN DEFAULT false,
    tutorial_completion_date TIMESTAMP WITH TIME ZONE,
    training_consent BOOLEAN DEFAULT false,
    training_open BOOLEAN DEFAULT false,
    admin_notes TEXT,
    account_status VARCHAR(20) DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'terminated'))
);

-- User sessions (tracks active monitoring sessions)
CREATE TABLE user_sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    consent_given BOOLEAN DEFAULT false,
    session_data BYTEA, -- Encrypted session data
    ip_address INET,
    user_agent TEXT,
    device_fingerprint VARCHAR(255),
    heartbeat_count INTEGER DEFAULT 0,
    last_heartbeat TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity logs (encrypted user activity monitoring)
CREATE TABLE activity_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    session_id UUID REFERENCES user_sessions(session_id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    activity_data BYTEA, -- Encrypted activity data
    encrypted BOOLEAN DEFAULT true,
    ip_address INET,
    user_agent TEXT,
    location_data JSONB, -- Anonymized location info
    device_info JSONB, -- Device capabilities (anonymized)
    game_context JSONB, -- Game state context
    ai_insights JSONB, -- AI analysis results
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tutorial progress (tracks user tutorial completion)
CREATE TABLE tutorial_progress (
    progress_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    tutorial_id VARCHAR(100) DEFAULT 'main_tutorial',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    last_step_reached INTEGER DEFAULT 0,
    completed_steps INTEGER[] DEFAULT '{}',
    total_time_seconds INTEGER DEFAULT 0,
    attempts_count INTEGER DEFAULT 1,
    hints_used INTEGER DEFAULT 0,
    warnings_triggered INTEGER DEFAULT 0,
    voiceover_enabled BOOLEAN DEFAULT true,
    completion_score DECIMAL(5,2), -- Percentage score
    feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
    feedback_comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tutorial step analytics (global tutorial metrics)
CREATE TABLE tutorial_analytics (
    analytics_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tutorial_id VARCHAR(100) NOT NULL,
    step_number INTEGER NOT NULL,
    completion_count INTEGER DEFAULT 0,
    average_time_seconds DECIMAL(10,2),
    hint_usage_rate DECIMAL(5,2), -- Percentage of users who needed hints
    failure_rate DECIMAL(5,2), -- Percentage of users who failed this step
    skip_rate DECIMAL(5,2), -- Percentage of users who skipped this step
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tutorial_id, step_number)
);

-- Attack training sessions (PvP training records)
CREATE TABLE training_sessions (
    training_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player1_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    player2_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    session_type VARCHAR(50) DEFAULT 'casual', -- casual, ranked, practice
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    winner_id UUID REFERENCES users(user_id),
    end_reason VARCHAR(50), -- completed, timeout, disconnected, etc.
    duration_seconds INTEGER,
    training_mode VARCHAR(50) DEFAULT 'combat', -- combat, strategy, mixed
    difficulty_level VARCHAR(20) DEFAULT 'normal',
    consent_verified BOOLEAN DEFAULT true,

    -- Performance metrics
    player1_stats JSONB,
    player2_stats JSONB,
    combat_log BYTEA, -- Encrypted detailed combat log
    skill_assessment JSONB,

    -- Training outcomes
    experience_gained INTEGER DEFAULT 0,
    lessons_learned TEXT[],
    improvement_areas TEXT[],

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training matchmaking queue
CREATE TABLE training_queue (
    queue_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    queued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    preferences JSONB, -- Training preferences and filters
    skill_level INTEGER,
    estimated_wait_seconds INTEGER,
    matched BOOLEAN DEFAULT false,
    matched_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Privacy audit log (GDPR compliance tracking)
CREATE TABLE privacy_audit_log (
    audit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    admin_user_id UUID, -- Admin who performed the action
    action_type VARCHAR(100) NOT NULL, -- data_access, data_deletion, consent_change, etc.
    action_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    justification TEXT, -- Reason for access/modification
    affected_data TEXT[], -- What data was affected
    data_snapshot BYTEA, -- Encrypted snapshot of data before change
    compliance_officer_approval BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin access log (security and compliance)
CREATE TABLE admin_access_log (
    access_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id UUID NOT NULL,
    admin_username VARCHAR(255),
    action_type VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100), -- users, sessions, logs, etc.
    resource_id UUID,
    action_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    session_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System health monitoring
CREATE TABLE system_health (
    health_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    service_name VARCHAR(100) DEFAULT 'shadowwatch',
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4),
    metric_unit VARCHAR(50),
    status VARCHAR(20) DEFAULT 'healthy', -- healthy, warning, critical
    details JSONB,
    server_id VARCHAR(100),
    environment VARCHAR(50) DEFAULT 'production'
);

-- AI insights cache (performance optimization)
CREATE TABLE ai_insights_cache (
    cache_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cache_key VARCHAR(255) NOT NULL UNIQUE,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    insight_type VARCHAR(100) NOT NULL,
    insight_data JSONB,
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    access_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feature flags (for gradual rollouts)
CREATE TABLE feature_flags (
    flag_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flag_name VARCHAR(100) NOT NULL UNIQUE,
    flag_description TEXT,
    enabled BOOLEAN DEFAULT false,
    rollout_percentage DECIMAL(5,2) DEFAULT 0.00, -- 0.00 to 100.00
    user_whitelist UUID[] DEFAULT '{}',
    environment VARCHAR(50) DEFAULT 'production',
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- INDEXES
-- ==========================================

-- Performance indexes for common queries
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_active ON user_sessions(user_id) WHERE ended_at IS NULL;
CREATE INDEX idx_user_sessions_created_at ON user_sessions(created_at DESC);

CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_session_id ON activity_logs(session_id);
CREATE INDEX idx_activity_logs_timestamp ON activity_logs(timestamp DESC);
CREATE INDEX idx_activity_logs_action_type ON activity_logs(action_type);
CREATE INDEX idx_activity_logs_encrypted ON activity_logs(encrypted);

CREATE INDEX idx_tutorial_progress_user_id ON tutorial_progress(user_id);
CREATE INDEX idx_tutorial_progress_completed ON tutorial_progress(completed_at) WHERE completed_at IS NOT NULL;

CREATE INDEX idx_tutorial_analytics_tutorial_step ON tutorial_analytics(tutorial_id, step_number);

CREATE INDEX idx_training_sessions_player1 ON training_sessions(player1_id);
CREATE INDEX idx_training_sessions_player2 ON training_sessions(player2_id);
CREATE INDEX idx_training_sessions_started ON training_sessions(started_at DESC);
CREATE INDEX idx_training_sessions_active ON training_sessions(ended_at) WHERE ended_at IS NULL;

CREATE INDEX idx_training_queue_user_id ON training_queue(user_id);
CREATE INDEX idx_training_queue_active ON training_queue(matched) WHERE matched = false;

CREATE INDEX idx_privacy_audit_user_id ON privacy_audit_log(user_id);
CREATE INDEX idx_privacy_audit_action ON privacy_audit_log(action_type);
CREATE INDEX idx_privacy_audit_timestamp ON privacy_audit_log(action_timestamp DESC);

CREATE INDEX idx_admin_access_admin ON admin_access_log(admin_user_id);
CREATE INDEX idx_admin_access_timestamp ON admin_access_log(action_timestamp DESC);

CREATE INDEX idx_system_health_timestamp ON system_health(timestamp DESC);
CREATE INDEX idx_system_health_metric ON system_health(metric_name, timestamp DESC);

CREATE INDEX idx_ai_insights_cache_key ON ai_insights_cache(cache_key);
CREATE INDEX idx_ai_insights_cache_user ON ai_insights_cache(user_id);
CREATE INDEX idx_ai_insights_cache_expires ON ai_insights_cache(expires_at) WHERE expires_at IS NOT NULL;

-- ==========================================
-- VIEWS
-- ==========================================

-- Active user sessions view
CREATE VIEW active_user_sessions AS
SELECT
    us.*,
    u.shadowwatch_enabled,
    u.shadowwatch_consent_given,
    u.tutorial_completed
FROM user_sessions us
JOIN users u ON us.user_id = u.user_id
WHERE us.ended_at IS NULL;

-- User activity summary view
CREATE VIEW user_activity_summary AS
SELECT
    al.user_id,
    COUNT(*) as total_actions,
    COUNT(DISTINCT DATE(al.timestamp)) as active_days,
    MIN(al.timestamp) as first_activity,
    MAX(al.timestamp) as last_activity,
    ARRAY_AGG(DISTINCT al.action_type) as action_types
FROM activity_logs al
GROUP BY al.user_id;

-- Tutorial completion statistics
CREATE VIEW tutorial_completion_stats AS
SELECT
    tutorial_id,
    COUNT(*) as total_started,
    COUNT(completed_at) as total_completed,
    ROUND(
        COUNT(completed_at)::DECIMAL / NULLIF(COUNT(*), 0) * 100, 2
    ) as completion_rate,
    ROUND(AVG(total_time_seconds), 2) as avg_completion_time,
    ROUND(AVG(completion_score), 2) as avg_completion_score
FROM tutorial_progress
GROUP BY tutorial_id;

-- Training session statistics
CREATE VIEW training_session_stats AS
SELECT
    session_type,
    COUNT(*) as total_sessions,
    COUNT(ended_at) as completed_sessions,
    ROUND(AVG(duration_seconds), 2) as avg_duration,
    ROUND(
        COUNT(winner_id)::DECIMAL / NULLIF(COUNT(ended_at), 0) * 100, 2
    ) as completion_rate
FROM training_sessions
GROUP BY session_type;

-- Privacy compliance view
CREATE VIEW privacy_compliance_status AS
SELECT
    u.user_id,
    u.shadowwatch_enabled,
    u.shadowwatch_consent_given,
    u.gdpr_data_processing,
    u.data_retention_override_days,
    COALESCE(u.data_retention_override_days, 365) as effective_retention_days,
    CASE
        WHEN u.shadowwatch_enabled AND u.shadowwatch_consent_given IS NOT NULL
             AND u.gdpr_data_processing THEN 'compliant'
        WHEN NOT u.shadowwatch_enabled THEN 'opted_out'
        ELSE 'non_compliant'
    END as compliance_status,
    (
        SELECT COUNT(*)
        FROM activity_logs al
        WHERE al.user_id = u.user_id
        AND al.timestamp > NOW() - INTERVAL '30 days'
    ) as recent_activities,
    u.last_activity
FROM users u;

-- ==========================================
-- FUNCTIONS
-- ==========================================

-- Function to automatically clean up old data (GDPR compliance)
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
    retention_days INTEGER;
BEGIN
    -- Get default retention period
    SELECT COALESCE(current_setting('shadowwatch.data_retention_days', true)::INTEGER, 365)
    INTO retention_days;

    -- Delete old activity logs (with user-specific retention if set)
    DELETE FROM activity_logs
    WHERE timestamp < NOW() - INTERVAL '1 day' * COALESCE(
        (SELECT data_retention_override_days FROM users WHERE user_id = activity_logs.user_id),
        retention_days
    );

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    -- Delete old user sessions (keep last 100 per user)
    DELETE FROM user_sessions
    WHERE session_id NOT IN (
        SELECT session_id
        FROM (
            SELECT session_id,
                   ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY connected_at DESC) as rn
            FROM user_sessions
        ) ranked
        WHERE rn <= 100
    );

    -- Delete old system health records (keep last 30 days)
    DELETE FROM system_health
    WHERE timestamp < NOW() - INTERVAL '30 days';

    -- Delete expired AI insights cache
    DELETE FROM ai_insights_cache
    WHERE expires_at < NOW();

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to check user consent status
CREATE OR REPLACE FUNCTION get_user_consent_status(p_user_id UUID)
RETURNS TABLE (
    consent_given BOOLEAN,
    consent_date TIMESTAMP WITH TIME ZONE,
    consent_version VARCHAR(50),
    gdpr_compliant BOOLEAN,
    last_activity TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.shadowwatch_consent_given IS NOT NULL,
        u.shadowwatch_consent_given,
        u.shadowwatch_consent_version,
        u.gdpr_data_processing,
        u.last_activity
    FROM users u
    WHERE u.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to anonymize IP addresses for privacy
CREATE OR REPLACE FUNCTION anonymize_ip(ip INET)
RETURNS INET AS $$
BEGIN
    -- Anonymize IPv4 addresses to /24, IPv6 to /48
    IF family(ip) = 4 THEN
        RETURN network(set_masklen(ip, 24));
    ELSE
        RETURN network(set_masklen(ip, 48));
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- TRIGGERS
-- ==========================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_sessions_updated_at BEFORE UPDATE ON user_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tutorial_progress_updated_at BEFORE UPDATE ON tutorial_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON feature_flags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Privacy audit trigger for sensitive data access
CREATE OR REPLACE FUNCTION audit_data_access()
RETURNS TRIGGER AS $$
BEGIN
    -- This would be called by application code to log data access
    -- Implementation depends on specific audit requirements
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- INITIAL DATA
-- ==========================================

-- Insert default feature flags
INSERT INTO feature_flags (flag_name, flag_description, enabled, rollout_percentage) VALUES
('tutorial_system', 'Interactive tutorial system for new users', true, 100.00),
('attack_training', 'Safe PvP training environment', true, 50.00),
('voiceover_tutorial', 'Voice narration for tutorial steps', true, 25.00),
('advanced_ai_insights', 'Enhanced AI analysis features', false, 0.00),
('real_time_collaboration', 'Real-time multiplayer features', false, 0.00);

-- ==========================================
-- PERMISSIONS
-- ==========================================

-- Grant permissions for the application user (to be set by deployment script)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO shadowwatch_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO shadowwatch_app;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO shadowwatch_app;

-- ==========================================
-- PARTITIONING (for high-traffic tables)
-- ==========================================

-- Partition activity_logs by month for better performance
-- (This would be implemented based on actual usage patterns)

-- ==========================================
-- CONSTRAINTS & VALIDATION
-- ==========================================

-- Ensure consent is required for shadowwatch features
ALTER TABLE users ADD CONSTRAINT consent_required
    CHECK (NOT shadowwatch_enabled OR shadowwatch_consent_given IS NOT NULL);

-- Ensure training requires consent
ALTER TABLE training_sessions ADD CONSTRAINT training_consent_required
    CHECK (consent_verified = true);

-- Ensure tutorial ratings are valid
ALTER TABLE tutorial_progress ADD CONSTRAINT valid_rating
    CHECK (feedback_rating IS NULL OR (feedback_rating >= 1 AND feedback_rating <= 5));

-- ==========================================
-- COMMENTS
-- ==========================================

COMMENT ON TABLE users IS 'Main user table linking to game users with ShadowWatch consent and preferences';
COMMENT ON TABLE user_sessions IS 'Active user monitoring sessions with encrypted session data';
COMMENT ON TABLE activity_logs IS 'Encrypted activity monitoring logs for AI analysis';
COMMENT ON TABLE tutorial_progress IS 'User tutorial completion tracking and analytics';
COMMENT ON TABLE training_sessions IS 'PvP training session records with performance metrics';
COMMENT ON TABLE privacy_audit_log IS 'GDPR compliance audit trail for all data access';
COMMENT ON TABLE admin_access_log IS 'Security log for administrative actions';
COMMENT ON TABLE system_health IS 'System performance and health monitoring metrics';
COMMENT ON TABLE ai_insights_cache IS 'Cached AI analysis results for performance optimization';

-- ==========================================
-- END OF SCHEMA
-- ==========================================
