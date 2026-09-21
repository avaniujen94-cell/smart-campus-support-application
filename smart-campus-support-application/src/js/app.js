// Get HTML elements
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

const passwordInput = document.getElementById("password");

const lengthCheck = document.getElementById("lengthCheck");
const letterCheck = document.getElementById("letterCheck");
const numberCheck = document.getElementById("numberCheck");
const symbolCheck = document.getElementById("symbolCheck");
const issueType = document.getElementById("issueType");
const issueDetails = document.getElementById("issueDetails");
const reportError = document.getElementById("reportError");

// Keep user logged in while testing
if (sessionStorage.getItem("loggedIn") === "true") {
  loginScreen.classList.add("hidden");
  app.classList.remove("hidden");
}


// Password requirements
passwordInput.addEventListener("input", () => {

  const password = passwordInput.value;

  updateRequirement(
    lengthCheck,
    password.length >= 10,
    "At least 10 characters"
  );

  updateRequirement(
    letterCheck,
    /[A-Za-z]/.test(password),
    "At least one letter"
  );

  updateRequirement(
    numberCheck,
    /[0-9]/.test(password),
    "At least one number"
  );

  updateRequirement(
    symbolCheck,
    /[^A-Za-z0-9]/.test(password),
    "At least one symbol"
  );

});

function updateRequirement(element, valid, text) {

  if (valid) {

    element.textContent = "✔ " + text;
    element.classList.add("requirement-valid");
    element.classList.remove("requirement-invalid");

  } else {

    element.textContent = "✖ " + text;
    element.classList.add("requirement-invalid");
    element.classList.remove("requirement-valid");

  }

}


// Login validation and Java backend authentication
loginBtn.addEventListener("click", async () => {

  const email = document
    .getElementById("email")
    .value
    .trim()
    .toLowerCase();

  const password = document.getElementById("password").value;
  const loginError = document.getElementById("loginError");

  const validEmail =
    /^[a-zA-Z0-9._%+-]+@notredame\.edu\.au$/;

  const hasLength = password.length >= 10;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  if (!validEmail.test(email)) {
    loginError.textContent =
      "Please enter a valid Notre Dame email ending with @notredame.edu.au";
    return;
  }

  if (!hasLength || !hasLetter || !hasNumber || !hasSymbol) {
    loginError.textContent =
      "Invalid password. Please meet all password requirements below.";
    return;
  }

  loginError.textContent = "Logging in...";

  try {

    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: email,
        password: password
      })
    });

    const data = await response.json();

    if (data.success) {

      sessionStorage.setItem("loggedIn", "true");
      sessionStorage.setItem("user", JSON.stringify(data.user));

      loginError.textContent = "";

      loginScreen.classList.add("hidden");
      app.classList.remove("hidden");

    } else {

      loginError.textContent =
        data.message || "Invalid email or password.";

    }

  } catch (error) {

    console.error("Login error:", error);

    loginError.textContent =
      "Unable to connect to the Java backend.";

  }

});


// Logout
logoutBtn.addEventListener("click", () => {

  app.classList.add("hidden");
  loginScreen.classList.remove("hidden");
  navMenu.classList.remove("open");
  sessionStorage.removeItem("loggedIn");

});


// Mobile navigation
mobileMenuBtn.addEventListener("click", () => {

  navMenu.classList.toggle("open");

});

document.querySelectorAll("nav a").forEach(link => {

  link.addEventListener("click", () => {

    navMenu.classList.remove("open");

  });

});


// Quick action buttons
document.querySelectorAll("[data-scroll]").forEach(button => {

  button.addEventListener("click", () => {

    document
      .getElementById(button.dataset.scroll)
      ?.scrollIntoView({

        behavior: "smooth",
        block: "start"

      });

  });

});


// Global search
globalSearch.addEventListener("input", () => {

  const value = globalSearch.value
    .trim()
    .toLowerCase();

  document.querySelectorAll(".searchable").forEach(item => {

    const content =
      (item.dataset.search + " " + item.textContent)
        .toLowerCase();

    item.classList.toggle(
      "search-hidden",
      value && !content.includes(value)
    );

  });

});

// Announcements
const announcementToggle = document.getElementById("announcementToggle");

async function loadAnnouncements() {

  try {

    const response = await fetch("/api/announcements");
    const announcements = await response.json();

    // Find the existing announcement items
    const existingItems =
      document.querySelectorAll(".announcement-item");

    if (existingItems.length === 0) {
      console.error("Announcement items were not found in the HTML.");
      return;
    }

    // Use the parent container of the existing announcements
    const container = existingItems[0].parentElement;

    // Remove existing hardcoded announcements
    container.querySelectorAll(".announcement-item").forEach(item => {
      item.remove();
    });

    // Create announcements from the database
    announcements.forEach((announcement, index) => {

      const item = document.createElement("div");

      item.className =
        "announcement-item searchable" +
        (index >= 3 ? " extra-announcement hidden" : "");

      item.dataset.title = announcement.title;
      item.dataset.date = announcement.date;
      item.dataset.details = announcement.content;

      item.innerHTML = `
        <h3>${announcement.title}</h3>
        <p>${announcement.date}</p>
      `;

      container.appendChild(item);

      // Open announcement details
      item.addEventListener("click", () => {

        announcementTitle.textContent =
          announcement.title;

        announcementDate.textContent =
          announcement.date;

        announcementDetails.textContent =
          announcement.content;

        announcementModal.classList.remove("hidden");

      });

    });

  } catch (error) {

    console.error(
      "Unable to load announcements:",
      error
    );

  }

}


// Show / hide announcements
announcementToggle.addEventListener("click", () => {

  const extraAnnouncements =
    document.querySelectorAll(".extra-announcement");

  if (extraAnnouncements.length === 0) {
    return;
  }

  const isHidden =
    extraAnnouncements[0].classList.contains("hidden");

  extraAnnouncements.forEach(item => {
    item.classList.toggle("hidden");
  });

  announcementToggle.textContent =
    isHidden ? "Show Less" : "View All";

});


loadAnnouncements();
// Load events from Java backend
async function loadEvents() {

  try {

    const response = await fetch("/api/events");

    if (!response.ok) {
      throw new Error("Failed to load events");
    }

    const events = await response.json();

    const existingItems =
      document.querySelectorAll(".event-item");

    if (existingItems.length === 0) {
      console.error("Event items were not found in the HTML.");
      return;
    }

    // Use the existing event container
    const container = existingItems[0].parentElement;

    // Remove hardcoded events
    container.querySelectorAll(".event-item").forEach(item => {
      item.remove();
    });

    // Create events using database data
    events.forEach((event, index) => {

      const item = document.createElement("div");

      item.className =
        "event-item searchable event-click" +
        (index >= 3 ? " extra-event hidden" : "");

      item.dataset.title = event.name;
      item.dataset.date = event.date;
      item.dataset.time = event.time;
      item.dataset.location = event.location;
      item.dataset.details = event.description;

      item.innerHTML = `
        <h3>${event.name}</h3>
        <p>${event.date} | ${event.time}</p>
        <p>${event.location}</p>
      `;

      container.appendChild(item);

      // Event details
      item.addEventListener("click", () => {

        eventTitle.textContent = event.name;

        eventDate.textContent =
          "Date: " + event.date;

        eventTime.textContent =
          "Time: " + event.time;

        eventLocation.textContent =
          "Location: " + event.location;

        eventDetails.textContent =
          event.description;

        eventModal.classList.remove("hidden");

      });

    });

    console.log("Events loaded successfully from database.");

  } catch (error) {

    console.error(
      "Unable to load events:",
      error
    );

  }

}

loadEvents();
// Campus map
const locationSearch = document.getElementById("locationSearch");
const locationSearchBtn = document.getElementById("locationSearchBtn");
const locationResult = document.getElementById("locationResult");

// Load campus locations from Java backend
let campusLocations = [];

async function loadCampusLocations() {

  try {

    const response = await fetch("/api/locations");

    if (!response.ok) {
      throw new Error("Failed to load campus locations");
    }

    campusLocations = await response.json();

    console.log(
      "Campus locations loaded successfully from database."
    );

  } catch (error) {

    console.error(
      "Unable to load campus locations:",
      error
    );

  }

}


// Find a campus location
function findLocation(searchText) {

  const search = searchText.trim().toLowerCase();

  if (search === "") {

    locationResult.textContent =
      "Please enter a building or room.";

    return;
  }

  const location = campusLocations.find(item => {

    const building = item.building.toLowerCase();
    const locationName = item.location.toLowerCase();
    const description = item.description.toLowerCase();

    return (
      building.includes(search) ||
      search.includes(building) ||
      locationName.includes(search) ||
      search.includes(locationName) ||
      description.includes(search)
    );

  });

  if (location) {

    locationResult.textContent =
      `${location.building} — ${location.location}. ${location.description}`;

  } else {

    locationResult.textContent =
      "Location not found in the current campus map.";

  }
}


// Load locations when the application starts
loadCampusLocations();

locationSearchBtn.addEventListener("click", () => {
  findLocation(locationSearch.value);
});

locationSearch.addEventListener("keydown", event => {

  if (event.key === "Enter") {
    findLocation(locationSearch.value);
  }

});

document.querySelectorAll(".map-marker").forEach(marker => {

  marker.addEventListener("click", () => {

    locationSearch.value = marker.dataset.location;

    findLocation(marker.dataset.location);

  });

});

// Support services
const supportModal = document.getElementById("supportModal");
const supportTitle = document.getElementById("supportTitle");
const supportEmail = document.getElementById("supportEmail");
const supportPhone = document.getElementById("supportPhone");
const supportLocation = document.getElementById("supportLocation");
const closeSupportBtn = document.getElementById("closeSupportBtn");
const copySupportBtn = document.getElementById("copySupportBtn");

document.querySelectorAll(".help-btn").forEach(button => {

  button.addEventListener("click", () => {

    supportTitle.textContent = button.dataset.service;
    supportEmail.textContent = button.dataset.email;
    supportPhone.textContent = button.dataset.phone;
    supportLocation.textContent = button.dataset.location;

    supportModal.classList.remove("hidden");

  });

});

closeSupportBtn.addEventListener("click", () => {
  supportModal.classList.add("hidden");
});

supportModal.addEventListener("click", event => {

  if (event.target === supportModal) {
    supportModal.classList.add("hidden");
  }

});

copySupportBtn.addEventListener("click", () => {

  const contactDetails =
    "Email: " + supportEmail.textContent +
    "\nPhone: " + supportPhone.textContent +
    "\nLocation: " + supportLocation.textContent;

  navigator.clipboard.writeText(contactDetails);

  copySupportBtn.textContent = "Copied!";

  setTimeout(() => {
    copySupportBtn.textContent = "Copy Contact Details";
  }, 1500);

});

// Report issue
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


// Report issue submission
submitIssueBtn.addEventListener("click", () => {

  if (issueType.value === "") {
    reportError.textContent = "Please select an issue type.";
    return;
  }

  if (issueDetails.value.trim().length < 10) {
    reportError.textContent =
      "Please describe the issue using at least 10 characters.";
    return;
  }

  reportError.textContent = "";

  alert("Your issue has been submitted successfully.");

  issueType.value = "";
  issueDetails.value = "";

  reportModal.classList.add("hidden");

});


// Show or hide password
const togglePassword =
  document.getElementById("togglePassword");

togglePassword.addEventListener("click", () => {

  if (passwordInput.type === "password") {

    passwordInput.type = "text";
    togglePassword.textContent = "Hide";

  } else {

    passwordInput.type = "password";
    togglePassword.textContent = "Show";

  }

});

// Events
const eventToggle = document.getElementById("eventToggle");

eventToggle.addEventListener("click", () => {

  const extraEvents = document.querySelectorAll(".extra-event");

  const isHidden = extraEvents[0].classList.contains("hidden");

  extraEvents.forEach(item => {
    item.classList.toggle("hidden");
  });

  eventToggle.textContent =
    isHidden ? "Show Less" : "View All";

});

// Event details
const eventModal = document.getElementById("eventModal");
const eventTitle = document.getElementById("eventTitle");
const eventDate = document.getElementById("eventDate");
const eventTime = document.getElementById("eventTime");
const eventLocation = document.getElementById("eventLocation");
const eventDetails = document.getElementById("eventDetails");
const closeEventBtn = document.getElementById("closeEventBtn");

document.querySelectorAll(".event-click").forEach(item => {

  item.addEventListener("click", () => {

    eventTitle.textContent = item.dataset.title;
    eventDate.textContent = "Date: " + item.dataset.date;
    eventTime.textContent = "Time: " + item.dataset.time;
    eventLocation.textContent = "Location: " + item.dataset.location;
    eventDetails.textContent = item.dataset.details;

    eventModal.classList.remove("hidden");

  });

});

closeEventBtn.addEventListener("click", () => {
  eventModal.classList.add("hidden");
});

eventModal.addEventListener("click", event => {

  if (event.target === eventModal) {
    eventModal.classList.add("hidden");
  }

});

// Notifications
const notificationBtn = document.getElementById("notificationBtn");
const notificationMenu = document.getElementById("notificationMenu");
const notificationCount = document.getElementById("notificationCount");
const markReadBtn = document.getElementById("markReadBtn");

const notificationDetails =
  document.getElementById("notificationDetails");

const notificationDetailTitle =
  document.getElementById("notificationDetailTitle");

const notificationDetailText =
  document.getElementById("notificationDetailText");


function updateNotificationCount() {

  const unread =
    document.querySelectorAll(".notification-item:not(.read)").length;

  notificationCount.textContent = unread;

  if (unread === 0) {
    notificationCount.classList.add("hidden");
  } else {
    notificationCount.classList.remove("hidden");
  }

}


notificationBtn.addEventListener("click", event => {

  event.stopPropagation();

  notificationMenu.classList.toggle("hidden");

});


notificationMenu.addEventListener("click", event => {
  event.stopPropagation();
});


document.querySelectorAll(".notification-item").forEach(item => {

  item.addEventListener("click", () => {

    if (!item.classList.contains("read")) {
      item.classList.add("read");
      updateNotificationCount();
    }

    notificationDetailTitle.textContent =
      item.dataset.title;

    notificationDetailText.textContent =
      item.dataset.details;

    notificationDetails.classList.remove("hidden");

  });

});


markReadBtn.addEventListener("click", () => {

  document.querySelectorAll(".notification-item").forEach(item => {
    item.classList.add("read");
  });

  updateNotificationCount();

});


document.addEventListener("click", event => {

  if (
    !notificationMenu.contains(event.target) &&
    !notificationBtn.contains(event.target)
  ) {
    notificationMenu.classList.add("hidden");
  }

});


updateNotificationCount();

