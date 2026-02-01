import React, { useState } from 'react';
import { UserRole } from '../types';

// Mock data for UI development as backend connection requires deployment
const MOCK_PAYMENTS = [
    { id: '1', user_name: 'Rahul Sharma', plan: 'VIP', upi_txn_id: '123456789', status: 'PENDING', screenshot_url: 'https://picsum.photos/200/300' }
];

export const AdminDashboard: React.FC = () => {
  const [payments, setPayments] = useState(MOCK_PAYMENTS);

  const handleAction = (id: string, action: 'APPROVE' | 'REJECT') => {
      // API call would go here
      alert(`Payment ${action}D for ${id}`);
      setPayments(payments.filter(p => p.id !== id));
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Pending Approvals</h3>
        </div>
        <ul className="divide-y divide-gray-200">
            {payments.map(payment => (
                <li key={payment.id} className="p-4 sm:px-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-saffron-600">{payment.user_name}</p>
                            <p className="text-sm text-gray-500">Plan: {payment.plan} | Txn: {payment.upi_txn_id}</p>
                        </div>
                        <div className="flex space-x-2">
                            <a href={payment.screenshot_url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">View Proof</a>
                            <button onClick={() => handleAction(payment.id, 'APPROVE')} className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700">Approve</button>
                            <button onClick={() => handleAction(payment.id, 'REJECT')} className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700">Reject</button>
                        </div>
                    </div>
                </li>
            ))}
            {payments.length === 0 && <li className="p-4 text-center text-gray-500">No pending payments.</li>}
        </ul>
      </div>
    </div>
  );
};