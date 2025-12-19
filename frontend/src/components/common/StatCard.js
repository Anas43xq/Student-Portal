import React from 'react';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="col-md-6 col-lg-3 mb-4">
    <div className={`stat-card bg-${color} text-white`}>
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h6 className="text-black-50 mb-1">{title}</h6>
          <h2 className="mb-0">{value}</h2>
        </div>
        <Icon size={48} className="opacity-50" />
      </div>
    </div>
  </div>
);

export default StatCard;
