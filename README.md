# Servexa — Smart Technician & Home Service Platform

<p align="center">
  <strong>Find the Right Technician. Book the Right Service.</strong>
</p>

<p align="center">
  A Bangladesh-focused platform for discovering, comparing, and booking nearby skilled technicians and home service providers.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#how-it-works">How It Works</a> •
  <a href="#technology-stack">Technology</a> •
  <a href="#installation">Installation</a> •
  <a href="#project-structure">Structure</a>
</p>

---

## About Servexa

**Servexa** is a smart technician and home service platform designed for Bangladesh. It helps customers find suitable technicians for household and business maintenance services based on their **service needs, location, distance, availability, skills, experience, and ratings**.

Instead of searching for technician phone numbers manually, users can discover nearby professionals, compare their information, select a suitable technician, and submit a service booking through one organized platform.

Servexa supports different types of skilled service providers, including electricians, plumbers, AC technicians, painters, carpenters, mechanics, cleaners, and appliance repair technicians.

---

## Problem Statement

Finding a reliable technician in Bangladesh can often be difficult.

Customers may face problems such as:

* Difficulty finding a suitable technician nearby
* No organized way to compare technicians
* Uncertainty about technician availability
* Lack of information about experience and previous work
* Difficulty identifying the right type of technician for a specific problem
* Manual phone-based booking and communication
* No centralized platform for different home services

Servexa addresses these problems through a location-based digital service platform.

---

## Solution

Servexa connects **customers and skilled technicians** through a centralized service marketplace.

The platform allows customers to:

```text
Select / Describe a Problem
          ↓
Select Service Category
          ↓
Provide Location
          ↓
Discover Nearby Technicians
          ↓
Compare Technician Information
          ↓
Select a Suitable Technician
          ↓
Choose Date & Time
          ↓
Submit Service Booking
```

Technicians can receive and manage service requests according to their skills, service area, and availability.

---

## Core Features

### Customer Features

* Search and discover required services
* Describe a service problem
* Location-based technician discovery
* Interactive technician map
* Nearby technician search
* Service category filtering
* Distance-based filtering
* Availability-based filtering
* Technician profile viewing
* Experience and skill information
* Previous work / portfolio viewing
* Ratings and completed job information
* Service date and time selection
* Technician selection
* Service booking
* Booking status tracking

### Supported Service Categories

Servexa can support various skilled service categories such as:

* Electrical Services
* Plumbing Services
* AC Services
* Refrigerator & Appliance Repair
* Painting Services
* Carpentry
* Mechanical Services
* Cleaning Services
* Mobile & Computer Repair
* Bathroom & Kitchen Services
* Other Household Maintenance Services

---

## Interactive Technician Map

The map is one of the core parts of Servexa.

Users can discover technicians based on their location and service requirements.

### Map capabilities

* Display nearby technicians
* Show technician categories
* Show approximate technician locations
* Calculate distance from the user
* Filter technicians by category
* Filter by availability
* Filter by distance
* Select technicians directly from the map
* Open technician information from map markers
* Navigate from map discovery to technician profile and booking

### Example

```text
             Servexa Technician Map

                 📍 Your Location

       Electrician
       Rahim — 1.2 km
       Available

                        Plumber
                        Karim — 2.0 km
                        Available

              AC Technician
              Hasan — 3.4 km
              Busy
```

The map is designed to make technician discovery more visual, location-aware, and convenient.

---

## Technician Profile

Each technician can have a structured service profile containing information such as:

```text
Technician Name
Service Category
Skills
Experience
Service Area
Rating
Completed Jobs
Previous Work
Availability
```

This allows customers to understand a technician's background before making a booking.

---

## Technician Dashboard

Technicians have a dedicated dashboard to manage their service activities.

### Dashboard capabilities

* View new service requests
* Accept or reject requests
* Manage availability
* View accepted jobs
* View completed jobs
* Manage service profile
* Update skills
* Manage service area
* View customer requests
* Track service activity

### Example workflow

```text
New Request
     ↓
Review Job Details
     ↓
Accept / Reject
     ↓
Accepted Job
     ↓
Service Progress
     ↓
Completed Job
```

---

## Smart Problem-to-Service Matching

Servexa can provide a smart way for users to identify the required service.

For example:

> "My AC is not cooling properly."

The system can suggest:

**AC Technician**

Another example:

> "The water pipe in my bathroom is leaking."

The system can suggest:

**Plumber**

This reduces the difficulty of choosing the correct service category.

---

## Emergency Service

Servexa can support urgent service requests for situations such as:

* Water leakage
* Electrical problems
* AC breakdown
* Door or lock problems
* Other urgent household maintenance issues

Users can identify an emergency requirement and find nearby available technicians.

---

## Service Booking

A customer can create a service request by providing:

```text
Service Category
Problem Description
Location
Preferred Date
Preferred Time
Additional Details
```

The selected technician can then receive and manage the request.

---

## Service Request Flow

```text
Customer
   │
   ▼
Select Service
   │
   ▼
Describe Problem
   │
   ▼
Set Location
   │
   ▼
Find Nearby Technicians
   │
   ▼
View & Compare Profiles
   │
   ▼
Select Technician
   │
   ▼
Choose Schedule
   │
   ▼
Submit Booking
   │
   ▼
Technician Receives Request
   │
   ▼
Accept / Reject
   │
   ▼
Service Completed
```

---

## Project Objectives

The main objectives of Servexa are to:

* Make technician discovery easier
* Connect customers with nearby skilled workers
* Provide organized technician information
* Improve location-based service discovery
* Make technician comparison easier
* Simplify the service booking process
* Help technicians manage service requests
* Create a structured digital platform for home services in Bangladesh

---

## Technology Stack

The exact technologies may vary depending on the implementation, but the project is designed around a modern web architecture.

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* React Router
* Lucide Icons

### Maps & Location

* Leaflet
* React Leaflet
* OpenStreetMap
* Browser Geolocation API
* Geographic distance calculation

### Backend

* Node.js
* Express.js
* REST API

### Database

* PostgreSQL / Supabase

### Development Tools

* Git
* GitHub
* VS Code
* npm

---

## System Architecture

```text
                    ┌───────────────────┐
                    │      Customer     │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │   Servexa Web App │
                    └─────────┬─────────┘
                              │
             ┌────────────────┼────────────────┐
             │                │                │
             ▼                ▼                ▼
        Service Search      Map          Booking System
             │                │                │
             └────────────────┼────────────────┘
                              ▼
                       Backend / API
                              │
                              ▼
                         Database
                              │
                              ▼
                    Technician Dashboard
```

---

## Project Structure

```text
servexa/
│
├── public/
│
├── src/
│   ├── assets/
│   │
│   ├── components/
│   │   ├── map/
│   │   ├── technician/
│   │   ├── booking/
│   │   └── common/
│   │
│   ├── pages/
│   │   ├── Home/
│   │   ├── Services/
│   │   ├── Technician/
│   │   ├── Map/
│   │   ├── Booking/
│   │   └── Dashboard/
│   │
│   ├── hooks/
│   ├── services/
│   ├── types/
│   ├── utils/
│   ├── routes/
│   ├── App.tsx
│   └── main.tsx
│
├── .env
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/servexa.git
```

### 2. Navigate to the project

```bash
cd servexa
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env` file:

```env
VITE_API_URL=your_api_url
VITE_MAP_CONFIG=your_map_configuration
DATABASE_URL=your_database_url
```

Only add environment variables that are actually required by the current implementation.

### 5. Start the development server

```bash
npm run dev
```

The application will normally be available at:

```text
http://localhost:5173
```

---

## Example User Scenario

### Scenario: Water Pipe Leakage

A customer discovers that the bathroom water pipe is leaking.

```text
1. Open Servexa
        ↓
2. Select Plumbing
        ↓
3. Enter "Bathroom pipe leakage"
        ↓
4. Provide location
        ↓
5. View nearby plumbers
        ↓
6. Compare distance, rating and experience
        ↓
7. Select a plumber
        ↓
8. Choose preferred date/time
        ↓
9. Submit booking
```

The technician can then receive the request and manage it from the technician dashboard.

---

## Another Example: House Painting

For a larger service such as painting a house, the customer can provide:

```text
Property: 3 Bedroom Flat
Area: 1200 sq ft
Service: Full House Painting
Preferred Date: Selected Date
Budget: Customer Budget
```

The platform can support multiple suitable service providers or teams so the customer can evaluate available options before selecting one.

---

## Future Improvements

Possible future development areas include:

* Online payment integration
* More advanced real-time technician tracking
* Automated service recommendations
* Advanced AI-based problem classification
* Technician verification workflow
* Service quotation management
* Advanced analytics
* Mobile application
* Multi-provider service teams
* Service history and maintenance reminders
* Expanded location and service coverage across Bangladesh

---

## Why Servexa?

Servexa focuses on solving a common real-world problem:

> **"Where can I find a suitable and reliable technician when I need one?"**

Instead of depending entirely on personal contacts or scattered phone numbers, Servexa provides an organized platform where users can **discover, compare, select, and book** technicians according to their service requirements and location.

---

## Project Status

**Development Status:** In Development

Servexa is being developed as a modern web-based technician discovery and home service booking platform focused on real-world use cases in Bangladesh.

---

## Contribution

Contributions are welcome.

If you would like to improve the project:

```bash
git fork
git clone
git checkout -b feature/your-feature
git commit -m "Add your feature"
git push origin feature/your-feature
```

Then open a Pull Request.

---

## License

This project is developed for educational and project purposes.

If a specific open-source license is added to the repository, this section should be updated accordingly.

---

## Author

**Md Wasin Ahmed**

Software Engineering Student & Frontend Developer

* GitHub: [@Wasin87](https://github.com/Wasin87)
* LinkedIn: [Md Wasin Ahmed](https://www.linkedin.com/in/md-wasin-ahmed/)

---

<p align="center">
  <strong>Servexa</strong><br>
  Connecting People with the Right Skilled Professionals
</p>
