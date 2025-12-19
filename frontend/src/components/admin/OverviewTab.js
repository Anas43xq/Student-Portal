import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';

const OverviewTab = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    activeEnrollments: 0,
    averageGpa: 0
  });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchActivities();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const data = await adminAPI.getActivities(10);
      setActivities(data.activities || []);
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return time.toLocaleDateString();
  };

  const getActivityMessage = (activity) => {
    if (activity.type === 'enrollment') {
      return `${activity.studentName} enrolled in ${activity.courseCode} - ${activity.courseName}`;
    } else if (activity.type === 'student') {
      return `New student registration: ${activity.studentName} (${activity.email})`;
    }
    return 'Unknown activity';
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <section>
      <div className="row">
        <article className="col-md-3 mb-4">
          <div className="card text-white bg-primary">
            <div className="card-body">
              <h3 className="card-title h5">Total Students</h3>
              <p className="display-4">{stats.totalStudents}</p>
              <p className="mb-0">Active students</p>
            </div>
          </div>
        </article>
        <article className="col-md-3 mb-4">
          <div className="card text-white bg-success">
            <div className="card-body">
              <h3 className="card-title h5">Total Courses</h3>
              <p className="display-4">{stats.totalCourses}</p>
              <p className="mb-0">Available courses</p>
            </div>
          </div>
        </article>
        <article className="col-md-3 mb-4">
          <div className="card text-white bg-warning">
            <div className="card-body">
              <h3 className="card-title h5">Active Enrollments</h3>
              <p className="display-4">{stats.activeEnrollments}</p>
              <p className="mb-0">Current semester</p>
            </div>
          </div>
        </article>
        <article className="col-md-3 mb-4">
          <div className="card text-white bg-info">
            <div className="card-body">
              <h3 className="card-title h5">Average GPA</h3>
              <p className="display-4">{stats.averageGpa}</p>
              <p className="mb-0">System-wide</p>
            </div>
          </div>
        </article>
      </div>

      <article className="card">
        <header className="card-header">
          <h3 className="h5 mb-0">Recent Activity</h3>
        </header>
        <div className="card-body">
          {activities.length > 0 ? (
            <ul className="list-group list-group-flush">
              {activities.map((activity, index) => (
                <li key={`${activity.type}-${activity.id}-${index}`} className="list-group-item">
                  <div className="d-flex justify-content-between align-items-center">
                    <span>
                      {activity.type === 'enrollment' && (
                        <span className="badge bg-success me-2">Enrollment</span>
                      )}
                      {activity.type === 'student' && (
                        <span className="badge bg-primary me-2">New Student</span>
                      )}
                      {getActivityMessage(activity)}
                    </span>
                    <time className="text-muted" dateTime={activity.timestamp}>
                      {formatTimeAgo(activity.timestamp)}
                    </time>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted text-center py-4">No recent activities</p>
          )}
        </div>
      </article>
    </section>
  );
};

export default OverviewTab;
