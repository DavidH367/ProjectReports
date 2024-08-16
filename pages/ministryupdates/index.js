import React, { useState, useEffect } from "react";
import Head from "next/head";
import "firebase/firestore";
import { db } from "../../lib/firebase";
import {
  collection,
  query,
  getDocs,
} from "firebase/firestore";
import { useAuth } from "../../lib/context/AuthContext";
import { useRouter } from "next/router";
import ReusableTable from "../../Components/Form/ReusableTable";
import { columns } from "../../Data/minUpdates/data";

const UpdatesMinistriesComponent = () => {
  //inicio para el filtro de datos
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]); // Agrega el estado para los datos filtrados
  //Valida acceso a la pagina
  const router = useRouter();
  const { user, errors, setErrors } = useAuth();
  useEffect(() => {
    if (!user) {
      setErrors("");
      router.push("/auth/Login");
    }
  }, []);

  //traer datos de FireStore
  useEffect(() => {
    const fetchMinistryUpdates = async () => {
      const q = query(collection(db, "news"));

      const querySnapshot = await getDocs(q);

      const ministryNewsData = [];
      let indexs = 1;
      querySnapshot.forEach((doc) => {
        ministryNewsData.push({ ...doc.data(), indexs: indexs++ });
      });
      setData(ministryNewsData);
      setFilteredData(ministryNewsData);
      console.log(ministryNewsData); // Inicializa los datos filtrados con los datos originales
    };
    fetchMinistryUpdates();
  }, []);

  return (
    <>
      <div className="espacioU">
        <Head>
          <title>ACTUALIZACIONES DE ACTIVIDADES</title>
          <meta name="description" content="ACTUALIZACIONES DE ACTIVIDADES" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/img/logo_paginas.png" />
        </Head>
        <div className="container mx-auto p-10 justify-center items-center h-full">
          <h2 className="text-lg font-semibold mb-2 ">
            <p className="text-center">ACTUALIZACIONES DE ACTIVIDADES</p>
          </h2>
          <ReusableTable data={filteredData} columns={columns} />
        </div>
      </div>
    </>
  );
};

export default UpdatesMinistriesComponent;