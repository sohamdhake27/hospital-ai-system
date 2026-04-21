const axios = require("axios");

exports.getPrediction = async (req, res) => {
  try {
    const { age, disease } = req.body;

    const response = await axios.post(
      `${process.env.AI_URL}/predict`,
      { age, disease }
    );

    res.json(response.data);
  } catch (err) {
    console.log("AI ERROR:", err.message);
    res.status(500).json({ error: "AI failed" });
  }
};
