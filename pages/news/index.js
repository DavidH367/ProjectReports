import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import "firebase/firestore";

import {
  Card,
  CardFooter,
  Image,
  CardHeader,
  CardBody,
  Divider,
} from "@nextui-org/react";

const MainComponent = () => {
  
  return (
    <div className={"homeSearches"}>
      <Head>
        <title>ACTUALIZACION DE PROYECTOS</title>
        <meta name="description" content="CURSOS Y MATRICULAS" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/img/logo_paginas.png" />
      </Head>
      <h2 className="text-lg font-semibold mb-2 p-4 text-center">ACTUALIZACIONES DE PROYECTOS</h2>
      <div className="justify-center">
        <div className=" p-4 grid gap-12 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2  justify-items-center">
          <div>
            <Link href="../../news_history">
              <Card
                className="py-4"
                isPressable
                onPress={() => console.log("item pressed")}
              >
                <CardHeader className="pb-0 pt-1 px-4 flex-col text-center">
                  <h4 className="font-bold text-large">NOTICIAS DE MINISTERIO</h4>
                  <Divider />
                  <small className="text-default-500 font-bold">
                    Registrar actualización
                  </small>
                </CardHeader>
                <CardBody className="overflow-visible py-2">
                  <Image
                    alt="Card background"
                    className="object-cover rounded-xl h-40 w-360"
                    src="../img/noticias.png"
                    width={270}
                  />
                </CardBody>
              </Card>
            </Link>
          </div>
          <div>
            <Link href="../../ministryupdates">
              <Card
                className="py-4 "
                isPressable
                onPress={() => console.log("item pressed")}
              >
                <CardHeader className="pb-0 pt-1 px-4 flex-col text-center">
                  <h4 className="font-bold text-large">HISTORIAL DE NOTICIAS</h4>
                  <Divider />
                  <small className="text-default-500 font-bold">
                    Consulta de actividades por Ministerio
                  </small>
                </CardHeader>
                <CardBody className="overflow-visible py-2">
                  <Image
                    alt="Card background"
                    className="object-cover rounded-xl h-40 w-360"
                    src="../img/historialnoticias.png"
                    width={270}
                  />
                </CardBody>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainComponent;
