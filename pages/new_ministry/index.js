import Head from "next/head";
import React, { useState, useEffect } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from "../../lib/context/AuthContext";
import { parseZonedDateTime, parseAbsoluteToLocal } from "@internationalized/date";
import "firebase/firestore";
import { db } from "../../lib/firebase";
import {
  addDoc,
  collection,
} from "firebase/firestore";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Input, Select, SelectItem, Textarea, DatePicker, Divider } from "@nextui-org/react";
import { useRouter } from "next/router";

const ministryReference = collection(db, "ministries");
const upReference = collection(db, "updates");
const storage = getStorage();

const NewMinistryComponent = () => {
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [logo_url, setLogo_url] = useState("");
  const [leader, setLeader] = useState("");
  const [budget, setBudget] = useState("");
  const [ministry_name, setMinistry_name] = useState("");
  const [mision, setMision] = useState("");
  const [vision, setVision] = useState("");
  const [start_year, setStart_year] = useState(null);
  const [archivo, setArchivo] = useState(null);
  const [selectKey, setSelectKey] = useState(0);
  
  const categories = [
    { key: "Education", label: "Education" },
    { key: "Health", label: "Health" },
    { key: "XMA", label: "XMA" },
    { key: "Churchs", label: "Churchs" }
  ];

  //estado para formulario
  const [guardando, setGuardando] = useState(false); // Estado para controlar el botón

  // Estado para manejar la validez del formulario
  const [formValid, setFormValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  //Valida acceso a la pagina
  const router = useRouter();
  const { user, errors, setErrors } = useAuth();
  useEffect(() => {
    if (!user) {
      setErrors("");
      router.push("/auth/Login");
    }
  }, []);

  const handleChange = (event) => {
    const archivo = event.target.files[0];
    console.log("Archivo seleccionado:", archivo);
    setArchivo(archivo);
  };

  // Función para convertir CalendarDate a Date
  const calendarDateToUTC = (calendarDate) => {
    const date = new Date(Date.UTC(calendarDate.year, calendarDate.month - 1, calendarDate.day));
    return date;
  };

  // Función para guardar datos
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!guardando) {
      setGuardando(true);

      // Verificar si los campos obligatorios están llenos
      if (
        !category ||
        !description ||
        !ministry_name ||
        !mision ||
        !vision ||
        !start_year ||
        !leader ||
        !budget
      ) {
        setFormValid(false);
        setErrorMessage("Por favor, complete todos los campos obligatorios.");
        setGuardando(false);
        return; // No enviar el formulario si falta algún campo obligatorio
      }
      try {

        let logoUrl = "";
        if (archivo) {
          const archivoRef = ref(storage, `imagenes/imagenes/logos/${archivo.name}`);
          const uploadTask = uploadBytesResumable(archivoRef, archivo);

          logoUrl = await new Promise((resolve, reject) => {
            uploadTask.on(
              "state_changed",
              (snapshot) => {
                // Progress function ...
              },
              (error) => {
                reject(error);
              },
              async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(downloadURL);
              }
            );
          });
        }

        const newData = {
          category: category,
          description: description,
          ministry_name: ministry_name,
          mision: mision,
          vision: vision,
          date: calendarDateToUTC(start_year),
          leader: leader,
          budget: parseFloat(budget),
          logo_url: logoUrl,
        };

        const newUpData = {
          action: "Registra Nuevo Proyecto",
          date: new Date(),
          uid: user.uid,
        };

        await addDoc(ministryReference, newData);
        await addDoc(upReference, newUpData);

        // Limpiar los campos del formulario después de guardar
        setDescription("");
        setMinistry_name("");
        setMision("");
        setVision("");
        setLeader("");
        setBudget("");
        setCategory("");
        setSelectKey(prevKey => prevKey + 1);
        setArchivo(null);
        setStart_year(null);

        // Resetear el input de archivo
        document.getElementById("logo").value = "";

      } catch (error) {
        console.error("Error al guardar los datos:", error);
      } finally {
        // Vuelve a habilitar el botón después del guardado (independientemente de si tuvo éxito o no)
        setGuardando(false);
      }
    }
    // Reiniciar la validación y el mensaje de error
    setFormValid(true);
    setErrorMessage("");
  };

  return (
    <div className="espacio">
      <Head>
        <title>NUEVO MINISTERIO</title>
        <meta name="description" content="INGRESO DE ALUMNOS" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/img/logo_paginas.png" />
      </Head>
      <div className="container mx-auto p-10 justify-center items-center">
        <div className="px-8 bg-white shadow rounded-lg shadow-lg  p-4 box-border h-400 w-800 p-2 border-4 ">
          <h2 className="text-lg font-semibold mb-2 ">
            <p className="text-center">DATOS GENERALES DEL MINISTERIO</p>
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            POR FAVOR LLENAR TODOS LOS CAMPOS NECESARIOS
          </p>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 md:grid-cols-3">
              <div className="sm:col-span-1">
                <label
                  className=" block text-sm font-medium leading-6 text-gray-900"
                >
                  <p className="font-bold text-lg ">CATEGORIA</p>
                </label>
                <div className="mt-2 pr-4">
                  <Select
                    key={selectKey} // Clave para forzar re-renderizado
                    label="Select a category"
                    className="max-w-xs"
                    isRequired
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <SelectItem key="" value="">
                      Select a category
                    </SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.key} value={cat.key}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="sm:col-span-1">
                <label
                  htmlFor="Descripcion"
                  className=" block text-sm font-medium leading-6 text-gray-900"
                >
                  <p className="font-bold text-lg">DESCRIPCION</p>
                </label>
                <div className="mt-2 pr-4">
                  <Textarea
                    isRequired
                    type="text"
                    label="Descript."
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="max-w-xs"
                  >
                  </Textarea>
                </div>
              </div>

              <div className="sm:col-span-1">
                <label
                  htmlFor="Name"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  <a className="font-bold text-lg">Nombre de Proyecto</a>
                </label>
                <div className="mt-2 pr-4">
                  <Input
                    isRequired
                    type="text"
                    label="Ej: New Life Project"
                    id="ministry_name"
                    autoComplete="Name"
                    value={ministry_name}
                    onChange={(e) => setMinistry_name(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
              </div>

              <div className="sm:col-span-1">
                <label
                  htmlFor="Mision"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  <a className="font-bold text-lg">MISION</a>
                </label>
                <div className="flex w-full flex-wrap md:flex-nowrap mb-6 md:mb-0 gap-4 mt-2 pr-4">
                  <Textarea
                    isRequired
                    id="mision"
                    placeholder="Ej. "
                    autoComplete="mision"
                    className="max-w-xs"
                    value={mision}
                    onChange={(e) => setMision(e.target.value)}
                  >

                  </Textarea>
                </div>
              </div>

              <div className="sm:col-span-1">
                <label
                  className="block text-sm font-medium leading-6 text-gray-900"
                  htmlFor="Vision"
                >
                  <a className="font-bold text-lg">VISION</a>
                </label>
                <div className="flex w-full flex-wrap md:flex-nowrap mb-6 md:mb-0 gap-4 mt-2 pr-4">
                  <Textarea
                    isRequired
                    id="vision"
                    placeholder="Ej. "
                    autoComplete="vision"
                    className="max-w-xs"
                    value={vision}
                    onChange={(e) => setVision(e.target.value)}
                  >

                  </Textarea>
                </div>
              </div>

              <div className="sm:col-span-1 ">
                <label 
                className="block text-sm font-medium leading-6 text-gray-900">
                  <a className="font-bold text-lg">Fecha de Inicio</a>
                </label>
                <div className="mt-2 pr-32">
                  <DatePicker
                    id="start_year"
                    label="Fecha de Inicio"
                    variant="bordered"
                    showMonthAndYearPickers
                    granularity="day"
                    defaultValue={parseZonedDateTime("2022-11-07T00:45[America/Los_Angeles]")}
                    value={start_year}
                    onChange={setStart_year}
                    placeholderText="Fecha de inicio"
                    dateFormat="dd/MM/yyyy"
                  />

                </div>
              </div>

              <div className="sm:col-span-1">
                <label
                  htmlFor="Name"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  <a className="font-bold text-lg">Encargado / Lider</a>
                </label>
                <div className="mt-2 pr-4">
                  <Input
                    isRequired
                    type="text"
                    label="Ej: Daniel H"
                    id="leader"
                    autoComplete="Name"
                    value={leader}
                    onChange={(e) => setLeader(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
              </div>

              <div className="sm:col-span-1">
                <label
                  htmlFor="Name"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  <a className="font-bold text-lg">Presupuesto</a>
                </label>
                <div className="mt-2 pr-4">
                  <Input
                    isRequired
                    type="number"
                    label="L"
                    id="budget"
                    autoComplete="Presupuesto"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
              </div>

            </div>
            <Divider className="my-4" />
            <h2 className="text-lg font-semibold mb-2 ">
              <p className="text-center">DATOS GRAFICOS DEL MINISTERIO</p>
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              POR FAVOR LLENAR TODOS LOS CAMPOS NECESARIOS
            </p>
            <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 md:grid-cols-3">
              <div className="sm:col-span-1">
                <label
                  htmlFor="precio"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  <a className="font-bold text-lg">LOGO</a>
                </label>
                <div className="mt-2 pr-4">
                  <input
                    type="file"
                    id="logo"
                    onChange={handleChange}
                    className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none mt-2 pr-4"
                  />


                </div>
              </div>

              <button
                type="submit"
                onSubmit={handleSubmit}
                className="h-9 w-40 mt-11 rounded-lg bg-indigo-600 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                disabled={guardando} // Deshabilitar el botón cuando guardando es true
              >
                {guardando ? "Guardando..." : "Guardar"}
              </button>
              {!formValid && (
                <p className="text-red-500 mt-2">
                  {errorMessage}
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewMinistryComponent;
