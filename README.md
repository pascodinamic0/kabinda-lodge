# Welcome to kabinda Lodge

## Project info

**URL**: https://laricharde.org/kabinda-lodge/

## Google Maps Configuration

The application includes Google Maps integration for the contact page. To set up Google Maps:

1. **Get a Google Maps API Key**:
   - Visit [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Create a new project or select an existing one
   - Enable the Maps JavaScript API
   - Create credentials (API Key)

2. **Configure the API Key**:
   - Create a `.env` file in the root directory
   - Add your API key: `VITE_GOOGLE_MAPS_API_KEY=your_api_key_here`
   - Restart the development server

3. **Demo Mode**:
   - If no API key is provided, the map will use a demo key for development
   - For production, always use a proper API key

## How can I edit this code?

There are several ways of editing your application.


**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
