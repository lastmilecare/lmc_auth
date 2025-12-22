const thresholds = {
    "Temperature": {
        high: 100.1,
        max: 99.0,
        normalMin: 97.0,
        min: 95.1,
        low: 95.0,
        unit: "°F",
        remarks: {
            high: "Consultation Recommended",
            max: "Consultation Recommended",
            normal: "Pass",
            min: "Consultation Recommended",
            low: "Consultation Recommended"
        }
    },
    "SPO2": {
        normalMin: 95,
        low: 94,
        unit: "%",
        remarks: {
            normal: "Pass",
            low: "Consultation Recommended"
        }
    },
    "Random Blood Sugar": {
        high: 141,
        max: 140,
        normalMin: 110,
        min: 71,
        low: 70,
        unit: "mg/dl",
        remarks: {
            high: "Consultation Recommended",
            max: "Counselling for Lifestyle Changes/Consultation Recommended",
            normal: "Pass",
            low: "Consultation Recommended"
        }
    },
    "Pulse": {
        high: 120,
        max: 100,
        normalMin: 60,
        min: 50,
        low: 49,
        unit: "bpm",
        remarks: {
            high: "Consultation Recommended",
            max: "Take rest & Recheck/ Consultation",
            normal: "Pass",
            min: "Take rest & Recheck/ Consultation",
            low: "Consultation Recommended"
        }
    },
    "PFT": {
        normalMin: 400,
        low: 249,
        unit: "L/min",
        remarks: {
            max: "Pass",
            normal: "Pass",
            low: "Consultation Recommended"
        }
    },
    "Haemoglobin Test": {
        normalMin: 13,
        low: 8,
        unit: "g/dl",
        remarks: {
            high: "Pass",
            normal: "Pass",
            low: "Counselling for Lifestyle Changes/Consultation Recommended"
        }
    },
    "BMI": {
        high: 30,
        max: 25,
        min: 18.5,
        low: 15.9,
        unit: "kg/m²",
        remarks: {
            high: "Counselling for Lifestyle Changes/Consultation Recommended",
            max: "Pass",
            normal: "Pass",
            low: "Consultation Recommended"
        }
    },
    "BP Systolic": {
        high: 139,
        max: 120,
        normalMin: 100,
        low: 90,
        unit: "mm Hg",
        remarks: {
            high: "Take rest & Recheck/ Consultation",
            max: "Pass",
            normal: "Pass",
            low: "Consultation Recommended"
        }
    },
    "BP Diastolic": {
        high: 90,
        max: 80,
        normalMin: 70,
        low: 60,
        unit: "mm Hg",
        remarks: {
            high: "Take rest & Recheck/ Consultation",
            max: "Pass",
            normal: "Pass",
            low: "Consultation Recommended"
        }
    },
    "Vision": {
        normalMin: "6/6",
        low: "6/9",
        unit: null,
        remarks: {
            normal: "Pass",
            low: "Mandatory Corrective Lens Recommended"
        }
    },
    "AR Report (AV Right Eye - Spherical)": {
        high: 0.51,
        max: 0.5,
        normalMin: -0.5,
        low: -0.51,
        unit: "D",
        remarks: {
            high: "Mandatory Corrective Lens Recommended",
            max: "Pass",
            normal: "Pass",
            low: "Trail Lens Test Recommended"
        }
    },
    "AR Report (AV Right Eye - Cylindrical)": {
        high: 0.26,
        max: 0.25,
        normalMin: -0.25,
        low: -0.26,
        unit: "D",
        remarks: {
            high: "Mandatory Corrective Lens Recommended",
            max: "Pass",
            normal: "Pass",
            low: "Trail Lens Test Recommended"
        }
    },
    "AR Report (AV Left Eye - Spherical)": {
        high: 0.51,
        max: 0.5,
        normalMin: -0.5,
        low: -0.51,
        unit: "D",
        remarks: {
            high: "Mandatory Corrective Lens Recommended",
            max: "Pass",
            normal: "Pass",
            low: "Trail Lens Test Recommended"
        }
    },
    "AR Report (AV Left Eye - Cylindrical)": {
        high: 0.26,
        max: 0.25,
        normalMin: -0.25,
        low: -0.26,
        unit: "D",
        remarks: {
            high: "Mandatory Corrective Lens Recommended",
            max: "Pass",
            normal: "Pass",
            low: "Trail Lens Test Recommended"
        }
    },
    "Colour Blindness": {
        remarks: {
            normal: "Pass",
            low: "Traffic Light Knowledge Required"
        }
    },
    "HIV": {
        remarks: {
            normal: "Pass",
            low: "Consultation Recommended"
        }
    },
    "ECG": {
        remarks: {
            normal: "Pass",
            low: "Consultation Recommended"
        }
    },
    "Romberg Test": {
        remarks: {
            normal: "Pass",
            low: "Moderate Hearing Issues"
        }
    },
    "Basic Hearing": {
        remarks: {
            normal: "Pass",
            low: "NA"
        }
    }
};

module.exports = thresholds;
