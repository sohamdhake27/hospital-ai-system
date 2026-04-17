const Bed = require("../models/Bed");

const seedBeds = async () => {
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

  await Promise.all(
    beds.map((bed) =>
      Bed.updateOne(
        { bedNumber: bed.bedNumber },
        { $setOnInsert: bed },
        { upsert: true }
      )
    )
  );

  const totalBeds = await Bed.countDocuments();
  console.log(`Bed seed complete. ${totalBeds} beds available.`);
};

module.exports = seedBeds;
