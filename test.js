const puppeteer = require('puppeteer');

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

    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ],
        ignoreHTTPSErrors: true,
        timeout: 30000
    });

    try {
        const page = await browser.newPage();
        
        // Set minimal required headers
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36');
        await page.setDefaultNavigationTimeout(30000);
        
        // Login
        await login(page, user);
        
        // Wait for navigation after login
        await Promise.race([
            page.waitForSelector("div.panel-heading", { timeout: 20000 }),
            page.waitForSelector(".alert-danger", { timeout: 20000 })
        ]);
        
        // Navigate to semester grade card page
        await page.goto('https://app.ktu.edu.in/eu/res/semesterGradeCardListing.htm', {
            waitUntil: 'networkidle0',
            timeout: 20000
        });
        
        // Select semester and get results
        await page.select('#semesterGradeCardListingSearchForm_semesterId', semester);
        await page.click('#semesterGradeCardListingSearchForm_search');
        await page.waitForSelector('.table.table-bordered', { timeout: 20000 });
        
        // Extract all data in a single evaluation to reduce context switching
        const data = await page.evaluate(() => {
            // Get student details
            const details = {};
            document.querySelectorAll('.list-group-item').forEach(item => {
                const label = item.querySelector('.badge').textContent.trim();
                const value = item.textContent.replace(label, '').trim();
                details[label] = value;
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
        console.error('Error:', error);
        throw error;
    } finally {
        await browser.close();
    }
}

// Example usage
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