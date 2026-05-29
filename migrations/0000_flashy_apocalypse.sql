CREATE TABLE `conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`contact_number` text NOT NULL,
	`contact_name` text,
	`phone_number_id` text,
	`assigned_user_id` text,
	`category` text DEFAULT 'general' NOT NULL,
	`last_message_at` integer,
	`last_message_preview` text,
	`unread_count` integer DEFAULT 0 NOT NULL,
	`is_pinned` integer DEFAULT false NOT NULL,
	`is_archived` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`sender_id` text,
	`content` text DEFAULT '' NOT NULL,
	`direction` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`signalwire_message_id` text,
	`media_url` text,
	`media_type` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `phone_numbers` (
	`id` text PRIMARY KEY NOT NULL,
	`number` text NOT NULL,
	`friendly_name` text,
	`provider_id` text,
	`provider` text,
	`gateway_id` text,
	`admin_id` text,
	`assigned_to` text,
	`capabilities` text,
	`is_active` integer DEFAULT true NOT NULL,
	`purchased_at` integer NOT NULL,
	`monthly_rate` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `phone_numbers_number_unique` ON `phone_numbers` (`number`);--> statement-breakpoint
CREATE TABLE `sms_gateways` (
	`id` text PRIMARY KEY NOT NULL,
	`admin_id` text NOT NULL,
	`provider` text NOT NULL,
	`name` text NOT NULL,
	`is_active` integer DEFAULT false NOT NULL,
	`credentials` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL,
	`email` text NOT NULL,
	`full_name` text NOT NULL,
	`role` text DEFAULT 'team_member' NOT NULL,
	`avatar` text,
	`theme` text DEFAULT 'default',
	`ringtone` text DEFAULT 'chime',
	`notifications_enabled` integer DEFAULT true NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`created_by` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);