# KTU Result Analyzer

A web application for viewing and analyzing Kerala Technical University (KTU) semester results with advanced features like result caching, academic progress tracking, and AI-powered insights.

## Features

- 🔍 View semester-wise results
- 💾 Automatic result caching (24-hour validity)
- 📊 Visual representation of academic performance
- 🤖 AI-powered insights using Google's Generative AI
- 📱 Responsive design for all devices
- 🔒 Secure result storage
- 📈 Academic progress tracking

## Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: Handlebars, TailwindCSS
- **Database**: MongoDB
- **AI Integration**: Google Generative AI
- **Web Scraping**: Puppeteer
- **Data Visualization**: Chart.js
- **Deployment**: Docker support

## Prerequisites

- Node.js >= 18.0.0
- MongoDB
- Google AI API Key (for AI features)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/KTU-Result-Analyzer.git
cd KTU-Result-Analyzer
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
PORT=8080
MONGODB_URI=your_mongodb_connection_string
GOOGLE_AI_API_KEY=your_google_ai_api_key
NODE_ENV=development
```

4. Start the application:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## Usage

1. Open your browser and navigate to `http://localhost:8080`
2. Enter your KTU credentials (Register Number and Password)
3. Select the semester you want to view
4. View your results with detailed analysis

## API Endpoints

- `GET /`: Home page
- `POST /results`: Fetch and display results
- `POST /cached-results`: Retrieve cached results
- `GET /health`: Health check endpoint

## Docker Support

Build and run using Docker:

```bash
# Build the image
docker build -t ktu-result-analyzer .

# Run the container
docker run -p 8080:8080 ktu-result-analyzer
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Acknowledgments

- KTU for providing the result portal
- Google AI for powering the insights feature
- All contributors who have helped shape this project

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.