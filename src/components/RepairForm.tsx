import { useState } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

export default function RepairForm() {
  const [description, setDescription] = useState('');
  const [submitterName, setSubmitterName] = useState('');
  const [submitterEmail, setSubmitterEmail] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
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
    setSuccess(false);

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
        submitterName,
        submitterEmail,
        imageUrls,
        status: 'pending',
        createdAt: Timestamp.now(),
      });

      // Reset form
      setDescription('');
      setSubmitterName('');
      setSubmitterEmail('');
      setImages([]);
      setSuccess(true);
      
      // Clear file input
      const fileInput = document.getElementById('images') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Show success message for 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError('Failed to submit repair request. Please try again.');
      console.error('Submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="repair-form-container">
      <div className="repair-form-card">
        <h2>Submit Repair Request</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Your Name</label>
            <input
              id="name"
              type="text"
              value={submitterName}
              onChange={(e) => setSubmitterName(e.target.value)}
              required
              placeholder="John Doe"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Your Email</label>
            <input
              id="email"
              type="email"
              value={submitterEmail}
              onChange={(e) => setSubmitterEmail(e.target.value)}
              required
              placeholder="john@example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="Describe the issue that needs repair..."
              rows={5}
            />
          </div>

          <div className="form-group">
            <label htmlFor="images">Upload Images (Optional)</label>
            <input
              id="images"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
            />
            {images.length > 0 && (
              <p className="file-info">{images.length} file(s) selected</p>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && (
            <div className="success-message">
              Repair request submitted successfully!
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  );
}
