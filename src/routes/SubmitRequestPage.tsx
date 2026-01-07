import RepairForm from '../components/RepairForm';
import SubmissionSuccess from '../components/SubmissionSuccess';
import { PortalUser } from '../types';
import { useState } from 'react';

interface SubmitRequestPageProps {
  user: PortalUser;
}

export default function SubmitRequestPage({ user }: SubmitRequestPageProps) {
  const [submittedOrderNumber, setSubmittedOrderNumber] = useState<string | null>(null);

  const handleSubmissionSuccess = (orderNumber: string) => {
    setSubmittedOrderNumber(orderNumber);
  };

  const handleSubmitAnother = () => {
    setSubmittedOrderNumber(null);
  };

  if (submittedOrderNumber) {
    return (
      <SubmissionSuccess
        orderNumber={submittedOrderNumber}
        onSubmitAnother={handleSubmitAnother}
      />
    );
  }

  return <RepairForm user={user} onSuccess={handleSubmissionSuccess} />;
}
