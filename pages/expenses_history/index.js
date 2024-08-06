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
  updateDoc,
  doc,
  onSnapshot
} from "firebase/firestore";
import { useAuth } from "../../lib/context/AuthContext";
import { useRouter } from "next/router";
import ReusableTable from "../../Components/Form/ReusableTable";
import { columns } from "../../Data/expenses_history/data";
import FilterSection from "../../Components/Form/FilterSectionGastos";
import { startOfDay, endOfDay } from "date-fns";
import { parse, isAfter, isBefore } from "date-fns";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure } from "@nextui-org/react";
import "react-datepicker/dist/react-datepicker.css";
import { CalendarDate, parseDate } from "@internationalized/date";
import { parseZonedDateTime, parseAbsoluteToLocal } from "@internationalized/date";
import { Input, Select, SelectItem, Textarea, DatePicker, Divider } from "@nextui-org/react";

const supliersInfoRef = collection(db, "ministries");
const upReference = collection(db, "updates");

const InformeGastos = () => {

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [size, setSize] = React.useState('md')
  const sizes = ["5xl"];
  const [formValid, setFormValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [filterValue, setFilterValue] = useState("");
  const [ministries, setMinistries] = useState([]);
  const [filteredMinistries, setFilteredMinistries] = useState([]);

  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
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

  const handleOpen = (size) => {
    setSize(size)
    onOpen();
  }

  function handleSupplierChange(event) {
    const selectedSupplierValue = event.target.value;
    // Actualiza el estado con el nuevo valor seleccionado
    setSelectedSupplier(selectedSupplierValue);
    console.log("Seleccionado: ", selectedSupplierValue);
    if (!selectedSupplierValue) {
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
    } else {
      const selectedSupplierData = suppliers.find(supplier => supplier.id === selectedSupplierValue);
      setFormData({
        category: selectedSupplierData.category,
        description: selectedSupplierData.description,
        ministry_name: selectedSupplierData.ministry_name,
        mision: selectedSupplierData.mision,
        vision: selectedSupplierData.vision,
        leader: selectedSupplierData.leader,
        budget: selectedSupplierData.budget,
      });
    }

  }

  //Valida acceso a la pagina
  const router = useRouter();
  const { user, errors, setErrors } = useAuth();
  useEffect(() => {
    if (!user) {
      setErrors("");
      router.push("/auth/Login");
    }
  }, []);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const querySnapshot = await getDocs(supliersInfoRef);

        const supplierData = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          supplierData.push({
            id: doc.id,
            name: data.ministry_name,
            category: data.category,
            description: data.description,
            ministry_name: data.ministry_name,
            mision: data.mision,
            vision: data.vision,
            leader: data.leader,
            budget: data.budget,
          });
        });

        setSuppliers(supplierData);
      } catch (error) {
        console.error("Error fetching suppliers from Firestore:", error);
      }
    };
    fetchSuppliers();
  }, []);

  // Función para guardar datos
  const handleSubmit = async () => {

    if (!guardando) {
      setGuardando(true);

      const idDocumentos = selectedSupplier;

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
        };

        const newUpData = {
          action: "Se Cambio Informacion de Proyecto",
          date: new Date(),
          uid: user.uid,
        };


        await updateDoc(docRef, newData);
        await addDoc(upReference, newUpData);

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
            size={size}
            isOpen={isOpen}
            onClose={onClose}
          >
            <ModalContent>
              {(onClose) => (
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
                            items={suppliers}
                            label="Actualizar a:"
                            placeholder="Selecciona un Proyecto"
                            className="max-w-xs"
                            value={selectedSupplier}

                            onChange={handleSupplierChange}
                          >
                            {suppliers.map((supplier) => (
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
                              label="L"
                              id="budget"
                              autoComplete="Presupuesto"
                              value={formData.budget}
                              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                              className="max-w-xs"
                            />
                          </div>
                        </div>
                      </div>

                    </form>

                  </ModalBody>
                  <ModalFooter>
                    <Button color="danger" variant="light" onPress={onClose}>
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

export default InformeGastos;
