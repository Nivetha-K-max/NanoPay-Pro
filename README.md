# NanoPay Pro

Modern payment application built with React, TanStack Start, and TypeScript.

## Features

- 🔐 Secure authentication system
- 💸 Payment processing
- 📊 Transaction management
- 📱 Responsive design
- ⚡ Fast and modern UI

## Prerequisites

- Node.js 18+ or Bun
- npm/yarn/bun package manager

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   # or
   bun install
   ```

3. Copy `.env.example` to `.env` and configure:
   ```bash
   cp .env.example .env
   ```

4. Run development server:
   ```bash
   npm run dev
   # or
   bun run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Build for Production

```bash
npm run build
# or
bun run build
```

## Project Structure

```
src/
├── components/     # React components
├── hooks/         # Custom React hooks
├── lib/           # Utility functions
├── routes/        # TanStack Router routes
└── store/         # State management
```

## Scripts

- `dev` - Start development server
- `build` - Build for production
- `preview` - Preview production build
- `lint` - Run ESLint
- `format` - Format code with Prettier

## Technologies

- **Framework**: React 19 + TanStack Start
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI
- **Forms**: React Hook Form + Zod
- **State**: Zustand
- **Animations**: Framer Motion

## License

MIT
