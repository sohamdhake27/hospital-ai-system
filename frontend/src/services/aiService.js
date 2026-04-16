export const predictRisk = async (data) => {
  try {
    const response = await fetch("http://localhost:5000/api/ai/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    return await response.json();
  } catch (error) {
    console.error("Error:", error);
  }
};