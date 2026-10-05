-- Apply with the existing transactional D1 migration owner while writers are quiesced.
-- Copy exact rows; no envelope parsing, resealing, file or ownership mutation.
CREATE TABLE web_planning_migration_guard (version integer NOT NULL CHECK(version=2));
--> statement-breakpoint
INSERT INTO web_planning_migration_guard SELECT CASE WHEN COUNT(*)=1 AND MIN(version)=2 THEN 2 ELSE 0 END FROM web_planning_schema;
--> statement-breakpoint
ALTER TABLE web_planning_revision RENAME TO web_planning_revision_old;
--> statement-breakpoint
CREATE TABLE `web_planning_revision` (
	`workspace_id` text NOT NULL,
	`project_id` text NOT NULL,
	`work_id` text NOT NULL,
	`revision` integer NOT NULL,
	`fingerprint` text NOT NULL,
	`request_key` text NOT NULL,
	`request_fingerprint` text NOT NULL,
	`envelope` text NOT NULL,
	PRIMARY KEY(`workspace_id`, `project_id`, `work_id`, `revision`),
	FOREIGN KEY (`workspace_id`,`project_id`) REFERENCES `web_planning_workspace`(`workspace_id`,`project_id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "web_planning_revision_positive" CHECK(typeof("web_planning_revision"."revision") = 'integer' AND "web_planning_revision"."revision" BETWEEN 1 AND 9007199254740991),
	CONSTRAINT "web_planning_revision_json" CHECK(json_valid("web_planning_revision"."envelope"))
);

--> statement-breakpoint
INSERT INTO web_planning_revision SELECT workspace_id,project_id,work_id,revision,fingerprint,request_key,request_fingerprint,envelope FROM web_planning_revision_old;
--> statement-breakpoint
DROP TABLE web_planning_revision_old;
--> statement-breakpoint
CREATE UNIQUE INDEX `web_planning_revision_request` ON `web_planning_revision` (`workspace_id`,`project_id`,`request_key`);
--> statement-breakpoint
DROP TABLE web_planning_schema;
--> statement-breakpoint
CREATE TABLE `web_planning_schema` (
	`version` integer PRIMARY KEY NOT NULL,
	CONSTRAINT "web_planning_schema_version" CHECK("web_planning_schema"."version" = 3)
);

--> statement-breakpoint
INSERT INTO web_planning_schema(version) VALUES (3);
--> statement-breakpoint
DROP TABLE web_planning_migration_guard;
