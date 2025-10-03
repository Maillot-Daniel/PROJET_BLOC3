
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    alert("Vous devez être connecté pour modifier un événement.");
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default PrivateRoute;
