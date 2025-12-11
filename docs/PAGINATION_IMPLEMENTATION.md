# Pagination Implementation Guide

## Current State: Sales Tab (BookingsAndBillings)

### How It Works Now

1. **Data Loading**: 
   - `useDataManager` loads ALL bookings for a user on page load
   - No limits, no pagination
   - Example: User with 2,000 bookings loads all 2,000 records

2. **Client-Side Processing**:
   - All bookings stored in React state
   - Filtering done in browser: `bookings.filter(...)`
   - Sorting done in browser: `filtered.sort(...)`
   - All data rendered in DOM

3. **Current Query** (in `unifiedDataService.ts`):
   ```typescript
   .from('bookings')
   .select('*')
   .eq('user_id', userId)
   .order('booking_date', { ascending: false })
   // ❌ No .limit() - loads everything!
   ```

## Pagination Options

### Option 1: Client-Side Pagination (Easiest)
**Best for**: Users with <1,000 bookings

**How it works**:
- Still load all bookings from database
- Only display 50-100 bookings at a time
- User clicks "Next" or "Load More" to see more
- Filtering/sorting still happens in browser

**Pros**:
- ✅ Simple to implement (2-3 hours)
- ✅ No database changes needed
- ✅ Filters work instantly (all data in memory)
- ✅ Works offline (data already loaded)

**Cons**:
- ❌ Still loads all data initially (slow for large datasets)
- ❌ High memory usage
- ❌ Doesn't solve the core scalability issue

**Implementation**:
```typescript
const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 50;

const paginatedBookings = useMemo(() => {
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredAndSortedBookings.slice(start, end);
}, [filteredAndSortedBookings, currentPage]);

// Display pagination controls
<div>
  {paginatedBookings.map(booking => ...)}
  <button onClick={() => setCurrentPage(p => p + 1)}>Next</button>
</div>
```

---

### Option 2: Server-Side Pagination (Recommended)
**Best for**: Users with 500+ bookings, scalable solution

**How it works**:
- Database only returns 50-100 bookings per query
- Filtering/sorting happens in database (faster)
- User clicks "Next" to fetch next page
- Only loads what's needed

**Pros**:
- ✅ Fast initial load (only 50-100 records)
- ✅ Low memory usage
- ✅ Scales to 10,000+ bookings
- ✅ Database does filtering (faster)

**Cons**:
- ⚠️ More complex (1-2 days)
- ⚠️ Filters require new database query
- ⚠️ Need to handle loading states

**Implementation**:

#### Step 1: Update Service Method
```typescript
// unifiedDataService.ts
static async getBookings(
  userId: string, 
  options?: {
    page?: number;
    limit?: number;
    filters?: {
      serviceTypeIds?: string[];
      leadSourceIds?: string[];
      search?: string;
    };
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }
): Promise<{ data: Booking[]; total: number; page: number; limit: number }> {
  
  const page = options?.page || 1;
  const limit = options?.limit || 50;
  const offset = (page - 1) * limit;
  
  let query = supabase
    .from('bookings')
    .select('*, service_types(name), lead_sources(name)', { count: 'exact' })
    .eq('user_id', userId);
  
  // Apply filters
  if (options?.filters?.serviceTypeIds?.length) {
    query = query.in('service_type_id', options.filters.serviceTypeIds);
  }
  if (options?.filters?.leadSourceIds?.length) {
    query = query.in('lead_source_id', options.filters.leadSourceIds);
  }
  if (options?.filters?.search) {
    query = query.ilike('client_name', `%${options.filters.search}%`);
  }
  
  // Apply sorting
  const sortColumn = options?.sortBy === 'dateBooked' ? 'booking_date' : 
                     options?.sortBy === 'bookedRevenue' ? 'booked_revenue' :
                     'created_at';
  query = query.order(sortColumn, { 
    ascending: options?.sortOrder === 'asc' 
  });
  
  // Apply pagination
  query = query.range(offset, offset + limit - 1);
  
  const { data, error, count } = await query;
  
  if (error) {
    logger.error('Error fetching bookings:', error);
    return { data: [], total: 0, page, limit };
  }
  
  return {
    data: data?.map(item => transformBooking(item)) || [],
    total: count || 0,
    page,
    limit
  };
}
```

#### Step 2: Update Component State
```typescript
// BookingsAndBillings.tsx
const [currentPage, setCurrentPage] = useState(1);
const [totalBookings, setTotalBookings] = useState(0);
const [loadingBookings, setLoadingBookings] = useState(false);
const itemsPerPage = 50;

// Load bookings with pagination
const loadBookings = useCallback(async (page: number) => {
  setLoadingBookings(true);
  try {
    const result = await UnifiedDataService.getBookings(userId, {
      page,
      limit: itemsPerPage,
      filters: {
        serviceTypeIds: filters.serviceTypes,
        leadSourceIds: filters.leadSources,
        search: filters.search
      },
      sortBy,
      sortOrder
    });
    
    setBookings(result.data);
    setTotalBookings(result.total);
    setCurrentPage(page);
  } finally {
    setLoadingBookings(false);
  }
}, [userId, filters, sortBy, sortOrder]);

// Reload when filters change
useEffect(() => {
  loadBookings(1); // Reset to page 1 when filters change
}, [filters, sortBy, sortOrder]);
```

#### Step 3: Update UI
```typescript
// Remove client-side filtering/sorting
// Display paginated bookings directly
{paginatedBookings.map(booking => ...)}

// Add pagination controls
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  <div>
    Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalBookings)} of {totalBookings}
  </div>
  <div>
    <button 
      disabled={currentPage === 1}
      onClick={() => loadBookings(currentPage - 1)}
    >
      Previous
    </button>
    <span>Page {currentPage} of {Math.ceil(totalBookings / itemsPerPage)}</span>
    <button 
      disabled={currentPage * itemsPerPage >= totalBookings}
      onClick={() => loadBookings(currentPage + 1)}
    >
      Next
    </button>
  </div>
</div>
```

---

### Option 3: Infinite Scroll (Modern UX)
**Best for**: Mobile-friendly, modern feel

**How it works**:
- Load first 50 bookings
- When user scrolls near bottom, automatically load next 50
- No "Next" button needed
- Smooth, continuous experience

**Implementation**:
```typescript
const [allBookings, setAllBookings] = useState<Booking[]>([]);
const [hasMore, setHasMore] = useState(true);
const [loadingMore, setLoadingMore] = useState(false);

const loadMoreBookings = useCallback(async () => {
  if (loadingMore || !hasMore) return;
  
  setLoadingMore(true);
  const nextPage = Math.floor(allBookings.length / itemsPerPage) + 1;
  
  const result = await UnifiedDataService.getBookings(userId, {
    page: nextPage,
    limit: itemsPerPage,
    filters: { ... }
  });
  
  setAllBookings(prev => [...prev, ...result.data]);
  setHasMore(result.data.length === itemsPerPage);
  setLoadingMore(false);
}, [allBookings.length, loadingMore, hasMore]);

// Detect scroll near bottom
useEffect(() => {
  const handleScroll = () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000) {
      loadMoreBookings();
    }
  };
  
  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, [loadMoreBookings]);
```

---

## Recommended Approach: Hybrid

**Phase 1: Quick Win (Client-Side Pagination)**
- Implement client-side pagination first (2-3 hours)
- Improves UX immediately
- Doesn't require database changes

**Phase 2: Server-Side Pagination** (When needed)
- Implement server-side pagination when users have 500+ bookings
- Better performance, true scalability
- Requires database query updates

## Impact on Other Features

### Summary Metrics (Totals)
**Current**: Calculates from all bookings in memory
```typescript
const totals = useMemo(() => {
  const booked = sum(bookings.map(b => b.bookedRevenue));
  // ...
}, [bookings, payments]);
```

**With Pagination**: Need to fetch totals separately
```typescript
// Add new method to get totals
static async getBookingTotals(userId: string, filters?: {...}): Promise<{
  totalBooked: number;
  totalCollected: number;
  totalOutstanding: number;
}> {
  // Use SQL aggregation
  const { data } = await supabase
    .from('bookings')
    .select('booked_revenue')
    .eq('user_id', userId);
  
  // Apply same filters, then sum
  return {
    totalBooked: sum of all matching bookings,
    // ...
  };
}
```

### Filters
**Current**: Instant (all data in memory)
**With Server-Side**: Requires new database query (200-500ms)

### Search
**Current**: Searches all bookings in memory
**With Server-Side**: Uses database `ilike` query (faster for large datasets)

## Migration Path

1. **Week 1**: Add client-side pagination (quick win)
2. **Week 2-3**: Implement server-side pagination for bookings
3. **Week 4**: Add pagination to payments (if needed)
4. **Week 5**: Add pagination to admin dashboard

## Code Changes Summary

### Files to Modify

1. **`unifiedDataService.ts`**
   - Add pagination parameters to `getBookings()`
   - Add `getBookingTotals()` for summary metrics
   - Add filter/sort parameters

2. **`BookingsAndBillings.tsx`**
   - Replace `bookings` state with paginated state
   - Remove client-side filtering (move to server)
   - Add pagination controls
   - Update totals calculation

3. **`useDataManager.ts`** (optional)
   - Could add pagination support here
   - Or keep it simple and handle in component

### Estimated Effort

- **Client-Side Pagination**: 2-3 hours
- **Server-Side Pagination**: 1-2 days
- **Full Implementation** (with filters, totals): 2-3 days

## Example: Complete Server-Side Implementation

See `docs/PAGINATION_EXAMPLE.ts` for a complete working example.




