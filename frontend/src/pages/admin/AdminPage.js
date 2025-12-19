import React, { useState } from 'react';
import OverviewTab from '../../components/admin/OverviewTab';
import UsersTab from '../../components/admin/UsersTab';
import SettingsTab from '../../components/admin/SettingsTab';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <main>
      <header>
        <h2 className="mb-4">Admin Panel</h2>
      </header>

      <nav>
        <ul className="nav nav-tabs mb-4" role="tablist">
          <li className="nav-item" role="presentation">
            <button 
              className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`} 
              onClick={() => setActiveTab('overview')}
              role="tab"
              aria-selected={activeTab === 'overview'}
            >
              Overview
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button 
              className={`nav-link ${activeTab === 'users' ? 'active' : ''}`} 
              onClick={() => setActiveTab('users')}
              role="tab"
              aria-selected={activeTab === 'users'}
            >
              User Management
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button 
              className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`} 
              onClick={() => setActiveTab('settings')}
              role="tab"
              aria-selected={activeTab === 'settings'}
            >
              System Settings
            </button>
          </li>
        </ul>
      </nav>

      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'users' && <UsersTab />}
      {activeTab === 'settings' && <SettingsTab />}
    </main>
  );
};

export default AdminPage;
