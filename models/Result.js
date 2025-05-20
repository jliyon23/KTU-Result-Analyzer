const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    courseName: String,
    code: String,
    grade: String,
    credits: String,
    examMonth: String
});

const semesterResultSchema = new mongoose.Schema({
    semester: String,
    courses: [courseSchema],
    sgpa: String,
    totalCredits: String,
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

const resultSchema = new mongoose.Schema({
    registerNumber: {
        type: String,
        required: true,
        unique: true
    },
    studentDetails: {
        Name: String,
        'Name Of College': String,
        Branch: String
    },
    semesterResults: [semesterResultSchema]
});

module.exports = mongoose.model('Result', resultSchema); 