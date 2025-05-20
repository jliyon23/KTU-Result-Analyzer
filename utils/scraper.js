const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium-min');

// Helper function to add random delays that look like human behavior
async function randomDelay(min = 1000, max = 3000) {
    const delay = Math.floor(Math.random() * (max - min)) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
    return delay;
}

async function login(page, user) {
    await page.goto("https://app.ktu.edu.in/login.jsp");
    await page.waitForSelector("#login-username");
    await page.type("#login-username", user.username);
    await page.waitForSelector("#login-password");
    await page.type("#login-password", user.password);
    await page.click("#btn-login");
}

async function scrapeSemesterResults(username, password, semester) {
    const user = {
        username: username,
        password: password
    };

    // Set up chromium options for serverless
    await chromium.font();
    let browser;
    
    try {
        // Launch browser with optimized serverless configuration
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: true,
            ignoreHTTPSErrors: true
        });

        const page = await browser.newPage();
        
        // Set minimal required headers
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36');
        await page.setDefaultNavigationTimeout(20000);
        
        // Login
        await login(page, user);
        
        // Wait briefly for navigation after login
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Navigate to semester grade card page (simplified approach)
        await page.goto('https://app.ktu.edu.in/eu/res/semesterGradeCardListing.htm', {
            waitUntil: 'networkidle0',
            timeout: 20000
        });
        
        // Select semester and get results
        await page.select('#semesterGradeCardListingSearchForm_semesterId', semester);
        await page.click('#semesterGradeCardListingSearchForm_search');
        
        try {
            // Wait for results table
            await page.waitForSelector('.table.table-bordered', { timeout: 20000 });
            
            // Extract all data in a single evaluation to reduce context switching
            const data = await page.evaluate(() => {
                // Get student details
                const details = {};
                document.querySelectorAll('.list-group-item').forEach(item => {
                    const badge = item.querySelector('.badge');
                    if (badge) {
                        const label = badge.textContent.trim();
                        const value = item.textContent.replace(label, '').trim();
                        details[label] = value;
                    }
                });
                
                // Get results table data
                const table = document.querySelector('.table.table-bordered');
                const rows = table.querySelectorAll('tbody tr');
                const courses = [];
                
                let sgpa = '', totalCredits = '';
                
                rows.forEach(row => {
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 5) {
                        courses.push({
                            courseName: cells[0].textContent.trim(),
                            code: cells[1].textContent.trim(),
                            grade: cells[2].textContent.trim(),
                            credits: cells[3].textContent.trim(),
                            examMonth: cells[4].textContent.trim()
                        });
                    } else if (row.textContent.includes('SGPA')) {
                        sgpa = row.querySelector('td:last-child').textContent.trim();
                    } else if (row.textContent.includes('Total Earned Credits')) {
                        totalCredits = row.querySelector('td:last-child').textContent.trim();
                    }
                });
                
                return {
                    studentDetails: details,
                    results: {
                        courses,
                        sgpa,
                        totalCredits
                    }
                };
            });
            
            return data;
            
        } catch (error) {
            // If error occurred while getting results, handle differently for different semesters
            if (['6', '7', '8'].includes(semester)) {
                // For S6-S8, assume results not published
                return {
                    type: 'RESULTS_NOT_PUBLISHED',
                    message: 'Semester grade cards not available for this student.',
                    studentDetails: { 'Register Number': username }
                };
            } else {
                // For published semesters (S1-S5), check if it's a login issue
                const url = await page.url();
                if (url.includes('login.jsp')) {
                    throw new Error('Login failed: Invalid credentials or session expired');
                } else {
                    throw new Error('Failed to load results. The server might be experiencing issues.');
                }
            }
        }
        
    } catch (error) {
        console.error('Error:', error);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Export the function
module.exports = { scrapeSemesterResults };

// Comment out the example usage since we'll be using it through the web app
/*
async function main() {
    console.time('Scraping Duration');
    try {
        const results = await scrapeSemesterResults('SNG22CS077', 'jliyon@2305', '5');
        console.log('Student Details:', results.studentDetails);
        console.log('Course Results:', results.results.courses);
        console.log('SGPA:', results.results.sgpa);
        console.log('Total Credits:', results.results.totalCredits);
    } catch (error) {
        console.error('Failed to scrape results:', error);
    }
    console.timeEnd('Scraping Duration');
}

main();
*/ 