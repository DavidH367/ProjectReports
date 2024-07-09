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
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import "react-datepicker/dist/react-datepicker.css";
import { parseZonedDateTime, parseAbsoluteToLocal } from "@internationalized/date";
import { Card, CardHeader, CardBody, CardFooter, Image, Button, Select, SelectItem, DatePicker } from "@nextui-org/react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Input, Link } from "@nextui-org/react";

const upReference = collection(db, "updates");
const nlpReference = collection(db, "nlp");
const storage = getStorage();

const formatDate = (timestamp) => {
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
};

const Alumnosnlp = () => {
    //Valida acceso a la pagina
    const router = useRouter();
    const { user, errors, setErrors } = useAuth();
    useEffect(() => {
        if (!user) {
            setErrors("");
            router.push("/auth/Login");
        }
    }, [user]);

    const [archivo, setArchivo] = useState(null);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [size, setSize] = React.useState('sm');
    const [scrollBehavior, setScrollBehavior] = React.useState("inside");
    const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();
    const [guardando, setGuardando] = useState(false); // Estado para controlar el botón
    const [formValid, setFormValid] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [alumnos, setAlumnos] = useState([]);
    const [selectedAlumno, setSelectedAlumno] = useState(null);
    const [selectKey, setSelectKey] = useState(0);
    const [suppliers, setSuppliers] = useState([]);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [formData, setFormData] = useState({
        firstname: "",
        lastname: "",
        age: "",
        grade: "",
        date: null,
        indate: "",
        father: "",
        mother: "",
        household: "",
        siblings: "",
        co_siblings: "",
        sponsor_code: ""
    });

    const [date, setDate] = useState(null);
    const [sponsor_code, setSponsor_code] = useState("N/A");

    const grades = [
        { key: "1st grade", label: "1st grade" },
        { key: "2nd grade", label: "2nd grade" },
        { key: "3rd grade", label: "3rd grade" },
        { key: "5th grade", label: "5th grade" },
        { key: "6th grade", label: "6th grade" },
        { key: "7th grade", label: "7th grade" },
        { key: "8th grade", label: "8th grade" },
        { key: "9th grade", label: "9th grade" },
        { key: "10th grade", label: "10th grade" },
        { key: "11th grade", label: "11th grade" },
    ];

    useEffect(() => {
        if (!user) {
            setErrors("");
            router.push("/auth/Login");
        }
    }, [user]);

    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                const querySnapshot = await getDocs(nlpReference);

                const supplierData = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    supplierData.push({
                        id: doc.id,
                        firstname: data.firstname,
                        lastname: data.lastname,
                        age: data.age,
                        grade: data.grade,
                        date: data.date,
                        indate: data.indate,
                        //imageurl: data.imageurl,
                        sponsor_code: data.sponsor_code,
                        father: data.father,
                        mother: data.mother,
                        household: data.household,
                        siblings: data.siblings,
                        co_siblings: data.co_siblings,
                    });
                });

                setSuppliers(supplierData);
            } catch (error) {
                console.error("Error fetching suppliers from Firestore:", error);
            }
        };
        fetchSuppliers();
    }, [nlpReference]);

    function handleSupplierChange(event) {
        const selectedSupplierValue = event.target.value;
        // Actualiza el estado con el nuevo valor seleccionado
        setSelectedSupplier(selectedSupplierValue);
        console.log("Seleccionado: ", selectedSupplierValue);
        if (!selectedSupplierValue) {
            // Si no hay valor seleccionado, limpia el formulario
            setFormData({
                firstname: "",
                lastname: "",
                age: "",
                grade: null,
                date: null,
                indate: "",
                father: "",
                mother: "",
                household: "",
                siblings: "",
                co_siblings: "",
                sponsor_code: "",
            });
        } else {
            const selectedSupplierData = suppliers.find(supplier => supplier.id === selectedSupplierValue);
            setFormData({
                firstname: selectedSupplierData.firstname,
                lastname: selectedSupplierData.lastname,
                age: selectedSupplierData.age,
                grade: selectedSupplierData.grade,
                indate: selectedSupplierData.indate,
                father: selectedSupplierData.father,
                mother: selectedSupplierData.mother,
                household: selectedSupplierData.household,
                siblings: selectedSupplierData.siblings,
                co_siblings: selectedSupplierData.co_siblings,
                sponsor_code: selectedSupplierData.sponsor_code,
            });
        }
    }

    useEffect(() => {
        const fetchAlumnos = async () => {
            const alumnosCollection = collection(db, 'nlp');
            const alumnosSnapshot = await getDocs(alumnosCollection);
            const alumnosList = alumnosSnapshot.docs.map(doc => doc.data());
            setAlumnos(alumnosList);
        };

        fetchAlumnos();
    }, []);

    const handleOpen = (alumno) => {
        setSelectedAlumno(alumno);
        onOpen();
    };

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
    const handleAddAlumno = async () => {
        if (!guardando) {
            setGuardando(true);

            const idDocumentos = selectedSupplier;

            // Verificar si los campos obligatorios están llenos
            if (
                !formData.firstname ||
                !formData.lastname ||
                !formData.age ||
                !formData.grade ||
                !date ||
                !formData.indate 
            ) {
                setFormValid(false);
                setErrorMessage("Por favor, complete todos los campos obligatorios.");
                setGuardando(false);
                return; // No enviar el formulario si falta algún campo obligatorio
            }

            // Verificar y establecer sponsor_code
            if (!sponsor_code) {
                setSponsor_code("N/A");
            }

            try {

                const docRef = doc(supliersInfoRef, idDocumentos);

                let logoUrl = "";
                if (archivo) {
                    const archivoRef = ref(storage, `imagenes/imagenes/nlp/alumnos/${archivo.name}`);
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
                    firstname: formData.firstname,
                    lastname: formData.lastname,
                    age: parseFloat(formData.age),
                    grade: formData.grade,
                    date: calendarDateToUTC(date),
                    imageurl: logoUrl,
                    indate: parseFloat(formData.indate),
                    father: formData.father,
                    mother: formData.mother,
                    household: parseFloat(formData.household),
                    siblings: parseFloat(formData.siblings),
                    co_siblings: parseFloat(formData.co_siblings),
                    sponsor_code: formData.sponsor_code,
                };

                const newUpData = {
                    action: "Registra Nuevo Alumno NLP",
                    date: new Date(),
                    uid: user.uid,
                };

                const newUpData2 = {
                    action: "Actualiza Alumno NLP",
                    date: new Date(),
                    uid: user.uid,
                };

                if (selectedSupplier) {
                    // Actualizar el documento existente
                    const docRef = doc(nlpReference, selectedSupplier.id);
                    await updateDoc(docRef, newData);
                    await addDoc(upReference, newUpData2);
                } else {
                    // Crear un nuevo documento
                    await addDoc(nlpReference, newData);
                    await addDoc(upReference, newUpData);
                }
    
                setSelectKey(prevKey => prevKey + 1);
                setArchivo(null);
                setDate(null);
                setFormData({
                    firstname: '',
                    lastname: '',
                    age: '',
                    grade: '',
                    date: '',
                    indate: '',
                    father: '',
                    mother: '',
                    household: '',
                    siblings: '',
                    co_siblings: '',
                    sponsor_code: ''
                });
                
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
        <>
            <div className="espacioU">
                <Head>
                    <title>ALUMNOS REGISTRADOS EN PROYECTO NUEVA VIDA</title>
                    <meta name="description" content="ACTUALIZACIONES DE ACTIVIDADES" />
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                    <link rel="icon" href="/img/logo_paginas.png" />
                </Head>
                <div className="container mx-auto p-10 justify-center items-center h-full">
                    <h2 className="text-lg font-semibold mb-2 text-center">
                        ALUMNOS REGISTRADOS EN PROYECTO NUEVA VIDA
                    </h2>
                    <div className="grid justify-items-center">
                        <div className="p-4">
                            <Button
                                className="text-black text-tiny font-bold w-40 h-10 rounded-md bg-gray-300 "
                                onPress={onAddOpen}>
                                Registrar Nuevo Alumno
                            </Button>
                            <Modal
                                size="md"
                                isOpen={isAddOpen}
                                onClose={onAddClose}
                                scrollBehavior="inside"
                            >
                                <ModalContent>
                                    {() => (
                                        <>
                                            <ModalHeader className="text-center flex flex-col gap-1">Registrar Nuevo Alumno</ModalHeader>
                                            <ModalBody>
                                                <div className="grid gap-1 grid-cols-1">
                                                    <div className="sm:col-span-1">
                                                        <label
                                                            className=" block text-sm font-medium leading-6 text-gray-900"
                                                        >
                                                            <p className="font-bold text-lg ">Actualizar Info Alumnos</p>
                                                            <p className="font-light text-tiny ">Selecciona para Actualizar ó Deseleccionar para Agregar:</p>
                                                        </label>

                                                        <div className="mt-2 pr-4">
                                                            <Select
                                                                key={selectKey} // Clave para forzar re-renderizado
                                                                items={suppliers}
                                                                label="Actualizar a:"
                                                                placeholder="Selecciona un Alumno"
                                                                className="max-w-xs"
                                                                value={selectedSupplier}

                                                                onChange={handleSupplierChange}
                                                            >
                                                                {suppliers.map((supplier) => (
                                                                    <SelectItem key={supplier.id} textValue={`${supplier.firstname} ${supplier.lastname}`} >
                                                                        <div className="flex gap-2 items-center">
                                                                            <div className="flex flex-col">
                                                                                <span className="text-small">{supplier.firstname} {supplier.lastname}</span>
                                                                            </div>
                                                                        </div>
                                                                    </SelectItem>
                                                                ))}
                                                            </Select>
                                                        </div>
                                                    </div>
                                                    <label
                                                        className=" block text-sm font-medium leading-6 text-gray-900"
                                                    >
                                                        <p className="font text-md p-4">Informacion Personal del Alumno </p>
                                                    </label>
                                                    <Input
                                                        className="w-64"
                                                        isRequired
                                                        label="First Name"
                                                        id="firstname"
                                                        value={formData.firstname}
                                                        onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                                                    />
                                                    <Input
                                                        className="w-64"
                                                        isRequired
                                                        label="Last Name"
                                                        id="lastname"
                                                        value={formData.lastname}
                                                        onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                                                    />
                                                    <Input
                                                        className="w-64"
                                                        isRequired
                                                        label="Age"
                                                        type="number"
                                                        id="age"
                                                        value={formData.age}
                                                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                                    />
                                                    <Select
                                                        isRequired
                                                        key={selectKey}
                                                        id="grade"
                                                        value={formData.grade || ""}
                                                        label="Select Grade"
                                                        className="max-w-xs w-64"
                                                        onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                                                    >
                                                        {grades.map((grade) => (
                                                            <SelectItem key={grade.key}>
                                                                {grade.label}
                                                            </SelectItem>
                                                        ))}
                                                    </Select>
                                                    <DatePicker
                                                        className="w-64"
                                                        isRequired
                                                        id="date"
                                                        label="Fecha de Nacimiento"
                                                        variant="bordered"
                                                        showMonthAndYearPickers
                                                        granularity="day"
                                                        defaultValue={parseZonedDateTime("2022-11-07T00:45[America/Los_Angeles]")}
                                                        value={date}
                                                        onChange={setDate}
                                                        placeholderText="Fecha de Nacimiento"
                                                        dateFormat="dd/MM/yyyy"
                                                    />
                                                    <div className="sm:col-span-1 py-4">
                                                        <label

                                                            className="block text-sm leading-6 text-gray-900"
                                                        >
                                                            <a className="text-sm font-medium">Fotografia</a>
                                                        </label>
                                                        <div className="mt-2 pr-4">
                                                            <input
                                                                type="file"
                                                                id="logo"
                                                                onChange={handleChange}
                                                                className="w-64 block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none mt-2 pr-4"
                                                            />
                                                        </div>
                                                    </div>

                                                    <Input
                                                        className="w-64"
                                                        isRequired
                                                        label="Year Entered"
                                                        placeholder="2024"
                                                        type="number"
                                                        id="indate"
                                                        value={formData.indate}
                                                        onChange={(e) => setFormData({ ...formData, indate: e.target.value })}/>

                                                    <Input
                                                        className="w-64"
                                                        label="Sponsor Code"
                                                        id="sponsor_code"
                                                        value={formData.sponsor_code}
                                                        onChange={(e) => setFormData({ ...formData, sponsor_code: e.target.value })} />
                                                    <label
                                                        className=" block text-sm font-medium leading-6 text-gray-900"
                                                    >
                                                        <p className="font text-md p-4">Informacion  de Hogar </p>
                                                    </label>
                                                    <Input
                                                        className="w-64"
                                                        label="Father's FullName"
                                                        id="father"
                                                        value={formData.father}
                                                        onChange={(e) => setFormData({ ...formData, father: e.target.value })} />
                                                    <Input
                                                        className="w-64"
                                                        label="Mother's FullName"
                                                        id="mother"
                                                        value={formData.mother}
                                                        onChange={(e) => setFormData({ ...formData, mother: e.target.value })} />
                                                    <Input
                                                        className="w-64"
                                                        label="Households"
                                                        type="number"
                                                        id="household"
                                                        value={formData.household}
                                                        onChange={(e) => setFormData({ ...formData, household: e.target.value })} />
                                                    <Input
                                                        className="w-64"
                                                        label="Siblings"
                                                        type="number"
                                                        id="siblings"
                                                        value={formData.siblings}
                                                        onChange={(e) => setFormData({ ...formData, siblings: e.target.value })} />
                                                    <Input
                                                        className="w-64"
                                                        label="Siblings in the New Life Project"
                                                        type="number"
                                                        id="co_siblings"
                                                        value={formData.co_siblings}
                                                        onChange={(e) => setFormData({ ...formData, co_siblings: e.target.value })} />
                                                </div>
                                            </ModalBody>
                                            <ModalFooter>
                                                <Button color="danger" variant="light" onPress={onAddClose}>
                                                    Cancel
                                                </Button>
                                                <Button color="primary" onPress={handleAddAlumno}>
                                                    Save
                                                </Button>
                                            </ModalFooter>
                                        </>
                                    )}
                                </ModalContent>
                            </Modal>
                        </div>
                    </div>
                    <div className="p-1 grid grid-cols-4 gap-1">
                        {alumnos.map((alumno, index) => (
                            <div key={index}>
                                <Card isFooterBlurred className="w-52 h-full col-span-12 sm:col-span-5">
                                    <CardHeader className="absolute z-10 top-1 flex-col items-start">
                                        <p className="text-tiny text-white/70 uppercase">{alumno.age} years old</p>
                                        <h4 className="text-white text-tiny font-bold uppercase text-sm">{alumno.firstname} {alumno.lastname}</h4>
                                    </CardHeader>
                                    <Image
                                        removeWrapper
                                        alt="Card example background"
                                        className="z-0 w-full h-full scale-125 -translate-y-6 object-cover"
                                        src={alumno.imageurl}
                                    />
                                    <CardFooter className="absolute bg-white/30 bottom-0 border-t-0 border-zinc-100/50 z-10 grid justify-items-center text-center">
                                        <div>
                                            <p className="text-black text-tiny"> Sponsor Code: N° {alumno.sponsor_code} </p>
                                            <p className="text-black text-tiny font-bold "> Born: {formatDate(alumno.date)}</p>

                                            <div className="grid justify-items-center">
                                                <div className="py-1">
                                                    <Button
                                                        className="text-black text-tiny w-16 h-6 rounded-md bg-white "
                                                        onPress={() => handleOpen(alumno)}>
                                                        More Info
                                                    </Button>
                                                </div>
                                            </div>

                                        </div>
                                    </CardFooter>
                                </Card>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {selectedAlumno && (
                <Modal
                    size="md"
                    isOpen={isOpen}
                    onClose={onClose}
                    scrollBehavior="inside"
                >
                    <ModalContent>
                        {() => (
                            <>
                                <ModalHeader className="text-center flex flex-col gap-1">{selectedAlumno.firstname} {selectedAlumno.lastname}</ModalHeader>
                                <ModalBody>
                                    <Image
                                        removeWrapper
                                        alt="Child Cards"
                                        className="z-0 w-[250px] h-[300px] scale-90 -translate-y-6 translate-x-20 object-cover"
                                        src={selectedAlumno.imageurl}
                                    />
                                    <div className="grid gap-1 grid-cols-1 text-center">
                                        <p className="font-sans text-base font-bold">Personal Information</p>
                                        <p className="text-sm ">Sponsor Code: N°{selectedAlumno.sponsor_code}</p>
                                        <p className="text-sm ">Age: {selectedAlumno.age} years old</p>
                                        <p className="text-sm">Grade: {selectedAlumno.grade}</p>
                                        <p className="text-sm">Born: {formatDate(selectedAlumno.date)}</p>
                                        <p className="text-sm">Year entered: {selectedAlumno.indate}</p>
                                    </div>
                                    <div className="grid gap-1 grid-cols-1 text-center">
                                        <p className="text-base font-bold">Condition of Living</p>
                                        <p className="text-sm">Father's Name: {selectedAlumno.father}</p>
                                        <p className="text-sm">Mother's Name: {selectedAlumno.mother}</p>
                                        <p className="text-sm">People living in the household: {selectedAlumno.household}</p>
                                        <p className="text-sm">Siblings: {selectedAlumno.siblings}</p>
                                        <p className="text-sm">Siblings in the New Life Project: {selectedAlumno.co_siblings}</p>
                                    </div>
                                </ModalBody>
                                <ModalFooter>
                                    <Button color="danger" variant="light" onPress={onClose}>
                                        Close
                                    </Button>
                                    <Button color="primary" onPress={onClose}>
                                        Support Him
                                    </Button>
                                </ModalFooter>
                            </>
                        )}
                    </ModalContent>
                </Modal>
            )}
        </>
    );
};

export default Alumnosnlp;