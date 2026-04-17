export const predictRisk = async (data) => {
  try {
    const response = await fetch("https://hospital-ai-system-3uda.onrender.com/api/ai/predict",
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