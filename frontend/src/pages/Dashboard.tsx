import React, { useEffect, useState } from 'react';
import { Shield, Activity, Users, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import api from '../services/api';

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'up' | 'down';
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, change, changeType }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className="p-2 bg-blue-50 rounded-lg">{icon}</div>
      {change !== undefined && (
        <div className={`flex items-center gap-1 text-sm ${changeType === 'up' ? 'text-green-600' : 'text-red-600'}`}>
          {changeType === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          <span>{Math.abs(change)}%</span>
        </div>
      )}
    </div>
    <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
    <p className="text-gray-600 text-sm mt-1">{title}</p>
  </div>
);

interface Transaction {
  id: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  date: string;
  description: string;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalVolume: 0,
    activeUsers: 0,
    transactionsCount: 0,
    securityAlerts: 0
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Appel à l'API backend
      const [statsRes, transactionsRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/transactions/recent')
      ]);
      
      setStats(statsRes.data);
      setRecentTransactions(transactionsRes.data);
    } catch (err) {
      console.error('Erreur chargement dashboard:', err);
      setError('Impossible de charger les données. Vérifiez que le backend est démarré.');
      // Données de fallback pour le développement
      setStats({
        totalVolume: 1254800,
        activeUsers: 342,
        transactionsCount: 1256,
        securityAlerts: 3
      });
      setRecentTransactions([
        { id: 'TRX-001', amount: 12500, status: 'completed', date: new Date().toISOString(), description: 'Virement bancaire' },
        { id: 'TRX-002', amount: 3500, status: 'completed', date: new Date().toISOString(), description: 'Paiement fournisseur' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Transaction['status']) => {
    const styles = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800'
    };
    const labels = {
      completed: 'Complété',
      pending: 'En attente',
      failed: 'Échoué'
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>{labels[status]}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Shield className="text-white" size={20} />
              </div>
              <h1 className="text-xl font-bold text-gray-900">BankFlow</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">AD</span>
                </div>
                <span className="text-sm text-gray-700">Admin User</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard icon={<DollarSign className="text-blue-600" size={24} />} title="Volume total" value={`${stats.totalVolume.toLocaleString()} €`} change={12.5} changeType="up" />
          <StatCard icon={<Users className="text-green-600" size={24} />} title="Utilisateurs actifs" value={stats.activeUsers} change={5.2} changeType="up" />
          <StatCard icon={<Activity className="text-purple-600" size={24} />} title="Transactions" value={stats.transactionsCount} change={8.1} changeType="up" />
          <StatCard icon={<Shield className="text-yellow-600" size={24} />} title="Alertes sécurité" value={stats.securityAlerts} change={3} changeType="down" />
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Transactions récentes</h2>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">Voir tout →</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{transaction.id.slice(0, 8)}...</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{transaction.description}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{transaction.amount.toLocaleString()} €</td>
                    <td className="px-6 py-4">{getStatusBadge(transaction.status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(transaction.date).toLocaleDateString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;