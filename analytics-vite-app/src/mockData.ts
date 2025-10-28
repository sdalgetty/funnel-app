// Shared mock data for the application
export type FunnelData = {
  id: string;
  year: number;
  month: number;
  inquiries: number;
  callsBooked: number;
  callsTaken: number;
  closes: number;
  bookings: number;
  lastUpdated?: string;
};

// Mock data for funnel (compatible with both App and Funnel components)
export const mockFunnelData: FunnelData[] = [
  // 2024 Data
  { id: "2024_january", year: 2024, month: 1, inquiries: 31, callsBooked: 16, callsTaken: 14, closes: 4, bookings: 2909742 },
  { id: "2024_february", year: 2024, month: 2, inquiries: 28, callsBooked: 11, callsTaken: 11, closes: 1, bookings: 1287400 },
  { id: "2024_march", year: 2024, month: 3, inquiries: 19, callsBooked: 9, callsTaken: 9, closes: 8, bookings: 3895900 },
  { id: "2024_april", year: 2024, month: 4, inquiries: 19, callsBooked: 5, callsTaken: 5, closes: 0, bookings: 1343811 },
  { id: "2024_may", year: 2024, month: 5, inquiries: 15, callsBooked: 5, callsTaken: 5, closes: 2, bookings: 1674800 },
  { id: "2024_june", year: 2024, month: 6, inquiries: 11, callsBooked: 7, callsTaken: 5, closes: 0, bookings: 773800 },
  { id: "2024_july", year: 2024, month: 7, inquiries: 10, callsBooked: 6, callsTaken: 6, closes: 2, bookings: 1804421 },
  { id: "2024_august", year: 2024, month: 8, inquiries: 14, callsBooked: 8, callsTaken: 8, closes: 2, bookings: 1621800 },
  { id: "2024_september", year: 2024, month: 9, inquiries: 26, callsBooked: 11, callsTaken: 11, closes: 8, bookings: 5423600 },
  { id: "2024_october", year: 2024, month: 10, inquiries: 13, callsBooked: 6, callsTaken: 6, closes: 1, bookings: 1084260 },
  { id: "2024_november", year: 2024, month: 11, inquiries: 20, callsBooked: 12, callsTaken: 10, closes: 1, bookings: 678400 },
  { id: "2024_december", year: 2024, month: 12, inquiries: 28, callsBooked: 20, callsTaken: 17, closes: 6, bookings: 4116000 },
  
  // 2025 Data
  { id: "2025_january", year: 2025, month: 1, inquiries: 20, callsBooked: 12, callsTaken: 12, closes: 9, bookings: 6125600 },
  { id: "2025_february", year: 2025, month: 2, inquiries: 18, callsBooked: 10, callsTaken: 9, closes: 4, bookings: 2560000 },
  { id: "2025_march", year: 2025, month: 3, inquiries: 28, callsBooked: 17, callsTaken: 17, closes: 5, bookings: 3200000 },
  { id: "2025_april", year: 2025, month: 4, inquiries: 22, callsBooked: 11, callsTaken: 10, closes: 3, bookings: 1800000 },
  { id: "2025_may", year: 2025, month: 5, inquiries: 28, callsBooked: 14, callsTaken: 13, closes: 2, bookings: 1200000 },
  { id: "2025_june", year: 2025, month: 6, inquiries: 15, callsBooked: 7, callsTaken: 6, closes: 1, bookings: 800000 },
  { id: "2025_july", year: 2025, month: 7, inquiries: 19, callsBooked: 9, callsTaken: 8, closes: 0, bookings: 100000 },
  { id: "2025_august", year: 2025, month: 8, inquiries: 16, callsBooked: 8, callsTaken: 7, closes: 1, bookings: 500000 },
  { id: "2025_september", year: 2025, month: 9, inquiries: 21, callsBooked: 10, callsTaken: 9, closes: 1, bookings: 300000 },
  { id: "2025_october", year: 2025, month: 10, inquiries: 17, callsBooked: 8, callsTaken: 7, closes: 0, bookings: 0 },
  { id: "2025_november", year: 2025, month: 11, inquiries: 14, callsBooked: 6, callsTaken: 5, closes: 0, bookings: 0 },
  { id: "2025_december", year: 2025, month: 12, inquiries: 12, callsBooked: 5, callsTaken: 4, closes: 0, bookings: 0 },
];

// Mock data for other entities
export const mockServiceTypes = [
  { id: "1", name: "Consultation", isCustom: true, tracksInFunnel: true },
  { id: "2", name: "Implementation", isCustom: true, tracksInFunnel: true },
  { id: "3", name: "Support", isCustom: true, tracksInFunnel: true },
  { id: "4", name: "Strategy", isCustom: true, tracksInFunnel: true },
  { id: "5", name: "Training", isCustom: true, tracksInFunnel: true },
];

export const mockLeadSources = [
  { id: "1", name: "Website", isCustom: true },
  { id: "2", name: "Referral", isCustom: true },
  { id: "3", name: "Social Media", isCustom: true },
  { id: "4", name: "Google Ads", isCustom: true },
  { id: "5", name: "Instagram Ads", isCustom: true },
  { id: "6", name: "LinkedIn", isCustom: true },
  { id: "7", name: "Email Marketing", isCustom: true },
];

export const mockBookings = [
  {
    id: "1",
    projectName: "E-commerce Strategy",
    serviceTypeId: "1",
    leadSourceId: "1",
    dateInquired: "2024-01-15",
    dateBooked: "2024-01-20",
    projectDate: "2024-02-01",
    bookedRevenue: 5000,
    status: "confirmed",
    notes: "Initial consultation for e-commerce strategy",
    createdAt: "2024-01-15T10:00:00Z"
  },
  {
    id: "2",
    projectName: "Social Media Campaign",
    serviceTypeId: "2",
    leadSourceId: "3",
    dateInquired: "2024-01-18",
    dateBooked: "2024-01-25",
    projectDate: "2024-02-15",
    bookedRevenue: 3500,
    status: "confirmed",
    notes: "Full implementation of social media strategy",
    createdAt: "2024-01-18T14:30:00Z"
  },
  {
    id: "3",
    projectName: "Website Redesign",
    serviceTypeId: "2",
    leadSourceId: "2",
    dateInquired: "2024-02-01",
    dateBooked: "2024-02-05",
    projectDate: "2024-03-01",
    bookedRevenue: 8000,
    status: "confirmed",
    notes: "Complete website redesign and development",
    createdAt: "2024-02-01T09:15:00Z"
  },
  {
    id: "4",
    projectName: "SEO Optimization",
    serviceTypeId: "3",
    leadSourceId: "4",
    dateInquired: "2024-02-10",
    dateBooked: "2024-02-15",
    projectDate: "2024-03-15",
    bookedRevenue: 2500,
    status: "pending",
    notes: "Ongoing SEO support and optimization",
    createdAt: "2024-02-10T16:45:00Z"
  },
  {
    id: "5",
    projectName: "Brand Strategy Workshop",
    serviceTypeId: "4",
    leadSourceId: "6",
    dateInquired: "2024-02-20",
    dateBooked: "2024-02-25",
    projectDate: "2024-03-20",
    bookedRevenue: 4500,
    status: "confirmed",
    notes: "Full-day brand strategy workshop",
    createdAt: "2024-02-20T11:20:00Z"
  }
];

export const mockPayments = [
  {
    id: "1",
    bookingId: "1",
    amount: 5000,
    dueDate: "2024-02-01",
    paidAt: "2024-02-01",
    memo: "E-commerce strategy consultation",
    paymentMethod: "credit_card"
  },
  {
    id: "2",
    bookingId: "2",
    amount: 3500,
    dueDate: "2024-02-15",
    paidAt: "2024-02-15",
    memo: "Social media campaign implementation",
    paymentMethod: "bank_transfer"
  },
  {
    id: "3",
    bookingId: "3",
    amount: 4000,
    dueDate: "2024-03-01",
    paidAt: null,
    memo: "Website redesign - 50% deposit",
    paymentMethod: "credit_card"
  },
  {
    id: "4",
    bookingId: "3",
    amount: 4000,
    dueDate: "2024-04-01",
    paidAt: null,
    memo: "Website redesign - final payment",
    paymentMethod: "credit_card"
  }
];

export const mockAdSources = [
  { id: "1", name: "Google Ads", leadSourceId: "4" },
  { id: "2", name: "Instagram Ads", leadSourceId: "5" },
  { id: "3", name: "Facebook Ads", leadSourceId: "5" },
  { id: "4", name: "LinkedIn Ads", leadSourceId: "6" }
];

export const mockAdCampaigns = [
  {
    id: "1",
    adSourceId: "1",
    monthYear: "2024-01",
    adSpendCents: 150000, // $1,500
    leadsGenerated: 12
  },
  {
    id: "2",
    adSourceId: "1",
    monthYear: "2024-02",
    adSpendCents: 200000, // $2,000
    leadsGenerated: 18
  },
  {
    id: "3",
    adSourceId: "2",
    monthYear: "2024-01",
    adSpendCents: 80000, // $800
    leadsGenerated: 8
  },
  {
    id: "4",
    adSourceId: "2",
    monthYear: "2024-02",
    adSpendCents: 120000, // $1,200
    leadsGenerated: 15
  }
];

