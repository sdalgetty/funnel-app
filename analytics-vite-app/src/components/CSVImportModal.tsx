import React, { useState, useRef } from 'react';
import { Upload, X, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { importBookingsFromCSV, type ImportResult } from '../services/honeybookImporter';
import { importBookedClientsFromCSV } from '../services/honeybookBookedClientImporter';
import { parseCSV } from '../utils/csvParser';
import type { ServiceType, LeadSource } from '../types';
import { logger } from '../utils/logger';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (result: ImportResult) => Promise<void>;
  existingServiceTypes: ServiceType[];
  existingLeadSources: LeadSource[];
  userId: string;
  pageType?: 'funnel' | 'sales'; // Which page is this import for?
}

export default function CSVImportModal({
  isOpen,
  onClose,
  onImport,
  existingServiceTypes,
  existingLeadSources,
  userId,
  pageType = 'sales',
}: CSVImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setPreview(null);
  };

  const handlePreview = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const text = await file.text();
      
      // Detect which type of Honeybook report this is
      const { headers } = parseCSV(text);
      const lowerHeaders = headers.map(h => h.toLowerCase());
      
      // Check for Booked Client report indicators
      const isBookedClientReport = 
        lowerHeaders.includes('project creation date') ||
        lowerHeaders.includes('total booked value') ||
        (lowerHeaders.includes('first name') && lowerHeaders.includes('project type'));
      
      // Check for Leads report indicators
      const isLeadsReport = 
        lowerHeaders.includes('lead created date') ||
        lowerHeaders.includes('lead source open text');
      
      let result: ImportResult;
      
      if (isBookedClientReport) {
        // Use Booked Client importer (handles deduplication)
        result = importBookedClientsFromCSV(text, existingServiceTypes, existingLeadSources, userId);
      } else if (isLeadsReport) {
        // Use Leads report importer
        result = importBookingsFromCSV(text, existingServiceTypes, existingLeadSources, userId);
      } else {
        // Try Leads report format as default (more flexible)
        result = importBookingsFromCSV(text, existingServiceTypes, existingLeadSources, userId);
      }
      
      setPreview(result);
    } catch (err) {
      logger.error('Error previewing CSV:', err);
      setError(err instanceof Error ? err.message : 'Failed to parse CSV file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!preview) return;

    setIsProcessing(true);
    try {
      await onImport(preview);
      onClose();
      // Reset state
      setFile(null);
      setPreview(null);
      setError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      logger.error('Error importing CSV:', err);
      setError(err instanceof Error ? err.message : 'Failed to import data');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={handleClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '800px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Import Data from Honeybook CSV</h2>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Instructions */}
        <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '6px' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#374151' }}>
            <strong>Instructions:</strong>
          </p>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', fontSize: '14px', color: '#6b7280' }}>
            {pageType === 'funnel' ? (
              <>
                <li><strong>Import Leads Report for Funnel Data</strong></li>
                <li>Export your <strong>Leads report</strong> from Honeybook as CSV</li>
                <li>This will populate <strong>Inquiries</strong> and <strong>Closes count</strong> in your funnel</li>
                <li>Select the CSV file below, click "Preview", then "Import"</li>
                <li><strong>Note:</strong> This does NOT create sales records. Use the Sales tab to import Booked Client reports.</li>
              </>
            ) : (
              <>
                <li><strong>Import Booked Client Report for Sales Data</strong></li>
                <li>Export your <strong>Booked Client report</strong> from Honeybook as CSV</li>
                <li>This will create sales records and update <strong>Closes & Bookings</strong> (revenue) in your funnel</li>
                <li>Select the CSV file below, click "Preview", then "Import"</li>
                <li><strong>Note:</strong> For complete funnel data, import Leads report from Funnel tab first (for inquiries), then import Booked Client report here (for closes/bookings and sales records)</li>
                <li>Payment schedules will need to be added manually</li>
              </>
            )}
          </ul>
        </div>

        {/* File Input */}
        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                border: '2px dashed #d1d5db',
                borderRadius: '6px',
                padding: '24px',
                textAlign: 'center',
                backgroundColor: file ? '#f9fafb' : 'white',
                transition: 'all 0.2s',
              }}
            >
              <Upload size={32} style={{ marginBottom: '8px', color: '#6b7280' }} />
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                {file ? file.name : 'Click to select CSV file'}
              </div>
              {file && (
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  {(file.size / 1024).toFixed(2)} KB
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        {/* Error Display */}
        {error && (
          <div
            style={{
              padding: '12px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={20} color="#dc2626" />
            <span style={{ color: '#dc2626', fontSize: '14px' }}>{error}</span>
          </div>
        )}

        {/* Preview */}
        {preview && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Import Preview</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Only show bookings count for Booked Client report, not Leads report */}
              {preview.bookings.length > 0 && (
                <div style={{ padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <CheckCircle size={16} color="#16a34a" />
                    <strong style={{ fontSize: '14px', color: '#16a34a' }}>
                      {preview.bookings.length} Bookings
                    </strong>
                  </div>
                  <div style={{ fontSize: '12px', color: '#15803d', marginLeft: '24px' }}>
                    Ready to import
                  </div>
                </div>
              )}

              <div style={{ padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <CheckCircle size={16} color="#16a34a" />
                  <strong style={{ fontSize: '14px', color: '#16a34a' }}>
                    {preview.funnelData.length} Months of Funnel Data
                  </strong>
                </div>
                <div style={{ fontSize: '12px', color: '#15803d', marginLeft: '24px' }}>
                  Generated from bookings
                </div>
              </div>

              {/* Only show service types/lead sources for Booked Client report (has bookings), not Leads report */}
              {pageType === 'sales' && preview.bookings.length > 0 && preview.serviceTypes.length > existingServiceTypes.length && (
                <div style={{ padding: '12px', backgroundColor: '#fffbeb', borderRadius: '6px', border: '1px solid #fde68a' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <FileText size={16} color="#d97706" />
                    <strong style={{ fontSize: '14px', color: '#d97706' }}>
                      {preview.serviceTypes.length - existingServiceTypes.length} New Service Types
                    </strong>
                  </div>
                  <div style={{ fontSize: '12px', color: '#b45309', marginLeft: '24px' }}>
                    Will be created automatically
                  </div>
                </div>
              )}

              {pageType === 'sales' && preview.bookings.length > 0 && preview.leadSources.length > existingLeadSources.length && (
                <div style={{ padding: '12px', backgroundColor: '#fffbeb', borderRadius: '6px', border: '1px solid #fde68a' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <FileText size={16} color="#d97706" />
                    <strong style={{ fontSize: '14px', color: '#d97706' }}>
                      {preview.leadSources.length - existingLeadSources.length} New Lead Sources
                    </strong>
                  </div>
                  <div style={{ fontSize: '12px', color: '#b45309', marginLeft: '24px' }}>
                    Will be created automatically
                  </div>
                </div>
              )}

              {preview.warnings.length > 0 && (
                <div style={{ padding: '12px', backgroundColor: '#fffbeb', borderRadius: '6px', border: '1px solid #fde68a' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <AlertCircle size={16} color="#d97706" />
                    <strong style={{ fontSize: '14px', color: '#d97706' }}>
                      {preview.warnings.length} Warnings
                    </strong>
                  </div>
                  <div style={{ fontSize: '12px', color: '#b45309', marginLeft: '24px' }}>
                    {preview.warnings.slice(0, 3).join(', ')}
                    {preview.warnings.length > 3 && ` and ${preview.warnings.length - 3} more`}
                  </div>
                </div>
              )}

              {preview.errors.length > 0 && (
                <div style={{ padding: '12px', backgroundColor: '#fef2f2', borderRadius: '6px', border: '1px solid #fecaca' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <AlertCircle size={16} color="#dc2626" />
                    <strong style={{ fontSize: '14px', color: '#dc2626' }}>
                      {preview.errors.length} Errors
                    </strong>
                  </div>
                  <div style={{ fontSize: '12px', color: '#991b1b', marginLeft: '24px' }}>
                    {preview.errors.slice(0, 3).join(', ')}
                    {preview.errors.length > 3 && ` and ${preview.errors.length - 3} more`}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={handleClose}
            style={{
              padding: '8px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: 'white',
              color: '#374151',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          {file && !preview && (
            <button
              onClick={handlePreview}
              disabled={isProcessing}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: '#3b82f6',
                color: 'white',
                fontSize: '14px',
                fontWeight: '500',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                opacity: isProcessing ? 0.5 : 1,
              }}
            >
              {isProcessing ? 'Processing...' : 'Preview'}
            </button>
          )}
          {preview && (
            <button
              onClick={handleImport}
              disabled={isProcessing || preview.errors.length > 0}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: preview.errors.length > 0 ? '#9ca3af' : '#10b981',
                color: 'white',
                fontSize: '14px',
                fontWeight: '500',
                cursor: isProcessing || preview.errors.length > 0 ? 'not-allowed' : 'pointer',
                opacity: isProcessing ? 0.5 : 1,
              }}
            >
              {isProcessing ? 'Importing...' : 'Import Data'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

