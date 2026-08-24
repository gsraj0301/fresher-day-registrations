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

const LEADERSHIP_ACCOUNTS = [
    { email: 'principal@act.edu.in', name: 'Principal', role: 'principal' },
    { email: 'shhod@act.edu.in', name: 'S&H HOD', role: 'hod' },
    { email: 'deanadmin@act.edu.in', name: 'Dean Admissions', role: 'dean_admission' },
    { email: 'deanacademics@act.edu.in', name: 'Dean Academics', role: 'dean_academics' }
];

async function main() {
    console.log('=== Leadership Accounts Seed ===\n');

    const password = process.env.FACULTY_DEFAULT_PASSWORD || 'freshers@3128';
    const passwordHash = await bcrypt.hash(password, 10);

    for (const account of LEADERSHIP_ACCOUNTS) {
        const { data, error } = await supabase
            .from('users')
            .upsert({
                email: account.email,
                name: account.name,
                password_hash: passwordHash,
                role: account.role
            }, { onConflict: 'email' })
            .select('id, email, name, role')
            .single();

        if (error) {
            console.error(`Failed to seed ${account.email}:`, error.message);
            process.exit(1);
        }
        console.log(`Seeded: ${data.role.padEnd(16)} ${data.email}`);
    }

    console.log(`\nPassword for all accounts: ${password}`);
    console.log('\nRun supabase/migration_leadership_roles.sql first if not already applied.');
    console.log('=== Seed Complete ===');
}

main().catch(console.error);
