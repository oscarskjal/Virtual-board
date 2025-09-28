const LOGIN_API = "https://login-api-fwaw.onrender.com/api/auth/login";
const WHITEBOARD_API = "https://project1-part2-1.onrender.com/api/whiteboard";

let currentBoardId = null;
let draggedElement = null;

document.addEventListener("DOMContentLoaded", function () {
  const token = checkAuthentication();

  if (token) {
    initializeBoard(token);

    // Auto-refresh post-its every 3 seconds
    setInterval(() => {
      if (currentBoardId) {
        loadPostIts(token);
      }
    }, 4000);
  }

  const board = document.getElementById("board");
  if (board) {
    board.ondragover = (e) => e.preventDefault();
    board.ondrop = (e) => {
      e.preventDefault();
      if (draggedElement) {
        const rect = board.getBoundingClientRect();
        const newX = e.clientX - rect.left - 75;
        const newY = e.clientY - rect.top - 50;
        draggedElement.style.left = newX + "px";
        draggedElement.style.top = newY + "px";
        const postItId = draggedElement.dataset.id;
        if (postItId) {
          updatePostItPosition(postItId, newX, newY);
        }
      }
    };
  }

  const trashCan = document.getElementById("trash-can");
  if (trashCan) {
    trashCan.ondragover = (e) => {
      e.preventDefault();
      trashCan.classList.add("drag-over");
    };
    trashCan.ondragleave = () => {
      trashCan.classList.remove("drag-over");
    };
    trashCan.ondrop = (e) => {
      e.preventDefault();
      trashCan.classList.remove("drag-over");
      if (draggedElement) {
        const postItId = draggedElement.dataset.id;
        if (postItId) {
          deletePostIt(postItId, draggedElement);
        }
      }
    };
  }

  const boardSelect = document.getElementById("board-select");
  if (boardSelect) {
    boardSelect.style.display = "inline-block";
    loadBoardsToDropdown();

    boardSelect.onchange = () => {
      currentBoardId = boardSelect.value;
      document.querySelectorAll(".postit").forEach((p) => p.remove());
      loadPostIts(localStorage.getItem("authToken"));
    };
  }

  const newBoardBtn = document.getElementById("new-board-btn");
  if (newBoardBtn) {
    newBoardBtn.onclick = async () => {
      const name = prompt("Enter board name:");
      if (!name) return;
      const description = prompt("Enter board description (optional):") || "";
      const token = localStorage.getItem("authToken");
      try {
        const res = await fetch(`${WHITEBOARD_API}/api/boards`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            description,
            isPublic: false,
          }),
        });
        if (res.ok) {
          const newBoard = await res.json();
          currentBoardId = newBoard.id;
          document.querySelectorAll(".postit").forEach((p) => p.remove());
          await loadBoardsToDropdown();
          boardSelect.value = currentBoardId;
          loadPostIts(token);
        } else {
          const err = await res.json();
          alert("Failed to create board: " + (err.error || "Unknown error"));
        }
      } catch (error) {
        alert("Error creating board: " + error.message);
      }
    };
  }
});

async function loadBoardsToDropdown() {
  const boardSelect = document.getElementById("board-select");
  const token = localStorage.getItem("authToken");
  if (!boardSelect || !token) return;
  const res = await fetch(`${WHITEBOARD_API}/api/boards`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.ok) {
    const boards = await res.json();
    boardSelect.innerHTML = "";
    boards.forEach((board) => {
      const option = document.createElement("option");
      option.value = board.id;
      option.textContent = board.name;
      if (board.id === currentBoardId) option.selected = true;
      boardSelect.appendChild(option);
    });
    // If no board selected, select the first one
    if (!currentBoardId && boards.length > 0) {
      currentBoardId = boards[0].id;
      boardSelect.value = currentBoardId;
      loadPostIts(token);
    }
  }
}

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

async function getOrCreateBoard(token) {
  try {
    const response = await fetch(`${WHITEBOARD_API}/api/boards`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      const boards = await response.json();
      if (boards.length > 0) {
        currentBoardId = boards[0].id;
      } else {
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

function createPostItModal(token, isEdit = false, postItData = null) {
  if (!currentBoardId && !isEdit) return;

  const modal = document.createElement("div");
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.5); display: flex; justify-content: center;
    align-items: center; z-index: 1000;
  `;

  const editor = document.createElement("div");
  const initialColor = isEdit ? postItData.color : "#ffff88";
  editor.style.cssText = `
    background: ${initialColor}; width: 300px; height: 200px; border-radius: 10px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3); position: relative;
    display: flex; flex-direction: column; padding: 20px;
  `;

  let selectedColor = initialColor;

  const textarea = document.createElement("textarea");
  textarea.style.cssText = `
    background: transparent; border: none; resize: none; font-size: 16px;
    flex: 1; outline: none; font-family: sans-serif;
  `;
  textarea.placeholder = "Write your note...";
  if (isEdit) {
    textarea.value = postItData.content;
  }

  const colors = [
    "#ffff88",
    "#75be78",
    "#65a6db",
    "#cda76f",
    "#da7194",
    "#b35ec3",
  ];
  const colorPicker = document.createElement("div");
  colorPicker.style.cssText = "display: flex; gap: 10px; margin: 10px 0;";

  colors.forEach((color) => {
    const colorBtn = document.createElement("div");
    const isSelected = color === selectedColor;
    colorBtn.style.cssText = `
      width: 30px; height: 30px; background: ${color}; border-radius: 50%;
      cursor: pointer; border: ${
        isSelected ? "2px solid #333" : "2px solid transparent"
      };
    `;
    colorBtn.onclick = () => {
      selectedColor = color;
      editor.style.background = color;
      colorPicker
        .querySelectorAll("div")
        .forEach((btn) => (btn.style.border = "2px solid transparent"));
      colorBtn.style.border = "2px solid #333";
    };
    colorPicker.appendChild(colorBtn);
  });

  const buttons = document.createElement("div");
  buttons.style.cssText =
    "display: flex; gap: 10px; justify-content: flex-end;";

  const saveBtn = document.createElement("button");
  saveBtn.textContent = isEdit ? "Update" : "Save";
  saveBtn.style.cssText = "padding: 8px 16px; cursor: pointer;";

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancel";
  cancelBtn.style.cssText = "padding: 8px 16px; cursor: pointer;";

  saveBtn.onclick = () => {
    if (isEdit) {
      updatePostIt(
        token,
        postItData.id,
        textarea.value,
        selectedColor,
        modal,
        postItData.element
      );
    } else {
      savePostIt(token, textarea.value, selectedColor, modal);
    }
  };
  cancelBtn.onclick = () => document.body.removeChild(modal);
  modal.onclick = (e) => e.target === modal && document.body.removeChild(modal);

  editor.appendChild(textarea);
  editor.appendChild(colorPicker);
  buttons.appendChild(cancelBtn);
  buttons.appendChild(saveBtn);
  editor.appendChild(buttons);
  modal.appendChild(editor);
  document.body.appendChild(modal);
  textarea.focus();
}

function createPostIt(token) {
  createPostItModal(token, false);
}

function editPostIt(token, postItElement) {
  const postItData = {
    id: postItElement.dataset.id,
    content: postItElement.textContent,
    color: postItElement.style.backgroundColor || "#ffff88",
    element: postItElement,
  };

  if (postItData.color.startsWith("rgb")) {
    postItData.color = rgbToHex(postItData.color);
  }

  createPostItModal(token, true, postItData);
}

function rgbToHex(rgb) {
  const result = rgb.match(/\d+/g);
  if (result && result.length >= 3) {
    const r = parseInt(result[0]).toString(16).padStart(2, "0");
    const g = parseInt(result[1]).toString(16).padStart(2, "0");
    const b = parseInt(result[2]).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`;
  }
  return "#ffff88";
}

async function savePostIt(token, text, color, modal) {
  if (!text.trim()) return;

  const postItData = {
    content: text,
    xPosition: Math.floor(Math.random() * 300 + 50),
    yPosition: Math.floor(Math.random() * 300 + 100),
    color: color || "#ffff88",
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
      document.body.removeChild(modal);
    } else {
      const errorData = await response.json();
      console.error("Failed to save post-it:", errorData);
      alert("Failed to save post-it: " + (errorData.error || "Unknown error"));
    }
  } catch (error) {
    console.error("Error saving post-it:", error);
    alert("Error saving post-it: " + error.message);
  }
}

async function updatePostIt(
  token,
  postItId,
  text,
  color,
  modal,
  postItElement
) {
  if (!text.trim()) return;

  const updateData = {
    content: text,
    color: color || "#ffff88",
  };

  try {
    const response = await fetch(`${WHITEBOARD_API}/api/postits/${postItId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });

    if (response.ok) {
      postItElement.textContent = text;
      postItElement.style.background = color;
      document.body.removeChild(modal);
    } else {
      const errorData = await response.json();
      console.error("Failed to update post-it:", errorData);
      alert(
        "Failed to update post-it: " + (errorData.error || "Unknown error")
      );
    }
  } catch (error) {
    console.error("Error updating post-it:", error);
    alert("Error updating post-it: " + error.message);
  }
}

async function loadPostIts(token) {
  try {
    const response = await fetch(`${WHITEBOARD_API}/api/postits`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      const data = await response.json();
      const postits = (data.postits || data).filter(
        (p) => String(p.boardId) === String(currentBoardId)
      );
      document.querySelectorAll(".postit").forEach((p) => p.remove());
      postits.forEach((postit) => createVisualPostIt(postit));
    } else {
      console.error("Failed to load post-its:", response.status);
    }
  } catch (error) {
    console.error("Error loading post-its:", error);
  }
}

function createVisualPostIt(postItData) {
  const token = localStorage.getItem("authToken");
  const postit = document.createElement("div");
  postit.className = "postit";
  postit.textContent = postItData.content;
  postit.draggable = true;
  postit.dataset.id = postItData.id;
  postit.style.cssText = `
    position: absolute; left: ${postItData.xPosition}px; top: ${
    postItData.yPosition
  }px;
    background: ${postItData.color || "#ffff88"}; padding: 15px; width: 150px;
    min-height: 100px; border-radius: 8px; box-shadow: 3px 3px 10px rgba(0,0,0,0.2);
    cursor: move; user-select: none; font-family: sans-serif; word-wrap: break-word;
  `;

  postit.ondragstart = (e) => {
    draggedElement = postit;
    e.dataTransfer.effectAllowed = "move";
  };

  postit.ondragend = () => (draggedElement = null);

  postit.ondblclick = (e) => {
    e.preventDefault();
    editPostIt(token, postit);
  };

  document.getElementById("board").appendChild(postit);
}

async function updatePostItPosition(postItId, xPosition, yPosition) {
  const token = localStorage.getItem("authToken");
  if (!token || !postItId) return;

  try {
    const response = await fetch(`${WHITEBOARD_API}/api/postits/${postItId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        xPosition: parseInt(xPosition),
        yPosition: parseInt(yPosition),
      }),
    });

    if (!response.ok) {
      console.error("Failed to update position:", response.status);
    }
  } catch (error) {
    console.error("Error updating position:", error);
  }
}

async function deletePostIt(postItId, postItElement) {
  const token = localStorage.getItem("authToken");
  if (!token || !postItId) return;

  try {
    const response = await fetch(`${WHITEBOARD_API}/api/postits/${postItId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      postItElement.remove();
    } else {
      console.error("Failed to delete post-it:", response.status);
      alert("Failed to delete post-it");
    }
  } catch (error) {
    console.error("Error deleting post-it:", error);
    alert("Error deleting post-it: " + error.message);
  }
}

function logout() {
  localStorage.removeItem("authToken");
  window.location.href = "Login.html";
}
