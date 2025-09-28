const config = {
  // Automatisk detection av miljö
  API_BASE_URL:
    window.location.hostname === "localhost"
      ? "http://localhost:3000"
      : "https://login-api-fwaw.onrender.com",
};
