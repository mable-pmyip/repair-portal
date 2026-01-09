import { useState } from 'react';
import { Download } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { RepairRequest } from '../../../types';
import { format } from 'date-fns';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  repairs: RepairRequest[];
}

export default function ExportModal({ isOpen, onClose, repairs }: ExportModalProps) {
  const { t } = useLanguage();
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [exportDateType, setExportDateType] = useState<'all' | 'created' | 'completed' | 'cancelled'>('all');

  const exportToCSV = () => {
    if (!exportStartDate || !exportEndDate) {
      alert(t('adminDashboard.exportModal.selectDatesError'));
      return;
    }

    const startDate = new Date(exportStartDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(exportEndDate);
    endDate.setHours(23, 59, 59, 999);

    // Filter repairs based on selected date range and type
    const filteredData = repairs.filter(repair => {
      if (exportDateType === 'all') {
        const createdDate = repair.createdAt.toDate();
        const completedDate = repair.completedAt?.toDate();
        const cancelledDate = repair.cancelledAt?.toDate();

        const createdInRange = createdDate >= startDate && createdDate <= endDate;
        const completedInRange = completedDate && completedDate >= startDate && completedDate <= endDate;
        const cancelledInRange = cancelledDate && cancelledDate >= startDate && cancelledDate <= endDate;

        return createdInRange || completedInRange || cancelledInRange;
      }

      let dateToCheck: Date | null = null;

      if (exportDateType === 'created') {
        dateToCheck = repair.createdAt.toDate();
      } else if (exportDateType === 'completed' && repair.completedAt) {
        dateToCheck = repair.completedAt.toDate();
      } else if (exportDateType === 'cancelled' && repair.cancelledAt) {
        dateToCheck = repair.cancelledAt.toDate();
      }

      if (!dateToCheck) return false;
      return dateToCheck >= startDate && dateToCheck <= endDate;
    });

    if (filteredData.length === 0) {
      alert(t('adminDashboard.exportModal.noRecordsError'));
      return;
    }

    // Create CSV content
    const headers = [
      'Order Number',
      'Status',
      'Submitter Name',
      'Location',
      'Description',
      'Created Date',
      'Completed Date',
      'Cancelled Date',
      'Follow-up Actions'
    ];

    const csvRows = [headers.join(',')];

    filteredData.forEach(repair => {
      const row = [
        `"${repair.orderNumber}"`,
        `"${repair.status}"`,
        `"${repair.submitterName || ''}"`,
        `"${repair.location || ''}"`,
        `"${(repair.description || '').replace(/"/g, '""')}"`,
        `"${format(repair.createdAt.toDate(), 'yyyy-MM-dd HH:mm')}"`,
        repair.completedAt ? `"${format(repair.completedAt.toDate(), 'yyyy-MM-dd HH:mm')}"` : '""',
        repair.cancelledAt ? `"${format(repair.cancelledAt.toDate(), 'yyyy-MM-dd HH:mm')}"` : '""',
        `"${(repair.followUpActions || []).join('; ').replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    });

    // Download CSV
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `repair-requests-${exportDateType}-${exportStartDate}-to-${exportEndDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Close modal and reset
    setExportStartDate('');
    setExportEndDate('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content export-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ×
        </button>
        <h2>{t('adminDashboard.exportModal.title')}</h2>
        <p className="modal-description">{t('adminDashboard.exportModal.description')}</p>
        
        <div className="export-form">
          <div className="form-group">
            <label htmlFor="dateType">{t('adminDashboard.exportModal.filterBy')}</label>
            <select
              id="dateType"
              value={exportDateType}
              onChange={(e) => setExportDateType(e.target.value as 'all' | 'created' | 'completed' | 'cancelled')}
              className="export-select"
            >
              <option value="all">{t('adminDashboard.exportModal.filterAll')}</option>
              <option value="created">{t('adminDashboard.exportModal.filterCreated')}</option>
              <option value="completed">{t('adminDashboard.exportModal.filterCompleted')}</option>
              <option value="cancelled">{t('adminDashboard.exportModal.filterCancelled')}</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="startDate">{t('adminDashboard.exportModal.startDate')}</label>
            <input
              id="startDate"
              type="date"
              value={exportStartDate}
              onChange={(e) => setExportStartDate(e.target.value)}
              className="export-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="endDate">{t('adminDashboard.exportModal.endDate')}</label>
            <input
              id="endDate"
              type="date"
              value={exportEndDate}
              onChange={(e) => setExportEndDate(e.target.value)}
              className="export-input"
            />
          </div>

          <div className="export-actions">
            <button onClick={onClose} className="btn-secondary">
              {t('adminDashboard.exportModal.cancel')}
            </button>
            <button onClick={exportToCSV} className="btn-primary">
              <Download size={18} />
              {t('adminDashboard.exportModal.download')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
