import React from 'react';

const Pricing = () => {
  return (
    <div className="pricing-container">
      <div className="pricing-header">
        <h1>Pricing Plans</h1>
        <p>Choose the plan that fits your needs</p>
      </div>
      
      <div className="pricing-grid">
        <div className="pricing-card">
          <div className="pricing-card-header">
            <h2>Free</h2>
            <p className="price">$0<span>/month</span></p>
          </div>
          <div className="pricing-card-body">
            <ul className="features-list">
              <li>Basic resume builder</li>
              <li>1 resume template</li>
              <li>Limited ATS analysis</li>
              <li>Export as PDF</li>
            </ul>
          </div>
          <div className="pricing-card-footer">
            <button className="btn btn-outline">Current Plan</button>
          </div>
        </div>
        
        <div className="pricing-card highlight">
          <div className="pricing-card-header">
            <h2>Premium</h2>
            <p className="price">$9.99<span>/month</span></p>
          </div>
          <div className="pricing-card-body">
            <ul className="features-list">
              <li>Advanced resume builder</li>
              <li>All resume templates</li>
              <li>Full ATS analysis</li>
              <li>AI content suggestions</li>
              <li>Cover letter generator</li>
              <li>Resume & cover letter export</li>
            </ul>
          </div>
          <div className="pricing-card-footer">
            <button className="btn btn-primary">Upgrade Now</button>
          </div>
        </div>
        
        <div className="pricing-card">
          <div className="pricing-card-header">
            <h2>Enterprise</h2>
            <p className="price">$29.99<span>/month</span></p>
          </div>
          <div className="pricing-card-body">
            <ul className="features-list">
              <li>All Premium features</li>
              <li>Multiple resume profiles</li>
              <li>Team collaboration</li>
              <li>Custom templates</li>
              <li>Advanced analytics</li>
              <li>Priority support</li>
            </ul>
          </div>
          <div className="pricing-card-footer">
            <button className="btn btn-outline">Contact Sales</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
