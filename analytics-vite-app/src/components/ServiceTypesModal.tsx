import React, { useState } from 'react';
import { X, Check, Edit3, Trash2 } from 'lucide-react';
import type { ServiceType } from '../types';
import { InfoTooltip } from './InfoTooltip';

interface ServiceTypesModalProps {
  serviceTypes: ServiceType[];
  getBookingCountForServiceType: (id: string) => number;
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
  onArchive?: (id: string) => Promise<boolean>;
  onUnarchive?: (id: string) => Promise<boolean>;
  onUpdate: (id: string, newName: string) => void;
  onToggleFunnelTracking: (id: string) => void;
  onClose: () => void;
}

const ServiceTypesModal: React.FC<ServiceTypesModalProps> = ({
  serviceTypes,
  getBookingCountForServiceType,
  onAdd,
  onRemove,
  onArchive,
  onUnarchive,
  onUpdate,
  onToggleFunnelTracking,
  onClose
}) => {
  const [newServiceType, setNewServiceType] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const activeServiceTypes = serviceTypes.filter(st => !st.archived);
  const archivedServiceTypes = serviceTypes.filter(st => st.archived);
  const displayServiceTypes = showArchived ? serviceTypes : activeServiceTypes;

  const handleAdd = () => {
    if (newServiceType.trim()) {
      onAdd(newServiceType.trim());
      setNewServiceType('');
    }
  };

  const handleEdit = (serviceType: ServiceType) => {
    setEditingId(serviceType.id);
    setEditingName(serviceType.name);
  };

  const handleSaveEdit = () => {
    if (editingId && editingName.trim()) {
      onUpdate(editingId, editingName.trim());
      setEditingId(null);
      setEditingName('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleDelete = (id: string) => {
    onRemove(id);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Manage Service Types</h2>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0', lineHeight: 1.4 }}>
              Service Types categorize the work you book (e.g., Wedding, Engagement, Family). They help you filter sales and group performance metrics in Insights.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {archivedServiceTypes.length > 0 && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', marginTop: '16px', cursor: 'pointer', fontSize: '14px', color: '#6b7280' }}>
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: '#3b82f6' }}
            />
            Show archived service types
            <InfoTooltip content="Archived service types remain attached to past sales but are hidden from new sale dropdowns." />
          </label>
        )}

        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input
              type="text"
              value={newServiceType}
              onChange={(e) => setNewServiceType(e.target.value)}
              placeholder="Add new service type"
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
            />
            <button
              onClick={handleAdd}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Add
            </button>
          </div>

          <div style={{
            maxHeight: '280px',
            overflowY: 'auto',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}>
            {displayServiceTypes.length > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 12px',
                backgroundColor: '#f9fafb',
                borderBottom: '1px solid #e5e7eb',
                fontWeight: 600,
                fontSize: '12px',
                color: '#374151',
                position: 'sticky',
                top: 0,
                zIndex: 1,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>Service Type</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, width: '140px', justifyContent: 'flex-start' }}>
                  <span>Track in Funnel</span>
                  <InfoTooltip content="Include this service type when calculating Bookings (Qty) and funnel conversion metrics." />
                </div>
                <div style={{ width: '52px', flexShrink: 0, textAlign: 'left' }}>Edit</div>
                <div style={{ width: '88px', flexShrink: 0, textAlign: 'left' }}>Actions</div>
              </div>
            )}
            {displayServiceTypes.length === 0 ? (
              <div style={{
                textAlign: 'left',
                padding: '24px',
                color: '#6b7280',
                fontSize: '14px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
              }}>
                {showArchived ? 'No archived service types.' : 'No service types created yet. Add your first service type above to get started.'}
              </div>
            ) : (
              displayServiceTypes.map(st => (
                <div key={st.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderBottom: '1px solid #f3f4f6',
                  backgroundColor: st.archived ? '#f9fafb' : (st.tracksInFunnel ? '#eff6ff' : '#f9fafb'),
                }}>
                  {st.archived ? (
                    <>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: '14px', color: '#6b7280' }}>{st.name} <span style={{ fontStyle: 'italic', fontSize: '12px' }}>(archived)</span></span>
                      </div>
                      <div style={{ flexShrink: 0, width: '140px' }} />
                      <div style={{ flexShrink: 0, width: '52px' }} />
                      <div style={{ flexShrink: 0, width: '88px', display: 'flex', justifyContent: 'flex-start' }}>
                        {onUnarchive && (
                          <button
                            onClick={() => onUnarchive(st.id)}
                            style={{
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '4px 12px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            Restore
                          </button>
                        )}
                      </div>
                    </>
                  ) : editingId === st.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '6px 8px',
                          border: '1px solid #3b82f6',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                        autoFocus
                      />
                      <button
                        onClick={handleSaveEdit}
                        style={{
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Check size={12} />
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        style={{
                          backgroundColor: '#6b7280',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <X size={12} />
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: '14px', fontWeight: st.tracksInFunnel ? 600 : 500 }}>{st.name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                        <div style={{ width: '140px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={st.tracksInFunnel}
                              onChange={() => onToggleFunnelTracking(st.id)}
                              style={{ width: 16, height: 16, accentColor: '#3b82f6', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '13px', color: st.tracksInFunnel ? '#3b82f6' : '#6b7280', fontWeight: '500' }}>
                              Track in Funnel
                            </span>
                          </label>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                          <div style={{ width: '52px', flexShrink: 0 }}>
                            <button
                              onClick={() => handleEdit(st)}
                              style={{
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Edit3 size={12} />
                              Edit
                            </button>
                          </div>
                          <div style={{ width: '88px', flexShrink: 0, display: 'flex', justifyContent: 'flex-start' }}>
                          {getBookingCountForServiceType(st.id) > 0 ? (
                            onArchive && (
                              <button
                                onClick={() => onArchive(st.id)}
                                style={{
                                  backgroundColor: '#6b7280',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '4px 12px',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  minWidth: '72px',
                                  justifyContent: 'center'
                                }}
                              >
                                <Trash2 size={12} />
                                Archive
                              </button>
                            )
                          ) : (
                            <button
                              onClick={() => handleDelete(st.id)}
                              style={{
                                backgroundColor: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '4px 12px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                minWidth: '72px',
                                justifyContent: 'center'
                              }}
                            >
                              <Trash2 size={12} />
                              Delete
                            </button>
                          )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '10px 20px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceTypesModal;
