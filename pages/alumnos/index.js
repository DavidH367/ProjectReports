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
import { Card, CardHeader, CardBody, CardFooter, Image, Button, Select, SelectItem, Chip, Avatar, Skeleton, Alert } from "@nextui-org/react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Input, Link, Switch, RadioGroup, Radio } from "@nextui-org/react";
import { Timestamp } from "firebase/firestore"; // Importar Timestamp desde firestore
import { DateInput, DatePicker } from "@nextui-org/react"; // Importar DatePicker de NextUI
import imageCompression from 'browser-image-compression';
import InputMask from "react-input-mask"; // Importar InputMask


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
    const [alertMessage, setAlertMessage] = useState("");
    const [showAlert, setShowAlert] = useState(false);

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
        dni: "",
        grade: "",
        gen: "",
        imageurl: "",
        date: null,
        indate: null,
        father: "",
        mother: "",
        household: "",
        siblings: "",
        co_siblings: "",
        sponsor_code: "",
        dates_sponsorship: null,
        status: ""
    });
    const [firstname, setFirstname] = useState("");
    const [lastname, setLastname] = useState("");
    const [dni, setDni] = useState("");
    const [grade, setGrade] = useState("");
    const [imageurl, setImageurl] = useState("");
    const [date, setDate] = useState(null);
    const [archivo, setArchivo] = useState(null);
    const [indate, setIndate] = useState(null);
    const [sponsor_code, setSponsor_code] = useState("N/A");
    const [father, setFather] = useState("");
    const [mother, setMother] = useState("");
    const [household, setHousehold] = useState("");
    const [siblings, setSiblings] = useState("");
    const [co_siblings, setCo_siblings] = useState(0);
    const [status, setStatus] = useState("");
    const [gen, setGen] = useState("");
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
        const alumnosCollection = collection(db, "nlp");
        const unsubscribe = onSnapshot(alumnosCollection, (snapshot) => {
            const alumnosList = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setAlumnosNLP(alumnosList); // Actualizar el estado con los datos en tiempo real
        });

        return () => unsubscribe(); // Limpiar el listener al desmontar el componente
    }, []);

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

            const dateOfSponsor = selectedAlumnoData.indate instanceof Timestamp
                ? selectedAlumnoData.indate.toDate() // Convertir Timestamp a Date
                : selectedAlumnoData.indate;

            const lastSponsorDate = selectedAlumnoData.lastSponsorDate instanceof Timestamp
                ? selectedAlumnoData.lastSponsorDate.toDate()
                : null;

            setFormData({
                firstname: selectedAlumnoData.firstname,
                lastname: selectedAlumnoData.lastname,
                dni: selectedAlumnoData.dni,
                grade: selectedAlumnoData.grade,
                gen: selectedAlumnoData.gen,
                imageurl: selectedAlumnoData.imageurl,
                date: dateOfBirth,
                indate: dateOfSponsor,
                sponsor_code: selectedAlumnoData.sponsor_code,
                dates_sponsorship: selectedAlumnoData.dates_sponsorship,
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

    const handleChange = async (event) => {
        const archivo = event.target.files[0];
        if (archivo && archivo.type.startsWith('image/') && !archivo.name.toLowerCase().endsWith('.heic')) {
            try {
                const compressedFile = await imageCompression(archivo, { maxSizeMB: 1, maxWidthOrHeight: 1024 });
                setArchivo(compressedFile);
                const previewUrl = URL.createObjectURL(compressedFile);
                setPreviewImage(previewUrl);
                console.log("Vista previa generada:", previewUrl); // Depuración
            } catch (error) {
                console.error('Error al comprimir la imagen:', error);
            }
        } else if (archivo && archivo.name.toLowerCase().endsWith('.heic')) {
            alert("No se permiten archivos de tipo HEIC. Por favor, seleccione otro formato de imagen.");
            setArchivo(null);
            setPreviewImage(null);
            event.target.value = ""; // Restablecer el valor del input de archivo
        } else {
            setArchivo(null);
            setPreviewImage(null);
            event.target.value = ""; // Restablecer el valor del input de archivo
        }
    };
    // Función para convertir CalendarDate a Date
    const calendarDateToUTC = (calendarDate) => {
        if (!calendarDate) return null; // Manejar el caso en que calendarDate sea null
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
        if (!date) return "N/A";
        let parsedDate;

        // Verifica si es un objeto Date
        if (date.seconds && date.nanoseconds) {
            parsedDate = new Date(date.seconds * 1000); // Convertir Timestamp a Date
        } else if (date instanceof Date) {
            // Verifica si es un objeto Timestamp (Firestore)
            parsedDate = date;
        } else {
            return "Invalid Date"; // Maneja el caso de formato no esperado
        }

        const year = parsedDate.getFullYear();
        const month = (parsedDate.getMonth() + 1).toString().padStart(2, "0");
        const day = parsedDate.getDate().toString().padStart(2, "0");

        return `${year}-${month}-${day}`;
    };


    const calculateAge = (birthDate) => {
        if (!birthDate) return "N/A"; // Manejar el caso en que no haya fecha de nacimiento
        console.log("birthDate", birthDate);
        let date;
        if (birthDate instanceof Timestamp) {
            // Convertir Timestamp de Firebase a Date
            date = birthDate.toDate();
        } else if (birthDate instanceof Date) {
            // Si ya es un objeto Date, úsalo directamente
            date = birthDate;
        } else if (typeof birthDate === "string") {
            // Si es una cadena de texto en formato día-mes-año
            const [day, month, year] = birthDate.split("-").map(Number); // Dividir y convertir a números
            date = new Date(year, month - 1, day); // Crear un objeto Date (meses en JavaScript son 0-11)
        } else if (birthDate.seconds) {
            // Manejar el caso en que sea un objeto con segundos (Firestore Timestamp)
            date = new Date(birthDate.seconds * 1000);
        } else {
            return "Invalid Date"; // Manejar el caso de formato no esperado
        }

        const today = new Date();
        let age = today.getFullYear() - date.getFullYear();
        const monthDiff = today.getMonth() - date.getMonth();

        // Ajustar la edad si el mes actual es anterior al mes de nacimiento
        // o si es el mismo mes pero el día actual es anterior al día de nacimiento
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
            age--;
        }

        return age;
    };

    const handleModalClose = () => {
        // Restablecer los valores del formulario
        setSelectKey(prevKey => prevKey + 1);
        setSelectKey2(prevKey => prevKey + 1);
        setArchivo(null);
        setDate(null);
        setFirstname("");
        setLastname("");
        setGen("");
        setDni("");
        setGrade("");
        setIndate(null);
        setSponsor_code("");
        setFather("");
        setMother("");
        setHousehold("");
        setSiblings("");
        setCo_siblings(0);
        setPreviewImage(null); // Limpiar la vista previa si no hay archivo
        // Cerrar el modal
        onAddClose();
    };

    const handleModalClose2 = () => {
        resetForm();
        setErrorMessage("");
        setPreviewImage(null); // Limpiar la vista previa si no hay archivo
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
                !dni ||
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
                // Verificar si el DNI ya existe en la base de datos
                const querySnapshot = await getDocs(collection(db, "nlp"));
                const dniExists = querySnapshot.docs.some((doc) => doc.data().dni === dni);

                if (dniExists) {
                    setErrorMessage("El número de DNI ya está registrado. Por favor, ingrese uno diferente.");
                    setFormValid(false);
                    setGuardando(false);
                    return; // Detener el proceso si el DNI ya existe
                }

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
                const indateTimestamp = Timestamp.fromDate(new Date(indate)); // Convertir a Timestamp
                const newData = {
                    firstname: firstname,
                    lastname: lastname,
                    dni: dni,
                    grade: grade,
                    gen: gen,
                    date: calendarDateToUTC(date),
                    imageurl: logoUrl,
                    indate: indateTimestamp,
                    dates_sponsorship: sponsor_code === "N/A" ? indateTimestamp : Timestamp.now(),
                    father: father,
                    mother: mother,
                    household: parseFloat(household),
                    siblings: parseFloat(siblings),
                    co_siblings: parseFloat(co_siblings),
                    sponsor_code: sponsor_code || "N/A",
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

                // Mostrar el Alert
                setAlertMessage("Registro de Alumno Guardado");
                setShowAlert(true);
                setTimeout(() => setShowAlert(false), 2000);

                setSelectKey(prevKey => prevKey + 1);
                setSelectKey2(prevKey => prevKey + 1);
                setFirstname("");
                setLastname("");
                setGen("");
                setDni("");
                setGrade("");
                setDate(null);
                setArchivo(null);
                setIndate(null);
                setSponsor_code("N/A");
                setFather("");
                setMother("");
                setHousehold("");
                setSiblings("");
                setCo_siblings("");
                setStatus("");
                setPreviewImage(null); // Limpiar la vista previa si no hay archivo
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
                !formData.dni ||
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

                // Lógica para actualizar dates_sponsorship
                let updatedDatesSponsorship = formData.dates_sponsorship; // Mantener el valor actual por defecto
                if (formData.sponsor_code === "N/A" && sponsor_code !== "N/A") {
                    // Si el alumno no tenía patrocinador y ahora tiene
                    updatedDatesSponsorship = Timestamp.now();
                } else if (formData.sponsor_code !== "N/A" && sponsor_code === "N/A") {
                    // Si el alumno tenía patrocinador y ahora no tiene
                    updatedDatesSponsorship = Timestamp.now();
                }

                const newData = {
                    firstname: formData.firstname,
                    lastname: formData.lastname,
                    dni: formData.dni,
                    gen: formData.gen,
                    indate: calendarDateToUTC(indate),
                    father: formData.father,
                    mother: formData.mother,
                    household: parseFloat(formData.household),
                    siblings: parseFloat(formData.siblings),
                    co_siblings: parseFloat(formData.co_siblings),
                    status: formData.status,
                    imageurl: logoUrl, // Actualizar la URL de la imagen
                    date: calendarDateToUTC(date),
                    sponsor_code: sponsor_code,
                    dates_sponsorship: updatedDatesSponsorship, // Actualizar dates_sponsorship
                };
                // Solo actualizar el campo 'date' si se seleccionó una nueva fecha
                if (date) {
                    newData.date = calendarDateToUTC(date);
                } else {
                    newData.date = formData.date; // Mantener la fecha existente si no se seleccionó una nueva
                }

                // Solo actualizar el campo 'indate' si se seleccionó una nueva fecha
                if (indate) {
                    newData.indate = calendarDateToUTC(indate);
                } else {
                    newData.indate = formData.indate; // Mantener la fecha existente si no se seleccionó una nueva
                }

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

                // Actualizar el estado local con los datos modificados
                setAlumnosNLP((prevAlumnos) =>
                    prevAlumnos.map((alumno) =>
                        alumno.id === idDocumentos ? { ...alumno, ...newData } : alumno
                    )
                );
                // Mostrar el Alert
                setAlertMessage("Registro de Alumno Actualizado");
                setShowAlert(true);
                setTimeout(() => setShowAlert(false), 2000);
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
            dni: "",
            grade: "",
            gen: "",
            date: null,
            indate: null,
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
        setPreviewImage(null); // Limpiar la vista previa si no hay archivo
        setDate(null);
        setIndate(null);
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
                                size="xl"
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
                                            {showAlert && (
                                                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
                                                    <alert color="success" title={alertMessage} />
                                                </div>
                                            )}
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

                                                    <InputMask
                                                        mask="9999-9999-99999" // Máscara para el formato "1807-2002-00011"
                                                        value={dni}
                                                        onChange={(e) => setDni(e.target.value)} // Actualizar el estado del DNI
                                                    >
                                                        {(inputProps) => (
                                                            <Input
                                                                {...inputProps}
                                                                id="dni"
                                                                isRequired
                                                                label="DNI"
                                                                className="w-64"
                                                            />
                                                        )}
                                                    </InputMask>

                                                    <RadioGroup
                                                        id="gen"
                                                        value={gen}
                                                        isRequired
                                                        label="Género"
                                                        className="text-sm"
                                                        onChange={(e) => setGen(e.target.value)}
                                                    >
                                                        <Radio value="M">Male</Radio>
                                                        <Radio value="F">Female</Radio>
                                                    </RadioGroup>

                                                    <DatePicker
                                                        showMonthAndYearPickers
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
                                                                accept="image/*"
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

                                                    <DatePicker
                                                        showMonthAndYearPickers
                                                        className="w-64"
                                                        id="indate"
                                                        label="Fecha de Matricula:"
                                                        variant="bordered"
                                                        value={indate}
                                                        onChange={setIndate}
                                                        dateFormat="dd/MM/yyyy"
                                                    />

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
                                size="xl"
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
                                            {showAlert && (
                                                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
                                                    <alert color="success" title={alertMessage} />
                                                </div>
                                            )}
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

                                                    <InputMask
                                                        mask="9999-9999-99999" // Máscara para el formato "1807-2002-00011"
                                                        value={formData.dni}
                                                        onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                                                    >
                                                        {(inputProps) => (
                                                            <Input
                                                                {...inputProps}
                                                                id="dni"
                                                                className="w-64"
                                                                isRequired
                                                                label="DNI"

                                                            />
                                                        )}
                                                    </InputMask>

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
                                                    <DatePicker
                                                        showMonthAndYearPickers
                                                        className="w-64"
                                                        id="date"
                                                        label="Actualizar Fecha de Nacimiento:"
                                                        variant="bordered"
                                                        value={date}
                                                        onChange={setDate}
                                                        dateFormat="dd/MM/yyyy"
                                                    />

                                                    <RadioGroup
                                                        id="gen"
                                                        value={formData.gen}
                                                        isRequired
                                                        label="Género"
                                                        className="text-sm"
                                                        onChange={(e) => setFormData({ ...formData, gen: e.target.value })}
                                                    >
                                                        <Radio value="M">Male</Radio>
                                                        <Radio value="F">Female</Radio>
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

                                                    <Chip size="sm">Fecha de Ingreso Actual: {formData.indate ? formatDate(formData.indate) : ""}</Chip>
                                                    <DatePicker
                                                        showMonthAndYearPickers
                                                        className="w-64"
                                                        id="date"
                                                        label="Actualizar Fecha de Matricula:"
                                                        variant="bordered"
                                                        value={indate}
                                                        onChange={setIndate}
                                                        dateFormat="dd/MM/yyyy"
                                                    />

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
                                                        <SelectItem key="N/A" textValue="N/A">
                                                            <div className="flex gap-2 items-center">
                                                                <div className="flex flex-col">
                                                                    <span className="text-small">N/A</span>
                                                                </div>
                                                            </div>
                                                        </SelectItem>
                                                        {sponsors.map((supplier) => (
                                                            <SelectItem key={supplier.code} textValue={`${supplier.code} ${supplier.fullname}`}>
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
                                                    <Chip className="capitalize mx-1" radius="sm" color={statusColorMap[alumno.gen]} size="md" variant="faded">{alumno.gen}</Chip>
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
                                        <Chip size="md">Child ID: {selectedAlumno.dni}</Chip>
                                        <Chip size="md">Full Name: {selectedAlumno.firstname} {selectedAlumno.lastname}</Chip>
                                        <Chip className="capitalize" color={statusColorMap[selectedAlumno.status]} size="md" variant="flat">{selectedAlumno.status}</Chip>
                                        <Chip size="md">Gen: {selectedAlumno.gen} </Chip>
                                        <Chip size="md">
                                            {selectedAlumno.sponsor_code && selectedAlumno.sponsor_code !== "N/A"
                                                ? "Has Sponsor"
                                                : (() => {
                                                    const dates_sponsorship = selectedAlumno.dates_sponsorship
                                                        ? new Date(selectedAlumno.dates_sponsorship.seconds * 1000) // Convertir Timestamp de Firestore a Date
                                                        : null;

                                                    if (dates_sponsorship) {
                                                        const daysWithoutSponsor = Math.floor((new Date() - dates_sponsorship) / (1000 * 60 * 60 * 24));
                                                        return `No Sponsor for ${daysWithoutSponsor} days`;
                                                    }
                                                    return "No Sponsor";
                                                })()
                                            }
                                        </Chip>
                                        <p className="text-sm ">Sponsor Code: N°{selectedAlumno.sponsor_code}</p>
                                        <p className="text-sm ">Age: {calculateAge(selectedAlumno.date)} years old</p>
                                        <p className="text-sm">Grade: {selectedAlumno.grade}</p>

                                        <Chip size="md">Fecha de Nacimiento: {selectedAlumno.date}</Chip>
                                        <p className="text-sm">Date entered: {selectedAlumno.indate ? formatDate(selectedAlumno.indate) : "N/A"}</p>                                    </div>
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