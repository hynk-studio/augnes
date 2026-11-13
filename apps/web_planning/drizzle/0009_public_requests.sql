-- Optional publication capability; schema 6 and existing work/export bytes stay unchanged.
CREATE TABLE `web_planning_public_request` (
	`publication_id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`project_id` text NOT NULL,
	`work_id` text NOT NULL,
	`issuer_hash` text NOT NULL,
	`grant_id` text NOT NULL,
	`grant_fingerprint` text NOT NULL,
	`material` text NOT NULL,
	`material_fingerprint` text NOT NULL,
	`created_at` text NOT NULL,
	`expires` integer NOT NULL,
	`revoked_at` text,
	FOREIGN KEY (`workspace_id`,`project_id`) REFERENCES `web_planning_workspace`(`workspace_id`,`project_id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "web_planning_public_request_material" CHECK(json_valid("web_planning_public_request"."material"))
);
--> statement-breakpoint
CREATE INDEX `web_planning_public_request_work` ON `web_planning_public_request` (`workspace_id`,`project_id`,`work_id`,`publication_id`);
