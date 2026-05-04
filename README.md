# Github Profile Analyzer
Link :  https://github-profile-analyz.netlify.app/


#  Developer Telemetry & Analytics Dashboard

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Redux](https://img.shields.io/badge/Redux-593D88?style=for-the-badge&logo=redux&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)

A high-performance, algorithmic GitHub profile analyzer designed to extract codebase volume, operational habits, and ecosystem impact. Built as a tool for engineering managers and technical recruiters to move beyond vanity metrics (like followers) and evaluate true developer consistency and code health.

##  Key Features

*   **Algorithmic Profile Auditing:** Automatically parses a user's repositories to calculate an overall "Repo Health" score based on documentation, issue tracking, licensing, and recency.
*   **Head-to-Head Comparison Radar:** A dedicated module that allows users to queue two developers and pit their operational habits (Commits per Push, PR velocity) against each other in a dynamic, conditional-rendering data table.
*   **Deep Events API Integration:** Bypasses basic repository stats by pulling the last 90 days of GitHub Events data to determine actual collaboration signals (Solo vs. Team Player).
*   **Intelligent Search with Fallbacks:** Implements an auto-suggestion search bar with a built-in rate-limit escape hatch. If the GitHub Search API limits are hit, the system seamlessly falls back to the Core API for exact-match routing.
*   **Telemetry Tracking:** A persistence layer allowing users to "Track" and save high-value profiles to a local roster for rapid future access.

##  The Intelligence Algorithm

This application doesn't just display JSON data; it interprets it. The custom Redux Selectors act as a Single Source of Truth to calculate:

*   **Weighted Primary Stack:** Determines a developer's true primary languages by multiplying repository size by a recency weight (recent code matters more than old code).
*   **Open Source Score:** Calculates the percentage of repositories configured for community contribution (enabled issues, wikis).
*   **Smart Project Sorting:** Surfaces a developer's best work using a custom point system: `(Stars * 50) + (Forks * 25) + (Size / 100) + (Health * 2) + Recency Bonus`.

##  Technical Architecture

*   **Frontend Framework:** React 18
*   **Build Tool:** Vite (for rapid HMR and optimized builds)
*   **State Management:** Redux Toolkit (Cross-slice state sharing, Thunks for async API calls, and Memoized Selectors for heavy array calculations)
*   **Routing:** React Router v6
*   **Styling:** Tailwind CSS (Dark-mode native, custom scrollbar injected, flex/grid layouts)
*   **Data Source:** GitHub REST API (Users, Repositories, Events)

##  Local Development

To run this project locally:

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/github-profile-analyzer.git](https://github.com/your-username/github-profile-analyzer.git)
    cd github-profile-analyzer
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the development server:**
    ```bash
    npm run dev
    ```

4.  **Open your browser:**
    Navigate to `http://localhost:5173` (or the port provided by Vite).

