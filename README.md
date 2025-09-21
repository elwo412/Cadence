# Cadence

Cadence is a modern daily planner and focus timer application built for the desktop. It helps you organize your tasks, schedule your day, and stay focused using a Pomodoro-style timer.

![Cadence Screenshot](https://i.imgur.com/example.png)

## Features

- **Task Management:** Quickly add, complete, and delete your daily todos.
- **Visual Time Blocking:** Drag and drop tasks from your list onto a visual time grid to schedule your day.
- **Pomodoro Timer:** A built-in focus and break timer to help you stay productive.
- **Persistent Local Data:** Your tasks and schedule are saved to a local SQLite database, ensuring your data is private and always available.
- **Cross-Platform:** Built with Tauri, Cadence runs as a native application on Windows, macOS, and Linux.

## Technology Stack

- **Framework:** [Tauri](https://tauri.app/) (Rust Backend, WebView Frontend)
- **Frontend:** [React](https://reactjs.org/) with [TypeScript](https://www.typescriptlang.org/) and [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Drag & Drop:** [dnd-kit](https://dndkit.com/)
- **Database:** [SQLite](https://www.sqlite.org/index.html) (via `rusqlite` crate)

---

## Getting Started

To run this project in a development environment, you'll need to have [Node.js](https://nodejs.org/) and [Rust](https://www.rust-lang.org/tools/install) installed.

### 1. Clone the repository

```bash
git clone <repository-url>
cd cadence
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run the development server

This command will start the Vite frontend server and the Tauri backend, launching the application in a new window. Changes to your code will cause the app to automatically reload.

```bash
npm run tauri dev
```

## Building for Production

To build the application into a distributable executable file, run the following command:

```bash
npm run tauri build
```

The final installer or executable will be located in the `src-tauri/target/release/bundle/` directory.
