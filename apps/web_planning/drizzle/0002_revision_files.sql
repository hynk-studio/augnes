-- Existing envelopes and migrations are untouched. Old code refuses schema 2.
DROP TABLE web_planning_schema;
--> statement-breakpoint
CREATE TABLE `web_planning_schema` (
	`version` integer PRIMARY KEY NOT NULL,
	CONSTRAINT "web_planning_schema_version" CHECK("web_planning_schema"."version" = 2)
);

--> statement-breakpoint
INSERT INTO web_planning_schema(version) VALUES (2);
--> statement-breakpoint
CREATE TABLE `web_planning_file` (
	`workspace_id` text NOT NULL,
	`project_id` text NOT NULL,
	`work_id` text NOT NULL,
	`digest` text NOT NULL,
	`bytes` integer NOT NULL,
	`body` blob NOT NULL,
	PRIMARY KEY(`workspace_id`, `project_id`, `work_id`, `digest`),
	FOREIGN KEY (`workspace_id`,`project_id`) REFERENCES `web_planning_workspace`(`workspace_id`,`project_id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "web_planning_file_size" CHECK("web_planning_file"."bytes" BETWEEN 0 AND 262144),
	CONSTRAINT "web_planning_file_body" CHECK(typeof("web_planning_file"."body") = 'blob' AND length("web_planning_file"."body") = "web_planning_file"."bytes")
);

--> statement-breakpoint
CREATE TRIGGER web_planning_file_quota BEFORE INSERT ON web_planning_file
WHEN NOT EXISTS (SELECT 1 FROM web_planning_file WHERE workspace_id=NEW.workspace_id AND project_id=NEW.project_id AND work_id=NEW.work_id AND digest=NEW.digest)
BEGIN
  SELECT (CASE WHEN (SELECT COUNT(*) FROM web_planning_file WHERE workspace_id=NEW.workspace_id AND project_id=NEW.project_id AND work_id=NEW.work_id) >= 16 THEN RAISE(ABORT, 'file_history_count_exceeded') END);
  SELECT (CASE WHEN (SELECT COALESCE(SUM(bytes),0) FROM web_planning_file WHERE workspace_id=NEW.workspace_id AND project_id=NEW.project_id AND work_id=NEW.work_id) + NEW.bytes > 1048576 THEN RAISE(ABORT, 'file_history_bytes_exceeded') END);
END;
