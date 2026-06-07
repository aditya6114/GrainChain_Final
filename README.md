# GrainChain Final Project

## Overview
GrainChain is a platform for food donation and redistribution, connecting donors, recipients, and volunteers. The project features a live map of available food donations, easy donation listing with location autocomplete, and interfaces for recipients and volunteers to participate in the food rescue process.

## Features
- **Live Food Donation Map:**
  - View all available food donations on an interactive map (Leaflet/OpenStreetMap).
  - Markers show donation details and locations.
- **Donation Listing with Location Autocomplete:**
  - Donors can list food donations with details and upload images.
  - Location field provides live suggestions (powered by OpenStreetMap Nominatim API) and automatically geocodes addresses to coordinates for mapping.
- **Recipient Portal:**
  - Browse and search available food listings.
  - Filter by food type, urgency, and more.
- **Volunteer Portal:**
  - View and manage pickup/delivery tasks (UI in place).
- **Modern UI:**
  - Built with React, Next.js, and Tailwind CSS for a responsive, accessible experience.

## Getting Started

### Prerequisites
- Node.js (v18 or later recommended)
- npm or pnpm

### Installation
1. **Clone the repository:**
   ```sh
   git clone <your-repo-url>
   cd GrainChain_Final
   ```
2. **Install dependencies:**
   ```sh
   npm install
   # or
   pnpm install
   ```
3. **Set up environment variables:**
   - If using Supabase or other backend services, create a `.env.local` file and add your keys as needed (see `lib/supabaseClient.ts`).
   - For development/testing, the app uses OpenStreetMap Nominatim for geocoding (no API key required, but subject to rate limits).

### Running the App
```sh
npm run dev
# or
pnpm dev
```
- The app will be available at `http://localhost:3000`.

## Usage
- **List a Donation:**
  - Go to the Donor page (`/donor`), fill out the form, and use the location field to search for your address or place. Select a suggestion to geocode it for the map.
- **View Live Map:**
  - Go to the Map page (`/map`) and see all available donations as markers. Click a marker for details.
- **Browse as Recipient:**
  - Go to the Recipient page (`/recipient`) to browse and filter available food listings.
- **Volunteer:**
  - Go to the Volunteer page (`/volunteer`) to see available tasks (UI in place).

## Technologies Used
- **Frontend:** Next.js (React), TypeScript, Tailwind CSS
- **Map:** React-Leaflet, Leaflet, OpenStreetMap
- **Geocoding:** OpenStreetMap Nominatim API (for location autocomplete and geocoding)
- **Backend:** Supabase (Postgres, API)

## Notes
- **Nominatim API:**
  - No API key required, but please respect their [usage policy](https://operations.osmfoundation.org/policies/nominatim/). For production, consider self-hosting or using a commercial geocoding provider.
- **Database:**
  - Ensure your Supabase/Postgres instance has the correct schema for donations, including `latitude`, `longitude`, and `location` fields.

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a pull request

## License
MIT

## Credits
- Built by [Your Name/Team].
- Uses OpenStreetMap, React, Next.js, Supabase, and more. 

## Database Migration: Add Latitude and Longitude to Donations Table

To display donation locations on the map, update your `donations` table to include `latitude` and `longitude` columns:

```sql
ALTER TABLE public.donations
ADD COLUMN latitude double precision,
ADD COLUMN longitude double precision;
```

- `latitude` and `longitude` should be of type `double precision` to store coordinates.
- After running this migration, new donations can store their location for use in the map page (e.g., with Leaflet).

---

**If you use a migration tool or have a migrations folder, add this migration there as well.** 