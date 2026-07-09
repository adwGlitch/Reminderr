# RemindSync

An Enterprise Collaborative Reminder Platform built to manage personal reminders and shared group tasks in real-time. It features enterprise-grade security, instant synchronization, and elegant calendar views.

## Features

- **Personal & Group Reminders:** Create tasks for yourself or assign them to team members in shared groups.
- **Real-Time Synchronization:** Uses Firebase Firestore for seamless real-time updates across all connected clients.
- **Role-Based Access Control:** Invite members to groups with specific roles (Owner, Admin, Member) enforced by secure Firestore Rules.
- **Automated Recurrence & Notifications:** Built-in Cloud Functions handle recurring tasks and push notifications for approaching deadlines.
- **Admin Dashboard:** Super admins can view platform statistics and manage user accounts securely.
- **Sleek UI:** Crafted with Next.js App Router, TailwindCSS v4, Framer Motion, and Lucide React.

## Tech Stack

- **Frontend Framework:** [Next.js 15](https://nextjs.org) (App Router)
- **Styling:** [TailwindCSS v4](https://tailwindcss.com/) & [Framer Motion](https://www.framer.com/motion/)
- **State Management:** [Zustand](https://zustand-demo.pmnd.rs/)
- **Forms & Validation:** [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
- **Backend & Database:** [Firebase](https://firebase.google.com/) (Auth, Firestore, Cloud Functions, Cloud Messaging)

## Getting Started

### Prerequisites

1. Node.js 20+
2. A Firebase project with Firestore, Authentication (Email/Password), and Cloud Functions enabled.

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Deploying Firebase Functions & Rules

Navigate to the `functions` directory to install dependencies and deploy the backend infrastructure:

```bash
cd functions
npm install
cd ..
firebase deploy --only firestore:rules,firestore:indexes,functions
```

## Security & Architecture

RemindSync uses a hybrid authentication model:
- **Client-Side Auth:** Firebase Client SDK manages local state and real-time listeners.
- **Server-Side Sessions:** A Next.js Middleware protects routes using Firebase Admin session cookies to eliminate unauthenticated flashes on initial page load.

## License

This project is licensed under the MIT License.
