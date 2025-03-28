import React, { useState, useEffect } from "react";
import Head from "next/head";
import "firebase/firestore";
import { db } from "../../lib/firebase";
import {
    addDoc,
    collection,
    getDocs,
    doc,
    updateDoc,
    onSnapshot
} from "firebase/firestore";
import { useAuth } from "../../lib/context/AuthContext";
import { useRouter } from "next/router";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import "react-datepicker/dist/react-datepicker.css";
import { Card, CardHeader, CardBody, CardFooter, Image, Button, Select, SelectItem, Chip, Avatar, Skeleton } from "@nextui-org/react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Input, Link, Switch, RadioGroup, Radio } from "@nextui-org/react";
import { Timestamp } from "firebase/firestore"; // Importar Timestamp desde firestore
import { DateInput } from "@nextui-org/react"; // Importar DatePicker de NextUI

const upReference = collection(db, "updates");
const nlpSchoolReference = collection(db, "nlp");
const nlpSponsorReference = collection(db, "sponsors");
const storage = getStorage();

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

    const { isOpen, onOpen, onClose } = useDisclosure();
    const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();
    const { isOpen: isModOpen, onOpen: onModOpen, onClose: onModClose } = useDisclosure();
    const [scrollBehavior, setScrollBehavior] = React.useState("inside");
    const [guardando, setGuardando] = useState(false); // Estado para controlar el botón
    const [formValid, setFormValid] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [previewImage, setPreviewImage] = useState(null); // Vista previa de la imagen

    const statusColorMap = {
        Activo: "success",
        Inactivo: "warning",
        Egresó: "danger",
        Expulsión: "default",
    };

    const [alumnos, setAlumnos] = useState([]);
    const [selectedAlumno, setSelectedAlumno] = useState(null);
    const [alumnosnlp, setAlumnosNLP] = useState([]);
    const [sponsors, setSponsors] = useState([]);
    const [selectedSponsors, setSelectedSponsors] = useState(null);
    const [selectedAlumnoNLP, setSelectedAlumnoNLP] = useState(null);
    const [formData, setFormData] = useState({
        firstname: "",
        lastname: "",
        age: "",
        grade: "",
        imageurl: "",
        date: null,
        indate: "",
        father: "",
        mother: "",
        household: "",
        siblings: "",
        co_siblings: "",
        sponsor_code: "",
        status: ""
    });
    const [firstname, setFirstname] = useState("");
    const [lastname, setLastname] = useState("");
    const [age, setAge] = useState("");
    const [grade, setGrade] = useState("");
    const [imageurl, setImageurl] = useState("");
    const [date, setDate] = useState(null);
    const [archivo, setArchivo] = useState(null);
    const [indate, setIndate] = useState("");
    const [sponsor_code, setSponsor_code] = useState("N/A");
    const [father, setFather] = useState("");
    const [mother, setMother] = useState("");
    const [household, setHousehold] = useState("");
    const [siblings, setSiblings] = useState("");
    const [co_siblings, setCo_siblings] = useState("");
    const [status, setStatus] = useState("");
    const [selectKey, setSelectKey] = useState(0);
    const [selectKey2, setSelectKey2] = useState(100000);
    const grades = [
        { key: "1st grade", label: "1st grade" },
        { key: "2nd grade", label: "2nd grade" },
        { key: "3rd grade", label: "3rd grade" },
        { key: "4th grade", label: "4th grade" },
        { key: "5th grade", label: "5th grade" },
        { key: "6th grade", label: "6th grade" },
        { key: "7th grade", label: "7th grade" },
        { key: "8th grade", label: "8th grade" },
        { key: "9th grade", label: "9th grade" },
        { key: "10th grade", label: "10th grade" },
        { key: "11th grade", label: "11th grade" },
    ];

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const [filterValue, setFilterValue] = useState("");

    useEffect(() => {
        const fetchAlumnosNLP = async () => {
            try {
                const querySnapshot = await getDocs(nlpSchoolReference);

                const alumnoData = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    alumnoData.push({
                        id: doc.id,
                        firstname: data.firstname,
                        lastname: data.lastname,
                        age: data.age,
                        grade: data.grade,
                        imageurl: data.imageurl,
                        date: data.date,
                        indate: data.indate,
                        sponsor_code: data.sponsor_code,
                        father: data.father,
                        mother: data.mother,
                        household: data.household,
                        siblings: data.siblings,
                        co_siblings: data.co_siblings,
                        status: data.status,
                    });
                });

                setAlumnosNLP(alumnoData);
            } catch (error) {
                console.error("Error fetching suppliers from Firestore:", error);
            }
        };
        fetchAlumnosNLP();
    }, [nlpSchoolReference]);

    useEffect(() => {
        const fetchSponsors = async () => {
            try {
                const querySnapshot = await getDocs(nlpSponsorReference);

                const sponsorsData = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    sponsorsData.push({
                        id: doc.id,
                        fullname: data.fullname,
                        email: data.email,
                        payment_type: data.payment_type,
                        status: data.status,
                        code: data.code,
                        address: data.address,
                        church: data.church,
                    });
                });

                setSponsors(sponsorsData);
            } catch (error) {
                console.error("Error fetching suppliers from Firestore:", error);
            }
        };
        fetchSponsors();
    }, [nlpSponsorReference]);

    function handleAlumnoChange(event) {
        const selectedAlumnoValue = event.target.value;
        // Actualiza el estado con el nuevo valor seleccionado
        setSelectedAlumnoNLP(selectedAlumnoValue);

        if (!selectedAlumnoValue) {
            // Limpiar formulario después de la actualización
            resetForm();
        } else {
            const selectedAlumnoData = alumnosnlp.find(supplier => supplier.id === selectedAlumnoValue);

            const dateOfBirth = selectedAlumnoData.date instanceof Timestamp
                ? selectedAlumnoData.date.toDate() // Convertir Timestamp a Date
                : selectedAlumnoData.date;

            setFormData({
                firstname: selectedAlumnoData.firstname,
                lastname: selectedAlumnoData.lastname,
                age: selectedAlumnoData.age,
                grade: selectedAlumnoData.grade,
                imageurl: selectedAlumnoData.imageurl,
                date: dateOfBirth,
                indate: selectedAlumnoData.indate,
                sponsor_code: selectedAlumnoData.sponsor_code,
                father: selectedAlumnoData.father,
                mother: selectedAlumnoData.mother,
                household: selectedAlumnoData.household,
                siblings: selectedAlumnoData.siblings,
                co_siblings: selectedAlumnoData.co_siblings,
                status: selectedAlumnoData.status,
            });
            // Convierte la marca de tiempo Firestore a objeto Date y establece el estado
        }
    }

    useEffect(() => {
        // Configurar el listener de Firestore
        const alumnosCollection = collection(db, 'nlp');
        const unsubscribe = onSnapshot(alumnosCollection, (snapshot) => {
            const alumnosList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setAlumnos(alumnosList);
        });
        // Cleanup the listener on unmount
        return () => unsubscribe();
    }, []);

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const handleSearchChange = (e) => {
        setFilterValue(e.target.value);
        setCurrentPage(1);
    };
    const filteredAlumnos = alumnos.filter(alumno =>
        alumno.firstname.toLowerCase().includes(filterValue.toLowerCase()) ||
        alumno.lastname.toLowerCase().includes(filterValue.toLowerCase())
    );
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredAlumnos.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredAlumnos.length / itemsPerPage);


    const handleOpen = (alumno) => {
        const formattedAlumno = {
            ...alumno,
            date: alumno.date ? formatDate2(alumno.date) : null,
        }
        setSelectedAlumno(formattedAlumno);
        onOpen();
    };

    const handleChange = (event) => {
        const archivo = event.target.files[0];
        setArchivo(archivo);

        // Generar una vista previa de la imagen
        if (archivo) {
            const reader = new FileReader();
            reader.onload = () => {
                setPreviewImage(reader.result); // Guardar la URL de la vista previa
            };
            reader.readAsDataURL(archivo);
        } else {
            setPreviewImage(null); // Limpiar la vista previa si no hay archivo
        }
    };
    // Función para convertir CalendarDate a Date
    const calendarDateToUTC = (calendarDate) => {
        const date = new Date(Date.UTC(calendarDate.year, calendarDate.month - 1, calendarDate.day));
        return date;
    };
    const formatDate2 = (timestamp) => {
        const date = timestamp instanceof Date ? timestamp : new Date(timestamp.seconds * 1000);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Meses en JavaScript son de 0-11
        const day = date.getDate().toString().padStart(2, "0");

        return `${day}-${month}-${year}`;
    };

    //Funcion para convertir marcas de tiempo a texto
    const formatDate = (date) => {
        if (!date) return "";
        let parsedDate;

        // Verifica si es un objeto Date
        if (date instanceof Date) {
            parsedDate = date;
        } else if (date.seconds && date.nanoseconds) {
            // Verifica si es un objeto Timestamp (Firestore)
            parsedDate = new Date(date.seconds * 1000);
        } else {
            return "Invalid Date"; // Maneja el caso de formato no esperado
        }

        const year = parsedDate.getFullYear();
        const month = (parsedDate.getMonth() + 1).toString().padStart(2, "0");
        const day = parsedDate.getDate().toString().padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    const handleModalClose = () => {
        // Restablecer los valores del formulario
        setSelectKey(prevKey => prevKey + 1);
        setSelectKey2(prevKey => prevKey + 1);
        setArchivo(null);
        setDate(null);
        setFirstname("");
        setLastname("");
        setAge("");
        setGrade("");
        setIndate("");
        setSponsor_code("");
        setFather("");
        setMother("");
        setHousehold("");
        setSiblings("");
        setCo_siblings("");
        // Cerrar el modal
        onAddClose();
    };

    const handleModalClose2 = () => {
        resetForm();
        setErrorMessage("");
        // Cerrar el modal
        onModClose();
    };

    // Función para Agregar datos
    const handleAddAlumno = async () => {
        if (!guardando) {
            setGuardando(true);

            // Verificar si los campos obligatorios están llenos
            if (
                !firstname ||
                !lastname ||
                !age ||
                !grade ||
                !indate
            ) {
                setErrorMessage("Por favor, complete todos los campos obligatorios.");
                setFormValid(false);
                setGuardando(false);
                return; // No enviar el formulario si falta algún campo obligatorio
            }

            // Verificar y establecer sponsor_code
            if (!sponsor_code) {
                setSponsor_code("N/A");
            }

            try {
                let logoUrl = "";
                if (archivo) {
                    const archivoRef = ref(storage, `imagenes/imagenes/nlp/alumnos/${archivo.name}`);
                    const uploadTask = uploadBytesResumable(archivoRef, archivo);

                    logoUrl = await new Promise((resolve, reject) => {
                        uploadTask.on(
                            "state_changed",
                            (snapshot) => { },
                            (error) => reject(error),
                            async () => {
                                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                                resolve(downloadURL);
                            }
                        );
                    });
                }

                const newData = {
                    firstname: firstname,
                    lastname: lastname,
                    age: parseFloat(age),
                    grade: grade,
                    date: calendarDateToUTC(date),
                    imageurl: logoUrl,
                    indate: parseFloat(indate),
                    father: father,
                    mother: mother,
                    household: parseFloat(household),
                    siblings: parseFloat(siblings),
                    co_siblings: parseFloat(co_siblings),
                    sponsor_code: sponsor_code,
                    status: status,
                };

                const newUpData = {
                    action: "Registra Nuevo Alumno NLP",
                    date: new Date(),
                    uid: user.uid,
                };

                // Crear un nuevo documento
                await addDoc(nlpSchoolReference, newData);
                await addDoc(upReference, newUpData);

                // Actualizar el estado de alumnosnlp con el nuevo alumno
                setAlumnosNLP((prevAlumnos) => [
                    ...prevAlumnos,
                    { id: nlpSchoolReference.id, ...newData },
                ]);

                setSelectKey(prevKey => prevKey + 1);
                setSelectKey2(prevKey => prevKey + 1);
                setFirstname("");
                setLastname("");
                setAge("");
                setGrade("");
                setDate(null);
                setArchivo(null);
                setIndate("");
                setSponsor_code("N/A");
                setFather("");
                setMother("");
                setHousehold("");
                setSiblings("");
                setCo_siblings("");
                setStatus("");
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

    // Función para actualizar datos
    const handleModAlumno = async () => {
        if (!guardando) {
            setGuardando(true);

            const idDocumentos = selectedAlumnoNLP;
            // Verificar si los campos obligatorios están llenos
            if (
                !formData.firstname ||
                !formData.lastname ||
                !formData.age ||
                !formData.indate
            ) {
                setErrorMessage("Por favor, complete todos los campos obligatorios.");
                setFormValid(false);
                setGuardando(false);
                return; // No enviar el formulario si falta algún campo obligatorio
            }

            try {
                let logoUrl = formData.imageurl;
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
                    indate: parseFloat(formData.indate),
                    father: formData.father,
                    mother: formData.mother,
                    household: parseFloat(formData.household),
                    siblings: parseFloat(formData.siblings),
                    co_siblings: parseFloat(formData.co_siblings),
                    status: formData.status,
                    imageurl: logoUrl, // Actualizar la URL de la imagen
                };

                // Solo actualizar el campo 'imageurl' si se ha subido una nueva imagen
                if (archivo) {
                    newData.imageurl = logoUrl;
                }
                // Solo actualizar el campo 'grade' si se ha cambiado
                if (grade) {
                    newData.grade = grade;
                }
                if (sponsor_code) {
                    newData.sponsor_code = sponsor_code;
                }

                const newUpData2 = {
                    action: "Actualiza Alumno NLP",
                    date: new Date(),
                    uid: user.uid,
                };

                // Actualizar el documento existente
                const docRef = doc(nlpSchoolReference, idDocumentos);
                await updateDoc(docRef, newData);
                await addDoc(upReference, newUpData2);

                // Limpiar formulario después de la actualización
                resetForm();

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

    // Función para limpiar el formulario
    const resetForm = () => {
        setFormData({
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
            sponsor_code: "",
            status: ""
        });
        setSelectKey(prevKey => prevKey + 1);
        setSelectKey2(prevKey => prevKey + 1);
        setArchivo(null);
        setDate(null);
        setGrade("");

        // Resetear el input de archivo
        if (document.getElementById("logo")) {
            document.getElementById("logo").value = "";
        }
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
                <div className="container mx-auto p-1 ">
                    <h2 className="text-lg font-semibold mb-4 text-center">
                        ALUMNOS REGISTRADOS EN PROYECTO NUEVA VIDA
                    </h2>
                    <div className="">
                        <div className="">
                            <div className="space-y-2 ">

                                <Button
                                    className="bg-gradient-to-tr from-pink-500 to-yellow-500 text-white mx-2 "
                                    onPress={onAddOpen}>
                                    Registrar Nuevo Alumno
                                </Button>


                                <Button
                                    className="bg-gradient-to-tr from-pink-500 to-yellow-500 text-white mx-2 "
                                    onPress={onModOpen}>
                                    Actualizar Info Alumno
                                </Button>
                                <Input
                                    className="w-64"
                                    placeholder="Buscar por nombre o apellido..."
                                    value={filterValue}
                                    onChange={handleSearchChange}
                                    mb={4}
                                />


                            </div>
                            <Modal
                                size="md"
                                isOpen={isAddOpen}
                                onClose={handleModalClose}
                                scrollBehavior="inside"
                                backdrop="blur"
                                classNames={{
                                    body: "py-6",
                                    backdrop: "bg-[#292f46]/50 backdrop-opacity-80",
                                    header: "border-b-[1px] border-[#292f46]",
                                    footer: "border-t-[1px] border-[#292f46]",
                                }}
                            >
                                <ModalContent>
                                    {() => (
                                        <>
                                            <ModalHeader className="text-center flex flex-col gap-1">Registrar Nuevo Alumno</ModalHeader>
                                            <ModalBody>
                                                <div className="grid gap-1 grid-cols-1">
                                                    {errorMessage && (
                                                        <div className="text-red-500 text-center mb-4">
                                                            {errorMessage}
                                                        </div>
                                                    )}
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
                                                        value={firstname}
                                                        onChange={(e) => setFirstname(e.target.value)}
                                                    />
                                                    <Input
                                                        className="w-64"
                                                        isRequired
                                                        label="Last Name"
                                                        id="lastname"
                                                        value={lastname}
                                                        onChange={(e) => setLastname(e.target.value)}
                                                    />
                                                    <Input
                                                        className="w-64"
                                                        isRequired
                                                        label="Age"
                                                        type="number"
                                                        id="age"
                                                        value={age}
                                                        onChange={(e) => setAge(e.target.value)}
                                                    />

                                                    <DateInput
                                                        className="w-64"
                                                        id="date"
                                                        label="Fecha de Nacimiento:"
                                                        variant="bordered"
                                                        value={date}
                                                        onChange={setDate}
                                                        dateFormat="dd/MM/yyyy"
                                                    />
                                                    <label
                                                        className=" block text-sm font-medium leading-6 text-gray-900"
                                                    >
                                                        <p className="font text-md p-4">Informacion Académica del Alumno </p>
                                                    </label>
                                                    <Select
                                                        className="max-w-xs w-64"
                                                        isRequired
                                                        id="grade"
                                                        key={selectKey}
                                                        label="Select Grade"
                                                        value={grade}
                                                        onChange={(e) => setGrade(e.target.value)}
                                                    >
                                                        {grades.map((grade) => (
                                                            <SelectItem key={grade.key} value={grade.label}>
                                                                {grade.label}
                                                            </SelectItem>
                                                        ))}
                                                    </Select>
                                                    <RadioGroup
                                                        id="status"
                                                        value={status}
                                                        isRequired
                                                        label="Status del Alumno"
                                                        className="text-sm"
                                                        onChange={(e) => setStatus(e.target.value)}
                                                    >
                                                        <Radio value="Activo">Activo</Radio>
                                                        <Radio value="Inactivo">Inactivo</Radio>
                                                        <Radio value="Egresó">Egresó</Radio>
                                                        <Radio value="Expulsion">Expulsión</Radio>
                                                    </RadioGroup>
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
                                                            {previewImage && (
                                                                <div className="mt-4">
                                                                    <img
                                                                        src={previewImage}
                                                                        alt="Vista previa"
                                                                        className="w-32 h-32 object-cover rounded-md cursor-pointer"
                                                                        onClick={() => window.open(previewImage, "_blank")} // Abrir en una nueva pestaña
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <Input
                                                        className="w-64"
                                                        isRequired
                                                        label="Year Entered"
                                                        placeholder="2024"
                                                        type="number"
                                                        id="indate"
                                                        value={indate}
                                                        onChange={(e) => setIndate(e.target.value)} />

                                                    <Select
                                                        key={selectKey2} // Clave para forzar re-renderizado
                                                        id="sponsor_code"
                                                        items={sponsors}
                                                        label="Asignar Sponsor:"
                                                        placeholder="Selecciona un Patrocinador"
                                                        className="max-w-xs"
                                                        value={sponsor_code}
                                                        onChange={(e) => setSponsor_code(e.target.value)}
                                                    >
                                                        {sponsors.map((supplier) => (
                                                            <SelectItem key={supplier.code} textValue={`${supplier.code} ${supplier.fullname}`} >
                                                                <div className="flex gap-2 items-center">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-small">{supplier.code} {supplier.fullname}</span>
                                                                    </div>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </Select>
                                                    <label
                                                        className=" block text-sm font-medium leading-6 text-gray-900"
                                                    >
                                                        <p className="font text-md p-4">Informacion  de Hogar </p>
                                                    </label>
                                                    <Input
                                                        className="w-64"
                                                        label="Father's FullName"
                                                        id="father"
                                                        value={father}
                                                        onChange={(e) => setFather(e.target.value)} />
                                                    <Input
                                                        className="w-64"
                                                        label="Mother's FullName"
                                                        id="mother"
                                                        value={mother}
                                                        onChange={(e) => setMother(e.target.value)} />
                                                    <Input
                                                        className="w-64"
                                                        label="Households"
                                                        type="number"
                                                        id="household"
                                                        value={household}
                                                        onChange={(e) => setHousehold(e.target.value)} />
                                                    <Input
                                                        className="w-64"
                                                        label="Siblings"
                                                        type="number"
                                                        id="siblings"
                                                        value={siblings}
                                                        onChange={(e) => setSiblings(e.target.value)} />
                                                    <Input
                                                        className="w-64"
                                                        label="Siblings in the New Life Project"
                                                        type="number"
                                                        id="co_siblings"
                                                        value={co_siblings}
                                                        onChange={(e) => setCo_siblings(e.target.value)}
                                                    />

                                                </div>
                                            </ModalBody>
                                            <ModalFooter>
                                                <Button color="danger" variant="light" onPress={handleModalClose}>
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

                            <Modal
                                backdrop="blur"
                                size="md"
                                isOpen={isModOpen}
                                onClose={handleModalClose2}
                                scrollBehavior="inside"
                                classNames={{
                                    body: "py-6",
                                    backdrop: "bg-[#292f46]/50 backdrop-opacity-80",
                                    header: "border-b-[1px] border-[#292f46]",
                                    footer: "border-t-[1px] border-[#292f46]",
                                }}

                            >
                                <ModalContent>
                                    {() => (
                                        <>
                                            <ModalHeader className="text-center flex flex-col gap-1">Informacion de Alumno</ModalHeader>
                                            <ModalBody>
                                                <div className="grid gap-1 grid-cols-1">
                                                    {errorMessage && (
                                                        <div className="text-red-500 text-center mb-4">
                                                            {errorMessage}
                                                        </div>
                                                    )}
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
                                                                items={alumnosnlp}
                                                                label="Actualizar a:"
                                                                placeholder="Selecciona un Alumno"
                                                                className="max-w-xs"
                                                                value={selectedAlumnoNLP}

                                                                onChange={handleAlumnoChange}
                                                            >
                                                                {alumnosnlp.map((supplier) => (
                                                                    <SelectItem key={supplier.id} textValue={`${supplier.firstname} ${supplier.lastname}`} >
                                                                        <div className="flex gap-2 items-center">
                                                                            <Avatar className="flex-shrink-0" size="sm" src={supplier.imageurl} />
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
                                                    <div className="sm:col-span-1 py-4">
                                                        <label className="block text-sm leading-6 text-gray-900">
                                                            <a className="text-sm font-medium">Fotografía</a>
                                                        </label>
                                                        <div className="mt-2 pr-4">
                                                            <input
                                                                type="file"
                                                                id="logo"
                                                                onChange={handleChange}
                                                                className="w-64 block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none mt-2 pr-4"
                                                            />
                                                            {previewImage ? (
                                                                <div className="mt-4">
                                                                    <img
                                                                        src={previewImage}
                                                                        alt="Vista previa"
                                                                        className="w-32 h-32 object-cover rounded-md cursor-pointer"
                                                                        onClick={() => window.open(previewImage, "_blank")} // Abrir en una nueva pestaña
                                                                    />
                                                                </div>
                                                            ) : (
                                                                formData.imageurl && (
                                                                    <div className="mt-4">
                                                                        <img
                                                                            src={formData.imageurl}
                                                                            alt="Imagen actual"
                                                                            className="w-32 h-32 object-cover rounded-md cursor-pointer"
                                                                            onClick={() => window.open(formData.imageurl, "_blank")} // Abrir en una nueva pestaña
                                                                        />
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
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
                                                    <Chip size="sm">Grado Actual: {formData.grade}</Chip>
                                                    <Select
                                                        className="max-w-xs w-64"
                                                        type="text"
                                                        key={selectKey}
                                                        label="Select Grade"
                                                        placeholder={formData.grade}
                                                        id="grade"
                                                        value={grade}
                                                        onChange={(e) => setGrade(e.target.value)}
                                                    >
                                                        {grades.map((grade) => (
                                                            <SelectItem key={grade.key} value={grade.label}>
                                                                {grade.label}
                                                            </SelectItem>
                                                        ))}
                                                    </Select>
                                                    <Chip size="sm">Fecha de Nacimiento: {formData.date ? formatDate(formData.date) : ""}</Chip>

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

                                                    <RadioGroup
                                                        id="status"
                                                        value={formData.status}
                                                        isRequired
                                                        label="Status del Alumno"
                                                        className="text-sm"
                                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                                    >
                                                        <Radio value="Activo">Activo</Radio>
                                                        <Radio value="Inactivo">Inactivo</Radio>
                                                        <Radio value="Egresó">Egresó</Radio>
                                                        <Radio value="Expulsion">Expulsión</Radio>
                                                    </RadioGroup>

                                                    <Input
                                                        className="w-64"
                                                        isRequired
                                                        label="Year Entered"
                                                        placeholder="2024"
                                                        type="number"
                                                        id="indate"
                                                        value={formData.indate}
                                                        onChange={(e) => setFormData({ ...formData, indate: e.target.value })} />

                                                    <Chip size="sm">Patrocinador Actual: {formData.sponsor_code}</Chip>
                                                    <Select
                                                        key={selectKey2} // Clave para forzar re-renderizado
                                                        id="sponsor_code"
                                                        items={sponsors}
                                                        label="Asignar Sponsor:"
                                                        placeholder="Selecciona un Patrocinador"
                                                        className="max-w-xs"
                                                        value={sponsor_code}
                                                        onChange={(e) => setSponsor_code(e.target.value)}
                                                    >
                                                        {sponsors.map((supplier) => (
                                                            <SelectItem key={supplier.code} textValue={`${supplier.code} ${supplier.fullname}`} >
                                                                <div className="flex gap-2 items-center">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-small">{supplier.code} {supplier.fullname}</span>
                                                                    </div>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </Select>


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
                                                <Button color="danger" variant="light" onPress={handleModalClose2}>
                                                    Cancel
                                                </Button>
                                                <Button color="primary" onPress={handleModAlumno}>
                                                    Save
                                                </Button>
                                            </ModalFooter>
                                        </>
                                    )}
                                </ModalContent>
                            </Modal>
                        </div>
                    </div>
                    <div className="grid 2xl:grid-cols-4 xl:grid-cols-4 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 p-2">
                        {currentItems.map((alumno, index) => (
                            <div key={index} className="p-1">
                                <Card isFooterBlurred className="w-52 h-full col-span-12 sm:col-span-5">
                                    <CardHeader className="absolute z-10 flex-col items-center bg-slate-400/50 p-1">
                                        <p className="text-tiny text-white/70 uppercase text-center">{alumno.age} years old</p>
                                        <h4 className="text-white text-tiny font-bold uppercase text-sm text-center">{alumno.firstname} {alumno.lastname}</h4>
                                    </CardHeader>
                                    {alumno.imageurl ? (
                                        <Image
                                            removeWrapper
                                            alt="Child Cards"
                                            className="z-0 w-[250px] h-[300px] scale-100 object-cover"
                                            src={alumno.imageurl}
                                            
                                        />
                                    ) : (
                                        <div className="z-0 w-[250px] h-[300px] scale-100 bg-gray-300 animate-pulse"></div>
                                    )}
                                    <CardFooter className="absolute bg-white/30 bottom-0 border-t-0 border-zinc-100/50 z-10 grid justify-items-center text-center -p-1">
                                        <div>
                                            <p className="text-black text-tiny"> Sponsor Code: N° {alumno.sponsor_code} </p>


                                            <div className="grid grid-cols-1 justify-items-center">
                                                <div className="py-1">
                                                    <Chip className="capitalize" radius="sm" color={statusColorMap[alumno.status]} size="sm" variant="faded">{alumno.status}</Chip>
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
                <div className="flex justify-center mt-4">
                    <Button disabled={currentPage === 1} onClick={handlePrevPage}>Previous</Button>
                    <span className="mx-2">{currentPage} of {totalPages}</span>
                    <Button disabled={currentPage === totalPages} onClick={handleNextPage}>Next</Button>
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
                                    <div className="grid gap-1 grid-cols-1 text-center justify-items-center">

                                        <p className="text-base font-bold">Personal Information</p>
                                        <Chip size="md">Full Name: {selectedAlumno.firstname} {selectedAlumno.lastname}</Chip>
                                        <Chip className="capitalize" color={statusColorMap[selectedAlumno.status]} size="md" variant="flat">{selectedAlumno.status}</Chip>
                                        <p className="text-sm ">Sponsor Code: N°{selectedAlumno.sponsor_code}</p>
                                        <p className="text-sm ">Age: {selectedAlumno.age} years old</p>
                                        <p className="text-sm">Grade: {selectedAlumno.grade}</p>

                                        <Chip size="md">Fecha de Nacimiento: {selectedAlumno.date}</Chip>
                                        <p className="text-sm">Year entered: {selectedAlumno.indate}</p>
                                    </div>
                                    <div className="grid gap-1 grid-cols-1 text-center justify-items-center">
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