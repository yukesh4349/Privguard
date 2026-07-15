// Phase 1: Neo4j Cypher script for Identity Graph Engine constraints

// Create unique constraints to ensure data integrity and fast lookups
CREATE CONSTRAINT user_id_unique IF NOT EXISTS FOR (u:User) REQUIRE u.user_id IS UNIQUE;
CREATE CONSTRAINT account_id_unique IF NOT EXISTS FOR (a:Account) REQUIRE a.account_id IS UNIQUE;
CREATE CONSTRAINT system_id_unique IF NOT EXISTS FOR (s:System) REQUIRE s.system_id IS UNIQUE;
CREATE CONSTRAINT entitlement_id_unique IF NOT EXISTS FOR (e:Entitlement) REQUIRE e.entitlement_id IS UNIQUE;

// Indexes for common queries
CREATE INDEX user_name_idx IF NOT EXISTS FOR (u:User) ON (u.name);
CREATE INDEX account_type_idx IF NOT EXISTS FOR (a:Account) ON (a.account_type);

// Documentation on expected Graph Relationships
// 
// 1. User -> Account
// MATCH (u:User {user_id: '...'})
// MATCH (a:Account {account_id: '...'})
// MERGE (u)-[:HAS_ACCOUNT]->(a)
// 
// 2. Account -> System (Direct access)
// MATCH (a:Account {account_id: '...'})
// MATCH (s:System {system_id: '...'})
// MERGE (a)-[:CAN_ACCESS]->(s)
// 
// 3. Account -> Entitlement (Privileges)
// MATCH (a:Account {account_id: '...'})
// MATCH (e:Entitlement {entitlement_id: '...'})
// MERGE (a)-[:GRANTED]->(e)
//
// 4. Entitlement -> System (What system the entitlement applies to)
// MATCH (e:Entitlement {entitlement_id: '...'})
// MATCH (s:System {system_id: '...'})
// MERGE (e)-[:APPLIES_TO]->(s)

// Example Lateral Movement Query: "Shortest privilege-escalation path to a Tier-0 system"
// MATCH path = shortestPath( (u:User {user_id: 'malicious_actor'})-[:HAS_ACCOUNT|CAN_ACCESS|GRANTED*1..5]->(s:System {tier: '0'}) )
// RETURN path
