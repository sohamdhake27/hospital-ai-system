const mongoose = require("mongoose");
const Bed = require("./models/Bed");

mongoose.connect("mongodb://127.0.0.1:27017/hospitalDB")
  .then(() => console.log("DB Connected"))
  .catch(err => console.log(err));

const createBeds = async () => {
  await Bed.deleteMany(); // optional reset

  let beds = [];

  // General - 50 beds
  for (let i = 1; i <= 50; i++) {
    beds.push({
      bedNumber: "G" + i,
      department: "General",
      isOccupied: false
    });
  }

  // ICU - 20 beds
  for (let i = 1; i <= 20; i++) {
    beds.push({
      bedNumber: "ICU" + i,
      department: "ICU",
      isOccupied: false
    });
  }

  // Emergency - 15 beds
  for (let i = 1; i <= 15; i++) {
    beds.push({
      bedNumber: "E" + i,
      department: "Emergency",
      isOccupied: false
    });
  }

  await Bed.insertMany(beds);
  console.log("Beds created");

  mongoose.disconnect();
};

createBeds();
