import React, { useState } from "react";
import UsersService from "../services/UsersService";
import { useNavigate } from "react-router-dom";


function RegistrationPage() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
  name: '',
  email: '',
  password: '',
  city: '',
  role: 'USER'
});

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    await UsersService.register(formData);

    setFormData({
      name: '',
      email: '',
      password: '',
      city: '',
      role: 'USER'
    });
    alert('User registered successfully');
    navigate('/admin/user-management');
  } catch (error) {
    console.error('Error registering user', error);
    alert('An error occurred while registering user');
  }
};

    return (
        <div className="auth-container">
            <h2>Registration</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Name:</label>
                    <input 
                        type="text" 
                        name="name" 
                        value={formData.name} 
                        onChange={handleInputChange} 
                        required 
                    />
                </div>
                <div className="form-group">
                    <label>Email:</label>
                    <input 
                        type="email" 
                        name="email" 
                        value={formData.email} 
                        onChange={handleInputChange} 
                        required 
                    />
                </div>
                <div className="form-group">
                    <label>Password:</label>
                    <input 
                        type="password" 
                        name="password" 
                        value={formData.password} 
                        onChange={handleInputChange} 
                        required 
                    />
                </div>
               
                <div className="form-group">
                    <label>City:</label>
                    <input 
                        type="text" 
                        name="city" 
                        value={formData.city} 
                        onChange={handleInputChange} 
                        required 
                    />
                </div>
                <button type="submit">Register</button>
            </form>
        </div>
    );
}

export default RegistrationPage;