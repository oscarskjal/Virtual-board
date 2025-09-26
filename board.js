const LOGIN_API = "http://localhost:3000";
const WHITEBOARD_API = "http://localhost:3002";

let currentBoardId = null;

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

async function initializeBoard(token) {
  await getOrCreateBoard(token);

  loadPostIts(token);

  document.getElementById("add-postit-btn").onclick = () => createPostIt(token);
  document.getElementById("logout-btn").onclick = logout;
}

// GET OR CREATE A DEFAULT BOARD
async function getOrCreateBoard(token) {
  try {
    // Get existing boards
    const response = await fetch(`${WHITEBOARD_API}/api/boards`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      const boards = await response.json();

      if (boards.length > 0) {
        // Use first existing board
        currentBoardId = boards[0].id;
      } else {
        // Create a default board
        const createResponse = await fetch(`${WHITEBOARD_API}/api/boards`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: "My Board",
            description: "Default board",
            isPublic: false,
          }),
        });

        if (createResponse.ok) {
          const newBoard = await createResponse.json();
          currentBoardId = newBoard.id;
        }
      }
    }
  } catch (error) {
    console.error("Error with board:", error);
  }
}

// CREATE POST-IT
async function createPostIt(token) {
  const text = prompt("Enter post-it text:");
  if (!text || !currentBoardId) return;

  // Random position
  const xPosition = Math.floor(Math.random() * 300 + 50);
  const yPosition = Math.floor(Math.random() * 300 + 100);

  const postItData = {
    content: text,
    xPosition: xPosition,
    yPosition: yPosition,
    color: "#ffeb3b",
    boardId: currentBoardId,
  };

  try {
    const response = await fetch(`${WHITEBOARD_API}/api/postits`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(postItData),
    });

    if (response.ok) {
      const savedPostIt = await response.json();
      createVisualPostIt(savedPostIt);
    } else {
      const error = await response.json();
      alert("Failed to save post-it: " + (error.error || "Unknown error"));
    }
  } catch (error) {
    console.error("Error saving post-it:", error);
    alert("Error connecting to API");
  }
}

async function loadPostIts(token) {
  try {
    const response = await fetch(`${WHITEBOARD_API}/api/postits`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      const data = await response.json();
      const postits = data.postits || data;
      postits.forEach((postit) => createVisualPostIt(postit));
    }
  } catch (error) {
    console.error("Error loading post-its:", error);
  }
}

// CREATE VISUAL POST-IT
function createVisualPostIt(postItData) {
  const postit = document.createElement("div");
  postit.className = "postit";
  postit.textContent = postItData.content;
  postit.style.position = "absolute";
  postit.style.left = postItData.xPosition + "px";
  postit.style.top = postItData.yPosition + "px";
  postit.style.background = postItData.color || "#ffeb3b";
  postit.style.padding = "10px";
  postit.style.width = "150px";
  postit.style.minHeight = "100px";
  postit.style.borderRadius = "5px";
  postit.style.boxShadow = "2px 2px 5px rgba(0,0,0,0.2)";

  document.getElementById("board").appendChild(postit);
}

function logout() {
  localStorage.removeItem("authToken");
  window.location.href = "Login.html";
}
