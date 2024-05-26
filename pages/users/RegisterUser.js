import React, { useState, useEffect } from "react";
import Head from "next/head";
import "firebase/firestore";
import { Input, Chip } from "@nextui-org/react";
import { useRouter } from "next/router";
import { useAuth } from "../../lib/context/AuthContext";
import addNewUser from "../../lib/firebase/firebaseNewUser";
import { registrerWithEmail } from "../../lib/firebase/firebaseAuth";
import {
  addDoc,
  collection,
  getDocs,
  doc,
  updateDoc
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import {
  validateCellphone,
  ValidateEmail,
  validateString,
} from "../../lib/Validators";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure } from "@nextui-org/react";
import { Select, SelectItem, Textarea, DatePicker, Divider } from "@nextui-org/react";

const supliersInfoRef = collection(db, "users");
const upReference = collection(db, "updates");

const UserRegister = () => {
//seccion para Actualizar Roles
const { isOpen, onOpen, onClose } = useDisclosure();
const [size, setSize] = React.useState('md')
const sizes = ["5xl"];
const [formValid, setFormValid] = useState(true);
const [errorMessage, setErrorMessage] = useState("");

const [suppliers, setSuppliers] = useState([]);
const [selectedSupplier, setSelectedSupplier] = useState(null);
const [formData, setFormData] = useState({
  firstName: "",
  lastName: "",
  role: "",
});

function handleSupplierChange(event) {
  const selectedSupplierValue = event.target.value;
  // Actualiza el estado con el nuevo valor seleccionado
  setSelectedSupplier(selectedSupplierValue);
  console.log("Seleccionado: ", selectedSupplierValue);
  if (!selectedSupplierValue) {
    // Si no hay valor seleccionado, limpia el formulario
    setFormData({
      firstName: "",
      lastName: "",
      role: "",
    });
  } else {
    const selectedSupplierData = suppliers.find(supplier => supplier.id === selectedSupplierValue);
    setFormData({
      firstName: selectedSupplierData.firstName,
      lastName: selectedSupplierData.lastName,
      role: selectedSupplierData.role,
    });
  }
}

//estado para formulario
const [guardando, setGuardando] = useState(false); // Estado para controlar el botón

const handleOpen = (size) => {
  setSize(size)
  onOpen();
}

//Seccion para crear Usario
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [userRole, setUserRole] = useState("OPERARIO");
  const [userState, setUserState] = useState("ACTIVO");
  const router = useRouter();
  const { user, logout, errors, setErrors } = useAuth();

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const querySnapshot = await getDocs(supliersInfoRef);

        const supplierData = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          supplierData.push({
            id: doc.id,
            name: data.displayName,
            firstName: data.firstName,
            lastName: data.lastName,
            role: data.role,
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
  const handleSubmit2 = async () => {

    if (!guardando) {
      setGuardando(true);

      const idDocumentos = selectedSupplier;
      
      // Verificar si los campos obligatorios están llenos
      if (
        !formData.firstName ||
        !formData.lastName ||
        !formData.role 
      ) {
        setFormValid(false);
        setErrorMessage("Por favor, complete todos los campos obligatorios.");
        return; // No enviar el formulario si falta algún campo obligatorio
      }
      try {
        //id del usuario
        const docRef = doc(supliersInfoRef, idDocumentos);

        const newData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
          displayName: `${formData.firstName.toUpperCase()} ${formData.lastName.toUpperCase()}`,
        };

        const newUpData = {
          action: "Se Modifico Rol de Usuario",
          date: new Date(),
          uid: user.uid,
        };

        await updateDoc(docRef, newData);
        await addDoc(upReference, newUpData);


        window.location.reload();
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
    if (!user) {
      setErrors("");
      router.push("/auth/Login");
    }
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem("user");
    const logoutUser = await logout();
    if (logoutUser) {
      router.push("/auth/Login");
      return;
    }
  };
  const handleSubmit = async () => {
    if (firstName === "") {
      setErrors("El nombre no puede estar vacío");
      return;
    }
    if (!validateString(firstName)) {
      setErrors("Nombre incorrecto");
      return;
    }
    if (lastName === "") {
      setErrors("El apellido no puede estar vacío");
      return;
    }
    if (!validateString(lastName)) {
      setErrors("Apellido incorrecto");
      return;
    }
    if (phoneNumber === "") {
      setErrors("El número de teléfono no puede estar vacío");
      return;
    }
    if (!validateCellphone(phoneNumber)) {
      setErrors("Número de teléfono incorrecto");
      return;
    }
    if (email === "") {
      setErrors("El correo electrónico no puede estar vacío");
      return;
    }
    if (!ValidateEmail(email)) {
      setErrors("Correo electrónico incorrecto");
      return;
    }
    const password = "MEBN2024!";
    const { user, error } = await registrerWithEmail(email, password);
    if (error != null) {
      console.log("error", error);
      alert("error: ", error);
    } else {
      await addNewUser(
        user,
        firstName,
        lastName,
        phoneNumber,
        userRole,
        userState
      );
      const newUpData = {
        action: "Se Creo un Nuevo Usuario",
        date: new Date(),
        uid: user.uid,
      };
      await addDoc(upReference, newUpData);

      handleLogout();
    }
  };
  return (
    <div className="espacioU">
      <Head>
        <title>REGISTRO DE USUARIOS</title>
        <meta name="description" content="REGISTRO DE USUARIOS" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/img/logo_paginas.png" />
      </Head>
      <div className="container mx-auto p-10 justify-center items-center h-full">
        <div className="px-8 bg-white shadow rounded-lg shadow-lg  p-4 box-border h-400 w-800 p-2 border-4 ">
          <h2 className="text-lg font-semibold mb-2 ">
            <p className="text-center">REGISTRO DE USUARIOS</p>
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            POR FAVOR LLENAR TODOS LOS CAMPOS NECESARIOS
          </p>

          <div className="flex flex-wrap gap-3">
            {sizes.map((size) => (
              <Button key={size} onPress={() => handleOpen(size)}>Modificar Usuario</Button>
            ))}
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
                    <form onSubmit={handleSubmit2}>
                      <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 md:grid-cols-3">
                        <div className="mt-2 pr-4">
                          <Select
                            items={suppliers}
                            label="Actualizar a:"
                            placeholder="Selecciona un Usuario"
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
                            <p className="font-bold text-lg ">NOMBRE</p>
                          </label>
                          <div className="mt-2 pr-4">
                            <Input
                              isRequired
                              type="text"
                              label="Tipo"
                              id="firstName"
                              value={formData.firstName}
                              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                              className="max-w-xs"
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-1">
                          <label
                            className=" block text-sm font-medium leading-6 text-gray-900"
                          >
                            <p className="font-bold text-lg ">APELLIDO</p>
                          </label>
                          <div className="mt-2 pr-4">
                            <Input
                              isRequired
                              type="text"
                              label="Tipo"
                              id="lastName"
                              value={formData.lastName}
                              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                              className="max-w-xs"
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-1">
                          <label
                            className=" block text-sm font-medium leading-6 text-gray-900"
                          >
                            <p className="font-bold text-lg ">ROL</p>
                          </label>
                          <div className="mt-2 pr-4">
                            <Input
                              isRequired
                              type="text"
                              label="Tipo"
                              id="role"
                              value={formData.role}
                              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
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
                    <Button color="primary" onPress={handleSubmit2}>
                      Guardar
                    </Button>
                  </ModalFooter>
                </>
              )}
            </ModalContent>
          </Modal>

          <Divider className="my-4" />

          <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 md:grid-cols-3">
            <div className="sm:col-span-1">
              <label
                htmlFor="nombre"
                className=" block text-sm font-medium leading-6 text-gray-900"
              >
                <p className="font-bold text-lg">Nombre</p>
              </label>
              <div className="mt-2 pr-4">
                <Input
                  isRequired
                  label="Ej: David"
                  type="text"
                  name="nombre"
                  id="nombre"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="max-w-xs"
                />
              </div>
            </div>

            <div className="sm:col-span-1">
              <label
                htmlFor="apellido"
                className=" block text-sm font-medium leading-6 text-gray-900"
              >
                <p className="font-bold text-lg">Apellido</p>
              </label>
              <div className="mt-2 pr-4">
                <Input
                  isRequired
                  label="Ej: Hernández"
                  type="text"
                  name="apellido"
                  id="apellido"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="max-w-xs"
                />
              </div>
            </div>

            <div className="sm:col-span-1">
              <label
                htmlFor="telefono"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                <a className="font-bold text-lg">Numero de teléfono</a>
              </label>
              <div className="mt-2 pr-4">
                <Input
                  isRequired
                  label="Ej: 96365214"
                  type="numeric"
                  name="telefono"
                  id="telefono"
                  value={phoneNumber
                    .replace(/[^0-9]/g, "")
                    .replace(/(\d{4})(\d{4})/, "$1-$2")
                    .slice(0, 9)}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="max-w-xs"
                />
              </div>
            </div>

            <div className="sm:col-span-1">
              <label
                htmlFor="email"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                <a className="font-bold text-lg">Correo Electrónico</a>
              </label>
              <div className="mt-2 pr-4">
                <Input
                  isRequired
                  label="Ej: <EMAIL>"
                  type="email"
                  name="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="max-w-xs"
                />
              </div>
            </div>
            <div className="sm:col-span-1 mt-5">
              {errors ? (
                <Chip color="warning" variant="flat" className="mb-3">
                  <span className="form-errors">{errors}</span>
                </Chip>
              ) : null}
              <div>
                <button
                  onClick={handleSubmit}
                  className="h-9 w-40 rounded-lg bg-indigo-600 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Guardar
                </button>
              </div>
            </div>

            
            
          </div>
          
        </div>
        
      </div>
    </div>
  );
};

export default UserRegister;
