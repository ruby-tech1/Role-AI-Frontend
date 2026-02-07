# Role-Aware AI Assistant - Frontend

The frontend for the Role-Aware AI Assistant, providing a streamlined and responsive interface for project management, collaborative chat, and architectural documentation.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: React Context (AuthContext)
- **Icons**: [React Icons](https://react-icons.github.io/react-icons/)
- **Markdown Rendering**: [React Markdown](https://github.com/remarkjs/react-markdown)
- **Diagrams**: [Mermaid](https://mermaid.js.org/)
- **Authentication**: [Google OAuth](https://github.com/MomenSherif/react-oauth) & Custom JWT

## Key Features

- **Dynamic Dashboard**: Personalized view of all active projects.
- **Interactive Chat**: Real-time interaction with role-specific AI agents.
- **Project Details**: Centralized view for project metadata, files, and members.
- **Design Decision Tracking**: Integrated sidebar and dedicated section for architectural decisions.
- **File Explorer**: Easy access to project-related documents.
- **Responsive Design**: Modern, glassmorphic UI optimized for various screen sizes.

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm (Node Package Manager)

### Installation

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```

### Configuration

1. Create a `.env.local` file based on `.env.example`:
   ```bash
   cp .env.example .env.local
   ```
2. Fill in the required environment variables:
   - `NEXT_PUBLIC_API_URL`: The URL of your backend service (e.g., `http://localhost:8000`).
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: Your Google Cloud Console Client ID for OAuth.

## Running the Application

Start the development server:
```bash
npm run dev
```
The application will be available at `http://localhost:3000`.

## Building for Production

To create an optimized production build:
```bash
npm run build
npm run start
```

## Project Structure

- `src/app/`: Next.js pages and route segments.
- `src/components/`: Reusable React components (UI components, shared layouts).
- `src/contexts/`: React Contexts (Authentication).
- `src/lib/`: API client and utility functions.
- `src/types/`: TypeScript interfaces and type definitions.
- `public/`: Static assets (images, fonts).
