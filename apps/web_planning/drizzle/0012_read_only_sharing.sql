CREATE TABLE `__new_web_planning_continuation` (
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
	CONSTRAINT "web_planning_continuation_limit" CHECK("__new_web_planning_continuation"."max_updates" BETWEEN 0 AND 20)
);
--> statement-breakpoint
INSERT INTO `__new_web_planning_continuation`("grant_id", "workspace_id", "project_id", "work_id", "issuer_hash", "recipient_login", "recipient_hash", "obligation", "creation_fingerprint", "expires", "max_updates", "revoked_at") SELECT "grant_id", "workspace_id", "project_id", "work_id", "issuer_hash", "recipient_login", "recipient_hash", "obligation", "creation_fingerprint", "expires", "max_updates", "revoked_at" FROM `web_planning_continuation`;--> statement-breakpoint
DROP TABLE `web_planning_continuation`;--> statement-breakpoint
ALTER TABLE `__new_web_planning_continuation` RENAME TO `web_planning_continuation`;--> statement-breakpoint
CREATE INDEX `web_planning_continuation_work` ON `web_planning_continuation` (`workspace_id`,`project_id`,`work_id`,`grant_id`);--> statement-breakpoint
CREATE INDEX `web_planning_continuation_recipient` ON `web_planning_continuation` (`workspace_id`,`recipient_hash`,`grant_id`);