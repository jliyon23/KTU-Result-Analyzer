# KTU Result Analyzer

A web application for KTU students to check and analyze their semester results.

## Deploying to Render

This application is configured for deployment on Render.com.

### Setup Instructions

1. **Create a Render account** at [render.com](https://render.com) if you don't have one.

2. **Connect your Git repository** to Render.

3. **Create a new Web Service**:
   - Select your repository
   - Render will automatically detect the configuration from the `render.yaml` file
   - Set up environment variables:
     - `MONGODB_URI`: Your MongoDB connection string
     - `NODE_ENV`: Set to "production"

4. **Deploy the application**:
   - Render will automatically build and deploy your application

### Keeping the App Active

To prevent Render's free tier from spinning down your application:

1. **Use the built-in ping service**:
   ```
   npm run ping
   ```
   
   This will ping your application every 14 minutes to keep it alive.

2. **For a more reliable solution, consider**:
   - Setting up a cron job on a separate server to ping your application
   - Using a service like [UptimeRobot](https://uptimerobot.com/) to ping your application
   - Upgrading to a paid Render plan

## Local Development

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

3. Open http://localhost:8080 in your browser.

## Technology Stack

- Node.js
- Express
- MongoDB
- Puppeteer
- Handlebars