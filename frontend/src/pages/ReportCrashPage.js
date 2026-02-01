import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportAPI } from '../services/api';
import './ReportCrashPage.css';

const ReportCrashPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form data
  const [location, setLocation] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [verificationMethod, setVerificationMethod] = useState('national_id');
  const [nationalId, setNationalId] = useState('');
  const [vehiclesInvolved, setVehiclesInvolved] = useState(1);
  const [estimatedInjured, setEstimatedInjured] = useState(0);
  const [description, setDescription] = useState('');
  const [reportResult, setReportResult] = useState(null);
  
  // Face capture states
  const [faceImage, setFaceImage] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Get GPS location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
          setLoading(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setError('Please enable location services to report a crash');
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setError('Geolocation is not supported by your browser');
    }
  }, []);

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + photos.length > 5) {
      setError('Maximum 5 photos allowed');
      return;
    }
    setPhotos([...photos, ...files]);
    setError('');
  };

  const removePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  // Face capture functions
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setShowCamera(true);
      setError('');
    } catch (err) {
      console.error('Camera error:', err);
      setError('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        const file = new File([blob], `face_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setFaceImage(file);
        stopCamera();
      }, 'image/jpeg', 0.9);
    }
  };

  const retakeFacePhoto = () => {
    setFaceImage(null);
    startCamera();
  };

  const removeFacePhoto = () => {
    setFaceImage(null);
  };

  // Cleanup camera on unmount or when verification method changes
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  useEffect(() => {
    if (verificationMethod !== 'face_id') {
      stopCamera();
      setFaceImage(null);
    }
  }, [verificationMethod]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!location) {
      setError('Location is required');
      return;
    }
    
    if (photos.length === 0) {
      setError('At least one photo is required');
      return;
    }
    
    if (verificationMethod === 'national_id' && !nationalId) {
      setError('National ID is required');
      return;
    }

    if (verificationMethod === 'face_id' && !faceImage) {
      setError('Face photo is required for Face ID verification');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Convert photos to base64
      const photoPromises = photos.map(photo => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({
              filename: photo.name,
              data: reader.result.split(',')[1] // Get base64 data without prefix
            });
          };
          reader.readAsDataURL(photo);
        });
      });
      
      const photosBase64 = await Promise.all(photoPromises);

      // Convert face image to base64 if using face_id
      let faceImageBase64 = null;
      if (verificationMethod === 'face_id' && faceImage) {
        faceImageBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({
              filename: faceImage.name,
              data: reader.result.split(',')[1]
            });
          };
          reader.readAsDataURL(faceImage);
        });
      }
      
      // Create JSON payload
      const payload = {
        location: {
          coordinates: location
        },
        verification: {
          method: verificationMethod,
          nationalId: verificationMethod === 'national_id' ? nationalId : undefined,
          faceImage: verificationMethod === 'face_id' ? faceImageBase64 : undefined
        },
        photos: photosBase64,
        vehiclesInvolved: vehiclesInvolved,
        estimatedInjured: estimatedInjured,
        description: description
      };
      
      const response = await reportAPI.create(payload);
      
      if (response.data.success) {
        setReportResult(response.data);
        setStep(4); // Show success screen
      }
      
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.response?.data?.error || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="step-indicator">
      <div className={`step ${step >= 1 ? 'active' : ''}`}>1. Location</div>
      <div className={`step ${step >= 2 ? 'active' : ''}`}>2. Photos</div>
      <div className={`step ${step >= 3 ? 'active' : ''}`}>3. Details</div>
    </div>
  );

  if (reportResult) {
    return (
      <div className="report-crash-page">
        <div className="success-container">
          <div className="success-icon">✅</div>
          <h1>Report Submitted Successfully!</h1>
          <div className="report-details">
            <p><strong>Report ID:</strong> {reportResult.reportNumber}</p>
            <p><strong>Status:</strong> Help is on the way</p>
            <p><strong>Estimated Response Time:</strong> {reportResult.estimatedResponseTime}</p>
          </div>
          <p className="success-message">
            An ambulance has been automatically dispatched to your location.
            Emergency services are on their way.
          </p>
          <button 
            className="btn-primary"
            onClick={() => navigate('/')}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="report-crash-page">
      <div className="report-container">
        <div className="report-header">
          <h1>🚨 Report Car Crash</h1>
          <p>Emergency Response System</p>
        </div>

        {renderStepIndicator()}

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="report-form">
          {/* Step 1: Location */}
          {step === 1 && (
            <div className="form-step">
              <h2>📍 Location Information</h2>
              {loading ? (
                <div className="loading">Getting your location...</div>
              ) : location ? (
                <div className="location-info">
                  <p>✅ Location captured successfully</p>
                  <p className="coordinates">
                    Latitude: {location.lat.toFixed(6)}<br />
                    Longitude: {location.lng.toFixed(6)}<br />
                    Accuracy: ±{Math.round(location.accuracy)}m
                  </p>
                </div>
              ) : (
                <div className="error-message">
                  Unable to get location. Please enable GPS.
                </div>
              )}
              
              <button 
                type="button"
                className="btn-primary"
                onClick={() => setStep(2)}
                disabled={!location}
              >
                Next: Add Photos →
              </button>
            </div>
          )}

          {/* Step 2: Photos */}
          {step === 2 && (
            <div className="form-step">
              <h2>📸 Crash Photos</h2>
              <p>Take 1-5 photos of the crash scene</p>
              
              <div className="photo-upload">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  onChange={handlePhotoChange}
                  id="photo-input"
                  className="photo-input"
                />
                <label htmlFor="photo-input" className="photo-label">
                  📷 Take/Upload Photos
                </label>
              </div>

              <div className="photo-preview">
                {photos.map((photo, index) => (
                  <div key={index} className="photo-item">
                    <img 
                      src={URL.createObjectURL(photo)} 
                      alt={`Crash ${index + 1}`}
                    />
                    <button 
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="btn-remove"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <p className="photo-count">{photos.length}/5 photos</p>

              <div className="button-group">
                <button 
                  type="button"
                  className="btn-secondary"
                  onClick={() => setStep(1)}
                >
                  ← Back
                </button>
                <button 
                  type="button"
                  className="btn-primary"
                  onClick={() => setStep(3)}
                  disabled={photos.length === 0}
                >
                  Next: Add Details →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {step === 3 && (
            <div className="form-step">
              <h2>📝 Crash Details</h2>
              
              <div className="form-group">
                <label>Verification Method</label>
                <div className="radio-group">
                  <label>
                    <input
                      type="radio"
                      value="national_id"
                      checked={verificationMethod === 'national_id'}
                      onChange={(e) => setVerificationMethod(e.target.value)}
                    />
                    National ID
                  </label>
                  <label>
                    <input
                      type="radio"
                      value="face_id"
                      checked={verificationMethod === 'face_id'}
                      onChange={(e) => setVerificationMethod(e.target.value)}
                    />
                    Face ID
                  </label>
                </div>
              </div>

              {verificationMethod === 'national_id' && (
                <div className="form-group">
                  <label>National ID Number *</label>
                  <input
                    type="text"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    placeholder="Enter your National ID"
                    required
                  />
                </div>
              )}

              {verificationMethod === 'face_id' && (
                <div className="form-group">
                  <label>Face Verification *</label>
                  <p className="helper-text">Take a photo of your face for verification</p>
                  
                  {!faceImage && !showCamera && (
                    <button 
                      type="button"
                      className="btn-camera"
                      onClick={startCamera}
                    >
                      📷 Start Camera
                    </button>
                  )}

                  {showCamera && (
                    <div className="camera-container">
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline
                        className="camera-video"
                      />
                      <div className="camera-controls">
                        <button 
                          type="button"
                          className="btn-capture"
                          onClick={capturePhoto}
                        >
                          📸 Capture
                        </button>
                        <button 
                          type="button"
                          className="btn-secondary"
                          onClick={stopCamera}
                        >
                          Cancel
                        </button>
                      </div>
                      <canvas ref={canvasRef} style={{ display: 'none' }} />
                    </div>
                  )}

                  {faceImage && (
                    <div className="face-preview">
                      <img 
                        src={URL.createObjectURL(faceImage)} 
                        alt="Face verification"
                        className="face-image"
                      />
                      <div className="face-controls">
                        <button 
                          type="button"
                          className="btn-secondary"
                          onClick={retakeFacePhoto}
                        >
                          🔄 Retake
                        </button>
                        <button 
                          type="button"
                          className="btn-remove"
                          onClick={removeFacePhoto}
                        >
                          ✕ Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="form-group">
                <label>Vehicles Involved</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={vehiclesInvolved}
                  onChange={(e) => setVehiclesInvolved(parseInt(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label>Estimated Injured</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={estimatedInjured}
                  onChange={(e) => setEstimatedInjured(parseInt(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the crash..."
                  maxLength="500"
                  rows="4"
                />
                <small>{description.length}/500 characters</small>
              </div>

              <div className="button-group">
                <button 
                  type="button"
                  className="btn-secondary"
                  onClick={() => setStep(2)}
                >
                  ← Back
                </button>
                <button 
                  type="submit"
                  className="btn-primary btn-submit"
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : '🚑 Submit Report'}
                </button>
              </div>
            </div>
          )}
        </form>

        <button 
          className="btn-cancel"
          onClick={() => navigate('/')}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ReportCrashPage;
