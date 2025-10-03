import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import UsersService from "../services/UsersService";

function UpdateUser() {
    const navigate = useNavigate();
    const { userId } = useParams();

    const [userData, setUserData] = useState({
        name: '',
        email: '',
        role: 'USER', // valeur par défaut
        city: ''
    });

    useEffect(() => {
        fetchUserDataById(userId);
    }, [userId]);

    const fetchUserDataById = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await UsersService.getUserById(userId, token);
            const { name, email, city } = response.ourUsers;
            // Force toujours role à USER
            setUserData({ name, email, city, role: "USER" });
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUserData((prevUserData) => ({
            ...prevUserData,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const confirmUpdate = window.confirm('Are you sure you want to update this user?');
            if (confirmUpdate) {
                const token = localStorage.getItem('token');
                const dataToUpdate = { ...userData, role: "USER" }; // Role verrouillé
                await UsersService.updateUser(userId, dataToUpdate, token);
                navigate("/admin/user-management");
            }
        } catch (error) {
            console.error('Error updating user profile:', error);
            alert(error.message || "Update failed");
        }
    };

    return (
        <div className="auth-container">
            <h2>Update User</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Name:</label>
                    <input
                        type="text"
                        name="name"
                        value={userData.name}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Email:</label>
                    <input
                        type="email"
                        name="email"
                        value={userData.email}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>City:</label>
                    <input
                        type="text"
                        name="city"
                        value={userData.city}
                        onChange={handleInputChange}
                    />
                </div>
                <button type="submit">Update</button>
            </form>
        </div>
    );
}

export default UpdateUser;
