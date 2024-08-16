import React, { useState, useEffect } from "react";
import Head from "next/head";
import "firebase/firestore";
import { db } from "../../lib/firebase";
import {
  addDoc,
  collection,
  query,
  getDocs,
} from "firebase/firestore";
import { Input, Select, SelectItem, Textarea, DatePicker, Divider } from "@nextui-org/react";
import { useAuth } from "../../lib/context/AuthContext";
import { useRouter } from "next/router";
import "react-datepicker/dist/react-datepicker.css";
import { parseZonedDateTime, parseAbsoluteToLocal } from "@internationalized/date";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const updatesRef = collection(db, "updates");
const storage = getStorage();
const ministriesInfoRef = collection(db, "ministries");
const upReference = collection(db, "news");

const MinistriesComponent = () => {

  const [ministries, setMinistries] = useState([]);
  const [selectedMinistry, setSelectedMinistry] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dateup, setDateup] = useState(null);
  const [reached, setReached] = useState("");
  const [zone, setZone] = useState("");
  const [archivo1, setArchivo1] = useState(null);
  const [archivo2, setArchivo2] = useState(null);
  const [archivo3, setArchivo3] = useState(null);
  const [selectKey, setSelectKey] = useState(0);

  //estado para validar solo un guardado
  const [guardando, setGuardando] = useState(false); // Estado para controlar el botón

  //inicio para el filtro de datos
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]); // Agrega el estado para los datos filtrados

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

  const handleChange1 = (event) => {
    const archivo1 = event.target.files[0];
    console.log("Archivo seleccionado:", archivo1);
    setArchivo1(archivo1);
  };

  const handleChange2 = (event) => {
    const archivo2 = event.target.files[0];
    console.log("Archivo seleccionado:", archivo2);
    setArchivo2(archivo2);
  };

  const handleChange3 = (event) => {
    const archivo3 = event.target.files[0];
    console.log("Archivo seleccionado:", archivo3);
    setArchivo3(archivo3);
  };

  useEffect(() => {
    const fetchData = async () => {
      const q = query(collection(db, "ministries"));
      const querySnapshot = await getDocs(q);

      const ministriesData = [];
      let indexs = 1;
      querySnapshot.forEach((doc) => {
        ministriesData.push({ ...doc.data(), Sales_id: doc.id, indexs: indexs++ });
      });
      setData(ministriesData);
      setFilteredData(ministriesData); // Inicializa los datos filtrados con los datos originales
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchMinistries = async () => {
      try {
        const querySnapshot = await getDocs(ministriesInfoRef);
        const ministryData = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          ministryData.push({
            id: doc.id,
            name: data.ministry_name,

          });
        });

        setMinistries(ministryData);
      } catch (error) {
        console.error("Error fetching ministries from Firestore:", error);
      }
    };
    fetchMinistries();
  }, [ministriesInfoRef]);

  function handleMinistryChange(event) {
    const selectedMinistryValue = event.target.value;
    // Actualiza el estado con el nuevo valor seleccionado
    setSelectedMinistry(selectedMinistryValue);
  }

  // Función para convertir CalendarDate a Date
  const calendarDateToUTC = (calendarDate) => {
    const date = new Date(Date.UTC(calendarDate.year, calendarDate.month - 1, calendarDate.day));
    return date;
  };

  //Funcion para guardar datos
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!guardando) {
      setGuardando(true);
      const idDocumentos = selectedMinistry;

      // Verificar si los campos obligatorios están llenos
      if (!title || !description || !reached || !zone) {
        setFormValid(false);
        setErrorMessage("Por favor, complete todos los campos obligatorios.");
        return; // No enviar el formulario si falta algún campo obligatorio
      }

      try {

        let url1 = "";
        let url2 = "";
        let url3 = "";
        if (archivo1) {
          const archivoRef = ref(storage, `imagenes/imagenes/noticias/${archivo1.name}`);
          const uploadTask = uploadBytesResumable(archivoRef, archivo1);

          url1 = await new Promise((resolve, reject) => {
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
        if (archivo2) {
          const archivoRef = ref(storage, `imagenes/imagenes/noticias/${archivo2.name}`);
          const uploadTask = uploadBytesResumable(archivoRef, archivo2);

          url2 = await new Promise((resolve, reject) => {
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
        if (archivo3) {
          const archivoRef = ref(storage, `imagenes/imagenes/noticias/${archivo3.name}`);
          const uploadTask = uploadBytesResumable(archivoRef, archivo3);

          url3 = await new Promise((resolve, reject) => {
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
        //id del ministerio
        const docId2 = idDocumentos;

        const newUpdateData = {
          id: docId2,
          new_title: title,
          description: description,
          date: calendarDateToUTC(dateup), // Guardar la fecha actual en Firebase
          reached: parseFloat(reached),
          zone: zone,
          images:{
            url1: url1,
            url2: url2,
            url3: url3,
          }
        };

        const newUpData = {
          action: "Se Actualizó Un Proyecto",
          date: new Date(),
          uid: user.uid,
        };

        await addDoc(updatesRef, newUpdateData);
        await addDoc(upReference, newUpData);

        // Limpiar los campos del formulario después de guardar
        setSelectedMinistry(null);
        setSelectKey(prevKey => prevKey + 1);
        setTitle("");
        setDescription("");
        setDateup(null);
        setReached("");
        setZone("");
        setArchivo1(null);
        setArchivo2(null);
        setArchivo3(null);

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

  //final para funcion de guardar datos
  return (
    <div className="espacioU">
      <Head>
        <title>ACTUALIZACION DE PROYECTOS</title>
        <meta name="description" content="DEPOSITO O VENTA DE CAFÉ" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/img/logo_paginas.png" />
      </Head>
      <div className="container mx-auto p-10 justify-center items-center h-full">
        <div className='px-8 bg-white shadow rounded-lg shadow-lg  p-4 box-border h-400 w-800 p-2 border-4 mb-10'>
          <h2 className="text-lg font-semibold mb-2 ">
            <p className='text-center'>
              AGREGAR NUEVA ACTIVIDAD COMPLETADA A PROYECTOS
            </p>
          </h2>
          <p className="text-sm text-gray-600 mb-6">POR FAVOR LLENAR TODOS LOS CAMPOS NECESARIOS</p>
          <form onSubmit={handleSubmit} >
            <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 md:grid-cols-3">
              <div className="sm:col-span-1">
                <label htmlFor="n_cheque" className="block text-sm font-medium leading-6 text-gray-900">
                  <a className='font-bold text-lg'>
                    PROYECTO
                  </a>
                </label>
                <div className="mt-2 pr-4">
                  <Select
                    key={selectKey} // Clave para forzar re-renderizado
                    items={ministries}
                    label="Actualizar a:"
                    placeholder="Selecciona un Proyecto"
                    className="max-w-xs"
                    value={selectedMinistry}
                    onChange={handleMinistryChange}
                  >
                    {(user) => (
                      <SelectItem key={user.id} textValue={user.name}>
                        <div className="flex gap-2 items-center">
                          <div className="flex flex-col">
                            <span className="text-small">{user.name}</span>

                          </div>
                        </div>
                      </SelectItem>
                    )}
                  </Select>
                </div>
              </div>

              <div className="sm:col-span-1">
                <label
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  <a className="font-bold text-lg">Titulo de Actividad</a>
                </label>
                <div className="mt-2 pr-4">
                  <Input
                    isRequired
                    label="Titulo:"
                    type="text"
                    placeholder="Ej. Entrega de Filtros"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="max-w-md"
                  />
                </div>
              </div>

              <div className="sm:col-span-1">
                <label
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  <a className="font-bold text-lg">Descripcion de Actividad</a>
                </label>
                <div className="mt-2 pr-4">
                  <Textarea
                    isRequired
                    type="text"
                    placeholder="Ej. Se beneficio a la comunidad X"
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
              </div>


              <div className="sm:col-span-1 ">
                <label className="block text-sm font-medium leading-6 text-gray-900">
                  <a className="font-bold text-lg">Fecha de Actividad</a>
                </label>
                <div className="mt-2 pr-12">
                  <DatePicker
                    id="dateup"
                    label="Seleccione una Fecha"
                    variant="bordered"
                    showMonthAndYearPickers
                    granularity="day"
                    defaultValue={parseZonedDateTime("2022-11-07T00:45[America/Los_Angeles]")}
                    value={dateup}
                    onChange={setDateup}
                    placeholderText="Fecha de inicio"
                    dateFormat="dd/MM/yyyy"
                  />

                </div>
              </div>


              <div className="sm:col-span-1">
                <label
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  <a className="font-bold text-lg">Personas Alcanzadas</a>
                </label>
                <div className="mt-2 pr-4">
                  <Input
                    isRequired
                    type="number"
                    label="# personas"
                    id="reached"
                    value={reached}
                    onChange={(e) => setReached(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
              </div>


              <div className="sm:col-span-1">
                <label
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  <a className="font-bold text-lg">ZONA</a>
                </label>
                <div className="mt-2 pr-4">
                  <Input
                    isRequired
                    type="text"
                    label="Ingrese una localidad"
                    placeholder="Ej. Siguatepeque, Comayagua"
                    id="zone"
                    value={zone}
                    onChange={(e) => setZone(e.target.value)}
                    className="max-w-xs"
                  />
                </div>

              </div>


            </div>
            <h2 className="text-lg font-semibold mb-2 ">
              <p className="text-center">DATOS GRAFICOS DE LOS PROYECTOS</p>
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
                    id="url1"
                    onChange={handleChange1}
                    className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                  />
                </div>
                <div className="mt-2 pr-4">
                  <input
                    type="file"
                    id="url2"
                    onChange={handleChange2}
                    className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                  />
                </div>
                <div className="mt-2 pr-4">
                  <input
                    type="file"
                    id="url3"
                    onChange={handleChange3}
                    className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                  />
                </div>
              </div>

              <button
                onSubmit={handleSubmit}
                type="submit"
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

export default MinistriesComponent;