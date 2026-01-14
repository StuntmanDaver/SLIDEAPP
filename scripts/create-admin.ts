import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ssvgfaosfaxdvdxsdwdj.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzdmdmYW9zZmF4ZHZkeHNkd2RqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODM1MjE3NiwiZXhwIjoyMDgzOTI4MTc2fQ.XKEeJP2DVXoxR_nWdKOUmanu06v-81PrUkxCGfNEIlA";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const email = "Ketchel.david@gmail.com";
const password = "password123"; 

async function createAdmin() {
  console.log(`Creating admin user: ${email}...`);

  // 1. Create or Get User
  // We try to sign up. If user exists, we'll try to update their password.
  const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  let userId = signUpData.user?.id;

  if (signUpError) {
    console.log("User might already exist (or error occurred). Checking list...");
    // If user exists, listing them to find ID
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error("Error listing users:", listError);
      return;
    }
    
    const existingUser = users.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      userId = existingUser.id;
      console.log(`Found existing user ID: ${userId}`);
      
      // Update password just in case
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, { password });
      if (updateError) {
        console.error("Failed to update password:", updateError);
      } else {
        console.log("Updated existing user password to 'password123'");
      }
    } else {
      console.error("Could not create or find user. Error details:", signUpError);
      return;
    }
  } else {
    console.log(`User created with ID: ${userId}`);
  }

  if (!userId) return;

  // 2. Add to staff_users table
  console.log("Adding to staff_users table with role 'admin'...");
  
  const { error: staffError } = await supabase
    .from("staff_users")
    .upsert({ 
      user_id: userId, 
      role: "admin", 
      is_active: true 
    });

  if (staffError) {
    console.error("Error adding to staff_users:", staffError);
  } else {
    console.log("✅ Success! You can now log in.");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
  }
}

createAdmin();
