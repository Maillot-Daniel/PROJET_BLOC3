import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import UsersService from "../services/UsersService";
import "../userpage/UserManagementPage.css";

function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const isAdmin = UsersService.isAdmin();

  // Récupération des utilisateurs
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const usersData = await UsersService.getAllUsers();
      setUsers(usersData.ourUsersList || []);
    } catch (err) {
      setError(err.message || "Erreur lors de la récupération des utilisateurs");

      if (err.status === 401) {
        UsersService.clearAuth();
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Vérification de l'accès et récupération au chargement
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

      fetchUsers();
    };

    checkAccess();
  }, [fetchUsers, navigate, isAdmin]);

  // Suppression d'un utilisateur
  const deleteUser = async (userId) => {
    const confirmDelete = window.confirm(
      "Êtes-vous sûr de vouloir supprimer cet utilisateur ?"
    );
    if (!confirmDelete) return;

    try {
      await UsersService.deleteUser(userId);
      fetchUsers(); // rafraîchir la liste après suppression
    } catch (err) {
      setError(err.message || "Erreur lors de la suppression de l'utilisateur");
    }
  };

  if (loading) return <div className="loading">Chargement en cours...</div>;

  if (error)
    return (
      <div className="error-container">
        <h2>Erreur</h2>
        <p>{error}</p>
        {error.includes("Accès") ? (
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
              users.map((user) => {
                const userId = user.id || user._id;
                return (
                  <tr key={userId}>
                    <td>{userId}</td>
                    <td>{user.name || user.username || "Non renseigné"}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td className="actions-cell">
                      <button
                        type="button"
                        className="delete-button"
                        onClick={() => deleteUser(userId)}
                        disabled={!isAdmin}
                      >
                        Supprimer
                      </button>
                      <Link
                        to={`/admin/update-user/${userId}`}
                        className="update-button"
                      >
                        Modifier
                      </Link>
                    </td>
                  </tr>
                );
              })
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
