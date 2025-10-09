# Analytics App - Source Code Structure

## 📁 Directory Organization

```
src/
├── components/          # React components (main views)
│   ├── App.tsx         # Main application shell & routing
│   ├── Funnel.tsx      # Sales funnel tracking
│   ├── Advertising.tsx # Ad performance tracking
│   ├── BookingsAndBillings.tsx # Sales & bookings management
│   ├── Forecast.tsx    # Forecast trends
│   ├── ForecastModeling.tsx # Forecast model creation
│   ├── Calculator.tsx  # Funnel calculator
│   ├── UserProfile.tsx # User profile & settings
│   ├── AuthModal.tsx   # Authentication UI
│   └── FeatureGate.tsx # Subscription feature gating
│
├── data/               # Mock data (will be replaced by API)
│   └── mockData.ts     # All mock data for development
│
├── services/           # Data access layer
│   └── dataService.ts  # Service layer for data operations
│
├── constants/          # Configuration & design tokens
│   └── design.ts       # Design system constants
│
├── utils/              # Shared utility functions
│   └── formatters.ts   # Formatting & calculation helpers
│
├── types.ts            # TypeScript type definitions
├── AuthContext.tsx     # Authentication context & hooks
├── main.tsx            # Application entry point
├── App.css             # Global styles
└── index.css           # Base styles
```

## 🏗️ Architecture Patterns

### **1. Component Structure**
- **Smart Components**: Handle state, business logic, API calls
- **Presentation Logic**: Inline in same file for now (can be extracted later)
- **Props Flow**: Top-down data flow from App.tsx

### **2. State Management**
- **Local State**: `useState` for component-specific state
- **Global State**: Managed in `App.tsx` and passed via props
- **Auth State**: Managed in `AuthContext.tsx`
- **Future**: Consider React Query for server state when backend is ready

### **3. Type Safety**
- All types defined in `types.ts`
- Strict TypeScript configuration
- Type-only imports where appropriate
- No `any` types in component props

### **4. Data Flow**

```
┌─────────────┐
│   App.tsx   │ ← Main state container
└─────┬───────┘
      │
      ├─→ FunnelData → Funnel.tsx
      ├─→ Bookings → BookingsAndBillings.tsx
      ├─→ ServiceTypes → Multiple components
      └─→ LeadSources → Multiple components
```

**Current (Mock Data):**
```
Component → useState(MOCK_DATA) → Render
```

**Future (With Backend):**
```
Component → Service Layer → Supabase → Render
                ↓
          Loading/Error States
```

## 🎨 Design System

### **Color Meanings**
- **Primary Blue**: Main brand color, CTAs
- **Secondary Gray**: Neutral actions, borders
- **Success Green**: Positive actions, confirmations
- **Warning Yellow**: Alerts, trial notices
- **Danger Red**: Destructive actions, errors

### **Button Hierarchy**
1. **Primary Action**: Dark blue gradient + shadow (Add, Create)
2. **Secondary Action**: White + border (Manage, Settings)
3. **Navigation State**: Toggle style (View switchers)
4. **Danger**: Red (Delete, Remove)
5. **Neutral**: Gray (Cancel, Close)

### **Spacing Scale**
- xs: 4px
- sm: 8px
- md: 12px
- base: 16px
- lg: 20px
- xl: 24px
- 2xl: 32px

### **Typography Scale**
- xs: 12px (labels, captions)
- sm: 13px (small text)
- base: 14px (body text, buttons)
- md: 16px (descriptions)
- lg: 18px (section headers)
- xl-4xl: 20px-32px (page titles)

## 📊 Data Model

### **Core Entities**
- **FunnelData**: Monthly sales funnel metrics
- **Booking**: Customer bookings/projects
- **Payment**: Payment schedules
- **ServiceType**: Types of services offered
- **LeadSource**: Where customers come from
- **AdSource**: Advertising platforms
- **AdCampaign**: Monthly ad performance
- **ForecastModel**: Revenue forecast models

### **Relationships**
```
Booking
  ├─→ ServiceType (many-to-one)
  ├─→ LeadSource (many-to-one)
  └─→ Payments (one-to-many)

AdSource
  ├─→ LeadSource (many-to-one)
  └─→ AdCampaigns (one-to-many)

ForecastModel
  └─→ ServiceTypes (many-to-many)
```

## 🔄 Migration Path to Backend

### **Phase 1: Preparation** (Complete ✅)
- [x] Centralized types
- [x] Extracted mock data
- [x] Created service layer
- [x] Defined design system

### **Phase 2: Supabase Integration** (Next)
1. Create database schema/migrations
2. Set up Row Level Security (RLS)
3. Configure Supabase client
4. Replace service layer mock implementations
5. Add loading/error states to components
6. Implement optimistic updates

### **Phase 3: Authentication** (After Phase 2)
1. Integrate Supabase Auth
2. Replace mock users
3. Add protected routes
4. Implement subscription management

### **Phase 4: Real-time & Advanced** (Future)
1. Real-time data sync
2. Offline support
3. Data export
4. Advanced analytics

## 🧪 Testing Strategy (Future)

### **Unit Tests**
- Utility functions (formatters, calculations)
- Service layer methods
- Business logic functions

### **Integration Tests**
- Component interactions
- Data flow
- Feature gates

### **E2E Tests**
- Critical user flows
- Booking creation
- Payment tracking
- Forecast modeling

## 🚀 Getting Started

### **Development**
```bash
npm run dev
```

### **Build**
```bash
npm run build
```

### **Preview Production Build**
```bash
npm run preview
```

## 📝 Best Practices

### **Adding New Features**
1. Define types in `types.ts`
2. Add mock data to `data/mockData.ts`
3. Create service methods in `services/dataService.ts`
4. Build component using types and services
5. Use design tokens from `constants/design.ts`
6. Use formatters from `utils/formatters.ts`

### **Styling**
- Use design tokens from `constants/design.ts`
- Use helper functions for button styles
- Maintain consistent spacing and colors
- Follow alignment rules: text left, numbers right, actions left

### **Type Safety**
- Always define proper interfaces
- Use `type` imports for type-only imports
- Avoid `any` types
- Use generics where appropriate

## 🔧 Configuration

### **Environment Variables** (Future)
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Supabase Documentation](https://supabase.com/docs)
- [Vite Documentation](https://vitejs.dev)

