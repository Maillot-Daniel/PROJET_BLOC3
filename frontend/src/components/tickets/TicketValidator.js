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

    // Validation manuelle
    const handleManualValidate = () => {
        const { primaryKey, secondaryKey, signature } = manualInput;
        if (!primaryKey || !secondaryKey || !signature) {
            alert('Veuillez remplir tous les champs');
            return;
        }
        validateTicket(primaryKey, secondaryKey, signature);
    };

    // Appel API de validation
    const validateTicket = async (primaryKey, secondaryKey, signature) => {
        setLoading(true);
        setValidationResult('');
        
        try {
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/api/secure-tickets/validate`,
                { 
                    primaryKey, 
                    secondaryKey, 
                    signature 
                },
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
                    message: '✅ Ticket validé avec succès',
                    details: response.data.ticketNumber ? 
                        `Ticket ${response.data.ticketNumber} - ${response.data.eventTitle}` : 
                        'Ticket marqué comme utilisé'
                });
            } else {
                setValidationResult({
                    type: 'error', 
                    message: '❌ ' + (response.data.message || 'Ticket invalide')
                });
            }
        } catch (error) {
            console.error('Erreur validation:', error);
            
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

            {/* Validation manuelle */}
            <div style={{
                marginBottom: '20px'
            }}>
                <h3 style={{ 
                    color: '#34495e', 
                    marginBottom: '20px',
                    textAlign: 'center'
                }}>
                    Validation par Clés de Sécurité
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
                        {loading ? 'Validation en cours...' : '✅ Valider le Ticket'}
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
                    📋 Instructions de Validation:
                </h4>
                <ul style={{ 
                    margin: 0, 
                    paddingLeft: '20px',
                    lineHeight: '1.6'
                }}>
                    <li>Obtenez les clés de sécurité depuis le QR code du ticket</li>
                    <li>La clé primaire et secondaire font 16 caractères chacune</li>
                    <li>La signature est une chaîne encodée en Base64</li>
                    <li>Le ticket sera <strong>marqué comme utilisé</strong> après validation</li>
                    <li>Un ticket ne peut être validé qu'<strong>une seule fois</strong></li>
                    <li>Seuls les administrateurs peuvent valider les tickets</li>
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
                Endpoint: <code>/api/secure-tickets/validate</code> | 
                Méthode: <code>POST</code> | 
                Role requis: <code>ADMIN</code>
            </div>
        </div>
    );
};

export default TicketValidator;