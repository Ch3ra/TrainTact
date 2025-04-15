import React from 'react';
import './TrainerCard.css';

const TrainerCard = ({ trainer }) => {
  return (
    <div className="trainer-card">
      <div className="trainer-avatar">
        {/* Placeholder for trainer image */}
        <div className="avatar-placeholder">{trainer.name.charAt(0)}</div>
      </div>
      <div className="trainer-info">
        <h3>{trainer.name}</h3>
        <p><strong>Specialization:</strong> {trainer.specialization}</p>
        <p><strong>Experience:</strong> {trainer.experience}</p>
        <p><strong>Approach:</strong> {trainer.approach}</p>
      </div>
    </div>
  );
};

export default TrainerCard;