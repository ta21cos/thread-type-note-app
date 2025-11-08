-- Create profiles table (application domain)
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`bio` text,
	`avatar_url` text,
	`preferences` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint

-- Migrate data from users to profiles
INSERT INTO `profiles` (`id`, `display_name`, `bio`, `avatar_url`, `preferences`, `created_at`, `updated_at`)
SELECT
	`id`,
	COALESCE(`email`, 'User ' || substr(`id`, 1, 8)) as display_name,
	NULL as bio,
	NULL as avatar_url,
	NULL as preferences,
	`created_at`,
	`updated_at`
FROM `users`;
--> statement-breakpoint

-- Drop old external_identities table (empty, so safe to drop)
DROP TABLE `external_identities`;
--> statement-breakpoint

-- Recreate external_identities with new schema
CREATE TABLE `external_identities` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`provider_user_id` text NOT NULL,
	`profile_id` text NOT NULL,
	`email` text,
	`email_verified` integer,
	`metadata` text,
	`provider_created_at` integer,
	`provider_updated_at` integer,
	`last_synced_at` integer NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint

-- Create unique index on (provider, provider_user_id)
CREATE UNIQUE INDEX `external_identities_provider_provider_user_id_unique` ON `external_identities` (`provider`,`provider_user_id`);
--> statement-breakpoint

-- Add author_id column to notes table (nullable for now, will be required after auth is implemented)
ALTER TABLE `notes` ADD COLUMN `author_id` text REFERENCES `profiles`(`id`) ON DELETE cascade;
--> statement-breakpoint

-- Drop users table as it's replaced by profiles
DROP TABLE `users`;
