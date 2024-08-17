import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";

const withAuth = (WrappedComponent, allowedRoles = []) => {
  return (props) => {
    const { user, loading, setErrors } = useAuth();
    const [localUser, setLocalUser] = useState(null);
    const router = useRouter();

    useEffect(() => {
      if (!loading) {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        setLocalUser(storedUser);
    
        if (storedUser && storedUser.role) {
          console.log("Verificando acceso para el rol:", storedUser.role); // Debug
          if (!allowedRoles.includes(storedUser.role)) {
            console.log("Redirigiendo a no autorizado o login");
            router.push("/unauthorized");
          }
        } else {
          console.log("Redirigiendo a login");
          router.push("/auth/Login");
        }
      }
    }, [loading, localUser, router, allowedRoles]);
    
    if (loading || !user) {
      return <div>Cargando...</div>; // O un componente de loading personalizado
    }

    return <WrappedComponent {...props} />;
  };
};

export default withAuth;
