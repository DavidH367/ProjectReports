import React, { useState, useEffect } from "react";
import Head from "next/head";
import "firebase/firestore";
import { db } from "../../lib/firebase";
import {
  addDoc,
  collection,
  query,
  getDocs,
  updateDoc,
  doc,
  onSnapshot
} from "firebase/firestore";
import firebase from "firebase/app";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useAuth } from "../../lib/context/AuthContext";
import { useRouter } from "next/router";
import ReusableTable from "../../Components/Form/ReusableTable";
import { columns } from "../../Data/ministry_records/data";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure, Progress } from "@nextui-org/react";
import "react-datepicker/dist/react-datepicker.css";
import imageCompression from 'browser-image-compression';
import { Input, Select, SelectItem, Textarea, DatePicker, Divider } from "@nextui-org/react";

const supliersInfoRef = collection(db, "ministries");
const upReference = collection(db, "updates");
const storage = getStorage();

const MinistryRecordsComponent = () => {
  //Valida acceso a la pagina
  const router = useRouter();
  const { user, errors, setErrors } = useAuth();
  useEffect(() => {
    if (!user) {
      setErrors("");
      router.push("/auth/Login");
    }
  }, []);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [size, setSize] = React.useState('full')
  const sizes = ["5xl"];
  const [formValid, setFormValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [filterValue, setFilterValue] = useState("");
  const [ministries, setMinistries] = useState([]);
  const [filteredMinistries, setFilteredMinistries] = useState([]);
  const [logoFile, setLogoFile] = useState(null); // Estado para almacenar el archivo del logo
  const [currentLogoUrl, setCurrentLogoUrl] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [ministry, setMinistry] = useState([]);
  const [selectedMinistry, setSelectedMinistry] = useState(null);
  const [formData, setFormData] = useState({
    category: "",
    description: "",
    ministry_name: "",
    mision: "",
    vision: "",
    leader: "",
    budget: "",
  });

  //estado para formulario
  const [guardando, setGuardando] = useState(false); // Estado para controlar el botón

  const handleLogoChange = async (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/') && !file.name.toLowerCase().endsWith('.heic')) {
      try {
        const compressedFile = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1024 });
        setLogoFile(compressedFile);
      } catch (error) {
        console.error('Error al comprimir la imagen:', error);
      }
    } else if (file && file.name.toLowerCase().endsWith('.heic')) {
      alert("No se permiten archivos de tipo HEIC. Por favor, seleccione otro formato de imagen.");
      setLogoFile(null);
      event.target.value = ""; // Restablecer el valor del input de archivo
    } else {

      setLogoFile(null);
      event.target.value = ""; // Restablecer el valor del input de archivo
    }
  };

  const uploadLogo = async (file) => {
    const storageRef = ref(storage, `imagenes/imagenes/logos/${file.name}`); // Crea una referencia al archivo
    const uploadTask = uploadBytesResumable(storageRef, file); // Sube el archivo

    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // Calcula el progreso de la carga
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress); // Actualiza el estado con el progreso
        },
        (error) => {
          console.error("Error al subir el archivo:", error);
          reject(error); // Maneja errores
        },
        async () => {
          // Obtén la URL de descarga cuando la carga termine
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setUploadProgress(0); // Reinicia el progreso después de completar
          resolve(downloadURL);
        }
      );
    });
  };
  useEffect(() => {
    const fetchMinistries = async () => {
      try {
        const querySnapshot = await getDocs(supliersInfoRef);

        const MinistryData = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          MinistryData.push({
            id: doc.id,
            name: data.ministry_name,
            category: data.category,
            description: data.description,
            ministry_name: data.ministry_name,
            mision: data.mision,
            vision: data.vision,
            leader: data.leader,
            budget: data.budget,
            logo: data.logo_url || null, // Asegúrate de incluir el campo logo
          });
        });

        setMinistry(MinistryData);
      } catch (error) {
        console.error("Error fetching suppliers from Firestore:", error);
      }
    };
    fetchMinistries();
  }, []);
  function handleSupplierChange(event) {
    const selectedMinistryValue = event.target.value;
    // Actualiza el estado con el nuevo valor seleccionado
    setSelectedMinistry(selectedMinistryValue);

    if (!selectedMinistryValue) {
      // Si no hay valor seleccionado, limpia el formulario
      setFormData({
        category: "",
        description: "",
        ministry_name: "",
        mision: "",
        vision: "",
        leader: "",
        budget: "",
      });
      setCurrentLogoUrl(null); // Limpiar la URL del logo
    } else {
      const selectedMinistryData = ministry.find(supplier => supplier.id === selectedMinistryValue);
      if (selectedMinistryData) {
        setFormData({
          category: selectedMinistryData.category,
          description: selectedMinistryData.description,
          ministry_name: selectedMinistryData.ministry_name,
          mision: selectedMinistryData.mision,
          vision: selectedMinistryData.vision,
          leader: selectedMinistryData.leader,
          budget: selectedMinistryData.budget,
        });
        setCurrentLogoUrl(selectedMinistryData.logo || null); // Actualiza la URL del logo
      }
    }
  }
  const handleModalClose = () => {
    // Si no hay valor seleccionado, limpia el formulario
    setFormData({
      category: "",
      description: "",
      ministry_name: "",
      mision: "",
      vision: "",
      leader: "",
      budget: "",
    });
    setCurrentLogoUrl(null); // Limpiar la URL del logo
    // Cerrar el modal
    onClose();
  };



  // Función para guardar datos
  const handleSubmit = async () => {
    if (!guardando) {
      setGuardando(true);
      const idDocumentos = selectedMinistry;

      // Verificar si los campos obligatorios están llenos
      if (
        !formData.ministry_name ||
        !formData.category ||
        !formData.description ||
        !formData.leader ||
        !formData.mision ||
        !formData.vision ||
        !formData.budget
      ) {
        setFormValid(false);
        setErrorMessage("Por favor, complete todos los campos obligatorios.");
        return; // No enviar el formulario si falta algún campo obligatorio
      }
      try {
        let logoUrl = null;
        if (logoFile) {
          logoUrl = await uploadLogo(logoFile); // Subir el logo si se seleccionó uno
        }

        //id del ministerio
        const docRef = doc(supliersInfoRef, idDocumentos);
        const newData = {
          ministry_name: formData.ministry_name,
          category: formData.category,
          description: formData.description,
          mision: formData.mision,
          vision: formData.vision,
          leader: formData.leader,
          budget: parseFloat(formData.budget),
          ...(logoUrl && { logo_url: logoUrl }), // Agregar la URL del logo si existe
        };

        const newUpData = {
          action: "Se Cambio Informacion de Proyecto",
          date: new Date(),
          uid: user.uid,
        };

        await updateDoc(docRef, newData);
        await addDoc(upReference, newUpData);

        // Actualiza el estado local para reflejar los cambios
        setMinistry((prevMinistries) =>
          prevMinistries.map((ministry) =>
            ministry.id === idDocumentos
              ? { ...ministry, ...newData }
              : ministry
          )
        );
        // Forzar la actualización del modal
        handleSupplierChange({ target: { value: idDocumentos } });

        setFormData({
          category: "",
          description: "",
          ministry_name: "",
          mision: "",
          vision: "",
          leader: "",
          budget: "",
        });
        setLogoFile(null); // Reiniciar el estado del logo
        setCurrentLogoUrl(null); // Limpiar la URL del logo
        // Cerrar el modal
        onClose();

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

  useEffect(() => {
    const q = query(collection(db, "ministries"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ministriesData = [];
      let indexs = 1;
      querySnapshot.forEach((doc) => {
        ministriesData.push({ ...doc.data(), indexs: indexs++ });
      });
      setMinistries(ministriesData);
      setFilteredMinistries(ministriesData);
    });

    // Cleanup the listener on unmount
    return () => unsubscribe();
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value.toLowerCase();
    setFilterValue(value);
    setFilteredMinistries(ministries.filter(ministry =>
      ministry.ministry_name.toLowerCase().includes(value) ||
      ministry.leader.toLowerCase().includes(value)
    ));
  };

  return (
    <>
      <div className="espacioU">
        <Head>
          <title>PROYECTOS ACTUALUES</title>
          <meta name="description" content="PROYECTOS ACTUALUES" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/img/logo_paginas.png" />
        </Head>
        <div className="container mx-auto p-10 justify-center items-center h-full">
          <h2 className="text-lg font-semibold mb-2 ">
            <p className="text-center">CORREGIR INFORMACION DE MINISTERIOS</p>

          </h2>
          <div className="flex flex-wrap gap-3">
            {sizes.map((size) => (
              <Button
                className="bg-gradient-to-tr from-pink-500 to-yellow-500 text-white"
                key={size}
                onPress={() => {
                  setSize(size);
                  onOpen();
                }}
              >
                Modificar Ministerio
              </Button>
            ))}
            <Input
              className="w-64"
              placeholder="Buscar por nombre del ministerio o líder..."
              value={filterValue}
              onChange={handleSearchChange}
              mb={4}
            />
          </div>
          <Modal
            size={"full"}
            isOpen={isOpen}
            onClose={handleModalClose}
          >
            <ModalContent>
              {(handleModalClose) => (
                <>
                  <ModalHeader className="flex flex-col gap-1">INGRESE DATOS QUE DESEA CORREGIR</ModalHeader>
                  <ModalBody>
                    <form onSubmit={handleSubmit}>
                      <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 md:grid-cols-3">

                        <div className="mt-2 pr-4">
                          <label
                            className=" block text-sm font-medium leading-6 text-gray-900"
                          >
                            <p className="font-bold text-lg ">MINISTERIO</p>
                          </label>
                          <Select
                            items={ministry}
                            label="Actualizar a:"
                            placeholder="Selecciona un Proyecto"
                            className="max-w-xs"
                            value={selectedMinistry}
                            classNames={{
                              listbox: "max-h-64 overflow-y-auto",
                            }}
                            onChange={handleSupplierChange}
                          >
                            {ministry.map((supplier) => (
                              <SelectItem key={supplier.id} textValue={supplier.name}>
                                <div className="flex gap-2 items-center">
                                  <div className="flex flex-col">
                                    <span className="text-small">{supplier.name}</span>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </Select>
                        </div>

                        <div className="sm:col-span-1">
                          <label
                            className=" block text-sm font-medium leading-6 text-gray-900"
                          >
                            <p className="font-bold text-lg ">CATEGORIA</p>
                          </label>
                          <div className="mt-2 pr-4">
                            <Input
                              isRequired
                              type="text"
                              label="Tipo"
                              id="category"
                              value={formData.category}
                              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                              className="max-w-xs"
                            />
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
                            <Input
                              isRequired
                              type="text"
                              label="Descript."
                              id="description"
                              autoComplete="description"
                              value={formData.description}
                              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                              className="max-w-xs"
                            />
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
                              value={formData.ministry_name}
                              onChange={(e) => setFormData({ ...formData, ministry_name: e.target.value })}
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
                              value={formData.mision}
                              onChange={(e) => setFormData({ ...formData, mision: e.target.value })}
                            >

                            </Textarea>
                          </div>
                        </div>

                        <div className="sm:col-span-1">
                          <label
                            htmlFor="Vision"
                            className="block text-sm font-medium leading-6 text-gray-900"
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
                              value={formData.vision}
                              onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
                            >
                            </Textarea>
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
                              value={formData.leader}
                              onChange={(e) => setFormData({ ...formData, leader: e.target.value })}
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
                              label="$"
                              id="budget"
                              autoComplete="Presupuesto"
                              value={formData.budget}
                              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                              className="max-w-xs"
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-1">
                          <label
                            htmlFor="logo"
                            className="block text-sm font-medium leading-6 text-gray-900"
                          >
                            <a className="font-bold text-lg">Logo del Ministerio</a>
                          </label>
                          <div className="mt-2 pr-4">
                            {currentLogoUrl && (
                              <div className="mb-4">
                                <p className="text-sm text-gray-600">Vista previa del logo actual:</p>
                                <img
                                  src={currentLogoUrl}
                                  alt="Logo del Ministerio"
                                  className="w-32 h-32 object-contain border rounded"
                                />
                              </div>
                            )}
                            <input
                              type="file"
                              id="logo"
                              accept="image/*"
                              onChange={handleLogoChange}
                              className="max-w-xs"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-center p-4">
                        <Progress aria-label="Loading..." size="sm" value={uploadProgress} />
                      </div>

                    </form>

                  </ModalBody>
                  <ModalFooter>
                    <Button color="danger" variant="light" onPress={handleModalClose}>
                      Cerrar
                    </Button>
                    <Button color="primary" onPress={handleSubmit}>
                      Guardar
                    </Button>
                  </ModalFooter>
                </>
              )}
            </ModalContent>
          </Modal>

          <Divider className="my-4" />
          <h2 className="text-lg font-semibold mb-2 ">
            <p className="text-center">PROYECTOS ACTUALUES</p>
          </h2>
          <Divider className="my-4" />
          <ReusableTable data={filteredMinistries} columns={columns} />
        </div>
      </div>
    </>
  );
};

export default MinistryRecordsComponent;
