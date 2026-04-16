const Bed = require("../models/Bed");

const seedBeds = async () => {
  const existingBeds = await Bed.countDocuments();

  if (existingBeds > 0) {
    console.log("Beds already seeded");
    return;
  }

  const beds = [];

  for (let i = 1; i <= 50; i++) {
    beds.push({
      bedNumber: `G${i}`,
      department: "General",
      isOccupied: false,
      patient: null
    });
  }

  for (let i = 1; i <= 20; i++) {
    beds.push({
      bedNumber: `ICU${i}`,
      department: "ICU",
      isOccupied: false,
      patient: null
    });
  }

  for (let i = 1; i <= 15; i++) {
    beds.push({
      bedNumber: `E${i}`,
      department: "Emergency",
      isOccupied: false,
      patient: null
    });
  }

  await Bed.insertMany(beds);
  console.log("85 beds created successfully");
};

module.exports = seedBeds;
