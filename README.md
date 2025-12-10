# Marine Species Tracker

A comprehensive marine biodiversity tracking and conservation platform built with Next.js, featuring AI-powered species identification, interactive mapping, and real-time data visualization.

## Features

### 🐟 Species Management
- Browse and search marine species database
- Detailed species profiles with conservation status
- Population trends and stock assessments
- Interactive species cards with habitat information

### 🗺️ Interactive Mapping
- Mapbox integration for species location visualization
- Real-time coordinate tracking
- Habitat mapping and depth range visualization
- Geographic distribution analysis

### 🤖 AI Assistant
- Voice-activated marine species finder
- Natural language queries about marine biodiversity
- Conservation status inquiries
- Species identification assistance
- Text-to-speech responses

### 📊 Data Analytics
- Population statistics and trends
- Conservation status monitoring
- Occurrence data visualization
- Interactive charts and graphs

### 🔍 Advanced Search
- Multi-parameter species search
- Filter by habitat, depth, location
- Scientific name and common name search
- Conservation status filtering

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **AI/ML**: Google Genkit AI integration
- **Database**: MongoDB
- **Maps**: Mapbox GL JS, React Map GL
- **Charts**: Recharts
- **Authentication**: Firebase
- **Data Processing**: Papa Parse for CSV handling

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB database
- Mapbox API key
- Google AI API key
- Firebase project

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd marine-species-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Fill in your environment variables:
```env
MONGODB_URI=your_mongodb_connection_string
MAPBOX_ACCESS_TOKEN=your_mapbox_token
GOOGLE_AI_API_KEY=your_google_ai_key
FIREBASE_PROJECT_ID=your_firebase_project_id
```

4. Seed the database:
```bash
npm run seed
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:9002`

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run seed` - Seed database with marine species data
- `npm run seed:local` - Seed local database
- `npm run test:db` - Test database connection
- `npm run verify:seed` - Verify seeded data
- `npm run genkit:dev` - Start Genkit AI development server
- `npm run genkit:watch` - Start Genkit with file watching

## Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── (app)/             # Main application routes
│   │   ├── dashboard/     # Dashboard page
│   │   └── fish/          # Species pages
│   └── api/               # API routes
│       └── fish/          # Species API endpoints
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   ├── MapboxMap.tsx     # Map component
│   └── voice-assistant.tsx # AI assistant
├── lib/                  # Utility libraries
│   ├── types.ts          # TypeScript definitions
│   └── seed-local.ts     # Database seeding
├── ai/                   # AI/ML integration
│   └── flows/            # AI conversation flows
└── scripts/              # Database and utility scripts
```

## API Endpoints

### Species Management
- `GET /api/fish` - Get all species with pagination
- `GET /api/fish/[id]` - Get specific species details
- `GET /api/fish/search` - Search species by query
- `GET /api/fish/stats` - Get species statistics
- `GET /api/fish/coordinates` - Get species location data

## Key Components

### Voice Assistant
Interactive AI assistant for marine species queries with:
- Natural language processing
- Text-to-speech responses
- Real-time streaming responses
- Copy and speak functionality

### Interactive Map
Mapbox-powered mapping with:
- Species location visualization
- Clustering for performance
- Custom markers and popups
- Zoom and pan controls

### Species Cards
Rich species information display with:
- Conservation status indicators
- Population trend visualization
- Habitat information
- Occurrence statistics

## Database Schema

### MarineSpecies Collection
```typescript
{
  _id: string;
  scientificName: string;
  institutionCode?: string;
  basisOfRecord?: string;
  occurrenceID?: string;
  individualCount?: number;
  habitat?: string;
  waterBody?: string;
  country?: string;
  locality?: string;
  decimalLatitude?: number;
  decimalLongitude?: number;
  minimumDepthInMeters?: number;
  maximumDepthInMeters?: number;
  eventDate?: string;
  // ... additional fields
}
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## Environment Variables

Required environment variables:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/marine-species

# Mapbox
MAPBOX_ACCESS_TOKEN=pk.your_mapbox_token

# Google AI
GOOGLE_AI_API_KEY=your_google_ai_api_key

# Firebase
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_domain
```

## Deployment

The application can be deployed to various platforms:

### Vercel (Recommended)
[Live Demo](https://sih-web-git-main-njvishnun-6471s-projects.vercel.app?_vercel_share=AbPxBv6C93N91QGtw7LmaZbc6EVW3HS8)

```bash
npm run build
vercel deploy
```

### Firebase Hosting
```bash
npm run build
firebase deploy
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Marine species data from various research institutions
- Mapbox for mapping services
- Google AI for natural language processing
- Firebase for backend services
