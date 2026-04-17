import API from "../api/api";

export const predictRisk = async (data) => {
  try {
    const response = await API.post("/ai/predict", data);
    return response.data;
  } catch (error) {
    console.error("Error:", error);
  }
};
