import React, { useState } from 'react';
import axios from 'axios';

const TicketValidator = () => {
    const [validationResult, setValidationResult] = useState('');
    const [loading, setLoading] = useState(false);
    const [manualInput, setManualInput] = useState({
        primaryKey: '',
        secondaryKey: '', 
        signature: ''
    });

    // ✅ URL API FIXE - Plus d'erreur REACT_APP_API_URL
    const API_URL = "https://projet-bloc3.onrender.com";

    // Validation manuelle
    const handleManualValidate = () => {
        const { primaryKey, secondaryKey, signature } = manualInput;
        if (!primaryKey || !secondaryKey || !signature) {
            alert('Veuillez remplir tous les champs');
            return;
        }
        validateTicketManual(primaryKey, secondaryKey, signature);
    };

    // Appel API pour validation QR Code
    const validateTicketQR = async (qrData) => {
        setLoading(true);
        setValidationResult('');
        
        try {
            const response = await axios.post(
                `${API_URL}/api/secure-tickets/validate`,
                { qrData },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    timeout: 10000
                }
            );

            if (response.data.valid) {
                setValidationResult({
                    type: 'success',
                    message: '✅ ' + response.data.message,
                    details: response.data.ticketNumber ? 
                        `Ticket ${response.data.ticketNumber} - ${response.data.eventTitle}` : 
                        'Ticket validé avec succès'
                });
            } else {
                setValidationResult({
                    type: 'error',
                    message: '❌ ' + response.data.message
                });
            }
        } catch (error) {
            console.error('Erreur validation QR:', error);
            
            if (error.response?.status === 403) {
                setValidationResult({
                    type: 'error',
                    message: '❌ Accès refusé - Admin uniquement'
                });
            } else if (error.response) {
                setValidationResult({
                    type: 'error',
                    message: `❌ ${error.response.data.message || 'Erreur lors de la validation'}`
                });
            } else if (error.request) {
                setValidationResult({
                    type: 'error',
                    message: '❌ Impossible de contacter le serveur'
                });
            } else {
                setValidationResult({
                    type: 'error',
                    message: '❌ Erreur de configuration'
                });
            }
        } finally {
            setLoading(false);
        }
    };

    // Appel API pour validation manuelle
    const validateTicketManual = async (primaryKey, secondaryKey, signature) => {
        setLoading(true);
        setValidationResult('');
        
        try {
            const response = await axios.post(
                `${API_URL}/api/secure-tickets/validate-manual`,
                { primaryKey, secondaryKey, signature },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    timeout: 10000
                }
            );

            if (response.data.valid) {
                setValidationResult({
                    type: 'success',
                    message: '✅ ' + response.data.message,
                    details: response.data.ticketNumber ? 
                        `Ticket ${response.data.ticketNumber} - ${response.data.eventTitle}` : 
                        'Ticket validé avec succès'
                });
            } else {
                setValidationResult({
                    type: 'error',
                    message: '❌ ' + response.data.message
                });
            }
        } catch (error) {
            console.error('Erreur validation manuelle:', error);
            
            if (error.response?.status === 403) {
                setValidationResult({
                    type: 'error',
                    message: '❌ Accès refusé - Admin uniquement'
                });
            } else if (error.response) {
                setValidationResult({
                    type: 'error',
                    message: `❌ ${error.response.data.message || 'Erreur lors de la validation'}`
                });
            } else if (error.request) {
                setValidationResult({
                    type: 'error',
                    message: '❌ Impossible de contacter le serveur'
                });
            } else {
                setValidationResult({
                    type: 'error',
                    message: '❌ Erreur de configuration'
                });
            }
        } finally {
            setLoading(false);
        }
    };

    // Réinitialiser le formulaire
    const resetForm = () => {
        setValidationResult('');
        setManualInput({
            primaryKey: '',
            secondaryKey: '',
            signature: ''
        });
    };

    // Simulation de scan QR (pour test)
    const simulateQRScan = () => {
        const qrData = "abc123def456ghi7|testSignature123";
        validateTicketQR(qrData);
    };

    return (
        <div style={{ 
            padding: '20px', 
            maxWidth: '600px', 
            margin: '0 auto',
            fontFamily: 'Arial, sans-serif',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '10px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            marginTop: '20px',
            marginBottom: '20px'
        }}>
            <h2 style={{ 
                textAlign: 'center', 
                color: '#2c3e50',
                marginBottom: '30px',
                borderBottom: '2px solid #3498db',
                paddingBottom: '10px'
            }}>
                Validation de Tickets
            </h2>

            {/* Section Test QR Code */}
            <div style={{ 
                marginBottom: '20px',
                padding: '15px',
                backgroundColor: '#e8f4fd',
                border: '1px solid #3498db',
                borderRadius: '6px'
            }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>Test Rapide QR Code</h4>
                <button
                    onClick={simulateQRScan}
                    disabled={loading}
                    style={{
                        padding: '10px 15px',
                        backgroundColor: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {loading ? 'Test en cours...' : '🧪 Tester QR Code'}
                </button>
            </div>

            {/* Validation manuelle */}
            <div style={{
                marginBottom: '20px'
            }}>
                <h3 style={{ 
                    color: '#34495e', 
                    marginBottom: '20px',
                    textAlign: 'center'
                }}>
                    Validation Manuelle
                </h3>
                
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ 
                        display: 'block', 
                        marginBottom: '8px', 
                        fontWeight: 'bold',
                        color: '#2c3e50'
                    }}>
                        Clé Primaire:
                    </label>
                    <input
                        type="text"
                        value={manualInput.primaryKey}
                        onChange={(e) => setManualInput({
                            ...manualInput,
                            primaryKey: e.target.value
                        })}
                        placeholder="Entrez la clé primaire (16 caractères)"
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid #bdc3c7',
                            borderRadius: '6px',
                            fontSize: '16px',
                            backgroundColor: '#fff'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ 
                        display: 'block', 
                        marginBottom: '8px', 
                        fontWeight: 'bold',
                        color: '#2c3e50'
                    }}>
                        Clé Secondaire:
                    </label>
                    <input
                        type="text"
                        value={manualInput.secondaryKey}
                        onChange={(e) => setManualInput({
                            ...manualInput,
                            secondaryKey: e.target.value
                        })}
                        placeholder="Entrez la clé secondaire (16 caractères)"
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid #bdc3c7',
                            borderRadius: '6px',
                            fontSize: '16px',
                            backgroundColor: '#fff'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '25px' }}>
                    <label style={{ 
                        display: 'block', 
                        marginBottom: '8px', 
                        fontWeight: 'bold',
                        color: '#2c3e50'
                    }}>
                        Signature:
                    </label>
                    <textarea
                        value={manualInput.signature}
                        onChange={(e) => setManualInput({
                            ...manualInput,
                            signature: e.target.value
                        })}
                        placeholder="Entrez la signature HMAC"
                        rows="3"
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid #bdc3c7',
                            borderRadius: '6px',
                            fontSize: '16px',
                            resize: 'vertical',
                            backgroundColor: '#fff',
                            fontFamily: 'monospace'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    <button
                        onClick={handleManualValidate}
                        disabled={loading}
                        style={{
                            flex: 1,
                            padding: '14px',
                            backgroundColor: loading ? '#95a5a6' : '#27ae60',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            minWidth: '150px'
                        }}
                    >
                        {loading ? 'Validation...' : '✅ Valider Manuellement'}
                    </button>
                    
                    <button
                        onClick={resetForm}
                        style={{
                            padding: '14px 24px',
                            backgroundColor: '#95a5a6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            minWidth: '100px'
                        }}
                    >
                        🔄 Reset
                    </button>
                </div>
            </div>

            {/* Résultat de validation */}
            {validationResult && (
                <div style={{ 
                    marginTop: '25px',
                    padding: '20px',
                    backgroundColor: validationResult.type === 'success' ? 
                        'rgba(212, 237, 218, 0.9)' : 'rgba(248, 215, 218, 0.9)',
                    color: validationResult.type === 'success' ? '#155724' : '#721c24',
                    border: `2px solid ${validationResult.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
                    borderRadius: '8px',
                    textAlign: 'center'
                }}>
                    <div style={{ 
                        fontWeight: 'bold', 
                        fontSize: '18px',
                        marginBottom: validationResult.details ? '12px' : '0'
                    }}>
                        {validationResult.message}
                    </div>
                    {validationResult.details && (
                        <div style={{ 
                            fontSize: '14px', 
                            opacity: 0.9,
                            fontStyle: 'italic'
                        }}>
                            {validationResult.details}
                        </div>
                    )}
                </div>
            )}

            {/* Instructions */}
            <div style={{ 
                marginTop: '30px',
                padding: '20px',
                backgroundColor: 'rgba(232, 244, 253, 0.8)',
                border: '2px solid #3498db',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#004085'
            }}>
                <h4 style={{ 
                    margin: '0 0 15px 0',
                    color: '#2c3e50',
                    borderBottom: '1px solid #3498db',
                    paddingBottom: '8px'
                }}>
                    📋 Instructions:
                </h4>
                <ul style={{ 
                    margin: 0, 
                    paddingLeft: '20px',
                    lineHeight: '1.6'
                }}>
                    <li><strong>Validation QR</strong>: Utilisez le bouton test ou scannez un vrai QR</li>
                    <li><strong>Validation manuelle</strong>: Remplissez les 3 champs de sécurité</li>
                    <li>Format QR: <code>primaryKey|signature</code></li>
                    <li>Le ticket sera <strong>marqué comme utilisé</strong> après validation</li>
                </ul>
            </div>

            {/* Information API */}
            <div style={{ 
                marginTop: '20px',
                padding: '15px',
                backgroundColor: 'rgba(245, 245, 245, 0.8)',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#666',
                textAlign: 'center'
            }}>
                Endpoints: 
                <code>/api/secure-tickets/validate</code> (QR) | 
                <code>/api/secure-tickets/validate-manual</code> (Manuel)
            </div>
        </div>
    );
};

export default TicketValidator;