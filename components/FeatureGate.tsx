import React from 'react';
import { Link } from 'react-router-dom';
import { useSubscription } from '../hooks/useSubscription';

interface FeatureGateProps {
  feature: 'view_contact' | 'view_viewers' | 'unlimited_interests';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const FeatureGate: React.FC<FeatureGateProps> = ({ feature, children, fallback }) => {
  const { canUse, loading, plan } = useSubscription();

  if (loading) return null;

  if (canUse(feature)) {
    return <>{children}</>;
  }

  if (fallback) return <>{fallback}</>;

  const requiredPlan = feature === 'view_viewers' ? 'Platinum' : 'Gold';

  return (
    <div className="p-6 bg-rose-50 border border-rose-100 rounded-2xl text-center space-y-4">
      <div className="text-3xl">🔒</div>
      <div>
        <h4 className="font-bold text-gray-900">Unlock this Feature</h4>
        <p className="text-sm text-gray-600">This action requires a {requiredPlan} membership.</p>
      </div>
      <Link 
        to="/pricing" 
        className="inline-block bg-brand text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-rose-700 transition"
      >
        Upgrade to {requiredPlan}
      </Link>
    </div>
  );
};

export default FeatureGate;
