const bcrypt = require("bcryptjs");
const User = require("../models/user");

const DEMO_USERS = [
  {
    name: process.env.SEED_USER_NAME || "Local Demo User",
    email: process.env.SEED_USER_EMAIL || "test123@gmail.com",
    password: process.env.SEED_USER_PASSWORD || "123456",
    role: process.env.SEED_USER_ROLE || "admin"
  },
  {
    name: "Admin",
    email: "admin@test.com",
    password: "123456",
    role: "admin"
  },
  {
    name: "Doctor",
    email: "doctor@test.com",
    password: "123456",
    role: "doctor"
  },
  {
    name: "Reception",
    email: "rec@test.com",
    password: "123456",
    role: "reception"
  },
  {
    name: "Pharmacy",
    email: "pharmacy@test.com",
    password: "123456",
    role: "pharmacy"
  }
];

const DEFAULT_USER = DEMO_USERS[0];

const isDefaultLogin = (email, password) =>
  DEMO_USERS.some((user) => user.email === email && user.password === password);

async function upsertDemoUser(userConfig) {
  const hashedPassword = await bcrypt.hash(userConfig.password, 10);
  const existingUser = await User.findOne({ email: userConfig.email });

  if (existingUser) {
    existingUser.name = userConfig.name;
    existingUser.password = hashedPassword;
    existingUser.role = userConfig.role;
    await existingUser.save();
    return existingUser;
  }

  return User.create({
    name: userConfig.name,
    email: userConfig.email,
    password: hashedPassword,
    role: userConfig.role
  });
}

async function seedDefaultUser() {
  for (const userConfig of DEMO_USERS) {
    await upsertDemoUser(userConfig);
  }

  console.log(`Demo users synced: ${DEMO_USERS.map((user) => user.email).join(", ")}`);
  return DEMO_USERS;
}

module.exports = {
  seedDefaultUser,
  DEFAULT_USER,
  isDefaultLogin,
  DEMO_USERS
};
