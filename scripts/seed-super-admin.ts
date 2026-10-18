/**
 * First Super-Admin Provisioning CLI Script
 *
 * Usage:
 *   SUPER_ADMIN_PHONE="01982705646" SUPER_ADMIN_PASSWORD="YourStrongPassword123" SUPER_ADMIN_NAME="প্রধান অ্যাডমিন" npx tsx scripts/seed-super-admin.ts
 */

import { connectToDatabase } from "../src/lib/mongodb";
import { normalizePhoneNumber, isValidBangladeshiPhone } from "../src/lib/db-utils";
import { User } from "../src/models/User";

async function seedSuperAdmin() {
  console.log("\n🔐 Initializing Secure Super-Admin Account Provisioning...\n");

  await connectToDatabase();

  const rawPhone = process.env.SUPER_ADMIN_PHONE || "01866098078";
  const password = process.env.SUPER_ADMIN_PASSWORD || "AdminPass@2026";
  const fullName = process.env.SUPER_ADMIN_NAME || "প্রধান প্রশাসক (Super Admin)";

  const normalizedPhone = normalizePhoneNumber(rawPhone);

  if (!isValidBangladeshiPhone(normalizedPhone)) {
    console.error(`❌ Invalid Bangladeshi phone number: ${rawPhone}`);
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("❌ Password must be at least 8 characters long for Super-Admin.");
    process.exit(1);
  }

  // Check if account already exists
  let user = await User.findOne({ phone: normalizedPhone });

  if (user) {
    console.log(`⚠️ User with phone ${normalizedPhone} already exists.`);
    user.role = "super_admin";
    user.isActive = true;
    user.fullName = fullName;
    user.password = password; // pre-save hook will hash
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();
    console.log(`✅ Existing user successfully promoted to 'super_admin'.`);
  } else {
    user = await User.create({
      phone: normalizedPhone,
      fullName,
      password,
      role: "super_admin",
      isActive: true,
    });
    console.log(`✅ New Super-Admin account created successfully!`);
  }

  console.log(`
-----------------------------------------------------------
👤 Super-Admin Details:
• নাম (Name): ${user.fullName}
• ফোন নম্বর (Phone): ${user.phone}
• রোল (Role): ${user.role}
• অ্যাকাউন্ট আইডি (ID): ${user._id}
-----------------------------------------------------------
`);

  process.exit(0);
}

seedSuperAdmin().catch((err) => {
  console.error("❌ Failed to provision Super-Admin account:", err);
  process.exit(1);
});
