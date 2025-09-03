CREATE TABLE "chat_completions_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prompt" text NOT NULL,
	"response" text NOT NULL,
	"task" text NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" text DEFAULT '' NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"is_processed" boolean DEFAULT false NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL,
	"updated_at" bigint DEFAULT 0 NOT NULL,
	"content_vector_1536" vector(1536),
	"content_vector_1024" vector(1024),
	"content_vector_768" vector(768)
);
--> statement-breakpoint
CREATE TABLE "memory_access_patterns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"memory_id" uuid NOT NULL,
	"access_type" text NOT NULL,
	"context" text,
	"duration_ms" integer,
	"created_at" bigint DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memory_associations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_memory_id" uuid NOT NULL,
	"target_memory_id" uuid NOT NULL,
	"association_type" text NOT NULL,
	"strength" integer DEFAULT 5 NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memory_consolidation_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"memory_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"consolidation_score" integer,
	"created_at" bigint DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memory_fragments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content" text NOT NULL,
	"memory_type" text NOT NULL,
	"category" text NOT NULL,
	"importance" integer DEFAULT 5 NOT NULL,
	"emotional_impact" integer DEFAULT 0 NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL,
	"last_accessed" bigint DEFAULT 0 NOT NULL,
	"access_count" integer DEFAULT 1 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"content_vector_1536" vector(1536),
	"content_vector_1024" vector(1024),
	"content_vector_768" vector(768),
	"deleted_at" bigint
);
--> statement-breakpoint
CREATE TABLE "memory_long_term_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"priority" integer DEFAULT 5 NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"deadline" bigint,
	"status" text DEFAULT 'planned' NOT NULL,
	"parent_goal_id" uuid,
	"category" text DEFAULT 'personal' NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL,
	"updated_at" bigint DEFAULT 0 NOT NULL,
	"deleted_at" bigint
);
--> statement-breakpoint
CREATE TABLE "memory_search_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"query" text NOT NULL,
	"results_count" integer NOT NULL,
	"selected_memory_id" uuid,
	"search_duration_ms" integer,
	"created_at" bigint DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memory_short_term_ideas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content" text NOT NULL,
	"source_type" text DEFAULT 'dream' NOT NULL,
	"source_id" text,
	"status" text DEFAULT 'new' NOT NULL,
	"excitement" integer DEFAULT 5 NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL,
	"updated_at" bigint DEFAULT 0 NOT NULL,
	"content_vector_1536" vector(1536),
	"content_vector_1024" vector(1024),
	"content_vector_768" vector(768),
	"deleted_at" bigint
);
--> statement-breakpoint
CREATE TABLE "memory_tag_relations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"memory_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memory_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text,
	"created_at" bigint DEFAULT 0 NOT NULL,
	CONSTRAINT "memory_tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "memory_access_patterns" ADD CONSTRAINT "memory_access_patterns_memory_id_memory_fragments_id_fk" FOREIGN KEY ("memory_id") REFERENCES "public"."memory_fragments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_associations" ADD CONSTRAINT "memory_associations_source_memory_id_memory_fragments_id_fk" FOREIGN KEY ("source_memory_id") REFERENCES "public"."memory_fragments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_associations" ADD CONSTRAINT "memory_associations_target_memory_id_memory_fragments_id_fk" FOREIGN KEY ("target_memory_id") REFERENCES "public"."memory_fragments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_consolidation_events" ADD CONSTRAINT "memory_consolidation_events_memory_id_memory_fragments_id_fk" FOREIGN KEY ("memory_id") REFERENCES "public"."memory_fragments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_search_history" ADD CONSTRAINT "memory_search_history_selected_memory_id_memory_fragments_id_fk" FOREIGN KEY ("selected_memory_id") REFERENCES "public"."memory_fragments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_tag_relations" ADD CONSTRAINT "memory_tag_relations_memory_id_memory_fragments_id_fk" FOREIGN KEY ("memory_id") REFERENCES "public"."memory_fragments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_tag_relations" ADD CONSTRAINT "memory_tag_relations_tag_id_memory_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."memory_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_messages_unprocessed_index" ON "chat_messages" USING btree ("is_processed") WHERE "chat_messages"."is_processed" = false;--> statement-breakpoint
CREATE INDEX "chat_messages_content_vector_1536_index" ON "chat_messages" USING hnsw ("content_vector_1536" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "chat_messages_content_vector_1024_index" ON "chat_messages" USING hnsw ("content_vector_1024" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "chat_messages_content_vector_768_index" ON "chat_messages" USING hnsw ("content_vector_768" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "memory_access_patterns_memory_id_index" ON "memory_access_patterns" USING btree ("memory_id");--> statement-breakpoint
CREATE INDEX "memory_access_patterns_type_index" ON "memory_access_patterns" USING btree ("access_type");--> statement-breakpoint
CREATE INDEX "memory_access_patterns_created_at_index" ON "memory_access_patterns" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "memory_associations_unique" ON "memory_associations" USING btree ("source_memory_id","target_memory_id","association_type");--> statement-breakpoint
CREATE INDEX "memory_associations_source_index" ON "memory_associations" USING btree ("source_memory_id");--> statement-breakpoint
CREATE INDEX "memory_associations_target_index" ON "memory_associations" USING btree ("target_memory_id");--> statement-breakpoint
CREATE INDEX "memory_associations_type_index" ON "memory_associations" USING btree ("association_type");--> statement-breakpoint
CREATE INDEX "memory_consolidation_events_memory_id_index" ON "memory_consolidation_events" USING btree ("memory_id");--> statement-breakpoint
CREATE INDEX "memory_consolidation_events_type_index" ON "memory_consolidation_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "memory_consolidation_events_created_at_index" ON "memory_consolidation_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "memory_items_content_vector_1536_index" ON "memory_fragments" USING hnsw ("content_vector_1536" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "memory_items_content_vector_1024_index" ON "memory_fragments" USING hnsw ("content_vector_1024" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "memory_items_content_vector_768_index" ON "memory_fragments" USING hnsw ("content_vector_768" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "memory_items_memory_type_index" ON "memory_fragments" USING btree ("memory_type");--> statement-breakpoint
CREATE INDEX "memory_items_category_index" ON "memory_fragments" USING btree ("category");--> statement-breakpoint
CREATE INDEX "memory_items_importance_index" ON "memory_fragments" USING btree ("importance");--> statement-breakpoint
CREATE INDEX "memory_items_created_at_index" ON "memory_fragments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "memory_items_last_accessed_index" ON "memory_fragments" USING btree ("last_accessed");--> statement-breakpoint
CREATE INDEX "memory_long_term_goals_priority_index" ON "memory_long_term_goals" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "memory_long_term_goals_status_index" ON "memory_long_term_goals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "memory_long_term_goals_deadline_index" ON "memory_long_term_goals" USING btree ("deadline");--> statement-breakpoint
CREATE INDEX "memory_long_term_goals_parent_goal_id_index" ON "memory_long_term_goals" USING btree ("parent_goal_id");--> statement-breakpoint
CREATE INDEX "memory_search_history_query_index" ON "memory_search_history" USING btree ("query");--> statement-breakpoint
CREATE INDEX "memory_search_history_created_at_index" ON "memory_search_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "memory_short_term_ideas_source_type_index" ON "memory_short_term_ideas" USING btree ("source_type");--> statement-breakpoint
CREATE INDEX "memory_short_term_ideas_status_index" ON "memory_short_term_ideas" USING btree ("status");--> statement-breakpoint
CREATE INDEX "memory_short_term_ideas_excitement_index" ON "memory_short_term_ideas" USING btree ("excitement");--> statement-breakpoint
CREATE INDEX "memory_short_term_ideas_content_vector_1536_index" ON "memory_short_term_ideas" USING hnsw ("content_vector_1536" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "memory_short_term_ideas_content_vector_1024_index" ON "memory_short_term_ideas" USING hnsw ("content_vector_1024" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "memory_short_term_ideas_content_vector_768_index" ON "memory_short_term_ideas" USING hnsw ("content_vector_768" vector_cosine_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "memory_tag_relations_unique" ON "memory_tag_relations" USING btree ("memory_id","tag_id");--> statement-breakpoint
CREATE INDEX "memory_tag_relations_memory_id_index" ON "memory_tag_relations" USING btree ("memory_id");--> statement-breakpoint
CREATE INDEX "memory_tag_relations_tag_id_index" ON "memory_tag_relations" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "memory_tags_name_index" ON "memory_tags" USING btree ("name");