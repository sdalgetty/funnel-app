import React, { useState, useEffect } from 'react';
import { AdminService, AdminAccessLog } from '../services/adminService';
import { ArrowLeft, Clock, User, Eye, Edit, Play, Square } from 'lucide-react';

interface AdminAccessLogsProps {
  onBack: () => void;
}

export default function AdminAccessLogs({ onBack }: AdminAccessLogsProps) {
  const [logs, setLogs] = useState<AdminAccessLog[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [sessionActions, setSessionActions] = useState<AdminAccessLog[]>([]);
  const [viewMode, setViewMode] = useState<'all' | 'sessions'>('all');

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      loadSessionActions(selectedSession);
    }
  }, [selectedSession]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const [allLogs, allSessions] = await Promise.all([
        AdminService.getAccessLogs(200),
        AdminService.getImpersonationSessions(50),
      ]);
      setLogs(allLogs);
      setSessions(allSessions);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSessionActions = async (sessionId: string) => {
    try {
      const actions = await AdminService.getSessionActions(sessionId);
      setSessionActions(actions);
    } catch (error) {
      console.error('Error loading session actions:', error);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'impersonate_start':
        return <Play size={16} style={{ color: '#10b981' }} />;
      case 'impersonate_end':
        return <Square size={16} style={{ color: '#ef4444' }} />;
      case 'view_user':
        return <Eye size={16} style={{ color: '#3b82f6' }} />;
      case 'edit_data':
        return <Edit size={16} style={{ color: '#f59e0b' }} />;
      default:
        return <Clock size={16} style={{ color: '#6b7280' }} />;
    }
  };

  const formatActionType = (actionType: string) => {
    return actionType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDuration = (startTime: string, endTime: string | null) => {
    if (!endTime) return 'Active';
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const minutes = Math.floor((end - start) / 60000);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '24px' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            backgroundColor: '#f3f4f6',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            color: '#374151',
            cursor: 'pointer',
            marginBottom: '16px'
          }}
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0', color: '#1f2937' }}>
              Access Logs
            </h1>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
              View all admin actions and impersonation sessions
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setViewMode('all')}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                backgroundColor: viewMode === 'all' ? '#3b82f6' : '#f3f4f6',
                color: viewMode === 'all' ? 'white' : '#374151'
              }}
            >
              All Logs
            </button>
            <button
              onClick={() => setViewMode('sessions')}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                backgroundColor: viewMode === 'sessions' ? '#3b82f6' : '#f3f4f6',
                color: viewMode === 'sessions' ? 'white' : '#374151'
              }}
            >
              Impersonation Sessions
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          Loading logs...
        </div>
      ) : viewMode === 'sessions' ? (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          {sessions.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
              No impersonation sessions found
            </div>
          ) : (
            <div style={{ padding: '16px' }}>
              {sessions.map((session) => (
                <div
                  key={session.session_id}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '12px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    backgroundColor: selectedSession === session.session_id ? '#f3f4f6' : 'white'
                  }}
                  onClick={() => setSelectedSession(
                    selectedSession === session.session_id ? null : session.session_id
                  )}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
                        Session: {session.session_id.substring(0, 8)}...
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                        Target User: {session.target_user_id?.substring(0, 8)}...
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                        Started: {new Date(session.start_time).toLocaleString()}
                      </div>
                      {session.end_time && (
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                          Ended: {new Date(session.end_time).toLocaleString()}
                        </div>
                      )}
                      <div style={{ fontSize: '12px', fontWeight: '500', color: '#3b82f6', marginTop: '8px' }}>
                        Duration: {formatDuration(session.start_time, session.end_time)}
                      </div>
                    </div>
                    <div style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: session.end_time ? '#d1fae5' : '#fef3c7',
                      color: session.end_time ? '#065f46' : '#92400e'
                    }}>
                      {session.end_time ? 'Completed' : 'Active'}
                    </div>
                  </div>
                  {selectedSession === session.session_id && sessionActions.length > 0 && (
                    <div style={{
                      marginTop: '16px',
                      paddingTop: '16px',
                      borderTop: '1px solid #e5e7eb'
                    }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '8px' }}>
                        Actions Taken:
                      </div>
                      {sessionActions.map((action) => (
                        <div
                          key={action.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px',
                            fontSize: '12px',
                            color: '#374151',
                            backgroundColor: '#f9fafb',
                            borderRadius: '4px',
                            marginBottom: '4px'
                          }}
                        >
                          {getActionIcon(action.action_type)}
                          <span>{formatActionType(action.action_type)}</span>
                          <span style={{ color: '#9ca3af', marginLeft: 'auto' }}>
                            {new Date(action.created_at).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          {logs.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
              No logs found
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                    Action
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                    Target User
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                    Details
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                    Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    style={{
                      borderBottom: '1px solid #e5e7eb'
                    }}
                  >
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {getActionIcon(log.action_type)}
                        <span style={{ fontSize: '14px', color: '#1f2937' }}>
                          {formatActionType(log.action_type)}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                      {log.target_user_id ? log.target_user_id.substring(0, 8) + '...' : '—'}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                      {log.action_details ? JSON.stringify(log.action_details).substring(0, 50) + '...' : '—'}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}




