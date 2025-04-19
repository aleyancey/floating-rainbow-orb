// Load environment variables from .env file
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const multer = require('multer'); // For handling image uploads
const fs = require('fs');
const { google } = require('googleapis');

// Imports the Google Cloud client library
const vision = require('@google-cloud/vision');

// Creates a Vision API client
const visionClient = new vision.ImageAnnotatorClient();

// Initialize the YouTube API client
const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY
});

// Function to write logs to both console and file
const writeLog = (message) => {
    console.log(message);
    try {
        fs.appendFileSync(path.resolve(__dirname, 'debug.log'), message + '\n');
    } catch (error) {
        console.error('Error writing to debug.log:', error);
    }
};

// Log the credentials path for debugging
writeLog('DEBUG: GOOGLE_APPLICATION_CREDENTIALS path: ' + process.env.GOOGLE_APPLICATION_CREDENTIALS);
writeLog('DEBUG: Resolved credentials path: ' + path.resolve(__dirname, process.env.GOOGLE_APPLICATION_CREDENTIALS));

// Log the YouTube API key (first few characters) for debugging
writeLog('DEBUG: YouTube API Key (first 5 chars): ' + (process.env.YOUTUBE_API_KEY ? process.env.YOUTUBE_API_KEY.substring(0, 5) + '...' : 'Not set'));

// --- Express App Setup ---
const app = express();
const port = process.env.PORT || 3001; // Use port 3001 or one defined in .env

// --- Middleware ---
// Enable All CORS Requests for development
app.use(cors());
// Middleware to parse JSON bodies (increase limit for potential base64 uploads if needed)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Set up multer for memory storage (to handle the image file buffer)
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // Limit upload size to 10MB
});

// Function to search YouTube using the Data API v3
const searchYouTube = async (query) => {
    try {
        const response = await youtube.search.list({
            part: 'snippet',
            q: query,
            maxResults: 5,
            type: 'video'
        });
        
        return response.data.items;
    } catch (error) {
        console.error('Error searching YouTube:', error);
        throw error;
    }
};

// --- Routes ---
app.get('/', (req, res) => {
    writeLog('DEBUG: Received GET request to root endpoint');
    res.send('Album Finder Backend is running!');
});

// POST endpoint to process the image
// 'albumImage' is the field name the frontend will use for the file upload
app.post('/api/process-image', upload.single('albumImage'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        writeLog('Processing image...');

        // Perform label detection on the image
        const [result] = await visionClient.labelDetection(req.file.buffer);
        const labels = result.labelAnnotations;

        if (!labels || labels.length === 0) {
            return res.status(400).json({ error: 'No labels detected in the image' });
        }

        // Get the top 3 labels with highest score
        const topLabels = labels
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .map(label => label.description);

        writeLog('Top labels detected: ' + JSON.stringify(topLabels));

        // Create a search query from the labels
        const searchQuery = topLabels.join(' ');
        writeLog('Searching YouTube for: ' + searchQuery);

        // Search YouTube for videos
        const videos = await searchYouTube(searchQuery);
        writeLog('Found ' + videos.length + ' videos');

        // Return the results
        res.json({
            labels: topLabels,
            videos: videos
        });

    } catch (error) {
        console.error('Error processing image:', error);
        res.status(500).json({
            error: 'Failed to process image.',
            details: error.message
        });
    }
});

// --- Start Server ---
app.listen(port, () => {
    writeLog(`Backend server listening on port ${port}`);
});