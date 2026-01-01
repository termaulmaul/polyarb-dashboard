# PolyArb - Binary Market Arbitrage Dashboard

**Fully Responsive** 📱💻 - Optimized for mobile, tablet, and desktop

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Start both frontend and backend (recommended)
pnpm run dev:full

# Or start individually:
pnpm run dev:frontend  # Frontend only (port 8081)
pnpm run dev:backend   # Backend only (port 3001)

# Alternative: Use the shell script
./start_full.sh
```

### 🌐 URLs
- **Frontend**: http://localhost:8081
- **Backend API**: http://localhost:3001
- **Test Page**: http://localhost:8081/test.html

## 🔑 Wallet Connection

PolyArb requires an EVM wallet connection to interact with Polymarket:

- **Supported**: MetaMask, WalletConnect, Coinbase Wallet
- **Network**: Polygon (automatically switches)
- **Security**: Private keys stay client-side

See [WALLET_SETUP.md](WALLET_SETUP.md) for detailed setup instructions.

## 📱 Responsive Features

This dashboard is fully responsive with:

- **Mobile (< 768px)**: Single column layout, sidebar as overlay
- **Tablet (768px - 1024px)**: Optimized 2-column layouts
- **Desktop (> 1024px)**: Full layout with persistent sidebar

### Key Responsive Components:
- **Opportunities Table**: Cards on mobile, table on desktop
- **Header**: Compact mobile version with hamburger menu
- **Sidebar**: Hidden on mobile, accessible via menu button
- **Forms**: Responsive grid layouts
- **Typography**: Scaled text sizes for readability

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

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

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
