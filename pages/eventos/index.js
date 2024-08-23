import React, { useState, useEffect } from "react";
import Head from "next/head";
import "firebase/firestore";
import { db } from "../../lib/firebase";
import {
  addDoc,
  collection,
  query,
  getDocs,
  orderBy,
  limit,
  getDoc,
  doc
} from "firebase/firestore";
import { useAuth } from "../../lib/context/AuthContext";
import { useRouter } from "next/router";
import ReusableTable from "../../Components/Form/ReusableTable";
import { columns } from "../../Data/eventos/datas";
import FilterSection from "../../Components/Form/FilterSectionGastos";
import { startOfDay, endOfDay } from "date-fns";
import { parse, isAfter, isBefore } from "date-fns";

const InformeEventos = () => {
  //inicio para el filtro de datos
  const [data, setData] = useState([]);
  const [combinedData, setCombinedData] = useState([]); 
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
    const fetchEventos = async () => {
      // Consulta a la colección "updates"
      const updatesQuery = query(collection(db, "updates"),orderBy("date","desc"));
      const updatesSnapshot = await getDocs(updatesQuery);
  
      const updatesData = [];
      const userIds = new Set(); // Usaremos un Set para almacenar los UID únicos
  
      updatesSnapshot.forEach((doc) => {
        const data = doc.data();
        updatesData.push({ ...data, id: doc.id });
        userIds.add(data.uid); // Asumiendo que los documentos en "updates" tienen un campo "uid"
      });
  
      // Crear un array de promesas para obtener los documentos de la colección "users"
      const userPromises = Array.from(userIds).map(uid =>
        getDoc(doc(db, "users", uid))
      );
  
      // Esperar a que todas las promesas se resuelvan
      const userDocs = await Promise.all(userPromises);
  
      // Crear un mapa para acceder a los datos de los usuarios por su UID
      const usersArray = userDocs.map(userDoc => {
        if (userDoc.exists()) {
          const userData = userDoc.data();
          return {
            uid: userDoc.id,
            displayName: userData.displayName,
            role: userData.role,
          };
        }
        return null;
      }).filter(user => user !== null);
  
      const combinedData = updatesData.map(update => {
        const user = usersArray.find(user => user.uid === update.uid);
        return {
          ...update,
          displayName: user ? user.displayName : "Unknown",
          role: user ? user.role : "Unknown",
        };
      });
  
      setData(combinedData);
      setCombinedData(combinedData);
      console.log("Info: ",combinedData);
    };
  
    fetchEventos();
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
          <ReusableTable data={data} columns={columns} />
        </div>
      </div>
    </>
  );
};

export default InformeEventos;