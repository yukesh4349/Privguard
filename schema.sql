-- Phase 1: PostgreSQL DDL Schema for Insider Threat Detection Platform

-- Enums
CREATE TYPE employment_type_enum AS ENUM ('employee', 'contractor', 'vendor');
CREATE TYPE account_type_enum AS ENUM ('standard', 'privileged', 'service');
CREATE TYPE event_type_enum AS ENUM ('login', 'query', 'export', 'command', 'config_change', 'privilege_grant', 'file_access');
CREATE TYPE alert_status_enum AS ENUM ('open', 'investigating', 'closed', 'false_positive');
CREATE TYPE asset_tier_enum AS ENUM ('0', '1', '2');
CREATE TYPE data_classification_enum AS ENUM ('public', 'internal', 'confidential', 'restricted-pii');

-- Tables
CREATE TABLE "User" (
    user_id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    department VARCHAR(255),
    employment_type employment_type_enum NOT NULL,
    hr_status VARCHAR(50),
    join_date DATE,
    termination_date DATE,
    manager_id UUID, -- Self-referencing if needed
    peer_group_id UUID
);

CREATE TABLE "Account" (
    account_id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES "User"(user_id),
    system_id VARCHAR(255) NOT NULL,
    account_type account_type_enum NOT NULL,
    entitlement_tier VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL
);

CREATE TABLE "Session" (
    session_id UUID PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES "Account"(account_id),
    source_ip INET,
    geo VARCHAR(100),
    device_id VARCHAR(255),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    auth_method VARCHAR(100),
    mfa_used BOOLEAN DEFAULT FALSE,
    risk_score_at_start NUMERIC(5, 2),
    recording_uri VARCHAR(512),
    broker_id VARCHAR(255)
);

CREATE TABLE "Event" (
    event_id UUID PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES "Session"(session_id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    event_type event_type_enum NOT NULL,
    target_system VARCHAR(255),
    target_object VARCHAR(255),
    bytes_transferred BIGINT,
    command_text TEXT,
    result_status VARCHAR(50)
);

CREATE TABLE "Entitlement" (
    entitlement_id UUID PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES "Account"(account_id),
    system_id VARCHAR(255) NOT NULL,
    scope VARCHAR(255) NOT NULL,
    granted_by UUID REFERENCES "User"(user_id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    justification TEXT,
    jit_flag BOOLEAN DEFAULT FALSE
);

CREATE TABLE "RiskScoreLog" (
    id UUID PRIMARY KEY,
    entity_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    score NUMERIC(5, 2) NOT NULL,
    contributing_features_json JSONB,
    model_version VARCHAR(50),
    signature TEXT -- ML-DSA signed for tamper evidence
);

CREATE TABLE "Alert" (
    alert_id UUID PRIMARY KEY,
    entity_id UUID NOT NULL,
    risk_score NUMERIC(5, 2) NOT NULL,
    triggered_rules JSONB, -- Array of rules
    model_scores JSONB, -- Map of model scores
    severity VARCHAR(50) NOT NULL,
    status alert_status_enum NOT NULL DEFAULT 'open',
    assigned_analyst UUID REFERENCES "User"(user_id),
    sla_due TIMESTAMP WITH TIME ZONE
);

CREATE TABLE "Case" (
    case_id UUID PRIMARY KEY,
    alert_ids JSONB, -- Array of alert UUIDs
    analyst_notes TEXT,
    timeline_events JSONB,
    disposition VARCHAR(255),
    closed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE "AssetCriticality" (
    system_id VARCHAR(255) PRIMARY KEY,
    tier asset_tier_enum NOT NULL,
    data_classification data_classification_enum NOT NULL
);
