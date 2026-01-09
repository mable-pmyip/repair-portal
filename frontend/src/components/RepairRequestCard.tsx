import { format } from 'date-fns';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { RepairRequest } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import ImageWithLoading from './ImageWithLoading';

interface RepairRequestCardProps {
  request: RepairRequest;
  isExpanded: boolean;
  onToggleDescription: (id: string) => void;
  truncateText: (text: string, maxLength: number) => string;
  showSubmitterInfo?: boolean;
  showFollowUpActions?: boolean;
  showAdminActions?: boolean;
  followUpAction?: string;
  onFollowUpActionChange?: (value: string) => void;
  onAddFollowUpAction?: () => void;
  onMarkAsCompleted?: () => void;
  onCancelRepair?: () => void;
  onImageClick?: (request: RepairRequest, imageIndex: number) => void;
}

export default function RepairRequestCard({
  request,
  isExpanded,
  onToggleDescription,
  truncateText,
  showSubmitterInfo = false,
  showFollowUpActions = false,
  showAdminActions = false,
  followUpAction,
  onFollowUpActionChange,
  onAddFollowUpAction,
  onMarkAsCompleted,
  onCancelRepair,
  onImageClick,
}: RepairRequestCardProps) {
  const { t } = useLanguage();

  return (
    <div className="repair-card">
      <div className="repair-header">
        <h3>{request.orderNumber}</h3>
        <span className={`status-badge ${request.status}`}>
          {request.status === 'pending' && <Clock size={16} />}
          {request.status === 'completed' && <CheckCircle size={16} />}
          {request.status === 'cancelled' && <XCircle size={16} />}
          {t(`adminDashboard.${request.status}`)}
        </span>
      </div>

      <div className="repair-details">
        {showSubmitterInfo && (
          <p><strong>{t('adminDashboard.submittedBy')}:</strong> {request.submitterName}</p>
        )}
        <p><strong>{t('repairForm.location')}:</strong> {request.location}</p>
        <p><strong>{t('adminDashboard.submittedOn')}:</strong> {format(request.createdAt.toDate(), 'MMM dd, yyyy HH:mm')}</p>
        {request.completedAt && (
          <p><strong>{t('adminDashboard.completedOn')}:</strong> {format(request.completedAt.toDate(), 'MMM dd, yyyy HH:mm')}</p>
        )}
        {request.cancelledAt && (
          <p><strong>{t('adminDashboard.cancelledOn')}:</strong> {format(request.cancelledAt.toDate(), 'MMM dd, yyyy HH:mm')}</p>
        )}
      </div>

      {request.completionReason && (
        <div className="action-reason-box completion-reason">
          <strong>{t('adminDashboard.completionReason')}:</strong>
          <p>{request.completionReason}</p>
        </div>
      )}

      {request.cancellationReason && (
        <div className="action-reason-box cancellation-reason">
          <strong>{t('adminDashboard.cancellationReason')}:</strong>
          <p>{request.cancellationReason}</p>
        </div>
      )}

      <div className="repair-description">
        <strong>{t('repairForm.description')}:</strong>
        <p>
          {isExpanded ? request.description : truncateText(request.description, 200)}
          {request.description.length > 200 && (
            <button
              onClick={() => onToggleDescription(request.id!)}
              className="btn-expand"
            >
              {isExpanded ? t('adminDashboard.readLess') : t('adminDashboard.readMore')}
            </button>
          )}
        </p>
      </div>

      {showFollowUpActions && request.followUpActions && request.followUpActions.length > 0 && (
        <div className="follow-up-actions">
          <strong>{t('adminDashboard.followUpActions')}</strong>
          <ul>
            {request.followUpActions.map((action, index) => (
              <li key={index}>{action}</li>
            ))}
          </ul>
        </div>
      )}

      {request.imageUrls && request.imageUrls.length > 0 && (
        <div className="repair-images">
          <strong>{t('adminDashboard.images')}</strong>
          <div className="image-grid">
            {request.imageUrls.map((url, index) => (
              <ImageWithLoading
                key={index}
                src={url}
                alt={`Repair ${index + 1}`}
                className="thumbnail"
                onClick={() => onImageClick?.(request, index)}
              />
            ))}
          </div>
        </div>
      )}

      {showAdminActions && (
        <div className="repair-actions">
          {request.status === 'pending' ? (
            <>
              <div className="follow-up-input">
                <input
                  type="text"
                  placeholder={t('adminDashboard.addFollowUpPlaceholder')}
                  value={followUpAction || ''}
                  onChange={(e) => onFollowUpActionChange?.(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      onAddFollowUpAction?.();
                    }
                  }}
                />
                <button
                  onClick={onAddFollowUpAction}
                  className="btn-secondary"
                  disabled={!followUpAction?.trim()}
                >
                  {t('adminDashboard.addAction')}
                </button>
              </div>
              <div className="action-buttons">
                <button
                  onClick={onMarkAsCompleted}
                  className="btn-success"
                >
                  {t('adminDashboard.markAsCompleted')}
                </button>
                <button
                  onClick={onCancelRepair}
                  className="btn-danger"
                >
                  {t('adminDashboard.cancelRequest')}
                </button>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
