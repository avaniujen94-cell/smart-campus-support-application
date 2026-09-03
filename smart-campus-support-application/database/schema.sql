-- Smart Campus Support Application database schema

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL
);

CREATE TABLE announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    posted_date TEXT NOT NULL,
    created_by INTEGER
);

CREATE TABLE events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    event_date TEXT NOT NULL,
    event_time TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT
);

CREATE TABLE campus_locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    building TEXT,
    room TEXT,
    category TEXT,
    description TEXT
);

CREATE TABLE support_services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    phone TEXT,
    email TEXT,
    location TEXT
);

CREATE TABLE feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    issue_type TEXT NOT NULL,
    details TEXT NOT NULL,
    submitted_by INTEGER,
    status TEXT NOT NULL DEFAULT 'Open',
    submitted_at TEXT DEFAULT CURRENT_TIMESTAMP
);
