import Head from "next/head";
import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { doc, onSnapshot } from "@firebase/firestore";
import { useAuth } from "../lib/context/AuthContext";
import { useRouter } from "next/router";
import { Divider } from "@nextui-org/react";
import { Image } from "@nextui-org/react";

export default function Home() {
  const { user, setErrors } = useAuth();
  const [localUser, setLocalUser] = useState({});
  const [loadedUser, setLoadedUser] = useState(false);
  const router = useRouter();
  useEffect(() => {
    //entrar a la pagina
    if (!user) {
      setErrors("");
      router.push("/auth/Login");
    } else if (user.first_login) {
      router.push("/auth/ResetPassword");
    }
    //get rest of user information
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const updatedUser = doc.data();
        const newUser = {
          displayname: `${updatedUser.firstName} ${updatedUser.lastName}`,
          firstLogin: updatedUser.first_login,
        };
        localStorage.setItem("user", JSON.stringify(newUser));
        //saving user data in local storage
        setLocalUser(newUser);
        setLoadedUser(true);
      }
    });
    return () => unsubscribe();
  }, [loadedUser, router, setErrors, user]);
  return (
    <>
      <div className={"homeContainer"}>
        <Head>
          <title>INICIO</title>
          <meta name="description" content="INICIO" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/img/logo_paginas.png" />
        </Head>
        <h1 className="text-lg font-bold p-4 text-center">
          BIENVENIDO(A): {localUser.displayname}
        </h1>
        <Divider className="my-6" />
        <div className="flex justify-center items-center">
          <Image
            isBlurred
            height={400}
            width={440}
            src="/img/NEW_MEBN_LOGO.png"
            alt="LogoImages"
            className="m-5"
          />
        </div>
        <div className="flex justify-center items-center">
        <Image
            isBlurred
            height="auto"
            width={440}
            src="/img/LOGO_letras_deg.png"
            alt="LogoImages"
            className="m-5"
          />
        </div>
      </div>
    </>
  );
}
