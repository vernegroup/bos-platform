import fs from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const sql=postgres(process.env.DATABASE_URL,{max:1,prepare:false});
try{
 const dir=path.join(process.cwd(),"db","migrations");
 const files=(await fs.readdir(dir)).filter(f=>f.endsWith(".sql")).sort();
 await sql`CREATE TABLE IF NOT EXISTS bos_schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`;
 for(const file of files){
   const [done]=await sql`SELECT name FROM bos_schema_migrations WHERE name=${file}`;
   if(done) continue;
   const source=await fs.readFile(path.join(dir,file),"utf8");
   await sql.unsafe(source);
   await sql`INSERT INTO bos_schema_migrations(name) VALUES(${file})`;
   console.log("applied",file);
 }
} finally { await sql.end(); }
