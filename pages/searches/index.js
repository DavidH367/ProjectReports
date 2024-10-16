import Link from "next/link";
import Head from "next/head";
import {
  Card,
  CardFooter,
  Image,
  Button,
  CardHeader,
  CardBody,
  Divider,
} from "@nextui-org/react";
import React, { useEffect } from "react";
import { useAuth } from "../../lib/context/AuthContext";
import { useRouter } from "next/router";

export default function Searches() {
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
        <title>CONSULTAS</title>
        <meta name="description" content="CONSULTAS" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/img/logo_paginas.png" />
      </Head>
      <h2 className="text-lg font-semibold mb-2 p-4 text-center">CONSULTAS</h2>
      <div className="justify-center">
        <div className=" p-4 grid gap-10 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3  justify-items-center">
          <div>
            <Link href="../../purchasing_history">
              <Card
                className="py-4"
                isPressable
                onPress={() => console.log("item pressed")}
              >
                <CardHeader className="pb-0 pt-1 px-4 flex-col text-center">
                  <h4 className="font-bold text-large">CLIENTES</h4>
                  <Divider />
                  <small className="text-default-500 font-bold">
                    Historial de Clientes
                  </small>
                </CardHeader>
                <CardBody className="overflow-visible py-2">
                  <Image
                    alt="Card background"
                    className="object-cover rounded-xl h-40 w-full"
                    src="../img/compras.jpg"
                    width={270}
                  />
                </CardBody>
              </Card>
            </Link>
          </div>
          <div>
            <Link href="../../sales_history">
              <Card
                className="py-4 "
                isPressable
                onPress={() => console.log("item pressed")}
              >
                <CardHeader className="pb-0 pt-1 px-4 flex-col text-center">
                  <h4 className="font-bold text-large">VENTAS</h4>
                  <Divider />
                  <small className="text-default-500 font-bold">
                    Historial de Ventas
                  </small>
                </CardHeader>
                <CardBody className="overflow-visible py-2">
                  <Image
                    alt="Card background"
                    className="object-cover rounded-xl h-40 w-full"
                    src="../img/ventas.png"
                    width={270}
                  />
                </CardBody>
              </Card>
            </Link>
          </div>

          <div>
            <Link href="../../supliers_history">
              <Card
                className="py-4 "
                isPressable
                onPress={() => console.log("item pressed")}
              >
                <CardHeader className="pb-0 pt-1 px-4 flex-col text-center">
                  <h4 className="font-bold text-large">COMPRADORES</h4>
                  <Divider />
                  <small className="text-default-500 font-bold">
                    Historial de Ingresos y Abonos de Capital
                  </small>
                </CardHeader>
                <CardBody className="overflow-visible py-2">
                  <Image
                    alt="Card background"
                    className="object-cover rounded-xl h-40 w-full"
                    src="../img/inversion.jpg"
                    width={270}
                  />
                </CardBody>
              </Card>
            </Link>
          </div>
        </div>

        <div className="p-4 grid gap-10 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 justify-items-center">
          <div>
            <Link href="../../expenses_history">
              <Card
                className="py-4 "
                isPressable
                onPress={() => console.log("item pressed")}
              >
                <CardHeader className="pb-0 pt-1 px-4 flex-col text-center">
                  <h4 className="font-bold text-large">REPORTE DE GASTOS</h4>
                  <Divider />
                  <small className="text-default-500 font-bold">
                    Historial de pagos, gastos, etc.
                  </small>
                </CardHeader>
                <CardBody className="overflow-visible py-2">
                  <Image
                    alt="Card background"
                    className="object-cover rounded-xl h-40 w-full"
                    src="../img/reporte.jpg"
                    width={270}
                  />
                </CardBody>
              </Card>
            </Link>
          </div>
          <div>
            <Link href="../../reportes">
              <Card
                className="py-4 "
                isPressable
                onPress={() => console.log("item pressed")}
              >
                <CardHeader className="pb-0 pt-1 px-4 flex-col text-center">
                  <h4 className="font-bold text-large">
                    INFORMES DE TRANSACCIONES
                  </h4>
                  <Divider />
                  <small className="text-default-500 font-bold">
                    Informes General
                  </small>
                </CardHeader>
                <CardBody className="overflow-visible py-2">
                  <Image
                    alt="Card background"
                    className="object-cover rounded-xl h-40 w-full"
                    src="../img/informe.png"
                    width={270}
                  />
                </CardBody>
              </Card>
            </Link>
          </div>
        </div>
      </div>
      <div></div>
    </div>
  );
}
