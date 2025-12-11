# Sales Funnel Analytics App

A modern web application for tracking sales funnel performance, managing bookings, and analyzing advertising ROI.

## 🌟 Features

### **Core Analytics**
- 📊 **Sales Funnel Tracking**: Monitor inquiries, calls, and closes
- 💰 **Revenue Management**: Track bookings and cash flow
- 📈 **Forecast Modeling**: Create revenue projections
- 🎯 **Advertising ROI**: Measure ad performance and attribution

### **Sales Management**
- 📝 **Booking Management**: Track customer projects
- 💳 **Payment Tracking**: Monitor payment schedules
- 🏷️ **Service Types**: Categorize your services
- 🎯 **Lead Sources**: Track where customers come from

### **Advanced Features (Pro)**
- 🔄 **Auto-sync**: Automatic data integration
- 📊 **Unlimited History**: Access all historical data
- 📢 **Advertising Tracking**: Full ad performance analytics
- ⚡ **Real-time Updates**: Live data synchronization

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+ 
- npm or yarn

### **Installation**
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
# http://localhost:3001
```

### **Build for Production**
```bash
npm run build
npm run preview
```

## 🏗️ Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Inline CSS-in-JS (no external library)
- **Icons**: Lucide React
- **Authentication**: Context API (ready for Supabase Auth)
- **State Management**: React Hooks
- **Backend**: Ready for Supabase integration

## 📂 Project Structure

```
analytics-vite-app/
├── src/
│   ├── components/      # React components
│   ├── data/           # Mock data (temporary)
│   ├── services/       # Data access layer
│   ├── constants/      # Design system & config
│   ├── utils/          # Helper functions
│   ├── types.ts        # TypeScript definitions
│   └── AuthContext.tsx # Authentication state
├── public/             # Static assets
└── package.json        # Dependencies
```

See [src/README.md](./src/README.md) for detailed architecture documentation.

## 🎨 Design System

The app uses a consistent design system with:
- **Color palette**: Blue primary, gray neutrals, semantic colors
- **Typography**: 14px base, clear hierarchy
- **Spacing**: 4px-based scale
- **Components**: Reusable button styles, modals, tables

All design tokens are defined in `src/constants/design.ts`.

## 🔐 Authentication

### **Demo Accounts**
- **Free Account**: `demo@example.com`
  - Access to Funnel Calculator only
  
- **Pro Account**: `pro@example.com`
  - Full access to all features
  
- **Trial Account**: `trial@example.com`
  - Pro features for 14 days

### **Future: Real Auth**
Will integrate with Supabase Authentication:
- Google OAuth
- Email/Password
- Session management
- Row Level Security

## 📊 Analytics (PostHog)

The app uses [PostHog](https://posthog.com) for product analytics and user behavior tracking.

### **Environment Variables**

Add these to your `.env` file:

```bash
# PostHog Analytics (optional - app works without it)
VITE_POSTHOG_KEY=your_posthog_project_api_key
VITE_POSTHOG_HOST=https://us.i.posthog.com  # Optional, defaults to US instance
```

### **What's Tracked**

- **Authentication Events**: Sign in, sign up, sign out
- **Page Views**: Automatic tracking when navigating between pages
- **User Identification**: Users are identified with their profile data
- **Custom Events**: Available via `usePostHog()` hook

### **Usage in Code**

```typescript
import { usePostHog, usePageView } from './hooks/usePostHog'

// Track page views
usePageView('funnel', { additional: 'data' })

// Track custom events
const { track } = usePostHog()
track('button_clicked', { button_name: 'save' })
```

### **Privacy**

- Respects Do Not Track (DNT) browser settings
- Session recording disabled by default
- Autocapture disabled in development
- All tracking is opt-in via environment variables

## 📊 Data Model

### **Key Entities**
- **Funnel Data**: Monthly metrics (inquiries → closes)
- **Bookings**: Customer projects & revenue
- **Payments**: Payment schedules & tracking
- **Ad Campaigns**: Monthly ad spend & leads
- **Service Types**: Your service offerings
- **Lead Sources**: Where customers find you

### **Currency**
All monetary values stored in **cents** for precision:
- `$100.00` → `10000` cents
- Prevents floating-point errors
- Consistent with Stripe/payment processors

## 🔄 Backend Integration (Planned)

### **Database: Supabase/PostgreSQL**
```sql
-- Core tables ready for:
- funnel_data
- bookings
- payments
- service_types
- lead_sources
- ad_sources
- ad_campaigns
- forecast_models
```

### **Migration Path**
1. ✅ Frontend structure ready
2. Create Supabase project
3. Run database migrations
4. Update service layer
5. Add loading/error states
6. Deploy

See migration files in `/supabase/migrations/`.

## 🎯 Roadmap

### **Phase 1: MVP** (Complete ✅)
- [x] Funnel tracking
- [x] Booking management
- [x] Forecast modeling
- [x] Advertising analytics
- [x] User profiles
- [x] Feature gating

### **Phase 2: Backend** (Next)
- [ ] Supabase integration
- [ ] Real authentication
- [ ] Database migrations
- [ ] API integration
- [ ] Error handling
- [ ] Loading states

### **Phase 3: Enhancement**
- [ ] Data export (CSV, PDF)
- [ ] Email reports
- [ ] Mobile app
- [ ] Team collaboration
- [ ] Advanced analytics
- [ ] Custom dashboards

## 🧑‍💻 Development

### **Code Style**
- TypeScript strict mode
- ESLint configured
- Functional components with hooks
- Type-safe props

### **State Management**
- Local state: `useState`
- Global state: Props drilling (simple for now)
- Auth state: Context API
- Future: React Query for server state

### **Testing** (Future)
```bash
npm run test        # Run tests
npm run test:watch  # Watch mode
npm run test:coverage # Coverage report
```

## 📦 Dependencies

### **Core**
- `react` - UI library
- `react-dom` - React DOM renderer
- `typescript` - Type safety
- `vite` - Build tool

### **UI**
- `lucide-react` - Icon library

### **Future**
- `@supabase/supabase-js` - Backend client
- `react-query` - Server state management
- `react-hook-form` - Advanced forms
- `zod` - Schema validation

## 🐛 Troubleshooting

### **Port already in use**
The dev server will automatically try port 3002 if 3001 is taken.

### **Type errors**
```bash
# Clear TypeScript cache
rm -rf node_modules/.vite
npm run dev
```

### **Build errors**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

## 📄 License

Private - Internal Use Only

## 🤝 Contributing

Internal project - Contact project owner for access.

---

Built with ❤️ using React + TypeScript + Vite
