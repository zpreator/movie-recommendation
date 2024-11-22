// Backend URL
const BACKEND_URL = "/recommendations";

// State for selected movies
let selectedMovies = [];

// Add movie to the list
document.getElementById("add-movie").addEventListener("click", () => {
  const movieInput = document.getElementById("movie-input");
  const movieTitle = movieInput.value.trim();

  if (movieTitle && !selectedMovies.includes(movieTitle)) {
    selectedMovies.push(movieTitle);

    // Update UI
    const listItem = document.createElement("li");
    listItem.innerHTML = `
      <span>${movieTitle}</span>
      <button onclick="removeMovie('${movieTitle}')">Remove</button>
    `;
    document.getElementById("movies-list").appendChild(listItem);

    // Clear input
    movieInput.value = "";
  }
});

// Remove movie from the list
function removeMovie(movieTitle) {
  selectedMovies = selectedMovies.filter((movie) => movie !== movieTitle);

  // Update UI
  const moviesList = document.getElementById("movies-list");
  moviesList.innerHTML = "";
  selectedMovies.forEach((movie) => {
    const listItem = document.createElement("li");
    listItem.innerHTML = `
      <span>${movie}</span>
      <button onclick="removeMovie('${movie}')">Remove</button>
    `;
    moviesList.appendChild(listItem);
  });
}

// Get recommendations
document.getElementById("get-recommendations").addEventListener("click", async () => {
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "Loading...";

  try {
    const response = await fetch(BACKEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ movies: selectedMovies }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch recommendations.");
    }

    const recommendations = await response.json();

    console.log("Recommendations Received:", recommendations);


    // Display recommendations
    resultsDiv.innerHTML = recommendations
      .map(
        (rec) => `
        <div class="movie">
          <h3>${rec.title} (${rec.year || "N/A"})</h3>
          <p>${rec.description}</p>
          ${
            rec.poster
              ? `<img class="poster" src="${rec.poster}" alt="${rec.title}" />`
              : "<p>No poster available</p>"
          }
        </div>
      `
      )
      .join("");
  } catch (error) {
    console.error(error);
    resultsDiv.innerHTML = "Error fetching recommendations. Please try again.";
  }
});