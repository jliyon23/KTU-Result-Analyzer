require('dotenv').config();
const express = require('express');
const { engine } = require('express-handlebars');
const mongoose = require('mongoose');
const Result = require('./models/Result');
const { scrapeSemesterResults } = require('./utils/scraper');

const app = express();
const port = process.env.PORT || 3000;

// MongoDB connection with improved handling
const connectDB = async () => {
    try {
        const connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/ktu-results';
        await mongoose.connect(connectionString, {
            serverSelectionTimeoutMS: 5000
        });
        console.log('Connected to MongoDB');
        return true;
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        return false;
    }
};

// Connect to MongoDB
let dbConnected = false;
(async () => {
    dbConnected = await connectDB();
})();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Handlebars setup with helpers
app.engine('hbs', engine({
    extname: '.hbs',
    helpers: {
        eq: function (a, b) {
            return a === b;
        }
    }
}));
app.set('view engine', 'hbs');
app.set('views', './views');

// Health check route
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        dbConnected: dbConnected
    });
});

// Routes
app.get('/', (req, res) => {
    res.render('home');
});

// New route for checking cached results
app.post('/cached-results', async (req, res) => {
    if (!dbConnected) {
        return res.status(503).render('home', { 
            error: 'Database connection unavailable. Please try again later.' 
        });
    }

    const { username, semester } = req.body;
    const semesterKey = `S${semester}`;

    try {
        const result = await Result.findOne({ registerNumber: username }).lean();
        
        if (!result) {
            return res.render('home', { 
                error: 'No stored results found for this register number. Please try the regular search option.' 
            });
        }

        const currentSemesterResult = result.semesterResults.find(s => s.semester === semesterKey);
        
        if (!currentSemesterResult) {
            return res.render('home', { 
                error: `No stored results found for semester ${semesterKey}. Please try the regular search option.` 
            });
        }

        // Add last updated time to the template data
        const templateData = {
            result: {
                studentDetails: result.studentDetails,
                results: {
                    courses: currentSemesterResult.courses,
                    sgpa: currentSemesterResult.sgpa,
                    totalCredits: currentSemesterResult.totalCredits
                }
            },
            lastUpdated: new Date(currentSemesterResult.lastUpdated).toLocaleString(),
            isCached: true
        };

        res.render('results', templateData);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('home', { error: 'Failed to fetch stored results. Please try again.' });
    }
});

app.post('/results', async (req, res) => {
    if (!dbConnected) {
        return res.status(503).render('home', { 
            error: 'Database connection unavailable. Please try again later.' 
        });
    }

    const { username, password, semester } = req.body;
    if (!username || !password || !semester) {
        return res.status(400).render('home', { 
            error: 'All fields (username, password, and semester) are required.' 
        });
    }

    const semesterKey = `S${semester}`;
    
    try {
        // Find or create student record
        let result = await Result.findOne({ registerNumber: username }).lean();
        
        // Check if we need to fetch new results
        let needToFetch = true;
        if (result) {
            const existingSemester = result.semesterResults.find(s => s.semester === semesterKey);
            if (existingSemester) {
                // If results exist and are less than 24 hours old, use cached results
                const lastUpdate = new Date(existingSemester.lastUpdated);
                const hoursSinceUpdate = (Date.now() - lastUpdate) / (1000 * 60 * 60);
                if (hoursSinceUpdate < 24) {
                    needToFetch = false;
                }
            }
        }

        if (needToFetch) {
            try {
                // Fetch new results
                const scrapedData = await scrapeSemesterResults(username, password, semester);
                
                // Check if the results are "not published" (returned as an object, not thrown)
                if (scrapedData.type === 'RESULTS_NOT_PUBLISHED') {
                    return res.render('not-published', { 
                        message: scrapedData.message,
                        studentDetails: scrapedData.studentDetails,
                        semester: semesterKey
                    });
                }
                
                const semesterResult = {
                    semester: semesterKey,
                    courses: scrapedData.results.courses,
                    sgpa: scrapedData.results.sgpa,
                    totalCredits: scrapedData.results.totalCredits,
                    lastUpdated: new Date()
                };

                if (!result) {
                    // Create new student record
                    const newResult = new Result({
                        registerNumber: username,
                        studentDetails: {
                            Name: scrapedData.studentDetails.Name,
                            'Name Of College': scrapedData.studentDetails['Name Of College'],
                            Branch: scrapedData.studentDetails.Branch
                        },
                        semesterResults: [semesterResult]
                    });
                    await newResult.save();
                    result = newResult.toObject();
                } else {
                    // Update existing student record
                    const index = result.semesterResults.findIndex(s => s.semester === semesterKey);
                    if (index !== -1) {
                        result.semesterResults[index] = semesterResult;
                    } else {
                        result.semesterResults.push(semesterResult);
                    }
                    await Result.findOneAndUpdate(
                        { registerNumber: username },
                        { 
                            $set: {
                                studentDetails: {
                                    Name: scrapedData.studentDetails.Name,
                                    'Name Of College': scrapedData.studentDetails['Name Of College'],
                                    Branch: scrapedData.studentDetails.Branch
                                },
                                semesterResults: result.semesterResults
                            }
                        },
                        { new: true }
                    );
                }
            } catch (error) {
                console.error('Scraper error:', error);
                
                // Handle the special case when results are not published
                if (error.type === 'RESULTS_NOT_PUBLISHED') {
                    // Render not published template
                    return res.render('not-published', { 
                        message: error.message,
                        studentDetails: error.studentDetails,
                        semester: semesterKey
                    });
                }
                
                // For other errors, check if we have cached results
                if (result) {
                    const cachedSemester = result.semesterResults.find(s => s.semester === semesterKey);
                    if (cachedSemester) {
                        needToFetch = false;
                    } else {
                        return res.status(500).render('home', { 
                            error: 'Failed to fetch new results. Please try again later.' 
                        });
                    }
                } else {
                    return res.status(500).render('home', { 
                        error: 'Failed to fetch results: ' + (error.message || 'Unknown error') 
                    });
                }
            }
        }

        // Find the current semester results
        const currentSemesterResult = result.semesterResults.find(s => s.semester === semesterKey);
        
        // Prepare data for template
        const templateData = {
            result: {
                studentDetails: result.studentDetails,
                results: {
                    courses: currentSemesterResult.courses,
                    sgpa: currentSemesterResult.sgpa,
                    totalCredits: currentSemesterResult.totalCredits
                }
            },
            lastUpdated: new Date(currentSemesterResult.lastUpdated).toLocaleString()
        };

        res.render('results', templateData);
    } catch (error) {
        console.error('Application error:', error);
        res.status(500).render('home', { error: 'Server error. Please try again later.' });
    }
});

// Add error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).render('home', { error: 'Internal server error. Please try again later.' });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}); 