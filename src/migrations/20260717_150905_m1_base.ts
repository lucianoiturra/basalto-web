import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_ordenes_estado" AS ENUM('pendiente', 'pagada', 'fallida');
  CREATE TABLE "usuarios_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "usuarios" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "medios" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_tarjeta_url" varchar,
  	"sizes_tarjeta_width" numeric,
  	"sizes_tarjeta_height" numeric,
  	"sizes_tarjeta_mime_type" varchar,
  	"sizes_tarjeta_filesize" numeric,
  	"sizes_tarjeta_filename" varchar,
  	"sizes_pantalla_url" varchar,
  	"sizes_pantalla_width" numeric,
  	"sizes_pantalla_height" numeric,
  	"sizes_pantalla_mime_type" varchar,
  	"sizes_pantalla_filesize" numeric,
  	"sizes_pantalla_filename" varchar
  );
  
  CREATE TABLE "paquetes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nota" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "casas_momentos_visita" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"imagen_id" integer NOT NULL,
  	"titulo" varchar NOT NULL,
  	"frase" varchar NOT NULL,
  	"punto_x" numeric NOT NULL,
  	"punto_y" numeric NOT NULL
  );
  
  CREATE TABLE "casas_momentos_plano_recintos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"nombre" varchar NOT NULL,
  	"superficie" numeric NOT NULL,
  	"poligono" jsonb NOT NULL,
  	"render_id" integer,
  	"frase" varchar
  );
  
  CREATE TABLE "casas_momentos_fotos_obra" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"imagen_id" integer NOT NULL,
  	"lugar" varchar,
  	"fecha" varchar
  );
  
  CREATE TABLE "casas_materiales" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"nombre" varchar NOT NULL,
  	"frase" varchar NOT NULL,
  	"imagen_id" integer
  );
  
  CREATE TABLE "casas_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"pregunta" varchar NOT NULL,
  	"respuesta" varchar NOT NULL
  );
  
  CREATE TABLE "casas" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nombre" varchar NOT NULL,
  	"numero" varchar NOT NULL,
  	"slug" varchar,
  	"ubicacion" varchar,
  	"publicada" boolean DEFAULT false,
  	"specs_superficie" numeric NOT NULL,
  	"specs_pisos" numeric NOT NULL,
  	"specs_dormitorios" numeric NOT NULL,
  	"specs_banos" numeric NOT NULL,
  	"precio" numeric NOT NULL,
  	"precio_oferta" numeric,
  	"precio_ajustes" numeric DEFAULT 150000,
  	"coordenadas_lat" numeric DEFAULT -38.98,
  	"coordenadas_lng" numeric DEFAULT -72.65,
  	"momentos_llegada_imagen_id" integer,
  	"momentos_llegada_relato" varchar,
  	"momentos_plano_muros" jsonb,
  	"momentos_maqueta_glb_id" integer,
  	"paquete_zip_id" integer,
  	"paquete_laminas" numeric,
  	"paquete_incluye_dwg" boolean DEFAULT true,
  	"paquete_incluye_eett" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "ordenes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL,
  	"casa_id" integer NOT NULL,
  	"monto" numeric NOT NULL,
  	"con_ajustes" boolean DEFAULT false,
  	"descripcion_ajustes" varchar,
  	"estado" "enum_ordenes_estado" DEFAULT 'pendiente' NOT NULL,
  	"mp_preference_id" varchar,
  	"mp_payment_id" varchar,
  	"token_descarga" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"usuarios_id" integer,
  	"medios_id" integer,
  	"paquetes_id" integer,
  	"casas_id" integer,
  	"ordenes_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"usuarios_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "usuarios_sessions" ADD CONSTRAINT "usuarios_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "casas_momentos_visita" ADD CONSTRAINT "casas_momentos_visita_imagen_id_medios_id_fk" FOREIGN KEY ("imagen_id") REFERENCES "public"."medios"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "casas_momentos_visita" ADD CONSTRAINT "casas_momentos_visita_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."casas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "casas_momentos_plano_recintos" ADD CONSTRAINT "casas_momentos_plano_recintos_render_id_medios_id_fk" FOREIGN KEY ("render_id") REFERENCES "public"."medios"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "casas_momentos_plano_recintos" ADD CONSTRAINT "casas_momentos_plano_recintos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."casas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "casas_momentos_fotos_obra" ADD CONSTRAINT "casas_momentos_fotos_obra_imagen_id_medios_id_fk" FOREIGN KEY ("imagen_id") REFERENCES "public"."medios"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "casas_momentos_fotos_obra" ADD CONSTRAINT "casas_momentos_fotos_obra_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."casas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "casas_materiales" ADD CONSTRAINT "casas_materiales_imagen_id_medios_id_fk" FOREIGN KEY ("imagen_id") REFERENCES "public"."medios"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "casas_materiales" ADD CONSTRAINT "casas_materiales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."casas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "casas_faq" ADD CONSTRAINT "casas_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."casas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "casas" ADD CONSTRAINT "casas_momentos_llegada_imagen_id_medios_id_fk" FOREIGN KEY ("momentos_llegada_imagen_id") REFERENCES "public"."medios"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "casas" ADD CONSTRAINT "casas_momentos_maqueta_glb_id_medios_id_fk" FOREIGN KEY ("momentos_maqueta_glb_id") REFERENCES "public"."medios"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "casas" ADD CONSTRAINT "casas_paquete_zip_id_paquetes_id_fk" FOREIGN KEY ("paquete_zip_id") REFERENCES "public"."paquetes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ordenes" ADD CONSTRAINT "ordenes_casa_id_casas_id_fk" FOREIGN KEY ("casa_id") REFERENCES "public"."casas"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_usuarios_fk" FOREIGN KEY ("usuarios_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_medios_fk" FOREIGN KEY ("medios_id") REFERENCES "public"."medios"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_paquetes_fk" FOREIGN KEY ("paquetes_id") REFERENCES "public"."paquetes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_casas_fk" FOREIGN KEY ("casas_id") REFERENCES "public"."casas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ordenes_fk" FOREIGN KEY ("ordenes_id") REFERENCES "public"."ordenes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_usuarios_fk" FOREIGN KEY ("usuarios_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "usuarios_sessions_order_idx" ON "usuarios_sessions" USING btree ("_order");
  CREATE INDEX "usuarios_sessions_parent_id_idx" ON "usuarios_sessions" USING btree ("_parent_id");
  CREATE INDEX "usuarios_updated_at_idx" ON "usuarios" USING btree ("updated_at");
  CREATE INDEX "usuarios_created_at_idx" ON "usuarios" USING btree ("created_at");
  CREATE UNIQUE INDEX "usuarios_email_idx" ON "usuarios" USING btree ("email");
  CREATE INDEX "medios_updated_at_idx" ON "medios" USING btree ("updated_at");
  CREATE INDEX "medios_created_at_idx" ON "medios" USING btree ("created_at");
  CREATE UNIQUE INDEX "medios_filename_idx" ON "medios" USING btree ("filename");
  CREATE INDEX "medios_sizes_tarjeta_sizes_tarjeta_filename_idx" ON "medios" USING btree ("sizes_tarjeta_filename");
  CREATE INDEX "medios_sizes_pantalla_sizes_pantalla_filename_idx" ON "medios" USING btree ("sizes_pantalla_filename");
  CREATE INDEX "paquetes_updated_at_idx" ON "paquetes" USING btree ("updated_at");
  CREATE INDEX "paquetes_created_at_idx" ON "paquetes" USING btree ("created_at");
  CREATE UNIQUE INDEX "paquetes_filename_idx" ON "paquetes" USING btree ("filename");
  CREATE INDEX "casas_momentos_visita_order_idx" ON "casas_momentos_visita" USING btree ("_order");
  CREATE INDEX "casas_momentos_visita_parent_id_idx" ON "casas_momentos_visita" USING btree ("_parent_id");
  CREATE INDEX "casas_momentos_visita_imagen_idx" ON "casas_momentos_visita" USING btree ("imagen_id");
  CREATE INDEX "casas_momentos_plano_recintos_order_idx" ON "casas_momentos_plano_recintos" USING btree ("_order");
  CREATE INDEX "casas_momentos_plano_recintos_parent_id_idx" ON "casas_momentos_plano_recintos" USING btree ("_parent_id");
  CREATE INDEX "casas_momentos_plano_recintos_render_idx" ON "casas_momentos_plano_recintos" USING btree ("render_id");
  CREATE INDEX "casas_momentos_fotos_obra_order_idx" ON "casas_momentos_fotos_obra" USING btree ("_order");
  CREATE INDEX "casas_momentos_fotos_obra_parent_id_idx" ON "casas_momentos_fotos_obra" USING btree ("_parent_id");
  CREATE INDEX "casas_momentos_fotos_obra_imagen_idx" ON "casas_momentos_fotos_obra" USING btree ("imagen_id");
  CREATE INDEX "casas_materiales_order_idx" ON "casas_materiales" USING btree ("_order");
  CREATE INDEX "casas_materiales_parent_id_idx" ON "casas_materiales" USING btree ("_parent_id");
  CREATE INDEX "casas_materiales_imagen_idx" ON "casas_materiales" USING btree ("imagen_id");
  CREATE INDEX "casas_faq_order_idx" ON "casas_faq" USING btree ("_order");
  CREATE INDEX "casas_faq_parent_id_idx" ON "casas_faq" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "casas_numero_idx" ON "casas" USING btree ("numero");
  CREATE UNIQUE INDEX "casas_slug_idx" ON "casas" USING btree ("slug");
  CREATE INDEX "casas_momentos_llegada_momentos_llegada_imagen_idx" ON "casas" USING btree ("momentos_llegada_imagen_id");
  CREATE INDEX "casas_momentos_maqueta_momentos_maqueta_glb_idx" ON "casas" USING btree ("momentos_maqueta_glb_id");
  CREATE INDEX "casas_paquete_paquete_zip_idx" ON "casas" USING btree ("paquete_zip_id");
  CREATE INDEX "casas_updated_at_idx" ON "casas" USING btree ("updated_at");
  CREATE INDEX "casas_created_at_idx" ON "casas" USING btree ("created_at");
  CREATE INDEX "ordenes_casa_idx" ON "ordenes" USING btree ("casa_id");
  CREATE UNIQUE INDEX "ordenes_token_descarga_idx" ON "ordenes" USING btree ("token_descarga");
  CREATE INDEX "ordenes_updated_at_idx" ON "ordenes" USING btree ("updated_at");
  CREATE INDEX "ordenes_created_at_idx" ON "ordenes" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_usuarios_id_idx" ON "payload_locked_documents_rels" USING btree ("usuarios_id");
  CREATE INDEX "payload_locked_documents_rels_medios_id_idx" ON "payload_locked_documents_rels" USING btree ("medios_id");
  CREATE INDEX "payload_locked_documents_rels_paquetes_id_idx" ON "payload_locked_documents_rels" USING btree ("paquetes_id");
  CREATE INDEX "payload_locked_documents_rels_casas_id_idx" ON "payload_locked_documents_rels" USING btree ("casas_id");
  CREATE INDEX "payload_locked_documents_rels_ordenes_id_idx" ON "payload_locked_documents_rels" USING btree ("ordenes_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_usuarios_id_idx" ON "payload_preferences_rels" USING btree ("usuarios_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "usuarios_sessions" CASCADE;
  DROP TABLE "usuarios" CASCADE;
  DROP TABLE "medios" CASCADE;
  DROP TABLE "paquetes" CASCADE;
  DROP TABLE "casas_momentos_visita" CASCADE;
  DROP TABLE "casas_momentos_plano_recintos" CASCADE;
  DROP TABLE "casas_momentos_fotos_obra" CASCADE;
  DROP TABLE "casas_materiales" CASCADE;
  DROP TABLE "casas_faq" CASCADE;
  DROP TABLE "casas" CASCADE;
  DROP TABLE "ordenes" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_ordenes_estado";`)
}
