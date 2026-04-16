exports.calculateRiskScore = (patient) => {
    let score = 0;

    // Oxygen Level Risk
    if (patient.oxygenLevel && patient.oxygenLevel < 92) {
        score += 30;
    }

    // Heart Rate Risk
    if (patient.heartRate && patient.heartRate > 120) {
        score += 20;
    }

    // Diabetes Risk
    if (patient.diabetes) {
        score += 10;
    }

    // Emergency Priority
    if (patient.priority === "emergency") {
        score += 25;
    }

    let level = "Low";

    if (score >= 60) level = "High";
    else if (score >= 30) level = "Medium";

    return {
        score,
        level
    };
};
exports.calculateHospitalPressure = (stats) => {
    let score = 0;

    // Bed Occupancy Pressure
    const occupancyRate = (stats.beds.occupied / stats.beds.total) * 100;

    if (occupancyRate > 90) score += 40;
    else if (occupancyRate > 75) score += 25;

    // Waiting Patients Pressure
    if (stats.patients.waiting > 5) score += 30;
    else if (stats.patients.waiting > 2) score += 15;

    // Emergency Patients Pressure
    if (stats.emergencyCount > 3) score += 30;

    let level = "Low";

    if (score >= 60) level = "High";
    else if (score >= 30) level = "Medium";

    let recommendation = "System stable";

    if (level === "High")
        recommendation = "Increase emergency capacity immediately";
    else if (level === "Medium")
        recommendation = "Monitor patient inflow closely";

    return {
        pressureScore: score,
        pressureLevel: level,
        recommendation
    };
};