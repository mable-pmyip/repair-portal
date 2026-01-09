import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { RepairRequest } from '../../../types';
import { format } from 'date-fns';

interface RepairsTableProps {
  repairs: RepairRequest[];
  filter: 'pending' | 'completed' | 'cancelled';
  sortBy: 'createdAt' | 'status' | 'orderNumber' | 'location' | 'submitterName';
  sortOrder: 'asc' | 'desc';
  onSort: (field: 'createdAt' | 'status' | 'orderNumber' | 'location' | 'submitterName') => void;
  onRowClick: (repair: RepairRequest) => void;
  onMarkAsCompleted: (repairId: string) => void;
  onCancelRepair: (repairId: string) => void;
}

export default function RepairsTable({
  repairs,
  filter,
  sortBy,
  sortOrder,
  onSort,
  onRowClick,
  onMarkAsCompleted,
  onCancelRepair
}: RepairsTableProps) {
  const { t } = useLanguage();

  return (
    <div className="table-container">
      <table className="requests-table">
        <thead>
          <tr>
            <th onClick={() => onSort('orderNumber')} className="sortable">
              {t('adminDashboard.requestNumber')} {sortBy === 'orderNumber' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => onSort('location')} className="sortable">
              {t('repairForm.location')} {sortBy === 'location' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => onSort('submitterName')} className="sortable">
              {t('adminDashboard.submittedBy')} {sortBy === 'submitterName' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => onSort('createdAt')} className="sortable">
              {t('adminDashboard.submittedOn')} {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            {filter === 'pending' && <th>{t('adminDashboard.actions')}</th>}
          </tr>
        </thead>
        <tbody>
          {repairs.map((repair) => (
            <tr key={repair.id} onClick={() => onRowClick(repair)} className="clickable-row">
              <td className="request-number">
                <span className="request-number-with-status">
                  {repair.status === 'pending' && <Clock size={16} className="status-icon pending" />}
                  {repair.status === 'completed' && <CheckCircle size={16} className="status-icon completed" />}
                  {repair.status === 'cancelled' && <XCircle size={16} className="status-icon cancelled" />}
                  {repair.orderNumber}
                </span>
              </td>
              <td>{repair.location}</td>
              <td>{repair.submitterName}</td>
              <td>{format(repair.createdAt.toDate(), 'MMM dd, yyyy HH:mm')}</td>
              {filter === 'pending' && (
                <td onClick={(e) => e.stopPropagation()}>
                  <div className="table-actions">
                    <button
                      onClick={() => onMarkAsCompleted(repair.id!)}
                      className="btn-table btn-success-outline"
                      title={t('adminDashboard.markAsCompleted')}
                    >
                      <CheckCircle size={16} />
                    </button>
                    <button
                      onClick={() => onCancelRepair(repair.id!)}
                      className="btn-table btn-danger-outline"
                      title={t('adminDashboard.cancelRequest')}
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
