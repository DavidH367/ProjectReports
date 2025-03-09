import Head from "next/head";
import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { doc, onSnapshot } from "@firebase/firestore";
import { useAuth } from "../lib/context/AuthContext";
import { Divider } from "@nextui-org/react";
import { Image } from "@nextui-org/react";
import withAuth from "../lib/hoc/withAuth";

function Home() {
  const { user } = useAuth();
  const [localUser, setLocalUser] = useState({});
  const [loadedUser, setLoadedUser] = useState(false);

  useEffect(() => {
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
        setLocalUser(newUser);
        setLoadedUser(true);
      }
    });
    return () => unsubscribe();
  }, [loadedUser, user]);

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
            height={500}
            width={540}
            src="/img/NEW_MEBN_LOGO.png"
            alt="LogoImages"
            className="m-5"
          />
        </div>
      </div>
    </>
  );
}

export default withAuth(Home);
