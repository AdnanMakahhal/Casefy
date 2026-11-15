CREATE TABLE workspaces (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 name VARCHAR(80) NOT NULL, normalized_name VARCHAR(80) NOT NULL, legacy_key VARCHAR(32),
 is_primary BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CONSTRAINT workspaces_owner_id_legacy_key_key UNIQUE(owner_id, legacy_key)
);
CREATE INDEX workspaces_owner_id_idx ON workspaces(owner_id);
CREATE UNIQUE INDEX workspaces_one_primary ON workspaces(owner_id) WHERE is_primary;
INSERT INTO workspaces(owner_id,name,normalized_name,legacy_key,is_primary)
 SELECT id, COALESCE(NULLIF(workspace_name,''), left(name || '''s workspace',80)),
 lower(regexp_replace(trim(COALESCE(NULLIF(workspace_name,''),left(name || '''s workspace',80))), '\s+', ' ', 'g')), 'primary', true FROM users;
INSERT INTO workspaces(owner_id,name,normalized_name,legacy_key)
 SELECT u.id, n.name, lower(regexp_replace(trim(n.name),'\s+',' ','g')), 'additional-' || (n.position-1)
 FROM users u CROSS JOIN LATERAL unnest(u.workspace_names) WITH ORDINALITY AS n(name,position);
-- Preserve even historical project associations whose names are no longer in the legacy list.
INSERT INTO workspaces(owner_id,name,normalized_name,legacy_key)
 SELECT DISTINCT p.owner_id, 'Recovered workspace', 'recovered workspace', p.workspace_key FROM projects p
 WHERE NOT EXISTS (SELECT 1 FROM workspaces w WHERE w.owner_id=p.owner_id AND w.legacy_key=p.workspace_key);
ALTER TABLE projects ADD COLUMN workspace_id UUID;
UPDATE projects p SET workspace_id=w.id FROM workspaces w WHERE w.owner_id=p.owner_id AND w.legacy_key=p.workspace_key;
ALTER TABLE projects ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE projects ALTER COLUMN workspace_key SET DEFAULT 'primary';
ALTER TABLE projects ADD CONSTRAINT projects_workspace_id_fkey FOREIGN KEY(workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE INDEX projects_workspace_id_idx ON projects(workspace_id);
CREATE TABLE workspace_members (
 workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 role VARCHAR(10) NOT NULL DEFAULT 'viewer' CHECK(role IN ('viewer','editor')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), PRIMARY KEY(workspace_id,user_id)
);
CREATE INDEX workspace_members_user_id_idx ON workspace_members(user_id);
CREATE TABLE workspace_invites (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
 token_hash VARCHAR(64) NOT NULL UNIQUE, role VARCHAR(10) NOT NULL DEFAULT 'viewer' CHECK(role IN ('viewer','editor')),
 expires_at TIMESTAMPTZ NOT NULL, revoked_at TIMESTAMPTZ, accepted_at TIMESTAMPTZ, accepted_by INTEGER,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX workspace_invites_workspace_id_idx ON workspace_invites(workspace_id);
-- Registration, staff account creation and profile renames all retain a private primary workspace.
CREATE FUNCTION sync_primary_workspace() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 INSERT INTO workspaces(owner_id,name,normalized_name,legacy_key,is_primary)
 VALUES(NEW.id,COALESCE(NULLIF(NEW.workspace_name,''),left(NEW.name || '''s workspace',80)),
 lower(regexp_replace(trim(COALESCE(NULLIF(NEW.workspace_name,''),left(NEW.name || '''s workspace',80))),'\s+',' ','g')),'primary',true)
 ON CONFLICT(owner_id,legacy_key) DO UPDATE SET name=EXCLUDED.name, normalized_name=EXCLUDED.normalized_name;
 RETURN NEW;
END; $$;
CREATE TRIGGER users_private_workspace AFTER INSERT OR UPDATE OF workspace_name ON users FOR EACH ROW EXECUTE FUNCTION sync_primary_workspace();
