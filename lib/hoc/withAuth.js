import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/router";

const withAuth = (WrappedComponent) => {
  return (props) => {
    const { user, setErrors } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!user) {
        setErrors("");
        router.push("/auth/Login");
      } else if (user.first_login) {
        router.push("/auth/ResetPassword");
      }
    }, [router, setErrors, user]);

    if (!user) {
      return null; // or a loading spinner
    }

    return <WrappedComponent {...props} />;
  };
};

export default withAuth;
