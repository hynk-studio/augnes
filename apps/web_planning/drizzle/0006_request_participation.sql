CREATE TABLE `web_planning_participation` (
	`workspace_id` text NOT NULL,
	`project_id` text NOT NULL,
	`grant_id` text NOT NULL,
	`work_id` text NOT NULL,
	`recipient_login` text NOT NULL,
	`recipient_hash` text NOT NULL,
	`disclosure` text NOT NULL,
	`disclosure_fingerprint` text NOT NULL,
	`expires` integer NOT NULL,
	`revoked_at` text,
	PRIMARY KEY(`workspace_id`, `project_id`, `grant_id`),
	FOREIGN KEY (`workspace_id`,`project_id`) REFERENCES `web_planning_workspace`(`workspace_id`,`project_id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "web_planning_participation_disclosure" CHECK(json_valid("web_planning_participation"."disclosure"))
);
--> statement-breakpoint
CREATE INDEX `web_planning_participation_request` ON `web_planning_participation` (`workspace_id`,`project_id`,`work_id`);