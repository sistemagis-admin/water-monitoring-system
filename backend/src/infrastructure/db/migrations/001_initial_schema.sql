-- Smart Water Pump Monitoring System (SWPMS)
-- Initial Schema Migration based on PRD Section 24

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 24.2 organizations
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 24.3 projects
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, code)
);

-- 24.4 sites
CREATE TABLE IF NOT EXISTS sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Jakarta',
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, code)
);

-- 24.5 areas (rooms / areas)
CREATE TABLE IF NOT EXISTS areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(site_id, code)
);

-- Users, Roles, Permissions (RBAC)
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY(role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'OPERATOR',
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY(user_id, role_id)
);

-- 24.6 mqtt_devices (gateways / controllers)
CREATE TABLE IF NOT EXISTS mqtt_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    area_id UUID REFERENCES areas(id) ON DELETE SET NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    device_type VARCHAR(50) NOT NULL DEFAULT 'GATEWAY',
    status VARCHAR(50) NOT NULL DEFAULT 'UNKNOWN',
    last_seen_at TIMESTAMPTZ NULL,
    last_status_at TIMESTAMPTZ NULL,
    firmware_version VARCHAR(50) NULL,
    ip_address VARCHAR(50) NULL,
    rssi NUMERIC NULL,
    uptime_s BIGINT NULL,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- device_credentials
CREATE TABLE IF NOT EXISTS device_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES mqtt_devices(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    token TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 24.7 assets (Pumps, Tanks, Valves, etc.)
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    area_id UUID REFERENCES areas(id) ON DELETE SET NULL,
    device_id UUID REFERENCES mqtt_devices(id) ON DELETE SET NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    asset_type VARCHAR(50) NOT NULL DEFAULT 'PUMP',
    asset_subtype VARCHAR(50) NOT NULL DEFAULT 'MAIN_PUMP',
    status VARCHAR(50) NOT NULL DEFAULT 'STOPPED',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(site_id, code)
);

-- 24.8 metric_definitions
CREATE TABLE IF NOT EXISTS metric_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL,
    label VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NULL,
    data_type VARCHAR(50) NOT NULL DEFAULT 'number',
    category VARCHAR(50) NOT NULL DEFAULT 'OTHER',
    min_value NUMERIC NULL,
    max_value NUMERIC NULL,
    decimal_places INTEGER DEFAULT 2,
    chartable BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 24.9 asset_metrics
CREATE TABLE IF NOT EXISTS asset_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    metric_id UUID NOT NULL REFERENCES metric_definitions(id) ON DELETE CASCADE,
    source_key VARCHAR(100) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    alarm_enabled BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(asset_id, metric_id)
);

-- 24.10 sensors
CREATE TABLE IF NOT EXISTS sensors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    device_id UUID REFERENCES mqtt_devices(id) ON DELETE SET NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    sensor_type VARCHAR(50) NOT NULL,
    metric_code VARCHAR(100) NOT NULL REFERENCES metric_definitions(code) ON DELETE RESTRICT,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    unit VARCHAR(50) NULL,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 24.11 sensor_bindings
-- Flexible binding to either area OR asset (CHECK ensures exactly one is not null)
CREATE TABLE IF NOT EXISTS sensor_bindings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sensor_id UUID NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,
    area_id UUID REFERENCES areas(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    role VARCHAR(100) NULL,
    active BOOLEAN DEFAULT true,
    effective_from TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    effective_to TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_sensor_binding_target CHECK ((area_id IS NOT NULL) <> (asset_id IS NOT NULL))
);

-- 24.12 pump_commands
CREATE TABLE IF NOT EXISTS pump_commands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    command_id VARCHAR(100) UNIQUE NOT NULL,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES mqtt_devices(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    command_type VARCHAR(50) NOT NULL DEFAULT 'PUMP_POWER',
    desired_state VARCHAR(50) NOT NULL,
    actual_state VARCHAR(50) NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMPTZ NULL,
    acknowledged_at TIMESTAMPTZ NULL,
    completed_at TIMESTAMPTZ NULL,
    timeout_at TIMESTAMPTZ NULL,
    response_message TEXT NULL,
    idempotency_key VARCHAR(100) NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 24.14 telemetry_samples
CREATE TABLE IF NOT EXISTS telemetry_samples (
    id BIGSERIAL PRIMARY KEY,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    source_device_id UUID NOT NULL REFERENCES mqtt_devices(id) ON DELETE CASCADE,
    sensor_id UUID REFERENCES sensors(id) ON DELETE SET NULL,
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    device_timestamp TIMESTAMPTZ NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sequence BIGINT NULL,
    quality VARCHAR(50) DEFAULT 'GOOD',
    payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_telemetry_site_received ON telemetry_samples(site_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_device_received ON telemetry_samples(source_device_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_asset_received ON telemetry_samples(asset_id, received_at DESC);

-- 24.15 asset_current_state
CREATE TABLE IF NOT EXISTS asset_current_state (
    asset_id UUID PRIMARY KEY REFERENCES assets(id) ON DELETE CASCADE,
    last_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'STOPPED',
    metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    quality VARCHAR(50) NOT NULL DEFAULT 'GOOD',
    control_enabled BOOLEAN DEFAULT false,
    commandable BOOLEAN DEFAULT false,
    desired_state VARCHAR(50) NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 24.16 device_current_state
CREATE TABLE IF NOT EXISTS device_current_state (
    device_id UUID PRIMARY KEY REFERENCES mqtt_devices(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'UNKNOWN',
    last_seen_at TIMESTAMPTZ NULL,
    last_telemetry_at TIMESTAMPTZ NULL,
    last_status_at TIMESTAMPTZ NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 24.17 alarm_rules
CREATE TABLE IF NOT EXISTS alarm_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    metric_code VARCHAR(100) REFERENCES metric_definitions(code) ON DELETE CASCADE,
    rule_type VARCHAR(50) NOT NULL,
    operator VARCHAR(10) NULL,
    threshold NUMERIC NULL,
    secondary_threshold NUMERIC NULL,
    severity VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
    delay_seconds INTEGER DEFAULT 0,
    recovery_seconds INTEGER DEFAULT 0,
    cooldown_seconds INTEGER DEFAULT 0,
    enabled BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 24.18 alarms
CREATE TABLE IF NOT EXISTS alarms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL REFERENCES alarm_rules(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
    device_id UUID REFERENCES mqtt_devices(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    severity VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
    opened_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMPTZ NULL,
    acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
    acknowledgement_note TEXT NULL,
    resolved_at TIMESTAMPTZ NULL,
    resolved_reason VARCHAR(255) NULL,
    last_value NUMERIC NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alarms_site_status ON alarms(site_id, status);
CREATE INDEX IF NOT EXISTS idx_alarms_asset_status ON alarms(asset_id, status);

-- alarm_history
CREATE TABLE IF NOT EXISTS alarm_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alarm_id UUID NOT NULL REFERENCES alarms(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    from_status VARCHAR(50) NOT NULL,
    to_status VARCHAR(50) NOT NULL,
    note TEXT NULL,
    performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 24.19 events
CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
    device_id UUID REFERENCES mqtt_devices(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    event_code VARCHAR(100) NOT NULL,
    severity VARCHAR(50) NULL,
    message TEXT NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_events_site_occurred ON events(site_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_asset_occurred ON events(asset_id, occurred_at DESC);

-- 24.20 audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NULL,
    old_value JSONB NULL,
    new_value JSONB NULL,
    ip_address INET NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
