const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing Supabase credentials in .env.local');
    console.log('Please fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedAdmin() {
    console.log('Seeding admin user...');

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME || 'Admin';

    if (!adminEmail || !adminPassword) {
        console.error('Error: ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env.local');
        process.exit(1);
    }

    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const { data, error } = await supabase
        .from('users')
        .upsert({
            email: adminEmail,
            name: adminName,
            password_hash: passwordHash,
            role: 'admin'
        }, { onConflict: 'email' })
        .select();

    if (error) {
        console.error('Error seeding admin:', error.message);
        return false;
    }

    console.log('Admin user seeded successfully:', data[0].email);
    return true;
}

async function verifySections() {
    console.log('Verifying sections...');

    const { data, error } = await supabase
        .from('sections')
        .select('*')
        .order('department');

    if (error) {
        console.error('Error fetching sections:', error.message);
        return;
    }

    console.log(`Found ${data.length} sections:`);
    const grouped = {};
    data.forEach(s => {
        if (!grouped[s.department]) grouped[s.department] = [];
        grouped[s.department].push(s.section_name);
    });

    Object.entries(grouped).forEach(([dept, sections]) => {
        console.log(`  ${dept}: ${sections.join(', ')}`);
    });
}

async function main() {
    console.log('=== College Freshers Day Counter - Seed Script ===\n');

    const adminSeeded = await seedAdmin();
    if (!adminSeeded) {
        console.log('\nFailed to seed admin. Please check your Supabase credentials.');
        process.exit(1);
    }

    console.log('');
    await verifySections();

    console.log('\n=== Seed Complete ===');
    console.log('\nAdmin Credentials:');
    console.log(`  Email: ${adminEmail}`);
    console.log('  Password: (set via ADMIN_PASSWORD in .env.local)');
}

main().catch(console.error);
