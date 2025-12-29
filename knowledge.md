# PolyArb Dashboard - Knowledge Base

## 📋 Project Overview

**PolyArb Dashboard** adalah aplikasi web untuk monitoring dan kontrol bot arbitrage pada pasar binary options. Dashboard ini menyediakan interface real-time untuk melacak peluang arbitrage, mengelola konfigurasi bot, dan memantau performa trading.

### 🎯 Tujuan Utama
- **Arbitrage Detection**: Mendeteksi peluang arbitrage pada binary markets
- **Bot Control**: Kontrol otomatis eksekusi trades
- **Real-time Monitoring**: Dashboard real-time untuk metrics dan logs
- **Risk Management**: Parameter kontrol untuk mengelola risiko

---

## 🛠️ Tech Stack

### **Frontend Framework**
- **React 18.3.1** - Modern React dengan hooks dan concurrent features
- **TypeScript 5.8.3** - Type safety dan developer experience
- **Vite 5.4.19** - Build tool cepat dengan HMR

### **UI Framework & Styling**
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **shadcn/ui** - Component library berbasis Radix UI
- **Radix UI** - Primitives untuk accessible components
- **Lucide React** - Icon library
- **Inter & JetBrains Mono** - Google Fonts untuk typography

### **State Management & Data**
- **TanStack Query 5.83.0** - Server state management
- **React Hook Form 7.61.1** - Form handling
- **Zod 3.25.76** - Schema validation
- **date-fns 3.6.0** - Date utilities

### **Routing & Navigation**
- **React Router DOM 6.30.1** - Client-side routing
- **Next Themes 0.3.0** - Dark/light mode support

### **Charts & Visualization**
- **Recharts 2.15.4** - React charting library
- **Custom Sparkline** - Komponen chart sederhana

### **Development Tools**
- **ESLint 9.32.0** - Code linting
- **TypeScript ESLint** - TypeScript linting rules
- **PostCSS 8.5.6** - CSS processing
- **Autoprefixer 10.4.21** - CSS vendor prefixes

### **Package Manager**
- **pnpm** - Fast, disk-efficient package manager
- **Node.js** - Runtime environment

---

## 🏗️ Architecture

### **Project Structure**
```
polyarb-dashboard/
├── public/                 # Static assets
├── src/
│   ├── components/         # React components
│   │   ├── ui/            # shadcn/ui components
│   │   ├── BotControlPanel.tsx
│   │   ├── ExecutionLog.tsx
│   │   ├── Header.tsx
│   │   ├── MetricsSidebar.tsx
│   │   ├── OpportunitiesTable.tsx
│   │   └── NavLink.tsx
│   ├── data/              # Mock data & constants
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities
│   ├── pages/             # Page components
│   ├── types/             # TypeScript definitions
│   └── App.tsx            # Main app component
├── package.json           # Dependencies & scripts
├── tailwind.config.ts     # Tailwind configuration
├── vite.config.ts         # Vite configuration
└── components.json        # shadcn/ui configuration
```

### **Component Architecture**

#### **Pages**
- **Index** (`/`) - Main dashboard page
- **NotFound** (`*`) - 404 error page

#### **Layout Components**
- **Header** - Top navigation dengan status bot dan balance
- **MetricsSidebar** - Panel metrics dengan collapsible functionality
- **OpportunitiesTable** - Tabel peluang arbitrage (responsive)
- **BotControlPanel** - Form kontrol konfigurasi bot
- **ExecutionLog** - Log eksekusi trades dengan filtering

#### **UI Components** (shadcn/ui)
- **Button, Input, Select** - Form controls
- **Table, Badge, Card** - Data display
- **Dialog, Tooltip, Toast** - Interactions
- **ScrollArea, Separator** - Layout helpers

---

## 📊 Data Models

### **Core Types** (`src/types/arbitrage.ts`)

#### **Opportunity**
```typescript
interface Opportunity {
  id: string;
  marketName: string;
  yesAsk: number;      // Harga YES
  noAsk: number;       // Harga NO
  sum: number;         // YES + NO (harus < 1.0 untuk arbitrage)
  edge: number;        // Edge percentage (1.0 - sum) * 100
  executable: boolean; // Apakah bisa dieksekusi
  updatedAt: Date;
}
```

#### **ExecutionLog**
```typescript
interface ExecutionLog {
  id: string;
  timestamp: Date;
  market: string;
  yesPrice: number;
  noPrice: number;
  expectedEdge: number;
  status: 'BOTH_FILLED' | 'PARTIAL_FILL' | 'FAILED' | 'CANCELLED';
  details?: string;
}
```

#### **BotConfig**
```typescript
interface BotConfig {
  enabled: boolean;
  minEdge: number;        // Minimum edge untuk eksekusi
  maxPositionSize: number; // Ukuran posisi maksimal
  maxExecutionWait: number; // Waktu tunggu maksimal
}
```

#### **DashboardMetrics**
```typescript
interface DashboardMetrics {
  todayPnL: number;
  tradesExecuted: number;
  winRate: number;
  avgEdge: number;
  pnlHistory: number[]; // Array untuk sparkline chart
}
```

---

## 🎨 Design System

### **Color Palette** (CSS Variables)

#### **Base Colors**
- **Background**: Dark theme (`--background: 222 47% 6%`)
- **Foreground**: Light text (`--foreground: 210 20% 95%`)
- **Primary**: Green accent (`--primary: 152 76% 45%`)
- **Secondary**: Dark gray (`--secondary: 222 30% 14%`)

#### **Semantic Colors**
- **Profit**: Green (`--profit: 152 76% 45%`)
- **Loss**: Red (`--loss: 0 72% 51%`)
- **Warning**: Orange (`--warning: 38 92% 50%`)
- **Success**: Green (`--success: 152 76% 45%`)

#### **Component Colors**
- **Card**: Semi-transparent (`--card: 222 47% 8%`)
- **Border**: Subtle (`--border: 222 30% 18%`)
- **Muted**: Low contrast (`--muted: 222 30% 12%`)

### **Typography**
- **Sans**: Inter (Google Fonts)
- **Mono**: JetBrains Mono (Google Fonts)
- **Sizes**: Responsive scaling
- **Weights**: 300, 400, 500, 600, 700

### **Spacing & Layout**
- **Container**: Centered dengan max-width 1400px
- **Padding**: Responsive (2rem di desktop, 1rem di mobile)
- **Gaps**: Consistent 0.5rem - 2rem scale
- **Border Radius**: 0.5rem base dengan variants

### **Animations**
- **Pulse Subtle**: 2s ease-in-out untuk status indicators
- **Fade In**: 0.3s ease-out untuk log entries
- **Hover Transitions**: 0.2s ease untuk interactive elements

---

## 🔧 Functionality

### **Arbitrage Logic**

#### **Edge Calculation**
```
Edge = (1.00 - (YES + NO)) * 100

Contoh:
YES = 0.52, NO = 0.46
Sum = 0.98
Edge = (1.00 - 0.98) * 100 = 2.0%
```

#### **Execution Criteria**
- **Sum < 1.00**: Peluang arbitrage tersedia
- **Edge ≥ minEdge**: Bot akan mengeksekusi
- **Position Size ≤ maxPositionSize**: Kontrol risiko
- **Response Time ≤ maxExecutionWait**: Atomic execution

### **Real-time Updates**
- **Opportunities**: Update setiap 1 detik (simulasi)
- **Metrics**: Live calculation dari execution logs
- **Status**: Bot running/paused indicators

### **Risk Management**
- **Minimum Edge**: Filter peluang berisiko
- **Position Sizing**: Limit exposure per trade
- **Execution Timeout**: Prevent hanging orders
- **Partial Fill Handling**: Log dan alert untuk fills tidak lengkap

---

## 📱 Responsive Design

### **Breakpoints**
- **Mobile**: < 768px (single column, overlay sidebar)
- **Tablet**: 768px - 1024px (2 columns, adjusted layouts)
- **Desktop**: > 1024px (full layout, persistent sidebar)

### **Responsive Features**
- **Sidebar**: Hidden di mobile, overlay dengan hamburger menu
- **Table**: Cards di mobile, table di desktop
- **Grid**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- **Text**: Responsive sizing (`text-base sm:text-lg`)
- **Spacing**: Mobile-first padding dan margins

---

## 🚀 Development Workflow

### **Scripts** (`package.json`)
```json
{
  "dev": "vite",                    // Development server
  "build": "vite build",           // Production build
  "build:dev": "vite build --mode development",
  "lint": "eslint .",              // Code linting
  "preview": "vite preview"        // Preview production build
}
```

### **Development Server**
- **Host**: `::` (IPv6 + IPv4)
- **Port**: 8080
- **HMR**: Hot module replacement enabled

### **Build Configuration**
- **SWC**: Fast TypeScript compilation
- **Path Aliases**: `@/` → `src/`
- **Component Tagger**: Development mode only

---

## 🔍 Key Components Deep Dive

### **OpportunitiesTable**
- **Desktop**: Sortable table dengan hover effects
- **Mobile**: Card-based layout untuk readability
- **Real-time**: Updates setiap detik dengan visual indicators
- **Filtering**: Executable vs non-executable opportunities

### **MetricsSidebar**
- **Collapsible**: Expand/collapse functionality
- **Charts**: Sparkline untuk 7-day PnL history
- **Metrics**: Today PnL, trades executed, win rate, avg edge
- **Responsive**: Full height, mobile overlay

### **BotControlPanel**
- **Form Validation**: Zod schema validation
- **Real-time Updates**: Immediate config application
- **Risk Warnings**: Visual alerts untuk high-risk settings
- **Responsive Grid**: Adaptive layout untuk form fields

### **ExecutionLog**
- **Filtering**: Status-based filtering (Filled, Partial, Failed, Cancelled)
- **Scrolling**: Virtual scrolling untuk performance
- **Status Indicators**: Color-coded status badges
- **Timestamps**: Real-time formatting

### **Header**
- **Bot Status**: Visual indicator (running/paused)
- **Wallet Balance**: USDC balance display
- **Mobile Menu**: Hamburger button untuk sidebar
- **Responsive**: Compact di mobile

---

## 📈 Performance Optimizations

### **Bundle Optimization**
- **Code Splitting**: Route-based splitting
- **Tree Shaking**: Unused code elimination
- **SWC**: Fast compilation vs Babel

### **Runtime Performance**
- **React.memo**: Component memoization
- **useCallback/useMemo**: Expensive operation caching
- **Virtual Scrolling**: Large list optimization
- **Debounced Updates**: Real-time data throttling

### **Styling Performance**
- **Tailwind JIT**: On-demand CSS generation
- **CSS Variables**: Runtime theme switching
- **GPU Acceleration**: Transform/opacity animations

---

## 🧪 Testing & Quality

### **Code Quality**
- **ESLint**: Airbnb config dengan TypeScript
- **TypeScript**: Strict mode enabled
- **Prettier**: Code formatting (implied)

### **Accessibility**
- **Radix UI**: Built-in accessibility
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: ARIA labels dan roles
- **Color Contrast**: WCAG compliant colors

### **Browser Support**
- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile Browsers**: iOS Safari, Chrome Mobile
- **Progressive Enhancement**: Graceful degradation

---

## 🔐 Security Considerations

### **Client-side Security**
- **Input Validation**: Zod schemas untuk form validation
- **XSS Prevention**: React automatic escaping
- **CSRF Protection**: Token-based requests (future)

### **Data Handling**
- **Type Safety**: TypeScript strict mode
- **Input Sanitization**: Form validation
- **Error Boundaries**: Graceful error handling

---

## 📚 Dependencies Breakdown

### **Core React Ecosystem**
- `react`, `react-dom`: Framework core
- `react-router-dom`: Navigation
- `@tanstack/react-query`: Data fetching
- `react-hook-form`: Form management

### **UI Component Library**
- `40+ Radix UI components`: Accessible primitives
- `lucide-react`: Icon system
- `class-variance-authority`: Component variants
- `clsx`, `tailwind-merge`: Utility functions

### **Styling & Theming**
- `tailwindcss`: Utility framework
- `tailwindcss-animate`: Animation utilities
- `next-themes`: Theme switching
- `@tailwindcss/typography`: Prose styling

### **Development Tools**
- `@vitejs/plugin-react-swc`: Fast compilation
- `eslint`, `typescript-eslint`: Code quality
- `lovable-tagger`: Component development

---

## 🎯 Future Enhancements

### **Planned Features**
- **WebSocket Integration**: Real-time data dari server
- **Advanced Charts**: TradingView-style charts
- **Portfolio Management**: Multi-asset tracking
- **Alert System**: Email/SMS notifications
- **Backtesting**: Historical performance analysis

### **Performance Improvements**
- **Service Worker**: Offline capability
- **PWA**: Installable web app
- **Lazy Loading**: Component code splitting
- **Bundle Analysis**: Size optimization

### **User Experience**
- **Dark/Light Mode**: Complete theme system
- **Internationalization**: Multi-language support
- **Keyboard Shortcuts**: Power user features
- **Mobile App**: React Native companion

---

## 📞 Support & Maintenance

### **Project Status**
- **Version**: 0.0.0 (Development)
- **Platform**: Lovable.dev generated
- **Last Updated**: December 2025

### **Technology Updates**
- **React**: Latest stable version
- **TypeScript**: Latest stable version
- **Tailwind**: Latest stable version
- **Dependencies**: Regularly updated

### **Documentation**
- **README.md**: Setup dan usage instructions
- **knowledge.md**: Comprehensive technical documentation
- **responsive_summary.md**: Responsive design details
- **layout_fixes.md**: Layout troubleshooting

---

*This knowledge base serves as the comprehensive technical reference for the PolyArb Dashboard project. All information is current as of the latest development state.*