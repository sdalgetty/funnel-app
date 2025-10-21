import { SupabaseDataService } from '../services/supabaseDataService'

export const seedInitialData = async () => {
  try {
    console.log('🌱 Starting to seed initial data...')

    // Create service types
    const serviceTypes = await Promise.all([
      SupabaseDataService.createServiceType({
        name: 'Consultation',
        description: 'Initial consultation service'
      }),
      SupabaseDataService.createServiceType({
        name: 'Implementation',
        description: 'Full implementation service'
      }),
      SupabaseDataService.createServiceType({
        name: 'Support',
        description: 'Ongoing support service'
      })
    ])

    console.log('✅ Created service types:', serviceTypes.length)

    // Create lead sources
    const leadSources = await Promise.all([
      SupabaseDataService.createLeadSource({
        name: 'Website',
        description: 'Direct website inquiries'
      }),
      SupabaseDataService.createLeadSource({
        name: 'Referral',
        description: 'Client referrals'
      }),
      SupabaseDataService.createLeadSource({
        name: 'Social Media',
        description: 'Social media inquiries'
      }),
      SupabaseDataService.createLeadSource({
        name: 'Google Ads',
        description: 'Google advertising'
      }),
      SupabaseDataService.createLeadSource({
        name: 'Instagram Ads',
        description: 'Instagram advertising'
      })
    ])

    console.log('✅ Created lead sources:', leadSources.length)

    // Create ad sources
    const adSources = await Promise.all([
      SupabaseDataService.createAdSource({
        name: 'Google Ads',
        leadSourceId: leadSources.find(ls => ls.name === 'Google Ads')!.id
      }),
      SupabaseDataService.createAdSource({
        name: 'Instagram Ads',
        leadSourceId: leadSources.find(ls => ls.name === 'Instagram Ads')!.id
      })
    ])

    console.log('✅ Created ad sources:', adSources.length)

    // Create sample funnel data
    const funnelData = await SupabaseDataService.createFunnel({
      name: 'Default Funnel',
      bookingsGoal: 50,
      inquiryToCall: 0.3,
      callToBooking: 0.2,
      inquiriesYtd: 150,
      callsYtd: 45,
      bookingsYtd: 9
    })

    console.log('✅ Created funnel data:', funnelData.id)

    // Create sample bookings
    const bookings = await Promise.all([
      SupabaseDataService.createBooking({
        clientName: 'John Doe',
        clientEmail: 'john@example.com',
        clientPhone: '555-0123',
        serviceTypeId: serviceTypes[0].id,
        leadSourceId: leadSources[0].id,
        bookingDate: new Date('2024-01-15'),
        status: 'confirmed',
        notes: 'Initial consultation'
      }),
      SupabaseDataService.createBooking({
        clientName: 'Jane Smith',
        clientEmail: 'jane@example.com',
        clientPhone: '555-0456',
        serviceTypeId: serviceTypes[1].id,
        leadSourceId: leadSources[1].id,
        bookingDate: new Date('2024-01-20'),
        status: 'confirmed',
        notes: 'Full implementation'
      })
    ])

    console.log('✅ Created bookings:', bookings.length)

    // Create sample ad campaigns for current year
    const currentYear = new Date().getFullYear()
    const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
    
    for (const adSource of adSources) {
      for (const month of months) {
        await SupabaseDataService.createAdCampaign({
          adSourceId: adSource.id,
          monthYear: `${currentYear}-${month}`,
          adSpendCents: Math.floor(Math.random() * 500000), // Random spend up to $5000
          leadsGenerated: Math.floor(Math.random() * 20) // Random leads up to 20
        })
      }
    }

    console.log('✅ Created ad campaigns for all months')

    console.log('🎉 Successfully seeded all initial data!')
    return true

  } catch (error) {
    console.error('❌ Error seeding data:', error)
    return false
  }
}
