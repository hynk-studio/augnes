-- Transactional D1 migration with writers quiesced. Retain every existing row
-- and immutable envelope/file byte. Deferred FK checks permit replacing only
-- the mapping table without renaming dependants or disabling enforcement.
PRAGMA defer_foreign_keys=ON;
--> statement-breakpoint
CREATE TABLE web_planning_migration_guard (version integer NOT NULL CHECK(version=4));
--> statement-breakpoint
INSERT INTO web_planning_migration_guard SELECT CASE WHEN COUNT(*)=1 AND MIN(version)=4 THEN 4 ELSE 0 END FROM web_planning_schema;
--> statement-breakpoint
CREATE TABLE `__new_web_planning_workspace` (
	`singleton` integer PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`project_id` text NOT NULL,
	`author_ref` text NOT NULL,
	`owner_login_hash` text NOT NULL,
	`name` text,
	`continuation_work_id` text,
	`creation_key` text,
	`creation_fingerprint` text,
	CONSTRAINT "web_planning_workspace_positive" CHECK("__new_web_planning_workspace"."singleton" >= 1)
);
--> statement-breakpoint
INSERT INTO `__new_web_planning_workspace`(singleton,workspace_id,project_id,author_ref,owner_login_hash)
  SELECT singleton,workspace_id,project_id,author_ref,owner_login_hash FROM web_planning_workspace;
--> statement-breakpoint
DROP TABLE `web_planning_workspace`;--> statement-breakpoint
ALTER TABLE `__new_web_planning_workspace` RENAME TO `web_planning_workspace`;--> statement-breakpoint
CREATE INDEX `web_planning_workspace_owner` ON `web_planning_workspace` (`owner_login_hash`,`project_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `web_planning_workspace_scope` ON `web_planning_workspace` (`workspace_id`,`project_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `web_planning_workspace_creation` ON `web_planning_workspace` (`owner_login_hash`,`creation_key`);
--> statement-breakpoint
CREATE UNIQUE INDEX `web_planning_participation_identity` ON `web_planning_participation` (`grant_id`);
--> statement-breakpoint
DROP TABLE web_planning_schema;
--> statement-breakpoint
CREATE TABLE `web_planning_schema` (
	`version` integer PRIMARY KEY NOT NULL,
	CONSTRAINT "web_planning_schema_version" CHECK("web_planning_schema"."version" = 5)
);
--> statement-breakpoint
INSERT INTO web_planning_schema(version) VALUES (5);
--> statement-breakpoint
DROP TABLE web_planning_migration_guard;
--> statement-breakpoint
PRAGMA defer_foreign_keys=OFF;
