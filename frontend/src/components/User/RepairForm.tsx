import { useState } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { useLanguage } from '../../contexts/LanguageContext';
import { PortalUser } from '../../types';
import { Loader2 } from 'lucide-react';

interface RepairFormProps {
  user: PortalUser;
  onSuccess: (orderNumber: string) => void;
  onCancel?: () => void;
}

export default function RepairForm({ user, onSuccess, onCancel }: RepairFormProps) {
  const { t } = useLanguage();
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setImages(filesArray);
    }
  };

  const generateOrderNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `RP-${timestamp}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Upload images (only if provided)
      const imageUrls: string[] = [];
      if (images.length > 0) {
        for (const image of images) {
          const imageRef = ref(storage, `repairs/${Date.now()}-${image.name}`);
          await uploadBytes(imageRef, image);
          const url = await getDownloadURL(imageRef);
          imageUrls.push(url);
        }
      }

      // Create repair request
      const orderNumber = generateOrderNumber();
      await addDoc(collection(db, 'repairs'), {
        orderNumber,
        description,
        submitterName: user.username,
        submitterEmail: user.email,
        submitterUid: user.uid,
        location,
        imageUrls,
        status: 'pending',
        createdAt: Timestamp.now(),
      });

      // Call success callback with order number
      onSuccess(orderNumber);
    } catch (err) {
      setError(t('repairForm.errorMessage'));
      console.error('Submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="repair-form-container">
      {loading && (
        <div className="loading-overlay">
          <Loader2 size={48} className="spinner" />
          <p>{t('repairForm.submitting')}</p>
        </div>
      )}
      <h2>{t('repairForm.title')}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="location">{t('repairForm.location')}</label>
          <input
            id="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            placeholder={t('repairForm.locationPlaceholder')}
            autoComplete="off"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">{t('repairForm.description')}</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            placeholder={t('repairForm.descriptionPlaceholder')}
            rows={5}
          />
        </div>

        <div className="form-group">
          <label htmlFor="images">{t('repairForm.uploadImages')} ({t('repairForm.optional')})</label>
          <input
            id="images"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
          />
          {images.length > 0 && (
            <p className="file-info">{images.length} {t('repairForm.filesSelected')}</p>
          )}
        </div>
        {error && <div className="error-message">{error}</div>}

        <div className="modal-actions">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? t('repairForm.submitting') : t('repairForm.submitRequest')}
          </button>
        </div>
      </form>
    </div>
  );
}
