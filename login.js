const API_URL = `${config.API_BASE_URL}/api/auth/login`;

const loginForm = document.getElementById("loginForm");
const loginBtn = document.getElementById("loginBtn");
const messageDiv = document.getElementById("message");
const tokenDisplay = document.getElementById("tokenDisplay");
const tokenDiv = document.getElementById("token");

document.addEventListener("DOMContentLoaded", function () {
  loginForm.addEventListener("submit", handleLogin);
});

async function handleLogin(e) {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  // Visa loading state
  loginBtn.disabled = true;
  loginBtn.textContent = "Loggar in...";
  hideMessage();

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (data.success) {
      showMessage("Inloggning lyckades! ✅", "success");

      // Lägger till token i localStorage
      localStorage.setItem("authToken", data.token);

      // Visa JWT token
      tokenDiv.textContent = data.token;
      tokenDisplay.style.display = "block";

      // Redirect to Virtual Board efter login
      setTimeout(() => {
        window.location.href = "Virtual-board.html";
      }, 1500);

      // Rensa formulär
      loginForm.reset();
    } else {
      showMessage(data.message || "Inloggning misslyckades", "error");
      tokenDisplay.style.display = "none";
    }
  } catch (error) {
    showMessage(
      "Kunde inte ansluta till servern. Se till att backend körs på localhost:3000",
      "error"
    );
    tokenDisplay.style.display = "none";
    console.error("Login error:", error);
  }

  // Återställ knapp
  loginBtn.disabled = false;
  loginBtn.textContent = "Logga in";
}

function showMessage(text, type) {
  messageDiv.textContent = text;
  messageDiv.className = `message ${type}`;
  messageDiv.style.display = "block";
}

function hideMessage() {
  messageDiv.style.display = "none";
}
