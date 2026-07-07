#!/usr/bin/env node
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

config({ path: join(root, '.env.local') });

// Build first if needed
const { NestFactory } = await import('@nestjs/core');
const { DocumentBuilder, SwaggerModule } = await import('@nestjs/swagger');
const { AppModule } = await import(join(root, 'dist/app.module.js'));

const app = await NestFactory.create(AppModule, { logger: false });

const config2 = new DocumentBuilder()
  .setTitle('Mobile Legends API')
  .setDescription('Champion, item, and scrape history data for Mobile Legends Bang Bang')
  .setVersion('1.0')
  .addApiKey({ type: 'apiKey', name: 'x-rapidapi-proxy-secret', in: 'header' }, 'x-rapidapi-proxy-secret')
  .addApiKey({ type: 'apiKey', name: 'x-api', in: 'header' }, 'x-api')
  .build();

const document = SwaggerModule.createDocument(app, config2);

const outPath = join(root, 'openapi.json');
writeFileSync(outPath, JSON.stringify(document, null, 2));
console.log(`Wrote ${outPath}`);

await app.close();
process.exit(0);
