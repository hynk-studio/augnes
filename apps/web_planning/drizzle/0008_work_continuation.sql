-- Apply with writers quiesced; existing mappings, envelopes and file bytes are unchanged.
CREATE TABLE web_planning_continuation_migration_guard (version integer NOT NULL CHECK(version=5));
--> statement-breakpoint
INSERT INTO web_planning_continuation_migration_guard SELECT CASE WHEN COUNT(*)=1 AND MIN(version)=5 THEN 5 ELSE 0 END FROM web_planning_schema;
--> statement-breakpoint
CREATE TABLE `web_planning_continuation` (
	`grant_id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`project_id` text NOT NULL,
	`work_id` text NOT NULL,
	`issuer_hash` text NOT NULL,
	`recipient_login` text NOT NULL,
	`recipient_hash` text NOT NULL,
	`obligation` text NOT NULL,
	`creation_fingerprint` text NOT NULL,
	`expires` integer NOT NULL,
	`max_updates` integer NOT NULL,
	`revoked_at` text,
	FOREIGN KEY (`workspace_id`,`project_id`) REFERENCES `web_planning_workspace`(`workspace_id`,`project_id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "web_planning_continuation_limit" CHECK("web_planning_continuation"."max_updates" BETWEEN 1 AND 20)
);
--> statement-breakpoint
CREATE INDEX `web_planning_continuation_work` ON `web_planning_continuation` (`workspace_id`,`project_id`,`work_id`,`grant_id`);--> statement-breakpoint
CREATE TABLE `__new_web_planning_schema` (
	`version` integer PRIMARY KEY NOT NULL,
	CONSTRAINT "web_planning_schema_version" CHECK("__new_web_planning_schema"."version" = 6)
);
--> statement-breakpoint
INSERT INTO `__new_web_planning_schema`("version") VALUES (6);--> statement-breakpoint
DROP TABLE `web_planning_schema`;--> statement-breakpoint
ALTER TABLE `__new_web_planning_schema` RENAME TO `web_planning_schema`;--> statement-breakpoint

DROP TABLE web_planning_continuation_migration_guard;
