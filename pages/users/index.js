import Link from "next/link";
import Head from "next/head";
import { Card, Image, CardHeader, CardBody, Divider } from "@nextui-org/react";
import React, { useEffect } from "react";
import { useAuth } from "../../lib/context/AuthContext";
import { useRouter } from "next/router";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure } from "@nextui-org/react";

export default function Users() {
  //Valida acceso a la pagina
  const router = useRouter();
  const { user, errors, setErrors } = useAuth();
  useEffect(() => {
    if (!user) {
      setErrors("");
      router.push("/auth/Login");
    }
  }, []);
  return (
    <div className={"homeSearches"}>
      <Head>
        <title>USUARIOS</title>
        <meta name="description" content="USUARIOS" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/img/logo_paginas.png" />
      </Head>
      <h2 className="text-lg font-semibold mb-2 p-4 text-center">REGISTRAR O ACTUALIZAR USUARIOS</h2>
      <div className="justify-center">
        <div className="p-4 grid gap-10 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 justify-items-center">
          <div>
            <Link href="../users/RegisterUser">
              <Card
                className="py-4 "
                isPressable
                onPress={() => console.log("item pressed")}
              >
                <CardHeader className="pb-0 pt-1 px-4 flex-col text-center">
                  <h4 className="font-bold text-large">Registrar Usuario</h4>
                  <Divider />
                  <small className="text-default-500 font-bold">
                    Cambiar Rol de Usuario
                  </small>
                </CardHeader>
                <CardBody className="overflow-visible py-2">
                  <Image
                    alt="Card background"
                    className="object-cover rounded-xl h-40 w-full"
                    src="../img/NewUser.png"
                    width={300}
                  />
                </CardBody>
              </Card>
            </Link>
          </div>
          <div>
            <Link href="../auth/ResetPassword">
              <Card
                className="py-4 "
                isPressable
                onPress={() => console.log("item pressed")}
              >
                <CardHeader className="pb-0 pt-1 px-4 flex-col text-center">
                  <h4 className="font-bold text-large">
                    Actualizar Contraseña
                  </h4>
                  <Divider />
                  <small className="text-default-500 font-bold">
                    Nueva Contraseña
                  </small>
                </CardHeader>
                <CardBody className="overflow-visible py-2">
                  <Image
                    alt="Card background"
                    className="object-cover rounded-xl h-40 w-full"
                    src="../img/pass.png"
                    width={300}
                  />
                </CardBody>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
