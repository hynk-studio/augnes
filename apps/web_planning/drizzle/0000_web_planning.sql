CREATE TABLE `web_planning_erased` (
	`workspace_id` text NOT NULL,
	`project_id` text NOT NULL,
	`work_id` text NOT NULL,
	PRIMARY KEY(`workspace_id`, `project_id`, `work_id`),
	FOREIGN KEY (`workspace_id`,`project_id`) REFERENCES `web_planning_workspace`(`workspace_id`,`project_id`) ON UPDATE no action ON DELETE no action
);
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
	CONSTRAINT "web_planning_revision_bound" CHECK("web_planning_revision"."revision" BETWEEN 1 AND 32),
	CONSTRAINT "web_planning_revision_json" CHECK(json_valid("web_planning_revision"."envelope"))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `web_planning_revision_request` ON `web_planning_revision` (`workspace_id`,`project_id`,`request_key`);--> statement-breakpoint
CREATE TABLE `web_planning_schema` (
	`version` integer PRIMARY KEY NOT NULL,
	CONSTRAINT "web_planning_schema_version" CHECK("web_planning_schema"."version" = 1)
);
--> statement-breakpoint
CREATE TABLE `web_planning_workspace` (
	`singleton` integer PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`project_id` text NOT NULL,
	`author_ref` text NOT NULL,
	`owner_login_hash` text NOT NULL,
	CONSTRAINT "web_planning_workspace_singleton" CHECK("web_planning_workspace"."singleton" = 1)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `web_planning_workspace_scope` ON `web_planning_workspace` (`workspace_id`,`project_id`);