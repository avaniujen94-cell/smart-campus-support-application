const loginPage = document.getElementById("loginPage");
const app = document.getElementById("app");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

const menuBtn = document.getElementById("menuBtn");
const mainNav = document.getElementById("mainNav");

const searchInput = document.getElementById("searchInput");

const reportBtn = document.getElementById("reportBtn");
const reportModal = document.getElementById("reportModal");
const closeModal = document.getElementById("closeModal");
const submitIssue = document.getElementById("submitIssue");


// ================================
// LOGIN
// ================================

loginBtn.addEventListener("click", async () => {

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
        alert("Please enter your email and password.");
        return;
    }

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

        const result = await response.json();

        if (response.ok && result.success) {

            loginPage.classList.add("hidden");
            app.classList.remove("hidden");

        } else {

            alert(result.message || "Invalid email or password.");

        }

    } catch (error) {

        console.error(error);

        alert("Unable to connect to the Java backend.");

    }

});


// ================================
// LOGOUT
// ================================

logoutBtn.addEventListener("click", () => {

    app.classList.add("hidden");
    loginPage.classList.remove("hidden");

    mainNav.classList.remove("open");

});


// ================================
// MOBILE MENU
// ================================

menuBtn.addEventListener("click", () => {

    mainNav.classList.toggle("open");

});


// ================================
// NAVIGATION
// ================================

document.querySelectorAll("#mainNav a").forEach(link => {

    link.addEventListener("click", () => {

        mainNav.classList.remove("open");

    });

});


// ================================
// QUICK ACTIONS
// ================================

document.querySelectorAll(".quick-card[data-target]").forEach(button => {

    button.addEventListener("click", () => {

        const target = document.getElementById(button.dataset.target);

        if (target) {

            target.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }

    });

});


// ================================
// SEARCH
// ================================

searchInput.addEventListener("input", () => {

    const value = searchInput.value.trim().toLowerCase();

    document.querySelectorAll(".searchable-item").forEach(item => {

        const searchText =
            (item.dataset.search || "") +
            " " +
            item.textContent;

        const matches =
            searchText.toLowerCase().includes(value);

        item.style.display = matches ? "" : "none";

    });

});


// ================================
// REPORT ISSUE MODAL
// ================================

reportBtn.addEventListener("click", () => {

    reportModal.classList.remove("hidden");

});


closeModal.addEventListener("click", () => {

    reportModal.classList.add("hidden");

});


reportModal.addEventListener("click", event => {

    if (event.target === reportModal) {

        reportModal.classList.add("hidden");

    }

});


// ================================
// SUBMIT ISSUE
// ================================

submitIssue.addEventListener("click", async () => {

    const issueType =
        document.getElementById("issueType").value;

    const issueText =
        document.getElementById("issueText").value.trim();


    if (!issueText) {

        alert("Please describe the issue.");

        return;

    }


    try {

        const response = await fetch("/api/feedback", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                user_id: 1,
                subject: issueType,
                description: issueText,
                type: "Issue"

            })

        });


        const result = await response.json();


        if (response.ok && result.success) {

            alert("Issue submitted successfully.");

            document.getElementById("issueText").value = "";

            reportModal.classList.add("hidden");

        } else {

            alert(result.message || "Unable to submit issue.");

        }

    } catch (error) {

        console.error(error);

        alert("Unable to connect to the Java backend.");

    }

});


// ================================
// LOAD ANNOUNCEMENTS
// ================================

async function loadAnnouncements() {

    try {

        const response =
            await fetch("/api/announcements");

        const announcements =
            await response.json();

        console.log("Announcements:", announcements);

    } catch (error) {

        console.error(
            "Error loading announcements:",
            error
        );

    }

}


// ================================
// LOAD EVENTS
// ================================

async function loadEvents() {

    try {

        const response =
            await fetch("/api/events");

        const events =
            await response.json();

        console.log("Events:", events);

    } catch (error) {

        console.error(
            "Error loading events:",
            error
        );

    }

}


// ================================
// LOAD CAMPUS LOCATIONS
// ================================

async function loadCampusLocations() {

    try {

        const response =
            await fetch("/api/locations");

        const locations =
            await response.json();

        console.log("Campus locations:", locations);

    } catch (error) {

        console.error(
            "Error loading campus locations:",
            error
        );

    }

}


// ================================
// LOAD SUPPORT SERVICES
// ================================

async function loadSupportServices() {

    try {

        const response =
            await fetch("/api/support-services");

        const services =
            await response.json();

        console.log("Support services:", services);

    } catch (error) {

        console.error(
            "Error loading support services:",
            error
        );

    }

}


// ================================
// INITIAL DATA LOAD
// ================================

loadAnnouncements();
loadEvents();
loadCampusLocations();
loadSupportServices();