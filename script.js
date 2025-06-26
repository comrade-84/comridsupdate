
const API_USERS = "https://6852ac200594059b23ce9d1f.mockapi.io/users";
const API_POSTS = "https://6852ac200594059b23ce9d1f.mockapi.io/posts";
const API_CHATS = "https://685578c26a6ef0ed663299f6.mockapi.io/chats/chatss";
const WHATSAPP_LINK = "https://wa.me/+2348124080834";





// Constants for error messages
const ERROR_MESSAGES = {
  INVALID_EMAIL: "Please enter a valid email address",
  WEAK_PASSWORD: "Password must be at least 8 characters long",
  PASSWORD_MISMATCH: "Passwords do not match",
  REQUIRED_FIELD: "This field is required",
  INVALID_CAPTCHA: "Invalid CAPTCHA answer",
  SERVER_ERROR: "An unexpected error occurred. Please try again later."
};

let currentUser = null;
let currentPostId = null;
let allPosts = [];
let captchaData = {};
let signupEmail = "";
const commentModal = new bootstrap.Modal(document.getElementById("commentModal"));
const updatePostModal = new bootstrap.Modal(document.getElementById("updatePostModal"));
const notificationModal = new bootstrap.Modal(document.getElementById("notificationModal"));
const detailModal = new bootstrap.Modal(document.getElementById("detailModal"));
let toast;
document.addEventListener('DOMContentLoaded', function() {
  const toastElement = document.getElementById("appToast");
  if (toastElement) {
    toast = new bootstrap.Toast(toastElement);
  }
});
let chatInterval = null;



// Show toast notification
function showToast(message) {
  const toastMsgElem = document.getElementById("toast-message");
  if (toastMsgElem) toastMsgElem.textContent = message;
  if (toast) toast.show();
}

// Toggle button loading state
function toggleButtonLoading(button, isLoading) {
  if (!button) return; // Return early if button is null
  const spinner = button.querySelector(".spinner-border");
  if (spinner) { // Only proceed if spinner exists
    if (isLoading) {
      button.disabled = true;
      spinner.classList.remove("d-none");
    } else {
      button.disabled = false;
      spinner.classList.add("d-none");
    }
  }
}

// Generate CAPTCHA
function generateCaptcha() {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  captchaData = { question: `${a} + ${b}`, answer: a + b };
  document.getElementById("captcha-question").textContent = captchaData.question;
}

// Show auth section with mode
function showAuth(mode) {
  document.getElementById("landing-page").classList.add("d-none");
  document.getElementById("navbar").classList.add("d-none");
  if (mode === "signup") {
    document.getElementById("signup-section").classList.remove("d-none");
    document.getElementById("login-section").classList.add("d-none");
  } else if (mode === "login") {
    document.getElementById("login-section").classList.remove("d-none");
    document.getElementById("signup-section").classList.add("d-none");
  }
}

// Handle signup form submission
document.getElementById("signup-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const button = form.querySelector("button[type='submit']");
  const name = form.querySelector("#signup-name").value.trim();
  const email = form.querySelector("#signup-email").value.trim();
  const password = form.querySelector("#signup-password").value;
  const confirmPassword = form.querySelector("#signup-confirm-password").value;

  // Form validation
  if (!name) {
    showToast(ERROR_MESSAGES.REQUIRED_FIELD);
    return;
  }

  if (!email || !isValidEmail(email)) {
    showToast(ERROR_MESSAGES.INVALID_EMAIL);
    return;
  }

  if (password.length < 8) {
    showToast(ERROR_MESSAGES.WEAK_PASSWORD);
    return;
  }

  if (password !== confirmPassword) {
    showToast(ERROR_MESSAGES.PASSWORD_MISMATCH);
    return;
  }

  toggleButtonLoading(button, true);

  try {
    const role = "user";
    const response = await fetch(API_USERS, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + localStorage.getItem("authToken")
      },
      body: JSON.stringify({ email, password, role, name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Signup failed");
    }

    const data = await response.json();
    signupEmail = email;
    form.reset();
    document.getElementById("signup-section").classList.add("d-none");
    document.getElementById("captcha-section").classList.remove("d-none");
    generateCaptcha();
    showToast("Signup successful! Please verify your email address.");
  } catch (error) {
    console.error('Signup error:', error);
    showToast(error.message || ERROR_MESSAGES.SERVER_ERROR);
  } finally {
    toggleButtonLoading(button, false);
  }
});

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Handle login form submission
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const button = document.getElementById("login-btn");
  toggleButtonLoading(button, true);
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  try {
    const response = await fetch(API_USERS);
    if (!response.ok) throw new Error("Failed to fetch users");
    const users = await response.json();
    const user = users.find((u) => u.email === email && u.password === password);
    if (user) {
      currentUser = user;
      localStorage.setItem("currentUser", JSON.stringify(user));
      showDashboard();
      showToast(`Welcome back, ${user.name}!`);
      document.getElementById("user-avatar").src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;
      document.getElementById("user-avatar").classList.remove("d-none");
      
    } else {
      alert("Invalid email or password");
    }
  } catch (error) {
    alert(`An error occurred: ${error.message}. Please try again.`);
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
    document.getElementById("login-section").classList.remove("d-none");
    document.getElementById("login-email").value = signupEmail;
  } else {
    alert("Incorrect answer. Try again.");
    generateCaptcha();
    document.getElementById("captcha-form").reset();
  }
  toggleButtonLoading(button, false);
});

// Check login status on page load
async function checkLoginStatus() {
  const storedUser = localStorage.getItem("currentUser");
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      const response = await fetch(`${API_USERS}/${user.id}`);
      if (!response.ok) throw new Error("Failed to fetch user data");
      const validUser = await response.json();
      if (validUser && validUser.email === user.email) {
        currentUser = validUser;
        showDashboard();
        document.getElementById("user-avatar").src = `https://ui-avatars.com/api/?name=${encodeURIComponent(validUser.name)}&background=random`;
        document.getElementById("user-avatar").classList.remove("d-none");
      } else {
        handleLogout();
      }
    } catch (error) {
      console.error('Login status check failed:', error);
      handleLogout();
    }
  } else {
    showLandingPage();
  }
}

function handleLogout() {
  localStorage.removeItem("currentUser");
  currentUser = null;
  showLandingPage();
  showToast("You have been logged out");
}

function showLandingPage() {
  document.getElementById("landing-page").classList.remove("d-none");
  document.getElementById("navbar").classList.add("d-none");
  document.getElementById("signup-section").classList.add("d-none");
  document.getElementById("login-section").classList.add("d-none");
  document.getElementById("captcha-section").classList.add("d-none");
  document.getElementById("admin-dashboard").classList.add("d-none");
  document.getElementById("user-dashboard").classList.add("d-none");
  document.getElementById("chat-section").classList.add("d-none");
}

// Show appropriate dashboard
function showDashboard() {
  document.getElementById("signup-section").classList.add("d-none");
  document.getElementById("login-section").classList.add("d-none");
  document.getElementById("captcha-section").classList.add("d-none");
  document.getElementById("chat-section").classList.add("d-none");
  document.getElementById("landing-page").classList.add("d-none"); // Ensure hero section is hidden
  document.getElementById("navbar").classList.remove("d-none");
  if (currentUser.role === "admin") {
    document.getElementById("admin-dashboard").classList.remove("d-none");
    loadPosts("admin");
  } else {
    document.getElementById("user-dashboard").classList.remove("d-none");
    loadPosts("user");
  }
}

// Show chat section
function showChat() {
  document.getElementById("admin-dashboard").classList.add("d-none");
  document.getElementById("user-dashboard").classList.add("d-none");
  document.getElementById("chat-section").classList.remove("d-none");
  loadChats();
  if (!chatInterval) {
    chatInterval = setInterval(loadChats, 10000); // Poll every 20 seconds
  }
}

// Add emoji to chat input
function addEmoji(emoji) {
  const chatInput = document.getElementById("chat-input");
  chatInput.value += emoji;
  chatInput.focus();
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
      showToast("Post updated successfully!");
    } else {
      alert("Failed to post update");
    }
  } catch (error) {
    alert("An error occurred. Please try again.");
  } finally {
    toggleButtonLoading(button, false);
  }
});

// Load posts and update notifications
async function loadPosts(type) {
  try {
    const response = await fetch(API_POSTS);
    allPosts = await response.json();
    renderPosts(type, allPosts);
    updateNotificationBadge();
  } catch (error) {
    alert("Failed to load posts");
  }
}

// Render posts with optional filtering and equal height
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
      if (diffDays <= 5) {
        timestampBadge = '<span class="badge bg-success timestamp-badge">New</span>';
      } else if (diffDays > 5) {
        timestampBadge = '<span class="badge bg-secondary timestamp-badge">6+ days ago</span>';
      }
    }
    const shortDesc = post.description.length > 120 ? post.description.substring(0, 120) + "..." : post.description;
    const showMoreBtn = post.description.length > 120 ? `<button class="btn btn-sm btn-outline-light mt-2" onclick="showDetailModal('${post.id}')">Show More</button>` : '';
    const card = `
      <div class="col-md-4 mb-4">
        <div class="card h-100">
          <img src="${post.image}" class="card-img-top" alt="Web3 Update" style="height: 200px; object-fit: cover;">
          <div class="card-body d-flex flex-column">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h5 class="card-title mb-0">${post.title}</h5>
              <div>
                <span class="badge bg-primary category-badge">${post.category || 'Other'}</span>
                ${timestampBadge}
              </div>
            </div>
            <p class="card-text flex-grow-1">${shortDesc}</p>
            ${post.description.length > 120 ? `
              <div class="d-flex justify-content-center mt-2">
                <button class="btn btn-sm btn-outline-light" onclick="showDetailModal('${post.id}')">
                  <i class="bi bi-eye"></i> Show More
                </button>
              </div>
            ` : ''}
            <div class="post-buttons mt-3">
              <a href="${post.link}" target="_blank" class="btn btn-primary btn-sm">Visit Link</a>
              ${
                type === "user"
                  ? `<a href="${WHATSAPP_LINK}" target="_blank" class="btn btn-outline-light btn-sm">Message Admin</a>`
                  : ""
              }
            </div>
            ${
              type === "user"
                ? `
                <div class="d-flex justify-content-between align-items-center mt-3">
                  <button class="btn btn-outline-light btn-sm" onclick="likePost('${post.id}', this)">
                    <span class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span>
                    <i class="bi bi-heart-fill"></i> ${post.likes}
                  </button>
                  <button class="btn btn-outline-light btn-sm comment-btn" data-post-id="${post.id}">
                    <i class="bi bi-chat"></i> ${post.comments.length}
                  </button>
                  <button class="btn btn-outline-light btn-sm" onclick="sharePost('${post.id}', this)">
                    <span class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span>
                    <i class="bi bi-share"></i>
                  </button>
                </div>
              `
                : `
                <div class="post-buttons mt-3">
                  <button class="btn btn-warning btn-sm" onclick="showUpdateModal('${post.id}')">
                    <span class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span>
                    Update Post
                  </button>
                  <button class="btn btn-danger btn-sm" onclick="deletePost('${post.id}', this)">
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

  // Attach comment button event listeners
  container.querySelectorAll('.comment-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const postId = this.getAttribute('data-post-id');
      const post = posts.find(p => p.id == postId);
      if (post) showComments(post);
    });
  });
  // Attach update button event listeners (admin)
  container.querySelectorAll('.btn-warning').forEach(btn => {
    btn.addEventListener('click', function() {
      const postId = this.getAttribute('onclick')?.match(/'(.*?)'/)?.[1];
      if (postId) showUpdateModal(postId);
    });
  });
}

// Update notification badge
function updateNotificationBadge() {
  if (!currentUser) return;
  const badge = document.getElementById("notification-badge");
  if (!badge) return;
  const lastSeenKey = `notifications_last_seen_${currentUser.email}`;
  const lastSeen = localStorage.getItem(lastSeenKey);
  const unseen = allPosts.filter(post => new Date(post.createdAt) > new Date(lastSeen || 0));
  if (unseen.length > 0) {
    badge.textContent = unseen.length;
    badge.classList.remove("d-none");
  } else {
    badge.classList.add("d-none");
    badge.textContent = 0;
  }
}

// Show notifications
function showNotifications() {
  try {
    if (!currentUser) return;
    const notificationList = document.getElementById("notification-list");
    if (!notificationList) return;
    const lastSeenKey = `notifications_last_seen_${currentUser.email}`;
    const lastSeen = localStorage.getItem(lastSeenKey);
    // Find new posts since last seen
    const newPosts = allPosts.filter(post => new Date(post.createdAt) > new Date(lastSeen || 0));
    if (newPosts.length === 0) {
      notificationList.innerHTML = '<div class="text-center text-muted">No new updates.</div>';
    } else {
      notificationList.innerHTML = newPosts.map(post => `
        <div class="card mb-2">
          <div class="card-body">
            <h6 class="card-title mb-1">${post.title}</h6>
            <p class="card-text mb-1">${post.description}</p>
            <span class="badge bg-primary">${post.category}</span>
            <small class="text-muted float-end">${new Date(post.createdAt).toLocaleString()}</small>
          </div>
        </div>
      `).join('');
    }
    // Mark all as seen
    localStorage.setItem(lastSeenKey, new Date().toISOString());
    updateNotificationBadge();
    notificationModal.show();
  } catch (error) {
    console.error('Error showing notifications:', error);
    showToast('Failed to show notifications');
  }
    return postDate > lastViewedDate && postDate >= new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
  };


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
      body: JSON.stringify(post)
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
    if (!response.ok) throw new Error("Failed to fetch users");
    const users = await response.json();
    return users.find((u) => u.email === email) || { name: "Unknown User" };
  } catch (error) {
    return { name: "Unknown User" };
  }
}

// Show comments in modal
async function showComments(post) {
  currentPostId = post.id;
  try {
    const commentsContainer = document.getElementById("modal-comments");
    if (!commentsContainer) return;
    commentsContainer.innerHTML = "";
    if (!post.comments || post.comments.length === 0) {
      commentsContainer.innerHTML = '<p class="mb-0"><small>No comments yet.</small></p>';
    } else {
      for (const comment of post.comments) {
        const user = await getUserByEmail(comment.email);
        commentsContainer.innerHTML += `
          <div class="d-flex align-items-start mb-2">
            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random" class="avatar" alt="${user.name}">
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
    showToast("Failed to load comments");
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
      body: JSON.stringify(post)
    });
    if (updateResponse.ok) {
      document.getElementById("comment-form").reset();
      const updatedPostResponse = await fetch(`${API_POSTS}/${currentPostId}`);
const updatedPost = await updatedPostResponse.json();
showComments(updatedPost);
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
  try {
    let post = allPosts.find((p) => p.id === postId);
    if (!post) {
      // Fallback: fetch post if not in allPosts
      const response = await fetch(`${API_POSTS}/${postId}`);
      if (!response.ok) throw new Error('Failed to fetch post');
      post = await response.json();
    }
    document.getElementById("update-post-title").value = post.title || '';
    document.getElementById("update-post-desc").value = post.description || '';
    document.getElementById("update-post-link").value = post.link || '';
    document.getElementById("update-post-image").value = post.image || '';
    document.getElementById("update-post-category").value = post.category || '';
    currentPostId = postId;
    updatePostModal.show();
  } catch (error) {
    console.error('Error loading post for update:', error);
    showToast('Failed to load post for update');
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

// Load chats
async function loadChats() {
  try {
    const response = await fetch(API_CHATS);
    const chats = await response.json();
    const chatContainer = document.getElementById("chat-messages");
    chatContainer.innerHTML = "";
    if (chats.length === 0) {
      chatContainer.innerHTML = '<p class="text-center">No messages yet.</p>';
    } else {
      for (const chat of chats) {
        const user = await getUserByEmail(chat.userEmail);
        chatContainer.innerHTML += `
          <div class="chat-message">
            <div class="d-flex align-items-start">
              <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random" class="avatar" alt="${user.name}">
              <div>
                <strong>${user.name}</strong>
                <p class="mb-0"><small>${chat.message}</small></p>
                <small class="text-muted">${new Date(chat.createdAt).toLocaleTimeString()}</small>
              </div>
            </div>
          </div>
        `;
      }
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  } catch (error) {
    alert("Failed to load chats");
  }
}

// Handle chat submission
document.getElementById("chat-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const button = document.getElementById("chat-submit-btn");
  toggleButtonLoading(button, true);
  const message = document.getElementById("chat-input").value;
  try {
    const response = await fetch(API_CHATS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userEmail: currentUser.email,
        userName: currentUser.name,
        message,
        createdAt: new Date().toISOString(),
      }),
    });
    if (response.ok) {
      document.getElementById("chat-form").reset();
      loadChats();
      showToast("Message sent!");
    } else {
      alert("Failed to send message");
    }
  } catch (error) {
    alert("An error occurred. Please try again.");
  } finally {
    toggleButtonLoading(button, false);
  }
});

// Logout
function logout() {
  if (chatInterval) {
    clearInterval(chatInterval);
    chatInterval = null;
  }
  localStorage.removeItem("currentUser");
  currentUser = null;
  document.getElementById("admin-dashboard").classList.add("d-none");
  document.getElementById("user-dashboard").classList.add("d-none");
  document.getElementById("chat-section").classList.add("d-none");
  document.getElementById("signup-section").classList.add("d-none");
  document.getElementById("login-section").classList.add("d-none");
  document.getElementById("captcha-section").classList.add("d-none");
  document.getElementById("landing-page").classList.remove("d-none");
  document.getElementById("navbar").classList.add("d-none");
  document.getElementById("user-avatar").classList.add("d-none");
  showToast("Logged out successfully!");
  
}

// Show detail modal
async function showDetailModal(postId) {
  try {
    const response = await fetch(`${API_POSTS}/${postId}`);
    if (!response.ok) throw new Error('Failed to fetch post');
    const post = await response.json();
    const titleElem = document.getElementById("detailModalLabel");
    const descElem = document.getElementById("detail-description");
    if (!titleElem || !descElem) throw new Error("Modal elements missing");
    titleElem.textContent = post.title;
    descElem.innerHTML = `
      <p class="mb-3">${post.description}</p>
      <div class="d-flex justify-content-between align-items-center">
        <span class="badge bg-primary">${post.category}</span>
        <small class="text-muted">Posted: ${new Date(post.createdAt).toLocaleDateString()}</small>
      </div>
    `;
    detailModal.show();
  } catch (error) {
    console.error('Error loading post details:', error);
    showToast("Failed to load post details");
  }
}

// Show update post modal
async function showUpdateModal(postId) {
  try {
    let post = allPosts.find((p) => p.id === postId);
    if (!post) {
      const response = await fetch(`${API_POSTS}/${postId}`);
      if (!response.ok) throw new Error('Failed to fetch post');
      post = await response.json();
    }
    // Set form fields
    document.getElementById("update-post-title").value = post.title || '';
    document.getElementById("update-post-desc").value = post.description || '';
    document.getElementById("update-post-link").value = post.link || '';
    document.getElementById("update-post-image").value = post.image || '';
    document.getElementById("update-post-category").value = post.category || '';
    currentPostId = postId;
    updatePostModal.show();
  } catch (error) {
    console.error('Error loading post for update:', error);
    showToast('Failed to load post for update');
  }
}



// Show notifications modal
function showNotifications() {
  try {
    notificationModal.show();
  } catch (error) {
    console.error('Error showing notifications:', error);
    showToast('Failed to show notifications');
  }
}

// Add missing handler for delete post
async function deletePost(postId) {
  if (!confirm('Are you sure you want to delete this post?')) return;
  try {
    const response = await fetch(`${API_POSTS}/${postId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete post');
    showToast('Post deleted successfully!');
    loadPosts('admin');
  } catch (error) {
    console.error('Error deleting post:', error);
    showToast('Failed to delete post');
  }
}



// Initialize login status check
checkLoginStatus();