import React, { useState } from 'react'
import { SupabaseDataService } from '../services/supabaseDataService'
import { seedInitialData } from '../utils/seedData'

const TestConnection: React.FC = () => {
  const [status, setStatus] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    setStatus('Testing connection...')
    
    try {
      // Test basic connection by trying to get funnels
      const funnels = await SupabaseDataService.getAllFunnels()
      setStatus(`✅ Connection successful! Found ${funnels.length} funnels.`)
    } catch (error: any) {
      setStatus(`❌ Connection failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const seedData = async () => {
    setLoading(true)
    setStatus('Seeding data...')
    
    try {
      const success = await seedInitialData()
      if (success) {
        setStatus('✅ Data seeded successfully!')
      } else {
        setStatus('❌ Failed to seed data')
      }
    } catch (error: any) {
      setStatus(`❌ Error seeding data: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      maxWidth: '600px',
      margin: '20px auto',
      padding: '20px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      backgroundColor: 'white'
    }}>
      <h3>Database Connection Test</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={testConnection}
          disabled={loading}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          Test Connection
        </button>
        
        <button
          onClick={seedData}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: loading ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          Seed Data
        </button>
      </div>
      
      {status && (
        <div style={{
          padding: '10px',
          backgroundColor: status.includes('✅') ? '#d4edda' : '#f8d7da',
          border: `1px solid ${status.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '4px',
          color: status.includes('✅') ? '#155724' : '#721c24'
        }}>
          {status}
        </div>
      )}
    </div>
  )
}

export default TestConnection
