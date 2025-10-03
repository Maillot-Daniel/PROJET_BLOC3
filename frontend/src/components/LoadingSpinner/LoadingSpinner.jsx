import './LoadingSpinner.css';

const LoadingSpinner = ({ message }) => (
  <div className="spinner-container">
    <div className="spinner"></div>
    {message && <p>{message}</p>}
  </div>
);

export default LoadingSpinner;