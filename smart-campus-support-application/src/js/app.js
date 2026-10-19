"use strict";


/* =========================================================
   GLOBAL STATE
========================================================= */

let currentUser = null;

let announcements = [];
let events = [];
let campusLocations = [];
let supportServices = [];
let feedbackReports = [];
let myReports = [];

let currentMapCategory = "All";


const notifications = [

    {
        id: 1,
        title: "New event added",
        summary: "Career Fair is now available.",
        description:
            "A new Career Fair has been added to upcoming events.",
        type: "Event",
        icon: "📅",
        time: "Today",
        read: false
    },

    {
        id: 2,
        title: "Announcement updated",
        summary: "Campus information has been updated.",
        description:
            "Visit Announcements to read the latest campus information.",
        type: "Announcement",
        icon: "📢",
        time: "Today",
        read: false
    },

    {
        id: 3,
        title: "Student Support",
        summary: "Support information is available.",
        description:
            "Open Support Services to find contact details.",
        type: "Support",
        icon: "🎧",
        time: "Yesterday",
        read: false
    }

];


/* =========================================================
   BASIC HELPERS
========================================================= */

const byId =
    id =>
        document.getElementById(
            id
        );


const all =
    selector =>
        [
            ...document.querySelectorAll(
                selector
            )
        ];


function escapeHtml(value) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}


function normaliseArray(
    data,
    possibleKeys = []
) {

    if (
        Array.isArray(
            data
        )
    ) {

        return data;
    }


    for (
        const key
        of possibleKeys
    ) {

        if (
            Array.isArray(
                data?.[key]
            )
        ) {

            return data[key];
        }
    }


    if (
        Array.isArray(
            data?.data
        )
    ) {

        return data.data;
    }


    return [];
}


async function safeJson(response) {

    try {

        return await response.json();

    } catch {

        return null;
    }
}


function getFirstName(name) {

    return String(
        name ||
        "User"
    )
        .trim()
        .split(
            /\s+/
        )[0] ||
        "User";
}


function formatDate(value) {

    if (!value) {

        return "Date unavailable";
    }


    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(
            value
        );
    }


    return date.toLocaleDateString(
        "en-AU",
        {
            day:
                "numeric",

            month:
                "short",

            year:
                "numeric"
        }
    );
}


/* =========================================================
   EVENT TIME FORMAT
========================================================= */

function formatEventTime(value) {

    if (!value) {

        return "Time unavailable";
    }


    const time =
        String(
            value
        )
            .trim();


    /*
        If time already has AM or PM,
        keep it as it is.
    */

    if (
        /am|pm/i.test(
            time
        )
    ) {

        return time;
    }


    const parts =
        time.split(
            ":"
        );


    if (
        parts.length <
        2
    ) {

        return time;
    }


    let hour =
        Number(
            parts[0]
        );


    const minutes =
        String(
            parts[1]
        )
            .substring(
                0,
                2
            );


    if (
        Number.isNaN(
            hour
        )
    ) {

        return time;
    }


    const period =
        hour >= 12
            ?
            "PM"
            :
            "AM";


    hour =
        hour % 12;


    if (
        hour === 0
    ) {

        hour = 12;
    }


    return `${hour}:${minutes} ${period}`;
}


function eventTimeForInput(value) {

    if (!value) {

        return "";
    }


    const time =
        String(
            value
        )
            .trim();


    /*
        Already valid 24-hour input value.
    */

    if (
        /^\d{2}:\d{2}$/.test(
            time
        )
    ) {

        return time;
    }


    /*
        Example:
        10:00 AM
        2:30 PM
    */

    const match =
        time.match(
            /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i
        );


    if (!match) {

        return "";
    }


    let hour =
        Number(
            match[1]
        );


    const minutes =
        match[2];


    const period =
        match[3]
            .toUpperCase();


    if (
        period === "PM" &&
        hour !== 12
    ) {

        hour += 12;
    }


    if (
        period === "AM" &&
        hour === 12
    ) {

        hour = 0;
    }


    return `${
        String(
            hour
        )
            .padStart(
                2,
                "0"
            )
    }:${minutes}`;
}


function getEventDateParts(value) {

    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return {
            day:
                "--",

            month:
                "---"
        };
    }


    return {

        day:
            date.toLocaleDateString(
                "en-AU",
                {
                    day:
                        "2-digit"
                }
            ),

        month:
            date.toLocaleDateString(
                "en-AU",
                {
                    month:
                        "short"
                }
            )
    };
}


function lockBackgroundScroll() {

    document.body.classList.add(
        "modal-open"
    );
}


function unlockBackgroundScroll() {

    if (
        !document.querySelector(
            ".modal:not(.hidden)"
        )
    ) {

        document.body.classList.remove(
            "modal-open"
        );
    }
}


function scrollToSection(id) {

    byId(
        id
    )?.scrollIntoView(
        {
            behavior:
                "smooth",

            block:
                "start"
        }
    );


    byId(
        "sidebar"
    )?.classList.remove(
        "open"
    );
}


/* =========================================================
   UI CLEANUP
========================================================= */

function cleanMapDirectorySidebar() {

    const oldDirectoryKey =
        document.querySelector(
            ".map-directory-key"
        );


    if (
        oldDirectoryKey
    ) {

        oldDirectoryKey.remove();
    }
}


function improveNotificationSpacing() {

    const list =
        byId(
            "notificationDropdownList"
        );


    if (!list) {

        return;
    }


    list.style.display =
        "flex";


    list.style.flexDirection =
        "column";


    list.style.gap =
        "8px";


    list.style.padding =
        "8px 10px 10px";
}


/* =========================================================
   LOGIN ELEMENTS
========================================================= */

const loginScreen =
    byId(
        "loginScreen"
    );


const studentApp =
    byId(
        "studentApp"
    );


const adminApp =
    byId(
        "adminApp"
    );


const emailInput =
    byId(
        "email"
    );


const passwordInput =
    byId(
        "password"
    );


const loginButton =
    byId(
        "loginBtn"
    );


const loginError =
    byId(
        "loginError"
    );


const togglePassword =
    byId(
        "togglePassword"
    );


/* =========================================================
   PASSWORD VALIDATION
========================================================= */

function passwordIsValid(
    password
) {

    return (

        password.length >= 10 &&

        /[A-Za-z]/.test(
            password
        ) &&

        /\d/.test(
            password
        ) &&

        /[^A-Za-z0-9]/.test(
            password
        )

    );
}


function updatePasswordRule(
    id,
    valid,
    text
) {

    const node =
        byId(
            id
        );


    if (!node) {

        return;
    }


    node.textContent =
        `${
            valid
                ?
                "✔"
                :
                "✖"
        } ${text}`;


    node.classList.toggle(
        "valid",
        valid
    );


    node.classList.toggle(
        "invalid",
        !valid
    );
}


function checkPasswordRules() {

    const password =
        passwordInput?.value ||
        "";


    updatePasswordRule(
        "lengthCheck",
        password.length >= 10,
        "At least 10 characters"
    );


    updatePasswordRule(
        "letterCheck",
        /[A-Za-z]/.test(
            password
        ),
        "At least one letter"
    );


    updatePasswordRule(
        "numberCheck",
        /\d/.test(
            password
        ),
        "At least one number"
    );


    updatePasswordRule(
        "symbolCheck",
        /[^A-Za-z0-9]/.test(
            password
        ),
        "At least one symbol"
    );
}


/* =========================================================
   LOGIN
========================================================= */

async function login() {

    loginError.textContent =
        "";


    const email =
        emailInput.value
            .trim()
            .toLowerCase();


    const password =
        passwordInput.value;


    if (
        !email.endsWith(
            "@notredame.edu.au"
        )
    ) {

        loginError.textContent =
            "Please use your @notredame.edu.au email.";

        return;
    }


    if (
        !passwordIsValid(
            password
        )
    ) {

        loginError.textContent =
            "Password requirements are not met.";

        return;
    }


    loginButton.disabled =
        true;


    try {

        const response =
            await fetch(
                "/api/login",
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            {
                                email,
                                password
                            }
                        )
                }
            );


        const result =
            await safeJson(
                response
            );


        if (
            !response.ok ||
            result?.success === false
        ) {

            throw new Error(
                result?.message ||
                "Incorrect email or password."
            );
        }


        const user =
            result?.user ||
            result;


        currentUser = {

            id:
                user.id ??
                result.user_id,

            name:
                user.name ||
                email.split(
                    "@"
                )[0],

            email:
                user.email ||
                email,

            role:
                String(
                    user.role ||
                    "student"
                )
                    .toLowerCase()

        };


        sessionStorage.setItem(
            "smartCampusUser",
            JSON.stringify(
                currentUser
            )
        );


        routeUserByRole();

    } catch (error) {

        loginError.textContent =
            error.message ||
            "Unable to sign in.";

    } finally {

        loginButton.disabled =
            false;
    }
}


/* =========================================================
   SESSION
========================================================= */

function restoreSession() {

    const stored =
        sessionStorage.getItem(
            "smartCampusUser"
        );


    if (!stored) {

        return;
    }


    try {

        currentUser =
            JSON.parse(
                stored
            );


        routeUserByRole();

    } catch {

        sessionStorage.removeItem(
            "smartCampusUser"
        );
    }
}


function logout() {

    sessionStorage.removeItem(
        "smartCampusUser"
    );


    currentUser =
        null;


    studentApp.classList.add(
        "hidden"
    );


    adminApp.classList.add(
        "hidden"
    );


    loginScreen.classList.remove(
        "hidden"
    );


    emailInput.value =
        "";


    passwordInput.value =
        "";


    checkPasswordRules();


    window.scrollTo(
        {
            top:
                0
        }
    );
}


function routeUserByRole() {

    const role =
        String(
            currentUser?.role ||
            "student"
        )
            .toLowerCase();


    if (
        role === "admin" ||
        role === "staff"
    ) {

        showAdminDashboard();

    } else {

        showStudentDashboard();
    }
}


/* =========================================================
   MODALS
========================================================= */

function openGeneralModal(
    html
) {

    byId(
        "generalModalContent"
    ).innerHTML =
        html;


    byId(
        "generalModal"
    ).classList.remove(
        "hidden"
    );


    lockBackgroundScroll();
}


function closeGeneralModal() {

    byId(
        "generalModal"
    ).classList.add(
        "hidden"
    );


    unlockBackgroundScroll();
}


function closeLocationModal() {

    byId(
        "locationModal"
    ).classList.add(
        "hidden"
    );


    unlockBackgroundScroll();
}


function openReportModal() {

    byId(
        "reportMessage"
    ).textContent =
        "";


    byId(
        "reportModal"
    ).classList.remove(
        "hidden"
    );


    lockBackgroundScroll();
}


function closeReportModal() {

    byId(
        "reportModal"
    ).classList.add(
        "hidden"
    );


    unlockBackgroundScroll();
}


/* =========================================================
   STUDENT DASHBOARD
========================================================= */

function showStudentDashboard() {

    loginScreen.classList.add(
        "hidden"
    );


    adminApp.classList.add(
        "hidden"
    );


    studentApp.classList.remove(
        "hidden"
    );


    const firstName =
        getFirstName(
            currentUser?.name
        );


    byId(
        "welcomeName"
    ).textContent =
        firstName;


    byId(
        "topbarUserName"
    ).textContent =
        firstName;


    byId(
        "userAvatar"
    ).textContent =
        firstName
            .charAt(
                0
            )
            .toUpperCase();


    cleanMapDirectorySidebar();


    loadNotificationReadState();


    loadStudentDashboardData();
}


async function loadStudentDashboardData() {

    await Promise.allSettled(
        [
            loadAnnouncements(),
            loadEvents(),
            loadLocations(),
            loadSupportServices(),
            loadMyReports()
        ]
    );


    renderNotifications();
}


/* =========================================================
   STUDENT ANNOUNCEMENTS
========================================================= */

async function loadAnnouncements() {

    const response =
        await fetch(
            "/api/announcements"
        );


    if (
        !response.ok
    ) {

        throw new Error(
            "Unable to load announcements."
        );
    }


    announcements =
        normaliseArray(
            await safeJson(
                response
            ),
            [
                "announcements"
            ]
        );


    const container =
        byId(
            "announcementList"
        );


    if (
        !announcements.length
    ) {

        container.innerHTML = `
            <div class="empty-message">
                No announcements available.
            </div>
        `;

        return;
    }


    container.innerHTML =
        announcements
            .slice(
                0,
                3
            )
            .map(
                item => `
                    <button
                        class="announcement-item"
                        data-announcement-id="${escapeHtml(
                            item.id
                        )}"
                        type="button"
                    >

                        <div class="announcement-marker"></div>

                        <div>

                            <h3>

                                ${escapeHtml(
                                    item.title
                                )}

                            </h3>

                            <p>

                                ${escapeHtml(
                                    item.content
                                )}

                            </p>

                            <span class="item-meta">

                                ${escapeHtml(
                                    formatDate(
                                        item.date
                                    )
                                )}

                            </span>

                        </div>

                    </button>
                `
            )
            .join(
                ""
            );


    container
        .querySelectorAll(
            "[data-announcement-id]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const item =
                            announcements.find(
                                announcement =>
                                    Number(
                                        announcement.id
                                    ) ===
                                    Number(
                                        button.dataset
                                            .announcementId
                                    )
                            );


                        if (
                            item
                        ) {

                            openAnnouncementDetails(
                                item
                            );
                        }
                    }
                );
            }
        );
}


function openAnnouncementDetails(
    item
) {

    openGeneralModal(
        `
        <div class="modal-heading">

            <p class="section-eyebrow">
                Announcement
            </p>

            <h2>

                ${escapeHtml(
                    item.title
                )}

            </h2>

            <p>

                ${escapeHtml(
                    formatDate(
                        item.date
                    )
                )}

            </p>

        </div>


        <div class="modal-list-item">

            <p>

                ${escapeHtml(
                    item.content
                )}

            </p>

        </div>
        `
    );
}


function openAllAnnouncements() {

    openGeneralModal(
        `
        <div class="modal-heading">

            <h2>
                All Announcements
            </h2>

        </div>


        <div class="modal-list">

            ${
                announcements.length
                    ?
                    announcements
                        .map(
                            item => `
                                <button
                                    class="modal-list-item"
                                    data-full-announcement="${escapeHtml(
                                        item.id
                                    )}"
                                    type="button"
                                >

                                    <h3>

                                        ${escapeHtml(
                                            item.title
                                        )}

                                    </h3>

                                    <p>

                                        ${escapeHtml(
                                            item.content
                                        )}

                                    </p>

                                    <span>

                                        ${escapeHtml(
                                            formatDate(
                                                item.date
                                            )
                                        )}

                                    </span>

                                </button>
                            `
                        )
                        .join(
                            ""
                        )
                    :
                    `
                    <div class="empty-message">
                        No announcements available.
                    </div>
                    `
            }

        </div>
        `
    );


    all(
        "[data-full-announcement]"
    )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const item =
                            announcements.find(
                                announcement =>
                                    Number(
                                        announcement.id
                                    ) ===
                                    Number(
                                        button.dataset
                                            .fullAnnouncement
                                    )
                            );


                        if (
                            item
                        ) {

                            openAnnouncementDetails(
                                item
                            );
                        }
                    }
                );
            }
        );
}


/* =========================================================
   STUDENT EVENTS
========================================================= */

async function loadEvents() {

    const response =
        await fetch(
            "/api/events"
        );


    if (
        !response.ok
    ) {

        throw new Error(
            "Unable to load events."
        );
    }


    events =
        normaliseArray(
            await safeJson(
                response
            ),
            [
                "events"
            ]
        );


    const container =
        byId(
            "eventList"
        );


    if (
        !events.length
    ) {

        container.innerHTML = `
            <div class="empty-message">
                No upcoming events.
            </div>
        `;

        return;
    }


    container.innerHTML =
        events
            .slice(
                0,
                3
            )
            .map(
                item => {

                    const date =
                        getEventDateParts(
                            item.date
                        );


                    return `
                        <button
                            class="event-item"
                            data-event-id="${escapeHtml(
                                item.id
                            )}"
                            type="button"
                        >

                            <div class="event-date-box">

                                <strong>
                                    ${date.day}
                                </strong>

                                <span>
                                    ${date.month}
                                </span>

                            </div>


                            <div>

                                <h3>

                                    ${escapeHtml(
                                        item.name
                                    )}

                                </h3>

                                <p>

                                    ${escapeHtml(
                                        formatEventTime(
                                            item.time
                                        )
                                    )}

                                </p>

                                <p>

                                    ${escapeHtml(
                                        item.location ||
                                        ""
                                    )}

                                </p>

                            </div>

                        </button>
                    `;
                }
            )
            .join(
                ""
            );


    container
        .querySelectorAll(
            "[data-event-id]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const item =
                            events.find(
                                event =>
                                    Number(
                                        event.id
                                    ) ===
                                    Number(
                                        button.dataset
                                            .eventId
                                    )
                            );


                        if (
                            item
                        ) {

                            openEventDetails(
                                item
                            );
                        }
                    }
                );
            }
        );
}


function openEventDetails(
    item
) {

    openGeneralModal(
        `
        <div class="modal-heading">

            <p class="section-eyebrow">
                Campus Event
            </p>

            <h2>

                ${escapeHtml(
                    item.name
                )}

            </h2>

        </div>


        <div class="modal-list-item">

            <p>

                ${escapeHtml(
                    item.description ||
                    "No description available."
                )}

            </p>


            <br>


            <strong>

                📅

                ${escapeHtml(
                    formatDate(
                        item.date
                    )
                )}

            </strong>


            <br><br>


            <strong>

                🕐

                ${escapeHtml(
                    formatEventTime(
                        item.time
                    )
                )}

            </strong>


            <br><br>


            <strong>

                📍

                ${escapeHtml(
                    item.location ||
                    "Location unavailable"
                )}

            </strong>

        </div>
        `
    );
}


function openAllEvents() {

    openGeneralModal(
        `
        <div class="modal-heading">

            <h2>
                All Events
            </h2>

        </div>


        <div class="modal-list">

            ${
                events.length
                    ?
                    events
                        .map(
                            item => `
                                <button
                                    class="modal-list-item"
                                    data-full-event="${escapeHtml(
                                        item.id
                                    )}"
                                    type="button"
                                >

                                    <h3>

                                        ${escapeHtml(
                                            item.name
                                        )}

                                    </h3>

                                    <p>

                                        ${escapeHtml(
                                            item.description ||
                                            ""
                                        )}

                                    </p>

                                    <span>

                                        ${escapeHtml(
                                            formatDate(
                                                item.date
                                            )
                                        )}

                                        •

                                        ${escapeHtml(
                                            formatEventTime(
                                                item.time
                                            )
                                        )}

                                        •

                                        ${escapeHtml(
                                            item.location ||
                                            ""
                                        )}

                                    </span>

                                </button>
                            `
                        )
                        .join(
                            ""
                        )
                    :
                    `
                    <div class="empty-message">
                        No events available.
                    </div>
                    `
            }

        </div>
        `
    );


    all(
        "[data-full-event]"
    )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const item =
                            events.find(
                                event =>
                                    Number(
                                        event.id
                                    ) ===
                                    Number(
                                        button.dataset
                                            .fullEvent
                                    )
                            );


                        if (
                            item
                        ) {

                            openEventDetails(
                                item
                            );
                        }
                    }
                );
            }
        );
}


/* =========================================================
   CAMPUS LOCATIONS
========================================================= */

async function loadLocations() {

    try {

        const response =
            await fetch(
                "/api/locations"
            );


        const result =
            await safeJson(
                response
            );


        if (
            !response.ok
        ) {

            throw new Error(
                "Unable to load campus locations."
            );
        }


        campusLocations =
            normaliseArray(
                result,
                [
                    "locations",
                    "campus"
                ]
            );


        currentMapCategory =
            "All";


        renderMapFilters();


        renderCampusMap(
            campusLocations
        );


        cleanMapDirectorySidebar();

    } catch (error) {

        console.error(
            "Campus location error:",
            error
        );


        byId(
            "campusDirectoryList"
        ).innerHTML = `
            <div class="empty-message">
                Unable to load campus locations.
            </div>
        `;


        byId(
            "locationCount"
        ).textContent =
            "0 locations";
    }
}


/* =========================================================
   MAP HELPERS
========================================================= */

function getCategoryClass(
    category
) {

    return String(
        category ||
        "Other"
    )
        .trim()
        .toLowerCase()
        .replaceAll(
            " ",
            "-"
        );
}


function getLocationIcon(
    category
) {

    const value =
        String(
            category ||
            ""
        )
            .toLowerCase();


    if (
        value.includes(
            "library"
        )
    ) {

        return "📚";
    }


    if (
        value.includes(
            "student"
        )
    ) {

        return "🎓";
    }


    if (
        value.includes(
            "event"
        )
    ) {

        return "🎤";
    }


    if (
        value.includes(
            "recreation"
        )
    ) {

        return "🏃";
    }


    if (
        value.includes(
            "administration"
        )
    ) {

        return "🏢";
    }


    if (
        value.includes(
            "accommodation"
        )
    ) {

        return "🏠";
    }


    if (
        value.includes(
            "academic"
        )
    ) {

        return "💻";
    }


    return "📍";
}


/* =========================================================
   MAP FILTERS
========================================================= */

function renderMapFilters() {

    const container =
        byId(
            "mapCategoryFilters"
        );


    const categories =
        [
            ...new Set(
                campusLocations
                    .map(
                        item =>
                            item.category ||
                            "Other"
                    )
            )
        ]
            .sort();


    container.innerHTML = `

        <button
            class="map-filter ${
                currentMapCategory ===
                "All"
                    ?
                    "active"
                    :
                    ""
            }"
            data-category="All"
            type="button"
        >
            All
        </button>


        ${
            categories
                .map(
                    category => `
                        <button
                            class="map-filter ${
                                currentMapCategory ===
                                category
                                    ?
                                    "active"
                                    :
                                    ""
                            }"
                            data-category="${escapeHtml(
                                category
                            )}"
                            type="button"
                        >

                            ${getLocationIcon(
                                category
                            )}

                            ${escapeHtml(
                                category
                            )}

                        </button>
                    `
                )
                .join(
                    ""
                )
        }

    `;


    container
        .querySelectorAll(
            ".map-filter"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        currentMapCategory =
                            button.dataset.category;


                        renderMapFilters();


                        applyMapFilter();
                    }
                );
            }
        );
}


function applyMapFilter() {

    const filtered =
        currentMapCategory ===
        "All"
            ?
            campusLocations
            :
            campusLocations.filter(
                item =>
                    String(
                        item.category ||
                        "Other"
                    ) ===
                    currentMapCategory
            );


    renderCampusMap(
        filtered
    );
}


/* =========================================================
   RENDER CAMPUS MAP
========================================================= */

function renderCampusMap(
    locations
) {

    const markerContainer =
        byId(
            "campusMapMarkers"
        );


    const directoryContainer =
        byId(
            "campusDirectoryList"
        );


    byId(
        "locationCount"
    ).textContent =
        `${locations.length} ${
            locations.length === 1
                ?
                "location"
                :
                "locations"
        }`;


    if (
        !locations.length
    ) {

        markerContainer.innerHTML =
            "";


        directoryContainer.innerHTML = `
            <div class="empty-message">
                No locations found in this category.
            </div>
        `;


        return;
    }


    markerContainer.innerHTML =
        locations
            .map(
                item => {

                    const mapX =
                        Number(
                            item.map_x
                        ) ||
                        50;


                    const mapY =
                        Number(
                            item.map_y
                        ) ||
                        50;


                    const categoryClass =
                        getCategoryClass(
                            item.category
                        );


                    return `
                        <button
                            class="
                                map-marker
                                marker-${categoryClass}
                            "
                            style="
                                left:${mapX}%;
                                top:${mapY}%;
                            "
                            data-location-id="${escapeHtml(
                                item.id
                            )}"
                            title="${escapeHtml(
                                item.building
                            )}"
                            type="button"
                        >

                            <span class="marker-pin">

                                <span class="marker-emoji">

                                    ${getLocationIcon(
                                        item.category
                                    )}

                                </span>

                            </span>


                            <span class="marker-label">

                                ${escapeHtml(
                                    item.building
                                )}

                            </span>

                        </button>
                    `;
                }
            )
            .join(
                ""
            );


    directoryContainer.innerHTML =
        locations
            .map(
                item => `
                    <button
                        class="directory-location"
                        data-directory-location="${escapeHtml(
                            item.id
                        )}"
                        type="button"
                    >

                        <div
                            class="
                                directory-icon
                                directory-${getCategoryClass(
                                    item.category
                                )}
                            "
                        >

                            ${getLocationIcon(
                                item.category
                            )}

                        </div>


                        <div class="directory-location-info">

                            <strong>

                                ${escapeHtml(
                                    item.building
                                )}

                            </strong>

                            <span>

                                ${escapeHtml(
                                    item.location ||
                                    ""
                                )}

                            </span>

                            <small>

                                ${escapeHtml(
                                    item.category ||
                                    "Other"
                                )}

                            </small>

                        </div>

                    </button>
                `
            )
            .join(
                ""
            );


    markerContainer
        .querySelectorAll(
            "[data-location-id]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const item =
                            campusLocations.find(
                                location =>
                                    Number(
                                        location.id
                                    ) ===
                                    Number(
                                        button.dataset
                                            .locationId
                                    )
                            );


                        if (
                            !item
                        ) {

                            return;
                        }


                        highlightMapLocation(
                            item.id
                        );


                        openLocationDetails(
                            item
                        );
                    }
                );
            }
        );


    directoryContainer
        .querySelectorAll(
            "[data-directory-location]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const item =
                            campusLocations.find(
                                location =>
                                    Number(
                                        location.id
                                    ) ===
                                    Number(
                                        button.dataset
                                            .directoryLocation
                                    )
                            );


                        if (
                            !item
                        ) {

                            return;
                        }


                        highlightMapLocation(
                            item.id
                        );


                        openLocationDetails(
                            item
                        );
                    }
                );
            }
        );
}


/* =========================================================
   HIGHLIGHT LOCATION
========================================================= */

function highlightMapLocation(
    locationId
) {

    document
        .querySelectorAll(
            ".map-marker"
        )
        .forEach(
            marker => {

                marker.classList.remove(
                    "highlighted"
                );
            }
        );


    const marker =
        document.querySelector(
            `[data-location-id="${String(
                locationId
            )}"]`
        );


    if (
        !marker
    ) {

        return;
    }


    marker.classList.add(
        "highlighted"
    );


    setTimeout(
        () => {

            marker.classList.remove(
                "highlighted"
            );

        },
        3500
    );
}


/* =========================================================
   LOCATION DETAILS
========================================================= */

function openLocationDetails(
    item
) {

    byId(
        "locationModalContent"
    ).innerHTML = `

        <div class="location-modal-hero">

            <div class="location-modal-icon">

                ${getLocationIcon(
                    item.category
                )}

            </div>


            <span class="location-category-badge">

                ${escapeHtml(
                    item.category ||
                    "Campus Location"
                )}

            </span>


            <h2>

                ${escapeHtml(
                    item.building ||
                    ""
                )}

            </h2>


            <p>

                📍

                ${escapeHtml(
                    item.location ||
                    ""
                )}

            </p>

        </div>


        <p class="location-description">

            ${escapeHtml(
                item.description ||
                "No description available."
            )}

        </p>


        <div class="location-information-grid">


            <div class="location-info-box">

                <span>
                    Opening Hours
                </span>

                <strong>

                    ${escapeHtml(
                        item.opening_hours ||
                        "Not specified"
                    )}

                </strong>

            </div>


            <div class="location-info-box">

                <span>
                    Category
                </span>

                <strong>

                    ${escapeHtml(
                        item.category ||
                        "Other"
                    )}

                </strong>

            </div>


            <div class="location-info-box full-width">

                <span>
                    Services Available
                </span>

                <p>

                    ${escapeHtml(
                        item.services ||
                        "No service information available."
                    )}

                </p>

            </div>


            <div class="location-info-box full-width">

                <span>
                    Accessibility
                </span>

                <p>

                    ${escapeHtml(
                        item.accessibility ||
                        "No accessibility information available."
                    )}

                </p>

            </div>


            <div class="location-info-box full-width">

                <span>
                    Directions
                </span>

                <p>

                    ${escapeHtml(
                        item.directions ||
                        "Directions are not available."
                    )}

                </p>

            </div>

        </div>
    `;


    byId(
        "locationModal"
    ).classList.remove(
        "hidden"
    );


    lockBackgroundScroll();
}


/* =========================================================
   CAMPUS SEARCH
========================================================= */

function searchCampusLocation() {

    const input =
        byId(
            "campusSearchInput"
        );


    const resultBox =
        byId(
            "campusSearchResult"
        );


    const query =
        input.value
            .trim()
            .toLowerCase();


    if (
        !query
    ) {

        resultBox.classList.remove(
            "hidden"
        );


        resultBox.innerHTML = `

            <strong>
                Enter a building or service
            </strong>

            <p>
                Example: Library,
                Technology Building or Student Services.
            </p>
        `;


        return;
    }


    const matches =
        campusLocations.filter(
            item => {

                const searchable =
                    [
                        item.building,
                        item.location,
                        item.category,
                        item.description,
                        item.services,
                        item.directions
                    ]
                        .join(
                            " "
                        )
                        .toLowerCase();


                return searchable.includes(
                    query
                );
            }
        );


    currentMapCategory =
        "All";


    renderMapFilters();


    renderCampusMap(
        matches
    );


    resultBox.classList.remove(
        "hidden"
    );


    resultBox.innerHTML =
        matches.length
            ?
            `
            <strong>

                ${matches.length}

                ${
                    matches.length === 1
                        ?
                        "location"
                        :
                        "locations"
                }

                found

            </strong>

            <p>
                Select a map marker or directory item
                to view details.
            </p>
            `
            :
            `
            <strong>
                No location found
            </strong>

            <p>
                Try another building,
                service or category.
            </p>
            `;
}


function resetCampusMap() {

    currentMapCategory =
        "All";


    byId(
        "campusSearchInput"
    ).value =
        "";


    byId(
        "campusSearchResult"
    ).classList.add(
        "hidden"
    );


    renderMapFilters();


    renderCampusMap(
        campusLocations
    );
}


/* =========================================================
   SUPPORT SERVICES
========================================================= */

async function loadSupportServices() {

    const response =
        await fetch(
            "/api/support-services"
        );


    if (
        !response.ok
    ) {

        throw new Error(
            "Unable to load support services."
        );
    }


    supportServices =
        normaliseArray(
            await safeJson(
                response
            ),
            [
                "services",
                "supportServices"
            ]
        );


    const container =
        byId(
            "supportList"
        );


    if (
        !supportServices.length
    ) {

        container.innerHTML = `
            <div class="empty-message">
                No support services available.
            </div>
        `;

        return;
    }


    container.innerHTML =
        supportServices
            .slice(
                0,
                6
            )
            .map(
                item => `
                    <button
                        class="support-card"
                        data-support-id="${escapeHtml(
                            item.id
                        )}"
                        type="button"
                    >

                        <div class="support-card-icon">
                            🎧
                        </div>


                        <h3>

                            ${escapeHtml(
                                item.name
                            )}

                        </h3>


                        <p>

                            ${escapeHtml(
                                item.description ||
                                ""
                            )}

                        </p>


                        <span>

                            ${escapeHtml(
                                item.contact ||
                                ""
                            )}

                        </span>

                    </button>
                `
            )
            .join(
                ""
            );


    container
        .querySelectorAll(
            "[data-support-id]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const item =
                            supportServices.find(
                                service =>
                                    Number(
                                        service.id
                                    ) ===
                                    Number(
                                        button.dataset
                                            .supportId
                                    )
                            );


                        if (
                            item
                        ) {

                            openSupportDetails(
                                item
                            );
                        }
                    }
                );
            }
        );
}


function findCampusLocationForSupport(
    service
) {

    const target =
        String(
            service.location ||
            ""
        )
            .trim()
            .toLowerCase();


    if (
        !target
    ) {

        return null;
    }


    return (
        campusLocations.find(
            location => {

                const building =
                    String(
                        location.building ||
                        ""
                    )
                        .trim()
                        .toLowerCase();


                const locationText =
                    String(
                        location.location ||
                        ""
                    )
                        .trim()
                        .toLowerCase();


                return (

                    building ===
                    target ||

                    locationText ===
                    target ||

                    (
                        building &&
                        target.includes(
                            building
                        )
                    ) ||

                    (
                        target &&
                        building.includes(
                            target
                        )
                    ) ||

                    (
                        locationText &&
                        target.includes(
                            locationText
                        )
                    )

                );
            }
        ) ||
        null
    );
}


function openSupportDetails(
    service
) {

    const matchingLocation =
        findCampusLocationForSupport(
            service
        );


    openGeneralModal(
        `
        <div class="modal-heading">

            <p class="section-eyebrow">
                Student Support
            </p>

            <h2>

                ${escapeHtml(
                    service.name
                )}

            </h2>

        </div>


        <div class="modal-list-item">

            <p>

                ${escapeHtml(
                    service.description ||
                    "No description available."
                )}

            </p>


            <br>


            <strong>

                📧

                ${escapeHtml(
                    service.contact ||
                    "Contact unavailable"
                )}

            </strong>


            <br><br>


            <strong>

                📍

                ${escapeHtml(
                    service.location ||
                    "Location unavailable"
                )}

            </strong>

        </div>


        ${
            matchingLocation
                ?
                `
                <br>

                <button
                    id="supportMapButton"
                    class="login-button"
                    type="button"
                >
                    View on Campus Map
                </button>
                `
                :
                ""
        }
        `
    );


    if (
        matchingLocation
    ) {

        byId(
            "supportMapButton"
        )?.addEventListener(
            "click",
            () => {

                closeGeneralModal();


                currentMapCategory =
                    "All";


                renderMapFilters();


                renderCampusMap(
                    campusLocations
                );


                scrollToSection(
                    "campus-map"
                );


                setTimeout(
                    () => {

                        highlightMapLocation(
                            matchingLocation.id
                        );


                        openLocationDetails(
                            matchingLocation
                        );

                    },
                    450
                );
            }
        );
    }
}


function openAllSupport() {

    openGeneralModal(
        `
        <div class="modal-heading">

            <h2>
                Support Services
            </h2>

        </div>


        <div class="modal-list">

            ${
                supportServices.length
                    ?
                    supportServices
                        .map(
                            item => `
                                <button
                                    class="modal-list-item"
                                    data-full-support="${escapeHtml(
                                        item.id
                                    )}"
                                    type="button"
                                >

                                    <h3>

                                        ${escapeHtml(
                                            item.name
                                        )}

                                    </h3>

                                    <p>

                                        ${escapeHtml(
                                            item.description ||
                                            ""
                                        )}

                                    </p>

                                    <span>

                                        ${escapeHtml(
                                            item.contact ||
                                            ""
                                        )}

                                        •

                                        ${escapeHtml(
                                            item.location ||
                                            ""
                                        )}

                                    </span>

                                </button>
                            `
                        )
                        .join(
                            ""
                        )
                    :
                    `
                    <div class="empty-message">
                        No support services available.
                    </div>
                    `
            }

        </div>
        `
    );


    all(
        "[data-full-support]"
    )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const item =
                            supportServices.find(
                                service =>
                                    Number(
                                        service.id
                                    ) ===
                                    Number(
                                        button.dataset
                                            .fullSupport
                                    )
                            );


                        if (
                            item
                        ) {

                            openSupportDetails(
                                item
                            );
                        }
                    }
                );
            }
        );
}


/* =========================================================
   STUDENT MY REPORTS
========================================================= */

async function loadMyReports() {

    try {

        const response =
            await fetch(
                "/api/feedback"
            );


        const reports =
            normaliseArray(
                await safeJson(
                    response
                ),
                [
                    "feedback",
                    "reports"
                ]
            );


        myReports =
            reports.filter(
                report =>
                    Number(
                        report.user_id
                    ) ===
                    Number(
                        currentUser?.id
                    )
            );


        renderMyReports();

    } catch {

        myReports =
            [];


        renderMyReports();
    }
}


function renderMyReports() {

    const total =
        myReports.length;


    byId(
        "myReportTotal"
    ).textContent =
        total;


    byId(
        "myReportSubmitted"
    ).textContent =
        myReports.filter(
            report =>
                report.status ===
                "Submitted"
        ).length;


    byId(
        "myReportProgress"
    ).textContent =
        myReports.filter(
            report =>
                report.status ===
                "In Progress"
        ).length;


    byId(
        "myReportResolved"
    ).textContent =
        myReports.filter(
            report =>
                report.status ===
                "Resolved"
        ).length;


    const container =
        byId(
            "myReportsList"
        );


    if (
        !total
    ) {

        container.innerHTML = `

            <div class="student-report-empty">

                <div>
                    📋
                </div>

                <h3>
                    No reports submitted
                </h3>

                <p>
                    Your reports will appear here.
                </p>

            </div>
        `;


        return;
    }


    container.innerHTML =
        myReports
            .map(
                report => {

                    const statusClass =
                        String(
                            report.status ||
                            "Submitted"
                        )
                            .toLowerCase()
                            .replaceAll(
                                " ",
                                "-"
                            );


                    const typeClass =
                        String(
                            report.type ||
                            "Issue"
                        )
                            .toLowerCase();


                    return `
                        <div class="my-report-card">

                            <div class="my-report-card-header">

                                <div>

                                    <span
                                        class="
                                            report-type-badge
                                            report-type-${typeClass}
                                        "
                                    >

                                        ${escapeHtml(
                                            report.type ||
                                            "Issue"
                                        )}

                                    </span>

                                    <h3>

                                        ${escapeHtml(
                                            report.subject
                                        )}

                                    </h3>

                                </div>


                                <span
                                    class="
                                        report-status-badge
                                        report-status-${statusClass}
                                    "
                                >

                                    ${escapeHtml(
                                        report.status ||
                                        "Submitted"
                                    )}

                                </span>

                            </div>


                            <p>

                                ${escapeHtml(
                                    report.description
                                )}

                            </p>


                            <div class="my-report-footer">

                                <span>

                                    Report #

                                    ${escapeHtml(
                                        report.id
                                    )}

                                </span>

                                <span>

                                    ${escapeHtml(
                                        report.status ||
                                        "Submitted"
                                    )}

                                </span>

                            </div>

                        </div>
                    `;
                }
            )
            .join(
                ""
            );
}


async function submitStudentReport(
    event
) {

    event.preventDefault();


    const type =
        byId(
            "issueType"
        ).value;


    const subject =
        byId(
            "issueSubject"
        ).value
            .trim();


    const description =
        byId(
            "issueDescription"
        ).value
            .trim();


    const message =
        byId(
            "reportMessage"
        );


    if (
        !type ||
        !subject ||
        !description
    ) {

        message.textContent =
            "Please complete all fields.";


        message.className =
            "form-message error";


        return;
    }


    try {

        const response =
            await fetch(
                "/api/feedback",
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            {
                                user_id:
                                    currentUser?.id,

                                type,

                                subject,

                                description
                            }
                        )
                }
            );


        const result =
            await safeJson(
                response
            );


        if (
            !response.ok ||
            result?.success === false
        ) {

            throw new Error(
                result?.message ||
                "Unable to submit report."
            );
        }


        message.textContent =
            "Report submitted successfully.";


        message.className =
            "form-message success";


        byId(
            "reportIssueForm"
        ).reset();


        await loadMyReports();


        setTimeout(
            () => {

                closeReportModal();


                scrollToSection(
                    "my-reports"
                );

            },
            700
        );

    } catch (error) {

        message.textContent =
            error.message ||
            "Unable to submit report.";


        message.className =
            "form-message error";
    }
}


/* =========================================================
   NOTIFICATIONS
========================================================= */

function notificationStorageKey() {

    return `smartCampusReadNotifications:${
        currentUser?.email ||
        "guest"
    }`;
}


function loadNotificationReadState() {

    try {

        const saved =
            JSON.parse(
                localStorage.getItem(
                    notificationStorageKey()
                ) ||
                "[]"
            );


        const readIds =
            new Set(
                Array.isArray(
                    saved
                )
                    ?
                    saved.map(
                        Number
                    )
                    :
                    []
            );


        notifications
            .forEach(
                item => {

                    item.read =
                        readIds.has(
                            Number(
                                item.id
                            )
                        );
                }
            );

    } catch {

        // Keep default state.
    }
}


function saveNotificationReadState() {

    try {

        const readIds =
            notifications
                .filter(
                    item =>
                        item.read
                )
                .map(
                    item =>
                        item.id
                );


        localStorage.setItem(
            notificationStorageKey(),
            JSON.stringify(
                readIds
            )
        );

    } catch {

        // Continue without storage.
    }
}


function markNotificationRead(
    notification
) {

    if (
        !notification
    ) {

        return;
    }


    notification.read =
        true;


    saveNotificationReadState();


    renderNotifications();
}


function renderNotifications() {

    const unreadCount =
        notifications.filter(
            item =>
                !item.read
        ).length;


    const badge =
        byId(
            "notificationBadge"
        );


    badge.textContent =
        unreadCount;


    badge.classList.toggle(
        "hidden",
        unreadCount === 0
    );


    byId(
        "dashboardNotificationList"
    ).innerHTML =
        notifications
            .map(
                item => `
                    <button
                        class="
                            dashboard-notification
                            ${
                                item.read
                                    ?
                                    ""
                                    :
                                    "unread"
                            }
                        "
                        data-notification-id="${escapeHtml(
                            item.id
                        )}"
                        type="button"
                    >

                        <div class="dashboard-notification-icon">

                            ${item.icon}

                        </div>

                        <div>

                            <strong>

                                ${escapeHtml(
                                    item.title
                                )}

                            </strong>

                            <p>

                                ${escapeHtml(
                                    item.summary
                                )}

                            </p>

                        </div>

                    </button>
                `
            )
            .join(
                ""
            );


    const dropdownList =
        byId(
            "notificationDropdownList"
        );


    dropdownList.innerHTML =
        notifications
            .map(
                item => `
                    <button
                        class="
                            dropdown-notification
                            ${
                                item.read
                                    ?
                                    ""
                                    :
                                    "unread"
                            }
                        "
                        data-notification-id="${escapeHtml(
                            item.id
                        )}"
                        type="button"
                        style="
                            margin:0;
                            border:1px solid #e5eaf1;
                        "
                    >

                        <div class="dropdown-notification-icon">

                            ${item.icon}

                        </div>

                        <div>

                            <strong>

                                ${escapeHtml(
                                    item.title
                                )}

                            </strong>

                            <p>

                                ${escapeHtml(
                                    item.summary
                                )}

                            </p>

                        </div>

                    </button>
                `
            )
            .join(
                ""
            );


    improveNotificationSpacing();


    all(
        "[data-notification-id]"
    )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const item =
                            notifications.find(
                                notification =>
                                    Number(
                                        notification.id
                                    ) ===
                                    Number(
                                        button.dataset
                                            .notificationId
                                    )
                            );


                        if (
                            !item
                        ) {

                            return;
                        }


                        markNotificationRead(
                            item
                        );


                        byId(
                            "notificationDropdown"
                        ).classList.add(
                            "hidden"
                        );


                        openNotificationDetails(
                            item
                        );
                    }
                );
            }
        );
}


function openNotificationDetails(
    notification
) {

    openGeneralModal(
        `
        <div class="notification-detail">

            <div class="notification-detail-icon">

                ${notification.icon}

            </div>

            <h2>

                ${escapeHtml(
                    notification.title
                )}

            </h2>

            <span class="notification-detail-meta">

                ${escapeHtml(
                    notification.time ||
                    ""
                )}

            </span>

            <p>

                ${escapeHtml(
                    notification.description ||
                    notification.summary ||
                    ""
                )}

            </p>

        </div>
        `
    );
}


function openAllNotifications() {

    byId(
        "notificationDropdown"
    ).classList.add(
        "hidden"
    );


    openGeneralModal(
        `
        <div class="modal-heading">

            <p class="section-eyebrow">
                Recent Updates
            </p>

            <h2>
                Notifications
            </h2>

            <p>
                Select a notification to read its details.
            </p>

        </div>


        <div class="modal-list">

            ${
                notifications
                    .map(
                        item => `
                            <button
                                class="modal-list-item"
                                data-modal-notification="${escapeHtml(
                                    item.id
                                )}"
                                type="button"
                            >

                                <h3>

                                    ${item.icon}

                                    ${escapeHtml(
                                        item.title
                                    )}

                                </h3>

                                <p>

                                    ${escapeHtml(
                                        item.description
                                    )}

                                </p>

                                <span>

                                    ${
                                        item.read
                                            ?
                                            "Read"
                                            :
                                            "Unread"
                                    }

                                    •

                                    ${escapeHtml(
                                        item.time ||
                                        ""
                                    )}

                                </span>

                            </button>
                        `
                    )
                    .join(
                        ""
                    )
            }

        </div>
        `
    );


    all(
        "[data-modal-notification]"
    )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const item =
                            notifications.find(
                                notification =>
                                    Number(
                                        notification.id
                                    ) ===
                                    Number(
                                        button.dataset
                                            .modalNotification
                                    )
                            );


                        if (
                            !item
                        ) {

                            return;
                        }


                        markNotificationRead(
                            item
                        );


                        openNotificationDetails(
                            item
                        );
                    }
                );
            }
        );
}


/* =========================================================
   GLOBAL SEARCH
========================================================= */

function renderGlobalSearch(
    query
) {

    const results =
        byId(
            "globalSearchResults"
        );


    const value =
        query
            .trim()
            .toLowerCase();


    if (
        value.length <
        2
    ) {

        results.classList.add(
            "hidden"
        );


        results.innerHTML =
            "";


        return;
    }


    const searchable =
        [

            ...announcements.map(
                item => ({
                    id:
                        item.id,

                    title:
                        item.title,

                    type:
                        "Announcement"
                })
            ),


            ...events.map(
                item => ({
                    id:
                        item.id,

                    title:
                        item.name,

                    type:
                        "Event"
                })
            ),


            ...campusLocations.map(
                item => ({
                    id:
                        item.id,

                    title:
                        item.building,

                    type:
                        "Location"
                })
            ),


            ...supportServices.map(
                item => ({
                    id:
                        item.id,

                    title:
                        item.name,

                    type:
                        "Support"
                })
            )

        ];


    const matches =
        searchable
            .filter(
                item =>
                    String(
                        item.title ||
                        ""
                    )
                        .toLowerCase()
                        .includes(
                            value
                        )
            )
            .slice(
                0,
                8
            );


    results.innerHTML =
        matches.length
            ?
            matches
                .map(
                    item => `
                        <button
                            class="search-result-item"
                            data-search-type="${escapeHtml(
                                item.type
                            )}"
                            data-search-id="${escapeHtml(
                                item.id
                            )}"
                            type="button"
                        >

                            <strong>

                                ${escapeHtml(
                                    item.title
                                )}

                            </strong>

                            <span>

                                ${escapeHtml(
                                    item.type
                                )}

                            </span>

                        </button>
                    `
                )
                .join(
                    ""
                )
            :
            `
            <div class="empty-message">
                No matches found.
            </div>
            `;


    results.classList.remove(
        "hidden"
    );


    results
        .querySelectorAll(
            "[data-search-type]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const type =
                            button.dataset
                                .searchType;


                        const id =
                            Number(
                                button.dataset
                                    .searchId
                            );


                        results.classList.add(
                            "hidden"
                        );


                        byId(
                            "globalSearch"
                        ).value =
                            "";


                        if (
                            type ===
                            "Announcement"
                        ) {

                            const item =
                                announcements.find(
                                    announcement =>
                                        Number(
                                            announcement.id
                                        ) ===
                                        id
                                );


                            if (
                                item
                            ) {

                                openAnnouncementDetails(
                                    item
                                );
                            }

                        } else if (
                            type ===
                            "Event"
                        ) {

                            const item =
                                events.find(
                                    event =>
                                        Number(
                                            event.id
                                        ) ===
                                        id
                                );


                            if (
                                item
                            ) {

                                openEventDetails(
                                    item
                                );
                            }

                        } else if (
                            type ===
                            "Support"
                        ) {

                            const item =
                                supportServices.find(
                                    service =>
                                        Number(
                                            service.id
                                        ) ===
                                        id
                                );


                            if (
                                item
                            ) {

                                openSupportDetails(
                                    item
                                );
                            }

                        } else if (
                            type ===
                            "Location"
                        ) {

                            const item =
                                campusLocations.find(
                                    location =>
                                        Number(
                                            location.id
                                        ) ===
                                        id
                                );


                            if (
                                !item
                            ) {

                                return;
                            }


                            currentMapCategory =
                                "All";


                            renderMapFilters();


                            renderCampusMap(
                                campusLocations
                            );


                            scrollToSection(
                                "campus-map"
                            );


                            setTimeout(
                                () => {

                                    highlightMapLocation(
                                        item.id
                                    );


                                    openLocationDetails(
                                        item
                                    );

                                },
                                400
                            );
                        }
                    }
                );
            }
        );
}


/* =========================================================
   ADMIN DASHBOARD
========================================================= */

function showAdminDashboard() {

    loginScreen.classList.add(
        "hidden"
    );


    studentApp.classList.add(
        "hidden"
    );


    adminApp.classList.remove(
        "hidden"
    );


    const firstName =
        getFirstName(
            currentUser?.name
        );


    const role =
        currentUser?.role ===
        "admin"
            ?
            "Administrator"
            :
            "Staff";


    byId(
        "adminWelcomeName"
    ).textContent =
        firstName;


    byId(
        "adminUserName"
    ).textContent =
        firstName;


    byId(
        "adminAvatar"
    ).textContent =
        firstName
            .charAt(
                0
            )
            .toUpperCase();


    byId(
        "adminRoleLabel"
    ).textContent =
        role;


    byId(
        "adminSidebarRole"
    ).textContent =
        role;


    byId(
        "adminAccessBadge"
    ).textContent =
        `${role} Access`;


    byId(
        "adminInfoName"
    ).textContent =
        currentUser?.name ||
        "-";


    byId(
        "adminInfoRole"
    ).textContent =
        role;


    byId(
        "adminInfoEmail"
    ).textContent =
        currentUser?.email ||
        "-";


    showAdminSection(
        "adminDashboardSection"
    );


    loadAdminData();
}


async function loadAdminData() {

    await Promise.allSettled(
        [
            fetchAdminAnnouncements(),
            fetchAdminEvents(),
            fetchAdminLocations(),
            fetchAdminSupport(),
            fetchAdminFeedback()
        ]
    );


    renderAdminDashboard();
}


/* =========================================================
   ADMIN FETCH
========================================================= */

async function fetchAdminAnnouncements() {

    try {

        const response =
            await fetch(
                "/api/announcements"
            );


        announcements =
            normaliseArray(
                await safeJson(
                    response
                ),
                [
                    "announcements"
                ]
            );

    } catch {

        announcements =
            [];
    }
}


async function fetchAdminEvents() {

    try {

        const response =
            await fetch(
                "/api/events"
            );


        events =
            normaliseArray(
                await safeJson(
                    response
                ),
                [
                    "events"
                ]
            );

    } catch {

        events =
            [];
    }
}


async function fetchAdminLocations() {

    try {

        const response =
            await fetch(
                "/api/locations"
            );


        campusLocations =
            normaliseArray(
                await safeJson(
                    response
                ),
                [
                    "locations",
                    "campus"
                ]
            );

    } catch {

        campusLocations =
            [];
    }
}


async function fetchAdminSupport() {

    try {

        const response =
            await fetch(
                "/api/support-services"
            );


        supportServices =
            normaliseArray(
                await safeJson(
                    response
                ),
                [
                    "services",
                    "supportServices"
                ]
            );

    } catch {

        supportServices =
            [];
    }
}


async function fetchAdminFeedback() {

    try {

        const response =
            await fetch(
                "/api/feedback"
            );


        feedbackReports =
            normaliseArray(
                await safeJson(
                    response
                ),
                [
                    "feedback",
                    "reports"
                ]
            );

    } catch {

        feedbackReports =
            [];
    }
}


function renderAdminDashboard() {

    byId(
        "adminAnnouncementCount"
    ).textContent =
        announcements.length;


    byId(
        "adminEventCount"
    ).textContent =
        events.length;


    byId(
        "adminLocationCount"
    ).textContent =
        campusLocations.length;


    byId(
        "adminSupportCount"
    ).textContent =
        supportServices.length;


    byId(
        "adminReportCount"
    ).textContent =
        feedbackReports.length;


    renderAdminAnnouncements();

    renderAdminEvents();

    renderAdminLocations();

    renderAdminSupport();

    renderAdminReports();
}


function showAdminSection(
    id
) {

    all(
        ".admin-section"
    )
        .forEach(
            section => {

                section.classList.add(
                    "hidden"
                );
            }
        );


    byId(
        id
    )?.classList.remove(
        "hidden"
    );


    all(
        ".admin-nav-link"
    )
        .forEach(
            link => {

                link.classList.toggle(
                    "active",
                    link.dataset
                        .adminSection ===
                    id
                );
            }
        );


    const names = {

        adminDashboardSection:
            "Dashboard",

        adminAnnouncementsSection:
            "Announcements",

        adminEventsSection:
            "Events",

        adminLocationsSection:
            "Campus Locations",

        adminSupportSection:
            "Support Services",

        adminReportsSection:
            "Student Reports"

    };


    byId(
        "adminTopbarTitle"
    ).textContent =
        names[id] ||
        "Administration";
}


/* =========================================================
   ADMIN ANNOUNCEMENTS
========================================================= */

function renderAdminAnnouncements() {

    const body =
        byId(
            "adminAnnouncementsTable"
        );


    byId(
        "adminAnnouncementsTableCount"
    ).textContent =
        `${announcements.length} records`;


    byId(
        "adminAnnouncementCount"
    ).textContent =
        announcements.length;


    if (
        !announcements.length
    ) {

        body.innerHTML = `
            <tr>

                <td colspan="5">

                    <div class="empty-message">
                        No announcements available.
                    </div>

                </td>

            </tr>
        `;


        return;
    }


    body.innerHTML =
        announcements
            .map(
                item => `
                    <tr>

                        <td>

                            #${escapeHtml(
                                item.id
                            )}

                        </td>

                        <td>

                            <strong>

                                ${escapeHtml(
                                    item.title
                                )}

                            </strong>

                        </td>

                        <td class="admin-table-description">

                            ${escapeHtml(
                                item.content
                            )}

                        </td>

                        <td>

                            ${escapeHtml(
                                formatDate(
                                    item.date
                                )
                            )}

                        </td>

                        <td>

                            <div class="admin-action-buttons">

                                <button
                                    class="admin-edit-button"
                                    data-edit-announcement="${escapeHtml(
                                        item.id
                                    )}"
                                    type="button"
                                >
                                    Edit
                                </button>

                                <button
                                    class="admin-delete-button"
                                    data-delete-announcement="${escapeHtml(
                                        item.id
                                    )}"
                                    type="button"
                                >
                                    Delete
                                </button>

                            </div>

                        </td>

                    </tr>
                `
            )
            .join(
                ""
            );


    body
        .querySelectorAll(
            "[data-edit-announcement]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const item =
                            announcements.find(
                                announcement =>
                                    Number(
                                        announcement.id
                                    ) ===
                                    Number(
                                        button.dataset
                                            .editAnnouncement
                                    )
                            );


                        if (
                            item
                        ) {

                            openAnnouncementAdminForm(
                                item
                            );
                        }
                    }
                );
            }
        );


    body
        .querySelectorAll(
            "[data-delete-announcement]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteAnnouncement(
                            Number(
                                button.dataset
                                    .deleteAnnouncement
                            )
                        );
                    }
                );
            }
        );
}


function openAnnouncementAdminForm(
    announcement = null
) {

    const editing =
        Boolean(
            announcement
        );


    openGeneralModal(
        `
        <div class="modal-heading">

            <p class="section-eyebrow">
                Announcement Management
            </p>

            <h2>

                ${
                    editing
                        ?
                        "Edit Announcement"
                        :
                        "Add Announcement"
                }

            </h2>

            <p>

                ${
                    editing
                        ?
                        "Update the announcement shown to students."
                        :
                        "Create a new announcement for students."
                }

            </p>

        </div>


        <form id="adminAnnouncementForm">


            <div class="form-group">

                <label>
                    Title
                </label>

                <input
                    id="adminAnnouncementTitle"
                    type="text"
                    placeholder="Example: Campus Safety Reminder"
                    value="${
                        editing
                            ?
                            escapeHtml(
                                announcement.title
                            )
                            :
                            ""
                    }"
                    required
                >

            </div>


            <div class="form-group">

                <label>
                    Content
                </label>

                <textarea
                    id="adminAnnouncementContent"
                    rows="6"
                    placeholder="Example: Students are reminded to follow campus safety procedures..."
                    required
                >${
                    editing
                        ?
                        escapeHtml(
                            announcement.content
                        )
                        :
                        ""
                }</textarea>

            </div>


            <div class="form-group">

                <label>
                    Date
                </label>

                <input
                    id="adminAnnouncementDate"
                    type="date"
                    value="${
                        editing
                            ?
                            escapeHtml(
                                announcement.date
                            )
                            :
                            new Date()
                                .toISOString()
                                .split(
                                    "T"
                                )[0]
                    }"
                    required
                >

            </div>


            <p
                id="adminAnnouncementMessage"
                class="form-message"
            ></p>


            <button
                class="login-button"
                type="submit"
            >

                ${
                    editing
                        ?
                        "Save Changes"
                        :
                        "Add Announcement"
                }

            </button>

        </form>
        `
    );


    byId(
        "adminAnnouncementForm"
    ).addEventListener(
        "submit",
        event => {

            event.preventDefault();


            saveAnnouncement(
                editing
                    ?
                    announcement.id
                    :
                    null
            );
        }
    );
}


async function saveAnnouncement(
    announcementId = null
) {

    const title =
        byId(
            "adminAnnouncementTitle"
        ).value
            .trim();


    const content =
        byId(
            "adminAnnouncementContent"
        ).value
            .trim();


    const date =
        byId(
            "adminAnnouncementDate"
        ).value;


    const message =
        byId(
            "adminAnnouncementMessage"
        );


    const editing =
        announcementId !==
        null;


    try {

        const response =
            await fetch(
                editing
                    ?
                    `/api/announcements/${announcementId}`
                    :
                    "/api/announcements",
                {
                    method:
                        editing
                            ?
                            "PUT"
                            :
                            "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            {
                                title,
                                content,
                                date
                            }
                        )
                }
            );


        const result =
            await safeJson(
                response
            );


        if (
            !response.ok ||
            result?.success === false
        ) {

            throw new Error(
                result?.message ||
                "Unable to save announcement."
            );
        }


        message.textContent =
            editing
                ?
                "Announcement updated successfully."
                :
                "Announcement added successfully.";


        message.className =
            "form-message success";


        await fetchAdminAnnouncements();


        renderAdminAnnouncements();


        setTimeout(
            closeGeneralModal,
            600
        );

    } catch (error) {

        message.textContent =
            error.message;


        message.className =
            "form-message error";
    }
}


async function deleteAnnouncement(
    id
) {

    const item =
        announcements.find(
            announcement =>
                Number(
                    announcement.id
                ) ===
                Number(
                    id
                )
        );


    if (
        !window.confirm(
            `Delete "${
                item?.title ||
                "this announcement"
            }"?`
        )
    ) {

        return;
    }


    try {

        const response =
            await fetch(
                `/api/announcements/${id}`,
                {
                    method:
                        "DELETE"
                }
            );


        const result =
            await safeJson(
                response
            );


        if (
            !response.ok ||
            result?.success === false
        ) {

            throw new Error(
                result?.message ||
                "Unable to delete announcement."
            );
        }


        await fetchAdminAnnouncements();


        renderAdminAnnouncements();

    } catch (error) {

        alert(
            error.message ||
            "Unable to delete announcement."
        );
    }
}


/* =========================================================
   ADMIN EVENTS
========================================================= */

function renderAdminEvents() {

    const body =
        byId(
            "adminEventsTable"
        );


    byId(
        "adminEventsTableCount"
    ).textContent =
        `${events.length} records`;


    byId(
        "adminEventCount"
    ).textContent =
        events.length;


    if (
        !events.length
    ) {

        body.innerHTML = `
            <tr>

                <td colspan="7">

                    <div class="empty-message">
                        No events available.
                    </div>

                </td>

            </tr>
        `;


        return;
    }


    body.innerHTML =
        events
            .map(
                item => `
                    <tr>

                        <td>

                            #${escapeHtml(
                                item.id
                            )}

                        </td>

                        <td>

                            <strong>

                                ${escapeHtml(
                                    item.name ||
                                    "Event"
                                )}

                            </strong>

                        </td>

                        <td class="admin-table-description">

                            ${escapeHtml(
                                item.description ||
                                ""
                            )}

                        </td>

                        <td>

                            ${escapeHtml(
                                formatDate(
                                    item.date
                                )
                            )}

                        </td>

                        <td>

                            ${escapeHtml(
                                formatEventTime(
                                    item.time
                                )
                            )}

                        </td>

                        <td>

                            ${escapeHtml(
                                item.location ||
                                ""
                            )}

                        </td>

                        <td>

                            <div class="admin-action-buttons">

                                <button
                                    class="admin-edit-button"
                                    data-edit-event="${escapeHtml(
                                        item.id
                                    )}"
                                    type="button"
                                >
                                    Edit
                                </button>

                                <button
                                    class="admin-delete-button"
                                    data-delete-event="${escapeHtml(
                                        item.id
                                    )}"
                                    type="button"
                                >
                                    Delete
                                </button>

                            </div>

                        </td>

                    </tr>
                `
            )
            .join(
                ""
            );


    body
        .querySelectorAll(
            "[data-edit-event]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const item =
                            events.find(
                                event =>
                                    Number(
                                        event.id
                                    ) ===
                                    Number(
                                        button.dataset
                                            .editEvent
                                    )
                            );


                        if (
                            item
                        ) {

                            openEventAdminForm(
                                item
                            );
                        }
                    }
                );
            }
        );


    body
        .querySelectorAll(
            "[data-delete-event]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteAdminEvent(
                            Number(
                                button.dataset
                                    .deleteEvent
                            )
                        );
                    }
                );
            }
        );
}


function openEventAdminForm(
    eventItem = null
) {

    const editing =
        Boolean(
            eventItem
        );


    openGeneralModal(
        `
        <div class="modal-heading">

            <p class="section-eyebrow">
                Event Management
            </p>

            <h2>

                ${
                    editing
                        ?
                        "Edit Event"
                        :
                        "Add Event"
                }

            </h2>

            <p>

                ${
                    editing
                        ?
                        "Update the event information below."
                        :
                        "Create a new event for students."
                }

            </p>

        </div>


        <form id="adminEventForm">


            <div class="form-group">

                <label>
                    Event Name
                </label>

                <input
                    id="adminEventName"
                    type="text"
                    placeholder="Example: Career Fair 2026"
                    value="${
                        editing
                            ?
                            escapeHtml(
                                eventItem.name ||
                                ""
                            )
                            :
                            ""
                    }"
                    required
                >

            </div>


            <div class="form-group">

                <label>
                    Description
                </label>

                <textarea
                    id="adminEventDescription"
                    rows="5"
                    placeholder="Example: Meet employers, explore graduate opportunities and learn about internships."
                    required
                >${
                    editing
                        ?
                        escapeHtml(
                            eventItem.description ||
                            ""
                        )
                        :
                        ""
                }</textarea>

            </div>


            <div class="event-form-grid">


                <div class="form-group">

                    <label>
                        Date
                    </label>

                    <input
                        id="adminEventDate"
                        type="date"
                        value="${
                            editing
                                ?
                                escapeHtml(
                                    eventItem.date ||
                                    ""
                                )
                                :
                                ""
                        }"
                        required
                    >

                </div>


                <div class="form-group">

                    <label>
                        Time
                    </label>

                    <input
                        id="adminEventTime"
                        type="time"
                        value="${
                            editing
                                ?
                                escapeHtml(
                                    eventTimeForInput(
                                        eventItem.time
                                    )
                                )
                                :
                                ""
                        }"
                        required
                    >

                </div>

            </div>


            <div class="form-group">

                <label>
                    Location
                </label>

                <input
                    id="adminEventLocation"
                    type="text"
                    placeholder="Example: Main Hall"
                    value="${
                        editing
                            ?
                            escapeHtml(
                                eventItem.location ||
                                ""
                            )
                            :
                            ""
                    }"
                    required
                >

            </div>


            <p
                id="adminEventMessage"
                class="form-message"
            ></p>


            <button
                class="login-button"
                type="submit"
            >

                ${
                    editing
                        ?
                        "Save Changes"
                        :
                        "Add Event"
                }

            </button>

        </form>
        `
    );


    byId(
        "adminEventForm"
    ).addEventListener(
        "submit",
        event => {

            event.preventDefault();


            saveAdminEvent(
                editing
                    ?
                    eventItem.id
                    :
                    null
            );
        }
    );
}


async function saveAdminEvent(
    eventId = null
) {

    const name =
        byId(
            "adminEventName"
        ).value
            .trim();


    const description =
        byId(
            "adminEventDescription"
        ).value
            .trim();


    const date =
        byId(
            "adminEventDate"
        ).value;


    const time =
        byId(
            "adminEventTime"
        ).value;


    const location =
        byId(
            "adminEventLocation"
        ).value
            .trim();


    const message =
        byId(
            "adminEventMessage"
        );


    const editing =
        eventId !==
        null;


    if (
        !name ||
        !description ||
        !date ||
        !time ||
        !location
    ) {

        message.textContent =
            "Please complete all fields.";


        message.className =
            "form-message error";


        return;
    }


    try {

        const response =
            await fetch(
                editing
                    ?
                    `/api/events/${eventId}`
                    :
                    "/api/events",
                {
                    method:
                        editing
                            ?
                            "PUT"
                            :
                            "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            {
                                name,
                                description,
                                date,
                                time,
                                location
                            }
                        )
                }
            );


        const result =
            await safeJson(
                response
            );


        if (
            !response.ok ||
            result?.success === false
        ) {

            throw new Error(
                result?.message ||
                "Unable to save event."
            );
        }


        message.textContent =
            editing
                ?
                "Event updated successfully."
                :
                "Event added successfully.";


        message.className =
            "form-message success";


        await fetchAdminEvents();


        renderAdminEvents();


        setTimeout(
            closeGeneralModal,
            650
        );

    } catch (error) {

        message.textContent =
            error.message ||
            "Unable to save event.";


        message.className =
            "form-message error";
    }
}


async function deleteAdminEvent(
    eventId
) {

    const item =
        events.find(
            event =>
                Number(
                    event.id
                ) ===
                Number(
                    eventId
                )
        );


    if (
        !window.confirm(
            `Delete "${
                item?.name ||
                "this event"
            }"?

This event will also disappear from the student dashboard.`
        )
    ) {

        return;
    }


    try {

        const response =
            await fetch(
                `/api/events/${eventId}`,
                {
                    method:
                        "DELETE"
                }
            );


        const result =
            await safeJson(
                response
            );


        if (
            !response.ok ||
            result?.success === false
        ) {

            throw new Error(
                result?.message ||
                "Unable to delete event."
            );
        }


        await fetchAdminEvents();


        renderAdminEvents();

    } catch (error) {

        alert(
            error.message ||
            "Unable to delete event."
        );
    }
}


/* =========================================================
   ADMIN LOCATIONS
========================================================= */

function renderAdminLocations() {

    const body =
        byId(
            "adminLocationsTable"
        );


    byId(
        "adminLocationsTableCount"
    ).textContent =
        `${campusLocations.length} records`;


    byId(
        "adminLocationCount"
    ).textContent =
        campusLocations.length;


    if (
        !campusLocations.length
    ) {

        body.innerHTML = `
            <tr>

                <td colspan="7">

                    <div class="empty-message">
                        No campus locations available.
                    </div>

                </td>

            </tr>
        `;


        return;
    }


    body.innerHTML =
        campusLocations
            .map(
                item => `
                    <tr>

                        <td>

                            #${escapeHtml(
                                item.id
                            )}

                        </td>

                        <td>

                            <strong>

                                ${escapeHtml(
                                    item.building
                                )}

                            </strong>

                        </td>

                        <td>

                            ${escapeHtml(
                                item.location ||
                                ""
                            )}

                        </td>

                        <td>

                            <span class="location-category-admin">

                                ${escapeHtml(
                                    item.category ||
                                    ""
                                )}

                            </span>

                        </td>

                        <td>

                            ${escapeHtml(
                                item.opening_hours ||
                                ""
                            )}

                        </td>

                        <td>

                            X:

                            ${escapeHtml(
                                item.map_x
                            )}

                            <br>

                            Y:

                            ${escapeHtml(
                                item.map_y
                            )}

                        </td>

                        <td>

                            <div class="admin-action-buttons">

                                <button
                                    class="admin-edit-button"
                                    data-edit-location="${escapeHtml(
                                        item.id
                                    )}"
                                    type="button"
                                >
                                    Edit
                                </button>

                                <button
                                    class="admin-delete-button"
                                    data-delete-location="${escapeHtml(
                                        item.id
                                    )}"
                                    type="button"
                                >
                                    Delete
                                </button>

                            </div>

                        </td>

                    </tr>
                `
            )
            .join(
                ""
            );


    body
        .querySelectorAll(
            "[data-edit-location]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const item =
                            campusLocations.find(
                                location =>
                                    Number(
                                        location.id
                                    ) ===
                                    Number(
                                        button.dataset
                                            .editLocation
                                    )
                            );


                        if (
                            item
                        ) {

                            openLocationAdminForm(
                                item
                            );
                        }
                    }
                );
            }
        );


    body
        .querySelectorAll(
            "[data-delete-location]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteAdminLocation(
                            Number(
                                button.dataset
                                    .deleteLocation
                            )
                        );
                    }
                );
            }
        );
}


function openLocationAdminForm(
    locationItem = null
) {

    const editing =
        Boolean(
            locationItem
        );


    const categories =
        [
            "Academic",
            "Library",
            "Student Services",
            "Events",
            "Recreation",
            "Administration",
            "Accommodation"
        ];


    openGeneralModal(
        `
        <div class="modal-heading">

            <p class="section-eyebrow">
                Campus Location Management
            </p>

            <h2>

                ${
                    editing
                        ?
                        "Edit Campus Location"
                        :
                        "Add Campus Location"
                }

            </h2>

            <p>
                This information will be displayed
                on the student campus map.
            </p>

        </div>


        <form id="adminLocationForm">


            <div class="form-group">

                <label>
                    Building Name
                </label>

                <input
                    id="adminLocationBuilding"
                    type="text"
                    placeholder="Example: Main Library"
                    value="${
                        editing
                            ?
                            escapeHtml(
                                locationItem.building ||
                                ""
                            )
                            :
                            ""
                    }"
                    required
                >

            </div>


            <div class="form-group">

                <label>
                    Description
                </label>

                <textarea
                    id="adminLocationDescription"
                    rows="4"
                    placeholder="Example: Main campus library with study areas, computers and academic resources."
                    required
                >${
                    editing
                        ?
                        escapeHtml(
                            locationItem.description ||
                            ""
                        )
                        :
                        ""
                }</textarea>

            </div>


            <div class="location-form-grid">


                <div class="form-group">

                    <label>
                        Location
                    </label>

                    <input
                        id="adminLocationLocation"
                        type="text"
                        placeholder="Example: Building A"
                        value="${
                            editing
                                ?
                                escapeHtml(
                                    locationItem.location ||
                                    ""
                                )
                                :
                                ""
                        }"
                        required
                    >

                </div>


                <div class="form-group">

                    <label>
                        Category
                    </label>

                    <select
                        id="adminLocationCategory"
                        required
                    >

                        <option value="">
                            Select category
                        </option>

                        ${
                            categories
                                .map(
                                    category => `
                                        <option
                                            value="${category}"
                                            ${
                                                editing &&
                                                locationItem.category ===
                                                category
                                                    ?
                                                    "selected"
                                                    :
                                                    ""
                                            }
                                        >
                                            ${category}
                                        </option>
                                    `
                                )
                                .join(
                                    ""
                                )
                        }

                    </select>

                </div>

            </div>


            <div class="form-group">

                <label>
                    Opening Hours
                </label>

                <input
                    id="adminLocationOpeningHours"
                    type="text"
                    placeholder="Example: Monday - Friday, 8:00 AM - 8:00 PM"
                    value="${
                        editing
                            ?
                            escapeHtml(
                                locationItem.opening_hours ||
                                ""
                            )
                            :
                            ""
                    }"
                    required
                >

            </div>


            <div class="form-group">

                <label>
                    Services Available
                </label>

                <textarea
                    id="adminLocationServices"
                    rows="3"
                    placeholder="Example: Study rooms, printing, computers, Wi-Fi and borrowing services."
                    required
                >${
                    editing
                        ?
                        escapeHtml(
                            locationItem.services ||
                            ""
                        )
                        :
                        ""
                }</textarea>

            </div>


            <div class="form-group">

                <label>
                    Accessibility
                </label>

                <textarea
                    id="adminLocationAccessibility"
                    rows="3"
                    placeholder="Example: Wheelchair accessible entrance, lift and accessible toilets."
                    required
                >${
                    editing
                        ?
                        escapeHtml(
                            locationItem.accessibility ||
                            ""
                        )
                        :
                        ""
                }</textarea>

            </div>


            <div class="form-group">

                <label>
                    Directions
                </label>

                <textarea
                    id="adminLocationDirections"
                    rows="3"
                    placeholder="Example: From the main entrance, walk straight and turn left after the Student Centre."
                    required
                >${
                    editing
                        ?
                        escapeHtml(
                            locationItem.directions ||
                            ""
                        )
                        :
                        ""
                }</textarea>

            </div>


            <div class="location-form-grid">


                <div class="form-group">

                    <label>
                        Map X (0 - 100)
                    </label>

                    <input
                        id="adminLocationMapX"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="Example: 25"
                        value="${
                            editing
                                ?
                                escapeHtml(
                                    locationItem.map_x
                                )
                                :
                                "50"
                        }"
                        required
                    >

                </div>


                <div class="form-group">

                    <label>
                        Map Y (0 - 100)
                    </label>

                    <input
                        id="adminLocationMapY"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="Example: 35"
                        value="${
                            editing
                                ?
                                escapeHtml(
                                    locationItem.map_y
                                )
                                :
                                "50"
                        }"
                        required
                    >

                </div>

            </div>


            <p
                id="adminLocationMessage"
                class="form-message"
            ></p>


            <button
                class="login-button"
                type="submit"
            >

                ${
                    editing
                        ?
                        "Save Changes"
                        :
                        "Add Campus Location"
                }

            </button>

        </form>
        `
    );


    byId(
        "adminLocationForm"
    ).addEventListener(
        "submit",
        event => {

            event.preventDefault();


            saveAdminLocation(
                editing
                    ?
                    locationItem.id
                    :
                    null
            );
        }
    );
}


async function saveAdminLocation(
    locationId = null
) {

    const payload = {

        building:
            byId(
                "adminLocationBuilding"
            ).value
                .trim(),

        description:
            byId(
                "adminLocationDescription"
            ).value
                .trim(),

        location:
            byId(
                "adminLocationLocation"
            ).value
                .trim(),

        category:
            byId(
                "adminLocationCategory"
            ).value,

        opening_hours:
            byId(
                "adminLocationOpeningHours"
            ).value
                .trim(),

        services:
            byId(
                "adminLocationServices"
            ).value
                .trim(),

        accessibility:
            byId(
                "adminLocationAccessibility"
            ).value
                .trim(),

        directions:
            byId(
                "adminLocationDirections"
            ).value
                .trim(),

        map_x:
            byId(
                "adminLocationMapX"
            ).value,

        map_y:
            byId(
                "adminLocationMapY"
            ).value

    };


    const message =
        byId(
            "adminLocationMessage"
        );


    const editing =
        locationId !==
        null;


    if (
        Object.values(
            payload
        )
            .some(
                value =>
                    String(
                        value
                    )
                        .trim() ===
                    ""
            )
    ) {

        message.textContent =
            "Please complete all fields.";


        message.className =
            "form-message error";


        return;
    }


    try {

        const response =
            await fetch(
                editing
                    ?
                    `/api/locations/${locationId}`
                    :
                    "/api/locations",
                {
                    method:
                        editing
                            ?
                            "PUT"
                            :
                            "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );


        const result =
            await safeJson(
                response
            );


        if (
            !response.ok ||
            result?.success === false
        ) {

            throw new Error(
                result?.message ||
                "Unable to save campus location."
            );
        }


        message.textContent =
            editing
                ?
                "Campus location updated successfully."
                :
                "Campus location added successfully.";


        message.className =
            "form-message success";


        await fetchAdminLocations();


        renderAdminLocations();


        setTimeout(
            closeGeneralModal,
            650
        );

    } catch (error) {

        message.textContent =
            error.message ||
            "Unable to save campus location.";


        message.className =
            "form-message error";
    }
}


async function deleteAdminLocation(
    locationId
) {

    const item =
        campusLocations.find(
            location =>
                Number(
                    location.id
                ) ===
                Number(
                    locationId
                )
        );


    if (
        !window.confirm(
            `Delete "${
                item?.building ||
                "this campus location"
            }"?

It will disappear from the student campus map.`
        )
    ) {

        return;
    }


    try {

        const response =
            await fetch(
                `/api/locations/${locationId}`,
                {
                    method:
                        "DELETE"
                }
            );


        const result =
            await safeJson(
                response
            );


        if (
            !response.ok ||
            result?.success === false
        ) {

            throw new Error(
                result?.message ||
                "Unable to delete campus location."
            );
        }


        await fetchAdminLocations();


        renderAdminLocations();

    } catch (error) {

        alert(
            error.message ||
            "Unable to delete campus location."
        );
    }
}


/* =========================================================
   ADMIN SUPPORT SERVICES
========================================================= */

function renderAdminSupport() {

    const body =
        byId(
            "adminSupportTable"
        );


    byId(
        "adminSupportTableCount"
    ).textContent =
        `${supportServices.length} records`;


    byId(
        "adminSupportCount"
    ).textContent =
        supportServices.length;


    if (
        !supportServices.length
    ) {

        body.innerHTML = `
            <tr>

                <td colspan="6">

                    <div class="empty-message">
                        No support services available.
                    </div>

                </td>

            </tr>
        `;


        return;
    }


    body.innerHTML =
        supportServices
            .map(
                item => `
                    <tr>

                        <td>

                            #${escapeHtml(
                                item.id
                            )}

                        </td>

                        <td>

                            <strong>

                                ${escapeHtml(
                                    item.name
                                )}

                            </strong>

                        </td>

                        <td class="admin-table-description">

                            ${escapeHtml(
                                item.description ||
                                ""
                            )}

                        </td>

                        <td>

                            ${escapeHtml(
                                item.contact ||
                                ""
                            )}

                        </td>

                        <td>

                            ${escapeHtml(
                                item.location ||
                                ""
                            )}

                        </td>

                        <td>

                            <div class="admin-action-buttons">

                                <button
                                    class="admin-edit-button"
                                    data-edit-support="${escapeHtml(
                                        item.id
                                    )}"
                                    type="button"
                                >
                                    Edit
                                </button>

                                <button
                                    class="admin-delete-button"
                                    data-delete-support="${escapeHtml(
                                        item.id
                                    )}"
                                    type="button"
                                >
                                    Delete
                                </button>

                            </div>

                        </td>

                    </tr>
                `
            )
            .join(
                ""
            );


    body
        .querySelectorAll(
            "[data-edit-support]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const item =
                            supportServices.find(
                                service =>
                                    Number(
                                        service.id
                                    ) ===
                                    Number(
                                        button.dataset
                                            .editSupport
                                    )
                            );


                        if (
                            item
                        ) {

                            openSupportAdminForm(
                                item
                            );
                        }
                    }
                );
            }
        );


    body
        .querySelectorAll(
            "[data-delete-support]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteAdminSupport(
                            Number(
                                button.dataset
                                    .deleteSupport
                            )
                        );
                    }
                );
            }
        );
}


function openSupportAdminForm(
    service = null
) {

    const editing =
        Boolean(
            service
        );


    openGeneralModal(
        `
        <div class="modal-heading">

            <p class="section-eyebrow">
                Support Service Management
            </p>

            <h2>

                ${
                    editing
                        ?
                        "Edit Support Service"
                        :
                        "Add Support Service"
                }

            </h2>

            <p>

                ${
                    editing
                        ?
                        "Update the student support service below."
                        :
                        "Create a new support service for students."
                }

            </p>

        </div>


        <form id="adminSupportForm">


            <div class="form-group">

                <label>
                    Service Name
                </label>

                <input
                    id="adminSupportName"
                    type="text"
                    placeholder="Example: Academic Support"
                    value="${
                        editing
                            ?
                            escapeHtml(
                                service.name ||
                                ""
                            )
                            :
                            ""
                    }"
                    required
                >

            </div>


            <div class="form-group">

                <label>
                    Description
                </label>

                <textarea
                    id="adminSupportDescription"
                    rows="5"
                    placeholder="Example: Academic assistance, study guidance and learning support."
                    required
                >${
                    editing
                        ?
                        escapeHtml(
                            service.description ||
                            ""
                        )
                        :
                        ""
                }</textarea>

            </div>


            <div class="form-group">

                <label>
                    Contact
                </label>

                <input
                    id="adminSupportContact"
                    type="text"
                    placeholder="Example: academic@smartcampus.com"
                    value="${
                        editing
                            ?
                            escapeHtml(
                                service.contact ||
                                ""
                            )
                            :
                            ""
                    }"
                    required
                >

            </div>


            <div class="form-group">

                <label>
                    Location
                </label>

                <input
                    id="adminSupportLocation"
                    type="text"
                    placeholder="Example: Student Centre"
                    value="${
                        editing
                            ?
                            escapeHtml(
                                service.location ||
                                ""
                            )
                            :
                            ""
                    }"
                    required
                >

            </div>


            <p
                id="adminSupportMessage"
                class="form-message"
            ></p>


            <button
                class="login-button"
                type="submit"
            >

                ${
                    editing
                        ?
                        "Save Changes"
                        :
                        "Add Support Service"
                }

            </button>

        </form>
        `
    );


    byId(
        "adminSupportForm"
    ).addEventListener(
        "submit",
        event => {

            event.preventDefault();


            saveAdminSupport(
                editing
                    ?
                    service.id
                    :
                    null
            );
        }
    );
}


async function saveAdminSupport(
    serviceId = null
) {

    const payload = {

        name:
            byId(
                "adminSupportName"
            ).value
                .trim(),

        description:
            byId(
                "adminSupportDescription"
            ).value
                .trim(),

        contact:
            byId(
                "adminSupportContact"
            ).value
                .trim(),

        location:
            byId(
                "adminSupportLocation"
            ).value
                .trim()

    };


    const message =
        byId(
            "adminSupportMessage"
        );


    const editing =
        serviceId !==
        null;


    if (
        Object.values(
            payload
        )
            .some(
                value =>
                    !value
            )
    ) {

        message.textContent =
            "Please complete all fields.";


        message.className =
            "form-message error";


        return;
    }


    try {

        const response =
            await fetch(
                editing
                    ?
                    `/api/support-services/${serviceId}`
                    :
                    "/api/support-services",
                {
                    method:
                        editing
                            ?
                            "PUT"
                            :
                            "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );


        const result =
            await safeJson(
                response
            );


        if (
            !response.ok ||
            result?.success === false
        ) {

            throw new Error(
                result?.message ||
                "Unable to save support service."
            );
        }


        message.textContent =
            editing
                ?
                "Support service updated successfully."
                :
                "Support service added successfully.";


        message.className =
            "form-message success";


        await fetchAdminSupport();


        renderAdminSupport();


        setTimeout(
            closeGeneralModal,
            650
        );

    } catch (error) {

        message.textContent =
            error.message ||
            "Unable to save support service.";


        message.className =
            "form-message error";
    }
}


async function deleteAdminSupport(
    serviceId
) {

    const item =
        supportServices.find(
            service =>
                Number(
                    service.id
                ) ===
                Number(
                    serviceId
                )
        );


    if (
        !window.confirm(
            `Delete "${
                item?.name ||
                "this support service"
            }"?

It will disappear from the student Support Services section.`
        )
    ) {

        return;
    }


    try {

        const response =
            await fetch(
                `/api/support-services/${serviceId}`,
                {
                    method:
                        "DELETE"
                }
            );


        const result =
            await safeJson(
                response
            );


        if (
            !response.ok ||
            result?.success === false
        ) {

            throw new Error(
                result?.message ||
                "Unable to delete support service."
            );
        }


        await fetchAdminSupport();


        renderAdminSupport();

    } catch (error) {

        alert(
            error.message ||
            "Unable to delete support service."
        );
    }
}


/* =========================================================
   ADMIN REPORTS
========================================================= */

function renderAdminReports() {

    const body =
        byId(
            "adminReportsTable"
        );


    const total =
        feedbackReports.length;


    byId(
        "reportTotalCount"
    ).textContent =
        total;


    byId(
        "reportSubmittedCount"
    ).textContent =
        feedbackReports.filter(
            report =>
                report.status ===
                "Submitted"
        ).length;


    byId(
        "reportProgressCount"
    ).textContent =
        feedbackReports.filter(
            report =>
                report.status ===
                "In Progress"
        ).length;


    byId(
        "reportResolvedCount"
    ).textContent =
        feedbackReports.filter(
            report =>
                report.status ===
                "Resolved"
        ).length;


    byId(
        "adminReportsTableCount"
    ).textContent =
        `${total} records`;


    byId(
        "adminReportCount"
    ).textContent =
        total;


    if (
        !total
    ) {

        body.innerHTML = `
            <tr>

                <td colspan="7">

                    <div class="empty-message">
                        No student reports available.
                    </div>

                </td>

            </tr>
        `;


        return;
    }


    body.innerHTML =
        feedbackReports
            .map(
                report => {

                    const statusClass =
                        String(
                            report.status ||
                            "Submitted"
                        )
                            .toLowerCase()
                            .replaceAll(
                                " ",
                                "-"
                            );


                    const typeClass =
                        String(
                            report.type ||
                            "Issue"
                        )
                            .toLowerCase();


                    return `
                        <tr>

                            <td>

                                #${escapeHtml(
                                    report.id
                                )}

                            </td>


                            <td>

                                <strong>

                                    ${escapeHtml(
                                        report.user_name ||
                                        `Student #${report.user_id}`
                                    )}

                                </strong>

                                <br>

                                <small>

                                    ${escapeHtml(
                                        report.user_email ||
                                        ""
                                    )}

                                </small>

                            </td>


                            <td>

                                <span
                                    class="
                                        report-type-badge
                                        report-type-${typeClass}
                                    "
                                >

                                    ${escapeHtml(
                                        report.type ||
                                        "Issue"
                                    )}

                                </span>

                            </td>


                            <td>

                                ${escapeHtml(
                                    report.subject ||
                                    ""
                                )}

                            </td>


                            <td>

                                ${escapeHtml(
                                    report.description ||
                                    ""
                                )}

                            </td>


                            <td>

                                <span
                                    class="
                                        report-status-badge
                                        report-status-${statusClass}
                                    "
                                >

                                    ${escapeHtml(
                                        report.status ||
                                        "Submitted"
                                    )}

                                </span>

                            </td>


                            <td>

                                <select
                                    class="report-status-select"
                                    data-report-id="${escapeHtml(
                                        report.id
                                    )}"
                                >

                                    <option
                                        value="Submitted"
                                        ${
                                            report.status ===
                                            "Submitted"
                                                ?
                                                "selected"
                                                :
                                                ""
                                        }
                                    >
                                        Submitted
                                    </option>

                                    <option
                                        value="In Progress"
                                        ${
                                            report.status ===
                                            "In Progress"
                                                ?
                                                "selected"
                                                :
                                                ""
                                        }
                                    >
                                        In Progress
                                    </option>

                                    <option
                                        value="Resolved"
                                        ${
                                            report.status ===
                                            "Resolved"
                                                ?
                                                "selected"
                                                :
                                                ""
                                        }
                                    >
                                        Resolved
                                    </option>

                                </select>

                            </td>

                        </tr>
                    `;
                }
            )
            .join(
                ""
            );


    body
        .querySelectorAll(
            ".report-status-select"
        )
        .forEach(
            select => {

                select.addEventListener(
                    "change",
                    () => {

                        updateFeedbackStatus(
                            select.dataset
                                .reportId,

                            select.value
                        );
                    }
                );
            }
        );
}


async function updateFeedbackStatus(
    id,
    status
) {

    try {

        const response =
            await fetch(
                `/api/feedback/${id}`,
                {
                    method:
                        "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            {
                                status
                            }
                        )
                }
            );


        const result =
            await safeJson(
                response
            );


        if (
            !response.ok ||
            result?.success === false
        ) {

            throw new Error(
                result?.message ||
                "Unable to update report status."
            );
        }


        await fetchAdminFeedback();


        renderAdminReports();

    } catch (error) {

        alert(
            error.message ||
            "Unable to update report status."
        );


        await fetchAdminFeedback();


        renderAdminReports();
    }
}


/* =========================================================
   EVENT LISTENERS
========================================================= */

passwordInput?.addEventListener(
    "input",
    checkPasswordRules
);


passwordInput?.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Enter"
        ) {

            login();
        }
    }
);


loginButton?.addEventListener(
    "click",
    login
);


togglePassword?.addEventListener(
    "click",
    () => {

        const visible =
            passwordInput.type ===
            "text";


        passwordInput.type =
            visible
                ?
                "password"
                :
                "text";


        togglePassword.textContent =
            visible
                ?
                "Show"
                :
                "Hide";
    }
);


byId(
    "sidebarLogoutBtn"
)?.addEventListener(
    "click",
    logout
);


byId(
    "adminLogoutBtn"
)?.addEventListener(
    "click",
    logout
);


/* =========================================================
   CLOSE MODALS
========================================================= */

all(
    "[data-close-modal]"
)
    .forEach(
        node => {

            node.addEventListener(
                "click",
                closeGeneralModal
            );
        }
    );


all(
    "[data-close-location]"
)
    .forEach(
        node => {

            node.addEventListener(
                "click",
                closeLocationModal
            );
        }
    );


all(
    "[data-close-report]"
)
    .forEach(
        node => {

            node.addEventListener(
                "click",
                closeReportModal
            );
        }
    );


/* =========================================================
   STUDENT NAVIGATION
========================================================= */

all(
    ".feature-card"
)
    .forEach(
        card => {

            card.addEventListener(
                "click",
                () => {

                    scrollToSection(
                        card.dataset.target
                    );
                }
            );
        }
    );


all(
    ".sidebar-link[data-section]"
)
    .forEach(
        link => {

            link.addEventListener(
                "click",
                event => {

                    event.preventDefault();


                    all(
                        ".sidebar-link[data-section]"
                    )
                        .forEach(
                            item => {

                                item.classList.remove(
                                    "active"
                                );
                            }
                        );


                    link.classList.add(
                        "active"
                    );


                    scrollToSection(
                        link.dataset.section
                    );
                }
            );
        }
    );


byId(
    "mobileMenuButton"
)?.addEventListener(
    "click",
    () => {

        byId(
            "sidebar"
        )?.classList.toggle(
            "open"
        );
    }
);


byId(
    "quickSupportButton"
)?.addEventListener(
    "click",
    () => {

        scrollToSection(
            "support"
        );
    }
);


byId(
    "quickReportButton"
)?.addEventListener(
    "click",
    openReportModal
);


byId(
    "sidebarReportBtn"
)?.addEventListener(
    "click",
    openReportModal
);


byId(
    "reportIssueForm"
)?.addEventListener(
    "submit",
    submitStudentReport
);


byId(
    "refreshMyReports"
)?.addEventListener(
    "click",
    loadMyReports
);


/* =========================================================
   VIEW ALL
========================================================= */

byId(
    "viewAllAnnouncements"
)?.addEventListener(
    "click",
    openAllAnnouncements
);


byId(
    "viewAllEvents"
)?.addEventListener(
    "click",
    openAllEvents
);


byId(
    "viewAllSupport"
)?.addEventListener(
    "click",
    openAllSupport
);


/* =========================================================
   CAMPUS MAP CONTROLS
========================================================= */

byId(
    "campusSearchButton"
)?.addEventListener(
    "click",
    searchCampusLocation
);


byId(
    "campusSearchInput"
)?.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Enter"
        ) {

            searchCampusLocation();
        }
    }
);


byId(
    "resetMapButton"
)?.addEventListener(
    "click",
    resetCampusMap
);


/* =========================================================
   NOTIFICATION CONTROLS
========================================================= */

byId(
    "notificationButton"
)?.addEventListener(
    "click",
    event => {

        event.stopPropagation();


        byId(
            "notificationDropdown"
        ).classList.toggle(
            "hidden"
        );
    }
);


byId(
    "viewAllNotifications"
)?.addEventListener(
    "click",
    openAllNotifications
);


byId(
    "notificationViewAllTop"
)?.addEventListener(
    "click",
    event => {

        event.stopPropagation();


        openAllNotifications();
    }
);


/* =========================================================
   GLOBAL SEARCH
========================================================= */

byId(
    "globalSearch"
)?.addEventListener(
    "input",
    event => {

        renderGlobalSearch(
            event.target.value
        );
    }
);


/* =========================================================
   CLOSE DROPDOWNS
========================================================= */

document.addEventListener(
    "click",
    event => {

        const notificationWrapper =
            document.querySelector(
                ".notification-wrapper"
            );


        if (
            notificationWrapper &&
            !notificationWrapper.contains(
                event.target
            )
        ) {

            byId(
                "notificationDropdown"
            )?.classList.add(
                "hidden"
            );
        }


        const searchContainer =
            document.querySelector(
                ".global-search-container"
            );


        if (
            searchContainer &&
            !searchContainer.contains(
                event.target
            )
        ) {

            byId(
                "globalSearchResults"
            )?.classList.add(
                "hidden"
            );
        }
    }
);


/* =========================================================
   ADMIN NAVIGATION
========================================================= */

all(
    ".admin-nav-link"
)
    .forEach(
        link => {

            link.addEventListener(
                "click",
                () => {

                    showAdminSection(
                        link.dataset
                            .adminSection
                    );
                }
            );
        }
    );


all(
    "[data-admin-open]"
)
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    showAdminSection(
                        button.dataset
                            .adminOpen
                    );
                }
            );
        }
    );


/* =========================================================
   ADMIN ADD BUTTONS
========================================================= */

byId(
    "addAnnouncementBtn"
)?.addEventListener(
    "click",
    () => {

        openAnnouncementAdminForm();
    }
);


byId(
    "addEventBtn"
)?.addEventListener(
    "click",
    () => {

        openEventAdminForm();
    }
);


byId(
    "addLocationBtn"
)?.addEventListener(
    "click",
    () => {

        openLocationAdminForm();
    }
);


byId(
    "addSupportBtn"
)?.addEventListener(
    "click",
    () => {

        openSupportAdminForm();
    }
);


/* =========================================================
   START APPLICATION
========================================================= */

cleanMapDirectorySidebar();

improveNotificationSpacing();

checkPasswordRules();

restoreSession();