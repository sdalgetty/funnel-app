import React, { useState } from 'react';
import { X, Check, Edit3, Trash2 } from 'lucide-react';
import type { ServiceType } from '../types';

interface ServiceTypesModalProps {
  serviceTypes: ServiceType[];
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, newName: string) => void;
  onToggleFunnelTracking: (id: string) => void;
  onClose: () => void;
}

const ServiceTypesModal: React.FC<ServiceTypesModalProps> = ({
  serviceTypes,
  onAdd,
  onRemove,
  onUpdate,
  onToggleFunnelTracking,
  onClose
}) => {
  const [newServiceType, setNewServiceType] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

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

  const handleDelete = (id: string, name: string) => {
    const confirmMessage = `Are you sure you want to delete "${name}"? This action cannot be undone.`;
    if (confirm(confirmMessage)) {
      onRemove(id);
    }
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

        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {serviceTypes.length === 0 ? (
              <div style={{
                textAlign: 'left',
                padding: '24px',
                color: '#6b7280',
                fontSize: '14px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                border: '1px solid #e5e7eb'
              }}>
                No service types created yet. Add your first service type above to get started.
              </div>
            ) : (
              serviceTypes.map(st => (
                <div key={st.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb'
                }}>
                  {editingId === st.id ? (
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
                        <span style={{ fontSize: '14px' }}>{st.name}</span>
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
                          onClick={() => handleDelete(st.id, st.name)}
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
            <strong>Track in Funnel:</strong> Service Types marked as "Track in Funnel" will be included in your Funnel calculation for Closes.
          </div>
          <div>
            <strong>Delete:</strong> Deleting a service type will remove it from any existing bookings that use it.
            The booking data will be preserved, but the service type association will be lost.
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
