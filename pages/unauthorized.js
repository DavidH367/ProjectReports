
import Head from "next/head";
import { useRouter } from "next/router";
import { Button } from "@nextui-org/react";

export default function Unauthorized() {
  const router = useRouter();

  return (
    <div style={styles.container}>
      <h1 style={styles.message}>No tienes permisos para acceder a esta página</h1>
      <Button style={styles.button} onClick={() => router.push("/")}>
        Volver al Inicio
      </Button>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    textAlign: "center",
  },
  message: {
    marginBottom: "20px",
  },
  button: {
    padding: "10px 20px",
  },
};