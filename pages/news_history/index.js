import React, { useState, useEffect } from "react";
import Head from "next/head";
import "firebase/firestore";
import { db } from "../../lib/firebase";
import {
  addDoc,
  collection,
  query,
  getDocs,
  getDoc,
  doc,
  where
} from "firebase/firestore";
import { Input, Select, SelectItem, Textarea, DatePicker, Divider, Progress } from "@nextui-org/react";
import { useAuth } from "../../lib/context/AuthContext";
import { useRouter } from "next/router";
import "react-datepicker/dist/react-datepicker.css";
import { parseZonedDateTime, parseAbsoluteToLocal } from "@internationalized/date";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import imageCompression from 'browser-image-compression';


const updatesRef = collection(db, "news");
const storage = getStorage();
const ministriesInfoRef = collection(db, "ministries");
const upReference = collection(db, "updates");

const MinistriesComponent = () => {

  const [ministries, setMinistries] = useState([]);
  const [selectedMinistry, setSelectedMinistry] = useState(null);
  const [ministryName, setMinistryName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dateup, setDateup] = useState(null);
  const [act_bugdet, setAct_Bugdet] = useState(0);
  const [zone, setZone] = useState("");
  const [archivo1, setArchivo1] = useState(null);
  const [archivo2, setArchivo2] = useState(null);
  const [archivo3, setArchivo3] = useState(null);
  const [preview1, setPreview1] = useState(null);
  const [preview2, setPreview2] = useState(null);
  const [preview3, setPreview3] = useState(null);
  const [selectKey, setSelectKey] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0); // Progreso total


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

  // Función para manejar la compresión
  const handleFileChange = async (event, setArchivo, setPreview) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type.startsWith('image/') && !file.name.toLowerCase().endsWith('.heic')) {
        try {
          // Opciones de compresión
          const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          };
          const compressedFile = await imageCompression(file, options);
          setArchivo(compressedFile);
  
          // Generar vista previa
          const previewURL = URL.createObjectURL(compressedFile);
          setPreview(previewURL);
        } catch (error) {
          console.error("Error al comprimir la imagen:", error);
        }
      } else if (file.name.toLowerCase().endsWith('.heic')) {
        alert("No se permiten archivos de tipo HEIC. Por favor, seleccione otro formato de imagen.");
        setArchivo(null);
        setPreview(null);
        event.target.value = ""; // Restablecer el valor del input de archivo
      } else {
        setArchivo(null);
        setPreview(null);
        event.target.value = ""; // Restablecer el valor del input de archivo
      }
    }
  };

  // Función para subir archivos con progreso
  const uploadFile = (file, updateProgress) => {
    return new Promise((resolve, reject) => {
      const archivoRef = ref(storage, `imagenes/imagenes/noticias/${file.name}`);
      const uploadTask = uploadBytesResumable(archivoRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          updateProgress(progress); // Actualizar progreso individual
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

  const getFullName = async () => {
    try {
      let idMinistry = selectedMinistry;

      // Obtén la referencia al documento directamente usando el ID del documento
      const docRef = doc(db, "ministries", idMinistry);
      const docSnapshot = await getDoc(docRef);
      let fullNameM = "";

      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        fullNameM = data.ministry_name || ""; // Asigna el nombre del ministerio o una cadena vacía si no existe
        console.log("Nombre del Ministerio:", fullNameM);
      } else {
        console.log("No existe un documento con ese ID.");
      }
      return fullNameM;
    } catch (error) {
      console.error("Error al obtener el nombre completo:", error);
      return ""; // Retorna una cadena vacía en caso de error
    }
  };

  //Funcion para guardar datos
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!guardando) {
      setGuardando(true);
      let progress1 = 0, progress2 = 0, progress3 = 0;
      const idDocumentos = selectedMinistry;
      const updateTotalProgress = () => {
        const totalProgress = (progress1 + progress2 + progress3) / 3;
        setProgressTotal(totalProgress);
      };
      // Verificar si los campos obligatorios están llenos
      if (!title || !description || !act_bugdet || !zone || !dateup) {
        setFormValid(false);
        setErrorMessage("Por favor, complete todos los campos obligatorios.");
        return; // No enviar el formulario si falta algún campo obligatorio
      }

      try {


        let url1 = "", url2 = "", url3 = "";

        if (archivo1) {
          url1 = await uploadFile(archivo1, (progress) => {
            progress1 = progress;
            updateTotalProgress();
          });
        }
        if (archivo2) {
          url2 = await uploadFile(archivo2, (progress) => {
            progress2 = progress;
            updateTotalProgress();
          });
        }
        if (archivo3) {
          url3 = await uploadFile(archivo3, (progress) => {
            progress3 = progress;
            updateTotalProgress();
          });
        }

        //id del ministerio
        const docId2 = idDocumentos;

        const fullMinistryName = await getFullName();
        const newfullN = fullMinistryName;

        //const minisName = selectedMinistry.ministry_name;

        const newUpdateData = {
          id: docId2,
          minName: newfullN,
          new_title: title,
          description: description,
          date: calendarDateToUTC(dateup), // Guardar la fecha actual en Firebase
          act_bugdet: parseFloat(act_bugdet),
          zone: zone,
          images: {
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
        setAct_Bugdet("");
        setZone("");
        setArchivo1(null);
        setArchivo2(null);
        setArchivo3(null);

        // Resetear el input de archivo
        document.getElementById("url1").value = "";
        document.getElementById("url2").value = "";
        document.getElementById("url3").value = "";

        // Reiniciar vistas previas y barra de progreso
        setPreview1(null);
        setPreview2(null);
        setPreview3(null);
        setProgressTotal(0);

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
        <meta name="description" content="ACTUALIZACION DE PROYECTOS" />
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
                    {(ministr) => (
                      <SelectItem key={ministr.id} textValue={ministr.name}>
                        <div className="flex gap-2 items-center">
                          <div className="flex flex-col">
                            <span className="text-small">{ministr.name}</span>

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
                    isRequired
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
                  <a className="font-bold text-lg">Presupuesto de Actividad</a>
                </label>
                <div className="mt-2 pr-4">
                  <Input
                    isRequired
                    type="number"
                    label="USD"
                    id="act_bugdet"
                    value={act_bugdet}
                    onChange={(e) => setAct_Bugdet(e.target.value)}
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
                    accept="image/*"
                    onChange={(event) => handleFileChange(event, setArchivo1, setPreview1)}
                    className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                  />
                  {preview1 && <img src={preview1} alt="Vista previa 1" width="100" />}
                </div>
                <div className="mt-2 pr-4">
                  <input
                    type="file"
                    id="url2"
                    accept="image/*"
                    onChange={(event) => handleFileChange(event, setArchivo2, setPreview2)}
                    className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                  />
                  {preview2 && <img src={preview2} alt="Vista previa 2" width="100" />}
                </div>
                <div className="mt-2 pr-4">
                  <input
                    type="file"
                    id="url3"
                    accept="image/*"
                    onChange={(event) => handleFileChange(event, setArchivo3, setPreview3)}
                    className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                  />
                  {preview3 && <img src={preview3} alt="Vista previa 3" width="100" />}
                </div>
              </div>
              {/* Componente de progreso único */}
              <Progress value={progressTotal} max={100} />
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