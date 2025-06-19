const API_USERS = "https://6852ac200594059b23ce9d1f.mockapi.io/users";
const API_POSTS = "https://6852ac200594059b23ce9d1f.mockapi.io/posts";
const WHATSAPP_LINK = "https://wa.me/1234567890"; // Replace with your WhatsApp link

let currentUser = null;
let isLoginMode = false;
let currentPostId = null;
let allPosts = [];
let captchaData = {};
let signupEmail = "";
const commentModal = new bootstrap.Modal(document.getElementById("commentModal"));
const updatePostModal = new bootstrap.Modal(document.getElementById("updatePostModal"));
const toastElement = document.getElementById("appToast");
const toast = new bootstrap.Toast(toastElement);

// Show toast notification
function showToast(message) {
  document.getElementById("toast-message").textContent = message;
  toast.show();
}

// Toggle button loading state
function toggleButtonLoading(button, isLoading) {
  const spinner = button.querySelector(".spinner-border");
  if (isLoading) {
    button.disabled = true;
    spinner.classList.remove("d-none");
  } else {
    button.disabled = false;
    spinner.classList.add("d-none");
  }
}

// Generate CAPTCHA
function generateCaptcha() {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  captchaData = { question: `${a} + ${b}`, answer: a + b };
  document.getElementById("captcha-question").textContent = captchaData.question;
}

// Show auth section
function showAuth() {
  document.getElementById("landing-page").classList.add("d-none");
  document.getElementById("auth-section").classList.remove("d-none");
  document.getElementById("navbar").classList.add("d-none");
}

// Toggle between signup and login
function toggleAuthMode(isCaptchaSuccess = false) {
  isLoginMode = !isLoginMode || isCaptchaSuccess;
  document.getElementById("auth-title").textContent = isLoginMode ? "Login" : "Sign Up";
  document.getElementById("auth-btn").innerHTML = isLoginMode
    ? '<span class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span> Login'
    : '<span class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span> Sign Up';
  document.getElementById("auth-switch").textContent = isLoginMode ? "Sign Up" : "Login";
  document.getElementById("signup-fields").classList.toggle("d-none", isLoginMode);
  document.getElementById("login-fields").classList.toggle("d-none", !isLoginMode);
  // Disable hidden inputs to prevent validation errors
  document.getElementById("signup-email").disabled = isLoginMode;
  document.getElementById("signup-password").disabled = isLoginMode;
  document.getElementById("confirm-password").disabled = isLoginMode;
  document.getElementById("name").disabled = isLoginMode;
  document.getElementById("login-email").disabled = !isLoginMode;
  document.getElementById("login-password").disabled = !isLoginMode;
  if (isCaptchaSuccess) {
    document.getElementById("login-email").value = signupEmail;
  }
}

// Handle auth form submission
document.getElementById("auth-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const button = document.getElementById("auth-btn");
  toggleButtonLoading(button, true);
  let email, password;
  if (isLoginMode) {
    email = document.getElementById("login-email").value;
    password = document.getElementById("login-password").value;
  } else {
    email = document.getElementById("signup-email").value;
    password = document.getElementById("signup-password").value;
  }

  try {
    if (isLoginMode) {
      const response = await fetch(API_USERS);
      const users = await response.json();
      const user = users.find((u) => u.email === email && u.password === password);
      if (user) {
        currentUser = user;
        showDashboard();
        showToast(`Welcome back, ${user.name}!`);
        document.getElementById("user-avatar").src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
          user.name
        )}&background=random`;
        document.getElementById("user-avatar").classList.remove("d-none");
      } else {
        alert("Invalid email or password");
      }
    } else {
      const name = document.getElementById("name").value;
      const confirmPassword = document.getElementById("confirm-password").value;
      if (password !== confirmPassword) {
        alert("Passwords do not match");
        toggleButtonLoading(button, false);
        return;
      }
      const role = email === "ridwansaliu84@gmail.com" ? "admin" : "user";
      const response = await fetch(API_USERS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role, name }),
      });
      if (response.ok) {
        signupEmail = email;
        document.getElementById("auth-form").reset();
        document.getElementById("auth-section").classList.add("d-none");
        document.getElementById("captcha-section").classList.remove("d-none");
        generateCaptcha();
      } else {
        alert("Signup failed");
      }
    }
  } catch (error) {
    alert("An error occurred. Please try again.");
  } finally {
    toggleButtonLoading(button, false);
  }
});

// Handle CAPTCHA submission
document.getElementById("captcha-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const button = document.getElementById("captcha-btn");
  toggleButtonLoading(button, true);
  const answer = parseInt(document.getElementById("captcha-answer").value);
  if (answer === captchaData.answer) {
    document.getElementById("captcha-section").classList.add("d-none");
    document.getElementById("auth-section").classList.remove("d-none");
    toggleAuthMode(true);
  } else {
    alert("Incorrect answer. Try again.");
    generateCaptcha();
    document.getElementById("captcha-form").reset();
  }
  toggleButtonLoading(button, false);
});

// Show appropriate dashboard
function showDashboard() {
  document.getElementById("auth-section").classList.add("d-none");
  document.getElementById("navbar").classList.remove("d-none");
  if (currentUser.role === "admin") {
    document.getElementById("admin-dashboard").classList.remove("d-none");
    loadPosts("admin");
  } else {
    document.getElementById("user-dashboard").classList.remove("d-none");
    loadPosts("user");
  }
}

// Handle post submission
document.getElementById("post-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const button = e.target.querySelector("button");
  toggleButtonLoading(button, true);
  const post = {
    title: document.getElementById("post-title").value,
    description: document.getElementById("post-desc").value,
    link: document.getElementById("post-link").value,
    image: document.getElementById("post-image").value,
    category: document.getElementById("post-category").value,
    likes: 0,
    comments: [],
    createdAt: new Date().toISOString(),
  };
  try {
    const response = await fetch(API_POSTS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(post),
    });
    if (response.ok) {
      document.getElementById("post-form").reset();
      loadPosts("admin");
      showToast("Update posted successfully!");
    } else {
      alert("Failed to post update");
    }
  } catch (error) {
    alert("An error occurred. Please try again.");
  } finally {
    toggleButtonLoading(button, false);
  }
});

// Load posts for admin or user
async function loadPosts(type) {
  try {
    const response = await fetch(API_POSTS);
    allPosts = await response.json();
    renderPosts(type, allPosts);
  } catch (error) {
    alert("Failed to load posts");
  }
}

// Render posts with optional filtering
function renderPosts(type, posts) {
  const container = document.getElementById(`${type}-posts`);
  container.innerHTML = "";
  if (posts.length === 0) {
    container.innerHTML = '<p class="text-center">No results found.</p>';
    return;
  }
  posts.forEach((post) => {
    let timestampBadge = '';
    if (post.createdAt) {
      const postDate = new Date(post.createdAt);
      const now = new Date();
      const diffMs = now - postDate;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays >= 1 && diffDays <= 5) {
        timestampBadge = '<span class="badge bg-success timestamp-badge">New</span>';
      } else if (diffDays > 5) {
        timestampBadge = '<span class="badge bg-secondary timestamp-badge">6 days ago</span>';
      }
    }
    const card = `
      <div class="col-md-4 mb-4">
        <div class="card">
          <img src="${post.image}" class="card-img-top" alt="Web3 Update" style="height: 200px; object-fit: cover;">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h5 class="card-title mb-0">${post.title}</h5>
              <div>
                <span class="badge bg-primary category-badge">${post.category || 'Other'}</span>
                ${timestampBadge}
              </div>
            </div>
            <p class="card-text">${post.description}</p>
            <div class="d-flex gap-2 mb-2">
              <a href="${post.link}" target="_blank" class="btn btn-primary btn-sm flex-fill">Visit Link</a>
              ${
                type === "user"
                  ? `<a href="${WHATSAPP_LINK}" target="_blank" class="btn btn-outline-light btn-sm flex-fill">Message Admin</a>`
                  : ""
              }
            </div>
            ${
              type === "user"
                ? `
              <div class="d-flex justify-content-between align-items-center">
                <button class="btn btn-outline-light btn-sm" onclick="likePost('${post.id}', this)">
                  <span class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span>
                  <i class="bi bi-heart-fill"></i> ${post.likes}
                </button>
                <button class="btn btn-outline-light btn-sm" onclick="showComments('${post.id}')">
                  <i class="bi bi-chat"></i> ${post.comments.length}
                </button>
                <button class="btn btn-outline-light btn-sm" onclick="sharePost('${post.id}', this)">
                  <span class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span>
                  <i class="bi bi-share"></i>
                </button>
              </div>
            `
                : `
              <div class="d-flex gap-2">
                <button class="btn btn-warning btn-sm flex-fill" onclick="showUpdateModal('${post.id}')">
                  <span class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span>
                  Update Post
                </button>
                <button class="btn btn-danger btn-sm flex-fill" onclick="deletePost('${post.id}', this)">
                  <span class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span>
                  Delete Post
                </button>
              </div>
            `
            }
          </div>
        </div>
      </div>
    `;
    container.innerHTML += card;
  });
}

// Search posts
function searchPosts(type) {
  const searchInput = document.getElementById(`${type}-search`).value.toLowerCase();
  const filteredPosts = allPosts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchInput) ||
      post.description.toLowerCase().includes(searchInput) ||
      (post.category || "").toLowerCase().includes(searchInput)
  );
  renderPosts(type, filteredPosts);
}

// Clear search
function clearSearch(type) {
  document.getElementById(`${type}-search`).value = "";
  renderPosts(type, allPosts);
}

// Add search event listeners
document.getElementById("admin-search")?.addEventListener("input", () => searchPosts("admin"));
document.getElementById("user-search")?.addEventListener("input", () => searchPosts("user"));

// Like post
async function likePost(postId, button) {
  toggleButtonLoading(button, true);
  try {
    const response = await fetch(`${API_POSTS}/${postId}`);
    const post = await response.json();
    post.likes += 1;
    const updateResponse = await fetch(`${API_POSTS}/${postId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(post),
    });
    if (updateResponse.ok) {
      loadPosts(currentUser.role);
      showToast("Post liked!");
    } else {
      alert("Failed to like post");
    }
  } catch (error) {
    alert("An error occurred. Please try again.");
  } finally {
    toggleButtonLoading(button, false);
  }
}

// Fetch user by email
async function getUserByEmail(email) {
  try {
    const response = await fetch(API_USERS);
    const users = await response.json();
    return users.find((u) => u.email === email) || { name: "Unknown User" };
  } catch (error) {
    return { name: "Unknown User" };
  }
}

// Show comments in modal
async function showComments(postId) {
  currentPostId = postId;
  try {
    const response = await fetch(`${API_POSTS}/${postId}`);
    const post = await response.json();
    const commentsContainer = document.getElementById("modal-comments");
    commentsContainer.innerHTML = "";
    if (post.comments.length === 0) {
      commentsContainer.innerHTML = '<p class="mb-0"><small>No comments yet.</small></p>';
    } else {
      for (const comment of post.comments) {
        const user = await getUserByEmail(comment.email);
        commentsContainer.innerHTML += `
          <div class="d-flex align-items-start mb-2">
            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(
              user.name
            )}&background=random" class="avatar" alt="${user.name}">
            <div>
              <strong>${user.name}</strong>
              <p class="mb-0"><small>${comment.text}</small></p>
            </div>
          </div>
          <hr class="my-2">
        `;
      }
    }
    commentModal.show();
  } catch (error) {
    alert("Failed to load comments");
  }
}

// Add comment
document.getElementById("comment-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const button = e.target.querySelector("button");
  toggleButtonLoading(button, true);
  const commentText = document.getElementById("comment-input").value;
  try {
    const response = await fetch(`${API_POSTS}/${currentPostId}`);
    const post = await response.json();
    post.comments.push({ email: currentUser.email, text: commentText });
    const updateResponse = await fetch(`${API_POSTS}/${currentPostId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(post),
    });
    if (updateResponse.ok) {
      document.getElementById("comment-form").reset();
      showComments(currentPostId);
      loadPosts(currentUser.role);
      showToast("Comment added!");
    } else {
      alert("Failed to add comment");
    }
  } catch (error) {
    alert("An error occurred. Please try again.");
  } finally {
    toggleButtonLoading(button, false);
  }
});

// Share post
async function sharePost(postId, button) {
  toggleButtonLoading(button, true);
  try {
    const response = await fetch(`${API_POSTS}/${postId}`);
    const post = await response.json();
    const shareUrl = `${window.location.origin}/post/${postId}`;
    const shareText = `Check out this Web3 update: ${post.title} on ComradeUpdates! ${shareUrl}`;
    if (navigator.share && navigator.canShare({ url: shareUrl })) {
      await navigator.share({
        title: post.title,
        text: post.description,
        url: shareUrl,
      });
      showToast("Post shared successfully!");
    } else {
      await navigator.clipboard.writeText(shareText);
      showToast("Link copied to clipboard!");
    }
  } catch (error) {
    alert("Failed to share post");
  } finally {
    toggleButtonLoading(button, false);
  }
}

// Delete post
async function deletePost(postId, button) {
  toggleButtonLoading(button, true);
  try {
    const response = await fetch(`${API_POSTS}/${postId}`, {
      method: "DELETE",
    });
    if (response.ok) {
      loadPosts("admin");
      showToast("Post deleted successfully!");
    } else {
      alert("Failed to delete post");
    }
  } catch (error) {
    alert("An error occurred. Please try again.");
  } finally {
    toggleButtonLoading(button, false);
  }
}

// Show update post modal
async function showUpdateModal(postId) {
  currentPostId = postId;
  try {
    const response = await fetch(`${API_POSTS}/${postId}`);
    const post = await response.json();
    document.getElementById("update-post-title").value = post.title;
    document.getElementById("update-post-desc").value = post.description;
    document.getElementById("update-post-link").value = post.link;
    document.getElementById("update-post-image").value = post.image;
    document.getElementById("update-post-category").value = post.category || "Other";
    updatePostModal.show();
  } catch (error) {
    alert("Failed to load post data");
  }
}

// Handle update post submission
document.getElementById("update-post-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const button = e.target.querySelector("button");
  toggleButtonLoading(button, true);
  try {
    const response = await fetch(`${API_POSTS}/${currentPostId}`);
    const post = await response.json();
    post.title = document.getElementById("update-post-title").value;
    post.description = document.getElementById("update-post-desc").value;
    post.link = document.getElementById("update-post-link").value;
    post.image = document.getElementById("update-post-image").value;
    post.category = document.getElementById("update-post-category").value;
    const updateResponse = await fetch(`${API_POSTS}/${currentPostId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(post),
    });
    if (updateResponse.ok) {
      updatePostModal.hide();
      loadPosts("admin");
      showToast("Post updated successfully!");
    } else {
      alert("Failed to update post");
    }
  } catch (error) {
    alert("An error occurred. Please try again.");
  } finally {
    toggleButtonLoading(button, false);
  }
});

// Logout
function logout() {
  currentUser = null;
  document.getElementById("admin-dashboard").classList.add("d-none");
  document.getElementById("user-dashboard").classList.add("d-none");
  document.getElementById("auth-section").classList.add("d-none");
  document.getElementById("captcha-section").classList.add("d-none");
  document.getElementById("landing-page").classList.remove("d-none");
  document.getElementById("navbar").classList.add("d-none");
  document.getElementById("user-avatar").classList.add("d-none");
  showToast("Logged out successfully!");
}