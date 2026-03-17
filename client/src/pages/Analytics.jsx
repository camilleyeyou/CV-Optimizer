import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { useResume } from '../context/ResumeContext';
import { BarChart3, TrendingUp, Target, Award, Loader } from 'lucide-react';
import './Analytics.css';

const Analytics = () => {
  const { user } = useAuth();
  const { resumes } = useResume();
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchScores = useCallback(async () => {
    const { data, error } = await supabase
      .from('resume_scores')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (!error) setScores(data || []);
    setLoading(false);
  }, [user.id]);

  useEffect(() => { fetchScores(); }, [fetchScores]);

  // Compute analytics
  const totalScans = scores.length;
  const latestScores = scores.slice(-10);
  const avgScore = totalScans > 0
    ? Math.round(scores.reduce((s, sc) => s + sc.score, 0) / totalScans)
    : null;
  const bestScore = totalScans > 0 ? Math.max(...scores.map((s) => s.score)) : null;

  // Score trend (last 5 vs previous 5)
  const recent5 = scores.slice(-5);
  const prev5 = scores.slice(-10, -5);
  const recentAvg = recent5.length > 0 ? recent5.reduce((s, sc) => s + sc.score, 0) / recent5.length : 0;
  const prevAvg = prev5.length > 0 ? prev5.reduce((s, sc) => s + sc.score, 0) / prev5.length : 0;
  const trend = prev5.length > 0 ? Math.round(recentAvg - prevAvg) : null;

  // Missing keywords frequency
  const keywordFreq = {};
  scores.forEach((s) => {
    (s.missing_keywords || []).forEach((kw) => {
      keywordFreq[kw] = (keywordFreq[kw] || 0) + 1;
    });
  });
  const topMissing = Object.entries(keywordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Per-resume stats
  const resumeStats = {};
  scores.forEach((s) => {
    if (!resumeStats[s.resume_id]) {
      resumeStats[s.resume_id] = { scores: [], latest: s.score };
    }
    resumeStats[s.resume_id].scores.push(s.score);
    resumeStats[s.resume_id].latest = s.score;
  });

  const maxBarScore = latestScores.length > 0 ? Math.max(...latestScores.map((s) => s.score)) : 100;

  if (loading) {
    return (
      <div className="analytics-loading">
        <Loader size={24} className="spin" />
        <span>Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="analytics">
      <div className="analytics-header">
        <h1><BarChart3 size={24} /> Resume Analytics</h1>
        <p className="analytics-subtitle">Track your ATS score improvements over time.</p>
      </div>

      {totalScans === 0 ? (
        <div className="analytics-empty">
          <BarChart3 size={48} strokeWidth={1} />
          <h3>No data yet</h3>
          <p>Use the ATS Score widget in the Builder to start tracking your scores.</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="analytics-kpis">
            <div className="kpi-card">
              <div className="kpi-icon"><Target size={20} /></div>
              <div className="kpi-value">{avgScore}</div>
              <div className="kpi-label">Avg Score</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon"><Award size={20} /></div>
              <div className="kpi-value">{bestScore}</div>
              <div className="kpi-label">Best Score</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon"><BarChart3 size={20} /></div>
              <div className="kpi-value">{totalScans}</div>
              <div className="kpi-label">Total Scans</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon"><TrendingUp size={20} /></div>
              <div className={`kpi-value ${trend > 0 ? 'positive' : trend < 0 ? 'negative' : ''}`}>
                {trend !== null ? `${trend > 0 ? '+' : ''}${trend}` : '—'}
              </div>
              <div className="kpi-label">Trend</div>
            </div>
          </div>

          {/* Score History Chart (CSS bar chart) */}
          <div className="analytics-section">
            <h2>Score History</h2>
            <div className="analytics-chart">
              {latestScores.map((s, i) => (
                <div key={s.id} className="chart-bar-wrapper">
                  <div className="chart-bar-label">{s.score}</div>
                  <div
                    className="chart-bar"
                    style={{
                      height: `${(s.score / (maxBarScore || 100)) * 100}%`,
                      background: s.score >= 80 ? 'var(--success)' : s.score >= 60 ? 'var(--warning)' : 'var(--error)',
                    }}
                  />
                  <div className="chart-bar-date">
                    {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
            {scores.length > 10 && (
              <p className="analytics-chart-note">Showing last 10 scans</p>
            )}
          </div>

          {/* Two-column: Missing Keywords + Per-Resume */}
          <div className="analytics-grid">
            {/* Top Missing Keywords */}
            {topMissing.length > 0 && (
              <div className="analytics-section">
                <h2>Most Missed Keywords</h2>
                <p className="analytics-section-desc">Keywords that appeared most often across your ATS scans.</p>
                <div className="keyword-list">
                  {topMissing.map(([kw, count]) => (
                    <div key={kw} className="keyword-item">
                      <span className="keyword-name">{kw}</span>
                      <div className="keyword-bar-track">
                        <div
                          className="keyword-bar-fill"
                          style={{ width: `${(count / topMissing[0][1]) * 100}%` }}
                        />
                      </div>
                      <span className="keyword-count">{count}x</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Per-Resume Breakdown */}
            {Object.keys(resumeStats).length > 0 && (
              <div className="analytics-section">
                <h2>By Resume</h2>
                <p className="analytics-section-desc">Score breakdown per resume version.</p>
                <div className="resume-stats-list">
                  {Object.entries(resumeStats).map(([resumeId, stats]) => {
                    const resume = resumes.find((r) => r.id === resumeId);
                    const name = resume
                      ? (resume.title || `${resume.personal_info?.first_name || 'Untitled'}'s Resume`)
                      : 'Deleted Resume';
                    const avg = Math.round(stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length);
                    return (
                      <div key={resumeId} className="resume-stat-item">
                        <div className="resume-stat-info">
                          <span className="resume-stat-name">{name}</span>
                          <span className="resume-stat-scans">{stats.scores.length} scan{stats.scores.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="resume-stat-score-track">
                          <div
                            className="resume-stat-score-fill"
                            style={{
                              width: `${avg}%`,
                              background: avg >= 80 ? 'var(--success)' : avg >= 60 ? 'var(--warning)' : 'var(--error)',
                            }}
                          />
                        </div>
                        <span className="resume-stat-avg">{avg}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
