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


const Purchasing1 = () => {

  return (
    <div className={"homeSearches"}>
      <Head>
        <title>PROYECTOS MEBN</title>
        <meta name="description" content="PROYECTOS MEBN" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/img/logo_paginas.png" />
      </Head>
      <h2 className="text-lg font-semibold mb-2 p-4 text-center">PROYECTOS EN MINISTERIO BENDICIÓN A LAS NACIONES</h2>
      <div className="justify-center">
        <div className=" p-4 grid gap-12 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2  justify-items-center">
          <div>
            <Link href="../../new_ministry">
              <Card
                className="py-4"
                isPressable
                onPress={() => console.log("item pressed")}
              >
                <CardHeader className="pb-0 pt-1 px-4 flex-col text-center">
                  <h4 className="font-bold text-large">NUEVO MINISTERIO</h4>
                  <Divider />
                  <small className="text-default-500 font-bold">
                    Nueva Informacion para Ministerios.
                  </small>
                </CardHeader>
                <CardBody className="overflow-visible py-2">
                  <Image
                    alt="Card background"
                    className="object-cover rounded-xl h-40 w-360"
                    src="../img/ministerios.png"
                    width={270}
                  />
                </CardBody>
              </Card>
            </Link>
          </div>
          <div>
            <Link href="../../ministry_records">
              <Card
                className="py-4 "
                isPressable
                onPress={() => console.log("item pressed")}
              >
                <CardHeader className="pb-0 pt-1 px-4 flex-col text-center">
                  <h4 className="font-bold text-large">INFORMACION DE MINISTERIOS</h4>
                  <Divider />
                  <small className="text-default-500 font-bold">
                    Proyectos Actuales.
                  </small>
                </CardHeader>
                <CardBody className="overflow-visible py-2">
                  <Image
                    alt="Card background"
                    className="object-cover rounded-xl h-40 w-360"
                    src="../img/infoministerio.png"
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

export default Purchasing1;
