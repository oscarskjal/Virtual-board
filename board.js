// API Configuration
const LOGIN_API = "http://localhost:3003";
const WHITEBOARD_API = "http://localhost:3002";

document.addEventListener("DOMContentLoaded", function () {
  const token = checkAuthentication();
  if (token) {
    initializeBoard(token);
  }
});

function checkAuthentication() {
  const token = localStorage.getItem("authToken");
  if (!token) {
    alert("Please login first!");
    window.location.href = "Login.html";
    return null;
  }
  return token;
}

function initializeBoard(token) {
  document.getElementById("add-postit-btn").onclick = () => createPostIt();

  document.getElementById("logout-btn").onclick = logout;
}

function createPostIt() {
  const text = prompt("Enter post-it text:");
  if (!text) return;

  // Create visual post-it
  const postit = document.createElement("div");
  postit.className = "postit";
  postit.textContent = text;
  postit.style.position = "absolute";
  postit.style.left = "100px";
  postit.style.top = "100px";
  postit.style.background = "#ffeb3b";
  postit.style.padding = "10px";
  postit.style.width = "150px";
  postit.style.minHeight = "100px";

  document.getElementById("board").appendChild(postit);
}

function logout() {
  localStorage.removeItem("authToken");
  window.location.href = "Login.html";
}
