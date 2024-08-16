import React, { useState, useEffect } from "react";
import Link from "next/link";
import Head from "next/head";
import "firebase/firestore";

import {
  Card,
  CardFooter,
  Image,
  Button,
  CardHeader,
  CardBody,
  Divider,
} from "@nextui-org/react";


const NlpSchoolComponent = () => {

  return (
    <div className={"homeSearches"}>
      <Head>
        <title>PROYECTO NUEVA VIDA</title>
        <meta name="description" content="PROYECTO NUEVA VIDA" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/img/logo_paginas.png"/>
      </Head>
      <h2 className="text-lg font-semibold mb-2 p-4 text-center">PROYECTO NUEVA VIDA</h2>
      <div className="justify-center">
        <div className=" p-4 grid gap-12 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2  justify-items-center justify-center">
          <div className="">
            <Link href="../../alumnos">
              <Card
                className="py-4"
                isPressable
                onPress={() => console.log("item pressed")}
              >
                <CardHeader className="pb-0 pt-1 px-4 flex-col text-center">
                  <h4 className="font-bold text-large">ALUMNOS</h4>
                  <Divider />
                  <small className="text-default-500 font-bold">
                    Historial de Alumnos e Informacion
                  </small>
                </CardHeader>
                <CardBody className="overflow-visible py-2">
                  <Image
                    alt="Card background"
                    className="object-cover rounded-xl h-40 w-360"
                    src="../img/alumnos.png"
                    width={270}
                  />
                </CardBody>
              </Card>
            </Link>
          </div>
          <div>
            <Link href="../../sponsors">
              <Card
                className="py-4 "
                isPressable
                onPress={() => console.log("item pressed")}
              >
                <CardHeader className="pb-0 pt-1 px-4 flex-col text-center">
                  <h4 className="font-bold text-large">PATROCINADORES</h4>
                  <Divider />
                  <small className="text-default-500 font-bold">
                    Informacion de Patrocinadores
                  </small>
                </CardHeader>
                <CardBody className="overflow-visible py-2">
                  <Image
                    alt="Card background"
                    className="object-cover rounded-xl h-40 w-360"
                    src="../img/patrocinadores.png"
                    width={270}
                  />
                </CardBody>
              </Card>
            </Link>
          </div>

          <div>
            <Link href="../../teachers">
              <Card
                className="py-4 "
                isPressable
                onPress={() => console.log("item pressed")}
              >
                <CardHeader className="pb-0 pt-1 px-4 flex-col text-center">
                  <h4 className="font-bold text-large">MAESTROS</h4>
                  <Divider />
                  <small className="text-default-500 font-bold">
                    Informacion de Maestros
                  </small>
                </CardHeader>
                <CardBody className="overflow-visible py-2">
                  <Image
                    alt="Card background"
                    className="object-cover rounded-xl h-45 w-360"
                    src="../img/teachers.png"
                    width={270}
                  />
                </CardBody>
              </Card>
            </Link>
          </div>

          <div>
            <Link href="../../horarios">
              <Card
                className="py-4 "
                isPressable
                onPress={() => console.log("item pressed")}
              >
                <CardHeader className="pb-0 pt-1 px-4 flex-col text-center">
                  <h4 className="font-bold text-large">CONTROL DE ALUMNOS</h4>
                  <Divider />
                  <small className="text-default-500 font-bold">
                    Reportes de Alumnos y Asistencias
                  </small>
                </CardHeader>
                <CardBody className="overflow-visible py-2">
                  <Image
                    alt="Card background"
                    className="object-cover rounded-xl h-45 w-360"
                    src="../img/asistencia.png"
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

export default NlpSchoolComponent;
