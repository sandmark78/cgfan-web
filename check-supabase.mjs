import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Read all 2026/09/17 markdown files
const dir = 'content/prompts/2026/09/17';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));

const slugs = [];
for (const file of files) {
  const content = fs.readFileSync(path.join(dir, file), 'utf-8');
  const match = content.match(/^slug:\s*["']?([^"'\n]+)["']?/m);
  if (match) slugs.push(match[1].trim());
}

console.log(`Found ${slugs.length} slugs in markdown files`);

// Check which exist in Supabase
const { data, error } = await supabase
  .from('prompts')
  .select('slug')
  .in('slug', slugs);

if (error) {
  console.error('Error:', error);
} else {
  const found = new Set(data.map(d => d.slug));
  console.log(`Found ${found.size} in Supabase`);
  
  const missing = slugs.filter(s => !found.has(s));
  console.log(`Missing ${missing.length} slugs:`);
  missing.forEach(s => console.log(`  - ${s}`));
}
