const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require('path');
require("dotenv").config();

// console.log("OPENAI_API_KEY:", process.env.OPENAI_API_KEY);

const app = express();

// Serve static files (frontend) from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));


// All other routes should serve the index.html (your frontend)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Helper function to format movie list
function formatMovieList(movies) {
  if (!movies || movies.length === 0) return "";
  if (movies.length === 1) return movies[0];
  if (movies.length === 2) return `${movies[0]} and ${movies[1]}`;
  return `${movies.slice(0, -1).join(", ")}, and ${movies[movies.length - 1]}`;
}

const normalizeRecommendation = (rec) => {
  return {
    title: rec.Title || rec.title || "Unknown title",  // Normalize to lowercase
    description: rec.Description || rec.description || "No description available",
    year: rec.Year || rec.year || "N/A",
  };
};

// Route to fetch movie recommendations
app.post("/recommendations", async (req, res) => {
  const { movies } = req.body;

  console.log("Received movies: " + toString(movies))

  if (!movies || movies.length === 0) {
    return res.status(400).json({ error: "Please provide a list of movies." });
  }

  const formattedMovies = formatMovieList(movies);

  try {
    // Step 1: Call OpenAI API for recommendations
    const openAIResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4",
        messages: [
          {
            role: "user",
            content: `Generate some movie recommendations based on the following movies: ${formattedMovies}. Return in the format of JSON with each recommendation as a key, and each movie should have several attributes: title, description, year, etc.`,
          },
        ],
        temperature: 1,
        max_tokens: 2048,
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const recommendations = JSON.parse(openAIResponse.data.choices[0].message.content);

    // Normalize the keys to lowercase
    const normalizedRecommendations = [];
    for (const key in recommendations) {
      if (recommendations.hasOwnProperty(key)) {
        const recommendation = recommendations[key];
        normalizedRecommendations.push(normalizeRecommendation(recommendation));
      }
    }

    // // Send the response with normalized keys
    // res.json(normalizedRecommendations);

    console.log("Response Sent to Frontend:", normalizedRecommendations);
    // res.json(recommendations);

    // Step 2: Fetch movie details from TMDB
    const detailedRecommendations = await Promise.all(
      Object.values(normalizedRecommendations).map(async (rec) => {
        const tmdbResponse = await axios.get(
          `https://api.themoviedb.org/3/search/movie`,
          {
            params: {
              api_key: process.env.TMDB_API_KEY,
              query: rec.title,
            },
          }
        );

        const tmdbMovie = tmdbResponse.data.results[0];
        return {
          ...rec,
          poster: tmdbMovie ? `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}` : null,
        };
      })
    );

    res.json(detailedRecommendations);
  } catch (error) {
    console.error(error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Failed to fetch recommendations." });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});