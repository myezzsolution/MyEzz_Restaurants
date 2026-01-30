/**
 * Reseed Script: Clear and re-insert restaurant credentials
 * Run once: node reseedCredentials.js
 * Then DELETE this file and restaurant_credentials.json
 */

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

const SALT_ROUNDS = 10;

async function reseedCredentials() {
    console.log('🔐 Starting credential reseed...\n');

    // Step 1: Clear existing records
    console.log('🗑️  Clearing existing restaurant_auth records...');
    const { error: deleteError } = await supabase
        .from('restaurant_auth')
        .delete()
        .gte('id', 0); // Delete all records

    if (deleteError) {
        console.error('❌ Failed to clear table:', deleteError.message);
        return;
    }
    console.log('✅ Cleared existing records\n');

    // Step 2: Read and insert new credentials
    const credentialsPath = path.resolve(__dirname, '..', 'restaurant_credentials.json');
    const rawData = fs.readFileSync(credentialsPath, 'utf-8');
    const { restaurant_credentials } = JSON.parse(rawData);

    console.log(`📋 Found ${restaurant_credentials.length} restaurants to seed\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const cred of restaurant_credentials) {
        try {
            // Hash the password
            const passwordHash = await bcrypt.hash(cred.password, SALT_ROUNDS);

            // Insert into Supabase
            const { error } = await supabase
                .from('restaurant_auth')
                .insert({
                    restaurant_id: cred.id,
                    username: cred.username.toLowerCase().trim(),
                    password_hash: passwordHash
                });

            if (error) {
                console.error(`❌ Failed: ${cred.name} - ${error.message}`);
                errorCount++;
            } else {
                console.log(`✅ Seeded: ${cred.name} (${cred.username})`);
                successCount++;
            }
        } catch (err) {
            console.error(`❌ Error: ${cred.name} - ${err.message}`);
            errorCount++;
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log('='.repeat(50));

    if (successCount === restaurant_credentials.length) {
        console.log('\n🎉 All credentials reseeded successfully!');
        console.log('⚠️  Now DELETE restaurant_credentials.json!');
    }
}

reseedCredentials().catch(console.error);
