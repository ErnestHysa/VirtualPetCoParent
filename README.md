# Virtual Pet Co-Parent 🐉💕

A wholesome shared digital pet app where couples adopt and raise an adorable creature together across distance.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Platform](https://img.shields.io/badge/platform-Expo--React_Native-lightgrey)
![Backend](https://img.shields.io/badge/backend-Supabase-green)

## Features

- **Real-Time Sync**: Pet hunger, happiness, and energy update instantly across both partners' devices
- **Joint Care**: Feed, play, and care for your pet together
- **Mini-Games**: Fun 30-second games with co-op bonuses
- **Milestone Evolutions**: Watch your pet grow from egg to elder
- **Personality System**: Your pet's personality develops based on how you care for it
- **Beautiful Design**: Apple-caliber UI with smooth animations
- **Widgets**: Home screen widgets to check on your pet
- **Notifications**: Smart reminders and partner action alerts

## Tech Stack

- **Frontend**: React Native (Expo v52) + TypeScript
- **UI**: NativeWind v4 (Tailwind for RN) + Reanimated
- **State**: Zustand with persist
- **Backend**: Supabase (PostgreSQL, Real-time, Auth)
- **Navigation**: Expo Router

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/virtual-pet-co-parent.git
cd virtual-pet-co-parent
```

2. Install dependencies:
```bash
npm install
```

3. Set up Supabase:
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the SQL migration in `supabase/migration.sql`
   - Copy your project URL and anon key

4. Configure environment:
```bash
cp .env.example .env
```
Edit `.env` with your Supabase credentials.

5. Start the development server:
```bash
npm start
```

6. Scan the QR code with the Expo Go app (iOS) or Expo app (Android).

## Project Structure

```
VirtualPetCoParent/
├── app/                    # Expo Router pages
│   ├── (auth)/            # Authentication flow
│   ├── (tabs)/            # Main tab screens
│   └── _layout.tsx        # Root layout
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   ├── pet/              # Pet-specific components
│   └── games/            # Mini-game components
├── hooks/                # Custom React hooks
├── stores/               # Zustand state stores
├── lib/                  # Supabase client, utilities
├── services/             # Business logic layer
├── types/                # TypeScript definitions
├── constants/            # Design tokens, config
└── supabase/             # Database migrations
```

## Development

### Type checking
```bash
npm run typecheck
```

### Linting
```bash
npm run lint
```

## Design Philosophy

This app follows a "Whimsical Premium" design approach:
- Soft, rounded corners and generous spacing
- Subtle animations and haptic feedback
- Glassmorphism and layered depth
- Accessibility-first (WCAG AA+)
- Consistent component library

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- Inspired by the love of couples everywhere
- Built with Expo and Supabase
- Made with 💕
