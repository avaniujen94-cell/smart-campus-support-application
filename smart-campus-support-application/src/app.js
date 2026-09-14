const loginScreen = document.getElementById("loginScreen");
const app = document.getElementById("app");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const navMenu = document.getElementById("navMenu");
const globalSearch = document.getElementById("globalSearch");

const reportIssueBtn = document.getElementById("reportIssueBtn");
const reportModal = document.getElementById("reportModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const submitIssueBtn = document.getElementById("submitIssueBtn");

loginBtn.addEventListener("click", () => {
  loginScreen.classList.add("hidden");
  app.classList.remove("hidden");
});

logoutBtn.addEventListener("click", () => {
  app.classList.add("hidden");
  loginScreen.classList.remove("hidden");
  navMenu.classList.remove("open");
});

mobileMenuBtn.addEventListener("click", () => {
  navMenu.classList.toggle("open");
});

document.querySelectorAll("nav a").forEach(link => {
  link.addEventListener("click", () => navMenu.classList.remove("open"));
});

document.querySelectorAll("[data-scroll]").forEach(button => {
  button.addEventListener("click", () => {
    document.getElementById(button.dataset.scroll)?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });
});

globalSearch.addEventListener("input", () => {
  const value = globalSearch.value.trim().toLowerCase();

  document.querySelectorAll(".searchable").forEach(item => {
    const content = (item.dataset.search + " " + item.textContent).toLowerCase();
    item.classList.toggle("search-hidden", value && !content.includes(value));
  });
});

reportIssueBtn.addEventListener("click", () => {
  reportModal.classList.remove("hidden");
});

closeModalBtn.addEventListener("click", () => {
  reportModal.classList.add("hidden");
});

reportModal.addEventListener("click", event => {
  if (event.target === reportModal) {
    reportModal.classList.add("hidden");
  }
});

submitIssueBtn.addEventListener("click", () => {
  const issueDetails = document.getElementById("issueDetails").value.trim();

  if (!issueDetails) {
    alert("Please enter a short description.");
    return;
  }

  alert("Issue recorded in the front-end prototype. Database connection will be added later.");
  document.getElementById("issueDetails").value = "";
  reportModal.classList.add("hidden");
});

/*
  BACKEND INTEGRATION NOTES FOR SUBHAM

  Later, replace the mock content with calls to the Java backend.

  Suggested endpoints:

  GET    /api/announcements
  GET    /api/events
  GET    /api/locations
  GET    /api/support-services
  POST   /api/feedback
  POST   /api/login

  Example:

  fetch("/api/announcements")
    .then(response => response.json())
    .then(data => {
      // render announcements here
    });
*/
