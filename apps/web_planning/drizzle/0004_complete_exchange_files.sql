-- Preserve existing envelopes, scoped file identities and bytes. Old workers refuse schema 4.
DROP TRIGGER web_planning_file_quota;
--> statement-breakpoint
ALTER TABLE web_planning_file RENAME TO web_planning_file_old;
--> statement-breakpoint
CREATE TABLE `web_planning_file` (
	`workspace_id` text NOT NULL,
	`project_id` text NOT NULL,
	`work_id` text NOT NULL,
	`digest` text NOT NULL,
	`bytes` integer NOT NULL,
	`body` blob,
	PRIMARY KEY(`workspace_id`, `project_id`, `work_id`, `digest`),
	FOREIGN KEY (`workspace_id`,`project_id`) REFERENCES `web_planning_workspace`(`workspace_id`,`project_id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "web_planning_file_size" CHECK("web_planning_file"."bytes" BETWEEN 0 AND 6291456),
	CONSTRAINT "web_planning_file_body" CHECK(("web_planning_file"."bytes" <= 262144 AND typeof("web_planning_file"."body") = 'blob' AND length("web_planning_file"."body") = "web_planning_file"."bytes") OR ("web_planning_file"."bytes" > 262144 AND "web_planning_file"."body" IS NULL))
);
--> statement-breakpoint
INSERT INTO web_planning_file SELECT * FROM web_planning_file_old;
--> statement-breakpoint
DROP TABLE web_planning_file_old;
--> statement-breakpoint
CREATE TABLE `web_planning_file_part` (
	`workspace_id` text NOT NULL,
	`project_id` text NOT NULL,
	`work_id` text NOT NULL,
	`digest` text NOT NULL,
	`ordinal` integer NOT NULL,
	`data` text NOT NULL,
	PRIMARY KEY(`workspace_id`, `project_id`, `work_id`, `digest`, `ordinal`),
	FOREIGN KEY (`workspace_id`,`project_id`,`work_id`,`digest`) REFERENCES `web_planning_file`(`workspace_id`,`project_id`,`work_id`,`digest`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "web_planning_part_ordinal" CHECK(typeof("web_planning_file_part"."ordinal") = 'integer' AND "web_planning_file_part"."ordinal" BETWEEN 0 AND 31),
	CONSTRAINT "web_planning_part_size" CHECK(typeof("web_planning_file_part"."data") = 'text' AND length("web_planning_file_part"."data") BETWEEN 4 AND 262144)
);
--> statement-breakpoint
CREATE TRIGGER web_planning_file_quota BEFORE INSERT ON web_planning_file
WHEN NOT EXISTS (SELECT 1 FROM web_planning_file WHERE workspace_id=NEW.workspace_id AND project_id=NEW.project_id AND work_id=NEW.work_id AND digest=NEW.digest)
BEGIN
  SELECT (CASE WHEN (SELECT COUNT(*) FROM web_planning_file WHERE workspace_id=NEW.workspace_id AND project_id=NEW.project_id AND work_id=NEW.work_id) >= 16 THEN RAISE(ABORT, 'file_history_count_exceeded') END);
  SELECT (CASE WHEN (SELECT COALESCE(SUM(bytes),0) FROM web_planning_file WHERE workspace_id=NEW.workspace_id AND project_id=NEW.project_id AND work_id=NEW.work_id) + NEW.bytes > (CASE WHEN EXISTS (SELECT 1 FROM web_planning_revision WHERE workspace_id=NEW.workspace_id AND project_id=NEW.project_id AND work_id=NEW.work_id AND json_type(envelope,'$.exchange')='object') THEN 8388608 ELSE 1048576 END) THEN RAISE(ABORT, 'file_history_bytes_exceeded') END);
END;
--> statement-breakpoint
DROP TABLE web_planning_schema;
--> statement-breakpoint
CREATE TABLE `web_planning_schema` (
	`version` integer PRIMARY KEY NOT NULL,
	CONSTRAINT "web_planning_schema_version" CHECK("web_planning_schema"."version" = 4)
);
--> statement-breakpoint
INSERT INTO web_planning_schema(version) VALUES (4);
