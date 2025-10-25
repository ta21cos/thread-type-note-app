CREATE TABLE IF NOT EXISTS `mentions` (
	`id` text PRIMARY KEY NOT NULL,
	`from_note_id` text NOT NULL,
	`to_note_id` text NOT NULL,
	`position` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`from_note_id`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`to_note_id`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `notes` (
	`id` text PRIMARY KEY NOT NULL,
	`content` text NOT NULL,
	`parent_id` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`depth` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`parent_id`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `search_index` (
	`note_id` text PRIMARY KEY NOT NULL,
	`content` text NOT NULL,
	`tokens` text NOT NULL,
	`mentions` text,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`note_id`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `mentions_from_note_id_to_note_id_position_unique` ON `mentions` (`from_note_id`,`to_note_id`,`position`);