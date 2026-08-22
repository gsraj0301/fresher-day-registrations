const DEPARTMENTS = [
    "Computer Science & Engineering",
    "Information Technology",
    "Electronics & Communication Engineering",
    "Electrical & Electronics Engineering",
    "Mechanical Engineering",
    "Mechatronics Engineering",
    "Civil Engineering",
    "Biomedical Engineering",
    "Chemical Engineering",
    "Artificial Intelligence and Data Science"
];

const DEPT_SHORT = {
    "Computer Science & Engineering": "CSE",
    "Information Technology": "IT",
    "Electronics & Communication Engineering": "ECE",
    "Electrical & Electronics Engineering": "EEE",
    "Mechanical Engineering": "MECH",
    "Mechatronics Engineering": "MHT",
    "Civil Engineering": "CIVIL",
    "Biomedical Engineering": "BME",
    "Chemical Engineering": "CME",
    "Artificial Intelligence and Data Science": "AI&DS"
};

const DEPT_SECTIONS = {
    "Computer Science & Engineering": ["A", "B", "C"],
    "Information Technology": ["A", "B"],
    "Electronics & Communication Engineering": ["A"],
    "Electrical & Electronics Engineering": ["A"],
    "Mechanical Engineering": ["A"],
    "Mechatronics Engineering": ["A"],
    "Civil Engineering": ["A"],
    "Biomedical Engineering": ["A"],
    "Chemical Engineering": ["A"],
    "Artificial Intelligence and Data Science": ["A", "B"]
};

function shortDept(full) {
    return DEPT_SHORT[full] || full;
}

function getSections(dept) {
    return DEPT_SECTIONS[dept] || ["A"];
}

module.exports = { DEPARTMENTS, DEPT_SHORT, DEPT_SECTIONS, shortDept, getSections };
