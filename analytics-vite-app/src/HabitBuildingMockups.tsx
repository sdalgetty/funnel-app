/**
 * Visual Mockups for Habit-Building Features
 * 
 * This file contains mockup components showing how habit-building features
 * could be integrated into the app. These are design concepts, not production code.
 */

import React from 'react';
import { CheckCircle, Calendar, TrendingUp, Target, AlertCircle, Flame, Star, ArrowRight } from 'lucide-react';

// ============================================================================
// MOCKUP 1: Dashboard Health Scorecard (Top of Insights/Dashboard)
// ============================================================================
export function HealthScorecardMockup() {
  return (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: '#1f2937' }}>
          Data Health
        </h3>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          backgroundColor: '#d1fae5',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: '600',
          color: '#065f46'
        }}>
          <CheckCircle size={16} />
          92% Complete
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{
        width: '100%',
        height: '8px',
        backgroundColor: '#e5e7eb',
        borderRadius: '4px',
        marginBottom: '16px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: '92%',
          height: '100%',
          backgroundColor: '#10b981',
          borderRadius: '4px',
          transition: 'width 0.3s ease'
        }} />
      </div>

      {/* Status Items */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        <StatusItem
          label="Sales Data"
          status="upToDate"
          message="Current through January 2025"
        />
        <StatusItem
          label="Funnel Data"
          status="upToDate"
          message="Current through January 2025"
        />
        <StatusItem
          label="Forecast Model"
          status="needsAction"
          message="Create 2025 model"
        />
      </div>
    </div>
  );
}

function StatusItem({ label, status, message }: { label: string; status: 'upToDate' | 'needsAction' | 'behind'; message: string }) {
  const colors = {
    upToDate: { bg: '#d1fae5', text: '#065f46', icon: CheckCircle },
    needsAction: { bg: '#fef3c7', text: '#92400e', icon: AlertCircle },
    behind: { bg: '#fee2e2', text: '#991b1b', icon: AlertCircle }
  };
  const color = colors[status];
  const Icon = color.icon;

  return (
    <div style={{
      padding: '12px',
      backgroundColor: color.bg,
      borderRadius: '8px',
      border: `1px solid ${status === 'upToDate' ? '#10b981' : status === 'needsAction' ? '#f59e0b' : '#ef4444'}`
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
        <Icon size={14} color={color.text} />
        <span style={{ fontSize: '12px', fontWeight: '600', color: color.text }}>{label}</span>
      </div>
      <p style={{ fontSize: '11px', color: color.text, margin: 0 }}>{message}</p>
    </div>
  );
}

// ============================================================================
// MOCKUP 2: Smart Checklist (Could replace or supplement Health Scorecard)
// ============================================================================
export function SmartChecklistMockup() {
  const tasks = [
    { id: 1, label: 'Enter January 2025 Sales Data', completed: true, priority: 'high' },
    { id: 2, label: 'Enter January 2025 Funnel Data', completed: true, priority: 'high' },
    { id: 3, label: 'Create 2025 Forecast Model', completed: false, priority: 'medium' },
    { id: 4, label: 'Enter December 2024 Advertising Data', completed: false, priority: 'low' }
  ];

  const completedCount = tasks.filter(t => t.completed).length;
  const allComplete = completedCount === tasks.length;

  return (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: '#1f2937' }}>
          This Month's Tasks
        </h3>
        <div style={{
          fontSize: '14px',
          color: '#6b7280',
          fontWeight: '500'
        }}>
          {completedCount} of {tasks.length} complete
        </div>
      </div>

      {allComplete ? (
        <div style={{
          padding: '16px',
          backgroundColor: '#d1fae5',
          borderRadius: '8px',
          border: '1px solid #10b981',
          textAlign: 'center'
        }}>
          <CheckCircle size={24} color="#065f46" style={{ marginBottom: '8px' }} />
          <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#065f46' }}>
            You're fully caught up through last month's data. Great job! 🎉
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {tasks.map(task => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskItem({ task }: { task: { id: number; label: string; completed: boolean; priority: string } }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px',
      backgroundColor: task.completed ? '#f9fafb' : 'white',
      border: `1px solid ${task.completed ? '#d1d5db' : '#e5e7eb'}`,
      borderRadius: '8px',
      opacity: task.completed ? 0.7 : 1
    }}>
      <div style={{
        width: '20px',
        height: '20px',
        borderRadius: '4px',
        border: task.completed ? 'none' : '2px solid #d1d5db',
        backgroundColor: task.completed ? '#10b981' : 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        flexShrink: 0
      }}>
        {task.completed && <CheckCircle size={14} color="white" />}
      </div>
      <div style={{ flex: 1 }}>
        <span style={{
          fontSize: '14px',
          color: task.completed ? '#6b7280' : '#1f2937',
          textDecoration: task.completed ? 'line-through' : 'none'
        }}>
          {task.label}
        </span>
        {!task.completed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <span style={{
              fontSize: '11px',
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: task.priority === 'high' ? '#fee2e2' : task.priority === 'medium' ? '#fef3c7' : '#f3f4f6',
              color: task.priority === 'high' ? '#991b1b' : task.priority === 'medium' ? '#92400e' : '#6b7280'
            }}>
              {task.priority === 'high' ? 'High Priority' : task.priority === 'medium' ? 'Recommended' : 'Optional'}
            </span>
            <button style={{
              padding: '4px 8px',
              fontSize: '11px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              Do Now
              <ArrowRight size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MOCKUP 3: Streak System (Could be part of Health Scorecard or separate)
// ============================================================================
export function StreakSystemMockup() {
  return (
    <div style={{
      backgroundColor: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
      border: '2px solid #f59e0b',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '24px',
      textAlign: 'center'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
        <Flame size={24} color="#f59e0b" />
        <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: '#92400e' }}>
          6 Month Streak
        </h3>
      </div>
      <p style={{ fontSize: '14px', color: '#92400e', margin: '0 0 12px 0' }}>
        You've entered data every month for 6 months straight! Keep it up!
      </p>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '4px',
        marginTop: '12px'
      }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month, index) => (
          <div
            key={month}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '4px',
              backgroundColor: index < 6 ? '#f59e0b' : '#e5e7eb',
              border: `1px solid ${index < 6 ? '#d97706' : '#d1d5db'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title={`Month ${month}`}
          >
            {index < 6 && <Star size={12} color="white" />}
          </div>
        ))}
      </div>
      <p style={{ fontSize: '11px', color: '#92400e', margin: '8px 0 0 0' }}>
        Your best streak: 8 months
      </p>
    </div>
  );
}

// ============================================================================
// MOCKUP 4: Monthly Timeline Progress Visualization
// ============================================================================
export function MonthlyTimelineMockup() {
  const months = [
    { year: 2024, month: 7, label: 'Jul', complete: true },
    { year: 2024, month: 8, label: 'Aug', complete: true },
    { year: 2024, month: 9, label: 'Sep', complete: true },
    { year: 2024, month: 10, label: 'Oct', complete: true },
    { year: 2024, month: 11, label: 'Nov', complete: true },
    { year: 2024, month: 12, label: 'Dec', complete: true },
    { year: 2025, month: 1, label: 'Jan', complete: true, current: true },
    { year: 2025, month: 2, label: 'Feb', complete: false, current: true },
  ];

  return (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0', color: '#1f2937' }}>
        Data Entry Timeline
      </h3>
      <div style={{
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        {months.map((m, index) => (
          <div
            key={`${m.year}-${m.month}`}
            style={{
              position: 'relative',
              cursor: !m.complete ? 'pointer' : 'default'
            }}
          >
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '8px',
              backgroundColor: m.complete ? '#10b981' : m.current ? '#fef3c7' : '#fee2e2',
              border: `2px solid ${m.complete ? '#059669' : m.current ? '#f59e0b' : '#ef4444'}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.2s'
            }}
            >
              {m.complete ? (
                <CheckCircle size={20} color="white" />
              ) : (
                <AlertCircle size={20} color={m.current ? '#f59e0b' : '#ef4444'} />
              )}
              <span style={{
                fontSize: '10px',
                fontWeight: '600',
                color: m.complete ? 'white' : m.current ? '#92400e' : '#991b1b',
                marginTop: '2px'
              }}>
                {m.label}
              </span>
            </div>
            {m.current && (
              <div style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: '#3b82f6',
                border: '2px solid white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ fontSize: '10px', color: 'white', fontWeight: '700' }}>!</span>
              </div>
            )}
          </div>
        ))}
        {months.length < 12 && (
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '8px',
            border: '2px dashed #d1d5db',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9ca3af',
            fontSize: '12px'
          }}>
            ...
          </div>
        )}
      </div>
      <p style={{ fontSize: '12px', color: '#6b7280', margin: '12px 0 0 0' }}>
        Click incomplete months to enter data
      </p>
    </div>
  );
}

// ============================================================================
// MOCKUP 5: Completion Celebration (Modal/Toast)
// ============================================================================
export function CompletionCelebrationMockup() {
  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '32px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      zIndex: 1000,
      maxWidth: '400px',
      textAlign: 'center'
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        backgroundColor: '#d1fae5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 16px',
        animation: 'scaleIn 0.3s ease'
      }}>
        <CheckCircle size={32} color="#059669" />
      </div>
      <h3 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 8px 0', color: '#1f2937' }}>
        Month Complete! 🎉
      </h3>
      <p style={{ fontSize: '16px', color: '#6b7280', margin: '0 0 20px 0' }}>
        You've entered all data for January 2025. Your insights are now up to date!
      </p>
      <div style={{
        padding: '12px',
        backgroundColor: '#f0f9ff',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <p style={{ fontSize: '14px', color: '#1e40af', margin: 0 }}>
          <strong>This month:</strong> 12 bookings • $45,000 revenue
        </p>
      </div>
      <button style={{
        padding: '12px 24px',
        backgroundColor: '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        width: '100%'
      }}>
        View Insights
      </button>
    </div>
  );
}

// ============================================================================
// MOCKUP 6: Quick Entry Prompt (Could appear on Dashboard)
// ============================================================================
export function QuickEntryPromptMockup() {
  return (
    <div style={{
      backgroundColor: '#f0f9ff',
      border: '2px solid #3b82f6',
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px'
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Target size={18} color="#3b82f6" />
          <h4 style={{ fontSize: '16px', fontWeight: '600', margin: 0, color: '#1e40af' }}>
            Quick Entry
          </h4>
        </div>
        <p style={{ fontSize: '14px', color: '#1e40af', margin: 0 }}>
          Got a new sale? Enter it now to keep your data current!
        </p>
      </div>
      <button style={{
        padding: '10px 20px',
        backgroundColor: '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        whiteSpace: 'nowrap'
      }}>
        Add Sale
        <ArrowRight size={16} />
      </button>
    </div>
  );
}

// ============================================================================
// COMBINED DASHBOARD VIEW (Shows how these could work together)
// ============================================================================
export function CombinedDashboardMockup() {
  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 24px 0', color: '#1f2937' }}>
        Dashboard
      </h1>

      {/* Quick Entry Prompt */}
      <QuickEntryPromptMockup />

      {/* Streak System */}
      <StreakSystemMockup />

      {/* Health Scorecard */}
      <HealthScorecardMockup />

      {/* Smart Checklist */}
      <SmartChecklistMockup />

      {/* Monthly Timeline */}
      <MonthlyTimelineMockup />

      <p style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center', marginTop: '32px' }}>
        These are design mockups - not production code
      </p>
    </div>
  );
}

