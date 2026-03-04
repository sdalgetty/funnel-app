import React, { useState } from 'react';
import { X, Check, Edit3, Trash2 } from 'lucide-react';
import type { ServiceType } from '../types';

interface ServiceTypesModalProps {
  serviceTypes: ServiceType[];
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
  onUnarchive?: (id: string) => Promise<boolean>;
  onUpdate: (id: string, newName: string) => void;
  onToggleFunnelTracking: (id: string) => void;
  onClose: () => void;
}

const ServiceTypesModal: React.FC<ServiceTypesModalProps> = ({
  serviceTypes,
  onAdd,
  onRemove,
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Manage Service Types</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {archivedServiceTypes.length > 0 && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', cursor: 'pointer', fontSize: '14px', color: '#6b7280' }}>
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: '#3b82f6' }}
            />
            Show archived service types
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
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>{st.name} <span style={{ fontStyle: 'italic', fontSize: '12px' }}>(archived)</span></span>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                        <span style={{ fontSize: '14px', fontWeight: st.tracksInFunnel ? 600 : 500 }}>{st.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="checkbox"
                            checked={st.tracksInFunnel}
                            onChange={() => onToggleFunnelTracking(st.id)}
                            style={{ cursor: 'pointer' }}
                          />
                          <span style={{
                            fontSize: '11px',
                            color: st.tracksInFunnel ? '#10b981' : '#6b7280',
                            fontWeight: '500'
                          }}>
                            Track in Funnel
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
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
                        <button
                          onClick={() => handleDelete(st.id)}
                          style={{
                            backgroundColor: '#ef4444',
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
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{
          backgroundColor: '#f3f4f6',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '20px',
          fontSize: '12px',
          color: '#6b7280',
          textAlign: 'left'
        }}>
          <div style={{ marginBottom: '8px' }}>
            <strong>Track in Funnel:</strong> Service Types marked as "Track in Funnel" will be included in your Funnel calculation for Bookings (Qty).
          </div>
          <div>
            <strong>Archive:</strong> Service types used by sales cannot be deleted. They can be archived instead.
            Archived types remain attached to past sales but are hidden from new sale dropdowns.
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
