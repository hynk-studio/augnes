-- Optional intake, private offers and owner decisions for existing publications.
CREATE TABLE `web_planning_intake_event` (
	`publication_id` text NOT NULL,
	`version` integer NOT NULL,
	`operation_id` text NOT NULL,
	`enabled` integer NOT NULL,
	PRIMARY KEY(`publication_id`, `version`),
	FOREIGN KEY (`publication_id`) REFERENCES `web_planning_public_request`(`publication_id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "web_planning_intake_version" CHECK(typeof("web_planning_intake_event"."version") = 'integer' AND "web_planning_intake_event"."version" BETWEEN 1 AND 9007199254740991),
	CONSTRAINT "web_planning_intake_enabled" CHECK("web_planning_intake_event"."enabled" IN (0, 1))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `web_planning_intake_operation` ON `web_planning_intake_event` (`publication_id`,`operation_id`);
--> statement-breakpoint
CREATE TABLE `web_planning_request_application` (
	`publication_id` text NOT NULL,
	`application_id` text NOT NULL,
	`applicant_login` text NOT NULL,
	`applicant_hash` text NOT NULL,
	`material_fingerprint` text NOT NULL,
	`offer` text NOT NULL,
	`body_fingerprint` text NOT NULL,
	`created_at` text NOT NULL,
	`expires` integer NOT NULL,
	`decision` text,
	`decision_operation_id` text,
	`decision_fingerprint` text,
	`grant_id` text,
	`invalidated_at` text,
	PRIMARY KEY(`publication_id`, `application_id`),
	FOREIGN KEY (`publication_id`) REFERENCES `web_planning_public_request`(`publication_id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "web_planning_request_application_offer" CHECK(length("web_planning_request_application"."offer") BETWEEN 1 AND 500),
	CONSTRAINT "web_planning_request_application_decision" CHECK(
    ("web_planning_request_application"."decision" IS NULL AND "web_planning_request_application"."decision_operation_id" IS NULL AND "web_planning_request_application"."decision_fingerprint" IS NULL AND "web_planning_request_application"."grant_id" IS NULL)
    OR ("web_planning_request_application"."decision" IS NOT NULL AND "web_planning_request_application"."invalidated_at" IS NULL AND "web_planning_request_application"."decision_operation_id" IS NOT NULL AND "web_planning_request_application"."decision_fingerprint" IS NOT NULL
      AND (("web_planning_request_application"."decision" = 'approved' AND "web_planning_request_application"."grant_id" IS NOT NULL) OR ("web_planning_request_application"."decision" = 'declined' AND "web_planning_request_application"."grant_id" IS NULL))))
);
--> statement-breakpoint
CREATE INDEX `web_planning_request_application_pending` ON `web_planning_request_application` (`applicant_hash`,`expires`) WHERE "web_planning_request_application"."decision" IS NULL AND "web_planning_request_application"."invalidated_at" IS NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX `web_planning_request_application_principal` ON `web_planning_request_application` (`publication_id`,`applicant_hash`);
--> statement-breakpoint
CREATE UNIQUE INDEX `web_planning_request_application_operation` ON `web_planning_request_application` (`publication_id`,`decision_operation_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `web_planning_request_application_grant` ON `web_planning_request_application` (`grant_id`);
--> statement-breakpoint
-- A selected project reconstruction already revokes its publications within
-- the import transaction. The same update also handles ordinary withdrawal.
CREATE TRIGGER web_planning_publication_retire_applications
AFTER UPDATE OF revoked_at ON web_planning_public_request
WHEN NEW.revoked_at IS NOT NULL
BEGIN
  UPDATE web_planning_request_application
  SET invalidated_at = NEW.revoked_at
  WHERE publication_id = NEW.publication_id AND decision IS NULL AND invalidated_at IS NULL;
END;
--> statement-breakpoint
CREATE TRIGGER web_planning_erasure_retire_applications
AFTER INSERT ON web_planning_erased
BEGIN
  UPDATE web_planning_request_application
  SET invalidated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  WHERE decision IS NULL AND invalidated_at IS NULL AND publication_id IN (
    SELECT publication_id FROM web_planning_public_request
    WHERE workspace_id = NEW.workspace_id AND project_id = NEW.project_id AND work_id = NEW.work_id
  );
END;
