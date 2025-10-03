import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import UsersService from "../services/UsersService";
import "../userpage/UserManagementPage.css";

function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const isAdmin = UsersService.isAdmin(); // Stocké une fois ici

  // Fonction pour récupérer tous les utilisateurs
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const usersData = await UsersService.getAllUsers();
      console.log("Users fetched:", usersData);
      setUsers(usersData.ourUsersList || []);
    } catch (err) {
      console.error("Fetch users error:", err);
      setError(err.message || "Erreur lors de la récupération des utilisateurs");
      if (err.response?.status === 401) {
        UsersService.logout();
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Vérification des accès au chargement du composant
  useEffect(() => {
    const checkAccess = async () => {
      if (!UsersService.isAuthenticated()) {
        navigate("/login");
        return;
      }

      if (!isAdmin) {
        setError("Accès réservé aux administrateurs");
        setLoading(false);
        return;
      }

      try {
        await UsersService.getProfile(); // Appelle correcte
        fetchUsers();
      } catch (err) {
        if (err.response?.status === 403) {
          navigate("/unauthorized");
        } else if (err.response?.status === 401) {
          UsersService.logout();
          navigate("/login");
        } else {
          setError(err.message || "Erreur lors de la vérification des permissions");
          setLoading(false);
        }
      }
    };

    checkAccess();
  }, [fetchUsers, navigate, isAdmin]);

  // Suppression d'un utilisateur
  const deleteUser = async (userId) => {
    try {
      const confirmDelete = window.confirm(
        "Êtes-vous sûr de vouloir supprimer cet utilisateur ?"
      );
      if (confirmDelete) {
        await UsersService.deleteUser(userId);
        fetchUsers();
      }
    } catch (error) {
      setError(error.message || "Erreur lors de la suppression de l'utilisateur");
      console.error("Error deleting user:", error);
    }
  };

  if (loading) {
    return <div className="loading">Chargement en cours...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Erreur</h2>
        <p>{error}</p>
        {error.includes("expirée") ||
        error.includes("Accès refusé") ||
        error.includes("Accès réservé") ? (
          <Link to="/login" className="login-link">
            Se connecter
          </Link>
        ) : (
          <button onClick={fetchUsers} className="retry-button">
            Réessayer
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="user-management-container">
      <h2>Gestion des Utilisateurs</h2>
      <Link to="/admin/register" className="reg-button">
        Ajouter un Utilisateur
      </Link>

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user) => (
                <tr key={user.id || user._id}>
                  <td>{user.id || user._id}</td>
                  <td>{user.name || user.username || "Non renseigné"}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td className="actions-cell">
                    <button
                      type="button"
                      className="delete-button"
                      onClick={() => deleteUser(user.id || user._id)}
                      disabled={!isAdmin}
                    >
                      Supprimer
                    </button>
                    <Link
                      to={`/admin/update-user/${user.id || user._id}`}
                      className="update-button"
                    >
                      Modifier
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">Aucun utilisateur trouvé</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UserManagementPage;
