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
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Input, Link, Switch, RadioGroup, Radio, Textarea, Divider } from "@nextui-org/react";
import { Timestamp } from "firebase/firestore"; // Importar Timestamp desde firestore
import { DatePicker, DateInput } from "@nextui-org/react"; // Importar DatePicker de NextUI
import imageCompression from 'browser-image-compression';


const upReference = collection(db, "updates");
const teachersNLPReference = collection(db, "teachers");
const sponsorNLPReference = collection(db, "sponsors");
const storage = getStorage();

const TeachersNLPComponent = () => {
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
    const [size, setSize] = React.useState('sm');
    const [scrollBehavior, setScrollBehavior] = React.useState("inside");
    const [guardando, setGuardando] = useState(false); // Estado para controlar el botón
    const [formValid, setFormValid] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [sponsors, setSponsors] = useState([]);

    const [preview, setPreview] = useState(null);
    // Agrega el estado para el progreso
    const [uploadProgress, setUploadProgress] = useState(0);
    const statusColorMap = {
        Activo: "success",
        Inactivo: "warning",
        Egresó: "danger",
    };
    const [filteredTeachers, setFilteredTeachers] = useState([]);
    const [filterValue, setFilterValue] = useState("");
    const [teachers, setTeachers] = useState([]);
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [teacherss, setTeacherss] = useState([]);
    const [selectedTeachers, setSelectedTeachers] = useState(null);
    const [formData, setFormData] = useState({
        firstname: "",
        lastname: "",
        age: "",
        area: "",
        imageurl: "",
        date: null,
        description: "",
        project: "",
        sponsor_code: "",
        status: ""
    });
    const [firstname, setFirstname] = useState("");
    const [lastname, setLastname] = useState("");
    const [age, setAge] = useState("");
    const [area, setArea] = useState("");
    const [imageurl, setImageurl] = useState("");
    const [date, setDate] = useState(null);
    const [description, setDescription] = useState("");
    const [project, setProject] = useState("");
    const [sponsor_code, setSponsor_code] = useState("");
    const [status, setStatus] = useState("");
    const [archivo, setArchivo] = useState(null);
    const [selectKey, setSelectKey] = useState(0);
    const [selectKey2, setSelectKey2] = useState(100000);
    const areas = [
        { key: "Spanish", label: "Spanish" },
        { key: "Maths", label: "Maths" },
        { key: "History", label: "History" },
        { key: "Sciences", label: "Sciences" },
        { key: "Information Technologies", label: "Information Technologies" },
        { key: "Arts and Music", label: "Arts and Music" },
        { key: "Bible Classes", label: "Bible Classes" },

    ];

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredTeachers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage);
    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    useEffect(() => {
        const fetchTeachers = async () => {
            try {
                const querySnapshot = await getDocs(teachersNLPReference);

                const teachersData = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    teachersData.push({
                        id: doc.id,
                        firstname: data.firstname,
                        lastname: data.lastname,
                        age: data.age,
                        area: data.area,
                        imageurl: data.imageurl,
                        date: data.date,
                        description: data.description,
                        project: data.project,
                        sponsor_code: data.sponsor_code,
                        status: data.status,
                    });
                });

                setTeacherss(teachersData);
            } catch (error) {
                console.error("Error fetching teachers from Firestore:", error);
            }
        };
        fetchTeachers();
    }, [teachersNLPReference]);


    useEffect(() => {
        const fetchSponsors = async () => {
            try {
                const querySnapshot = await getDocs(sponsorNLPReference);

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
    }, [sponsorNLPReference]);



    function handleTeacherChange(event) {
        const selectedTeacherValue = event.target.value;
        // Actualiza el estado con el nuevo valor seleccionado
        setSelectedTeachers(selectedTeacherValue);

        if (!selectedTeacherValue) {
            // Limpiar formulario después de la actualización
            resetForm();
        } else {
            const selectedTeacherData = teacherss.find(supplier => supplier.id === selectedTeacherValue);

            const dateOfBirth = selectedTeacherData.date instanceof Timestamp
                ? selectedTeacherData.date.toDate() // Convertir Timestamp a Date
                : selectedTeacherData.date;

            setFormData({
                firstname: selectedTeacherData.firstname,
                lastname: selectedTeacherData.lastname,
                age: selectedTeacherData.age,
                area: selectedTeacherData.area,
                imageurl: selectedTeacherData.imageurl,
                date: dateOfBirth,
                description: selectedTeacherData.description,
                project: selectedTeacherData.project,
                sponsor_code: selectedTeacherData.sponsor_code,
                status: selectedTeacherData.status,
            });
            // Convierte la marca de tiempo Firestore a objeto Date y establece el estado
        }
    }

    useEffect(() => {
        // Configurar el listener de Firestore
        const teachersCollection = collection(db, 'teachers');
        const unsubscribe = onSnapshot(teachersCollection, (snapshot) => {
            const teachersList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTeachers(teachersList);
            setFilteredTeachers(teachersList);
        });

        // Cleanup the listener on unmount
        return () => unsubscribe();
    }, []);
    const handleSearchChange = (e) => {
        const value = e.target.value.toLowerCase();
        setFilterValue(value);
        setFilteredTeachers(teachers.filter(teacher =>
            teacher.firstname.toLowerCase().includes(value) ||
            teacher.lastname.toLowerCase().includes(value)
        ));
    };

    const handleOpen = (teacher) => {
        const formattedTeacher = {
            ...teacher,
            date: teacher.date ? formatDate2(teacher.date) : null,
        }
        setSelectedTeacher(formattedTeacher);
        onOpen();
    };

    const handleChange = async (event) => {
        const archivo = event.target.files[0];
        if (archivo && archivo.type.startsWith('image/') && !archivo.name.toLowerCase().endsWith('.heic')) {
            try {
                const compressedFile = await imageCompression(archivo, { maxSizeMB: 1, maxWidthOrHeight: 1024 });
                setArchivo(compressedFile);
                const previewUrl = URL.createObjectURL(compressedFile);
                setPreview(previewUrl);
                console.log("Vista previa generada:", previewUrl); // Depuración
            } catch (error) {
                console.error('Error al comprimir la imagen:', error);
            }
        } else if (archivo && archivo.name.toLowerCase().endsWith('.heic')) {
            alert("No se permiten archivos de tipo HEIC. Por favor, seleccione otro formato de imagen.");
            setArchivo(null);
            setPreview(null);
            event.target.value = ""; // Restablecer el valor del input de archivo
        } else {
            setArchivo(null);
            setPreview(null);
            event.target.value = ""; // Restablecer el valor del input de archivo
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
        setFirstname("");
        setLastname("");
        setAge("");
        setArea("");
        setDate(null);
        setDescription("");
        setProject("");
        setSponsor_code("");
        setStatus("");
        setPreview(null);
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
                !area ||
                !date
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
                    const archivoRef = ref(storage, `imagenes/imagenes/logos/${archivo.name}`);
                    const uploadTask = uploadBytesResumable(archivoRef, archivo);

                    logoUrl = await new Promise((resolve, reject) => {
                        uploadTask.on(
                            "state_changed",
                            (snapshot) => {
                                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                                setUploadProgress(progress); // Actualiza el progreso
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
                    firstname: firstname,
                    lastname: lastname,
                    age: parseFloat(age),
                    area: area,
                    imageurl: logoUrl,
                    date: calendarDateToUTC(date),
                    description: description,
                    project: project,
                    sponsor_code: sponsor_code,
                    status: status,
                };

                const newUpData = {
                    action: "Registra Nuevo Maestro",
                    date: new Date(),
                    uid: user.uid,
                };

                // Crear un nuevo documento
                await addDoc(teachersNLPReference, newData);
                await addDoc(upReference, newUpData);

                // Actualiza manualmente el estado `teacherss` con el nuevo maestro
                setTeacherss((prevTeachers) => [
                    ...prevTeachers,
                    { id: docRef.id, ...newData }
                ]);
                setSelectKey(prevKey => prevKey + 1);
                setSelectKey2(prevKey => prevKey + 1);
                setArchivo(null);
                setFirstname("");
                setLastname("");
                setAge("");
                setArea("");
                setDate(null);
                setDescription("");
                setProject("");
                setSponsor_code("");
                setStatus("");

                // Resetear el input de archivo
                document.getElementById("logo").value = "";

                // Limpiar las vistas previas
                setPreview(null);
                setUploadProgress(0);

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

            const idDocumentos = selectedTeachers;

            // Verificar si los campos obligatorios están llenos
            if (
                !formData.firstname ||
                !formData.lastname ||
                !formData.age ||
                !formData.area
            ) {
                setErrorMessage("Por favor, complete todos los campos obligatorios.");
                setFormValid(false);
                setGuardando(false);
                return; // No enviar el formulario si falta algún campo obligatorio
            }

            try {
                let logoUrl = formData.imageurl;
                if (archivo) {
                    const archivoRef = ref(storage, `imagenes/imagenes/nlp/maestros/${archivo.name}`);
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
                    area: formData.area,
                    //imageurl: formData.logoUrl,
                    //date: calendarDateToUTC(formData.date),
                    //sponsor_code: formData.sponsor_code,
                    description: formData.description,
                    project: formData.project,
                    status: formData.status,
                };

                // Solo actualizar el campo 'imageurl' si se ha subido una nueva imagen
                if (archivo) {
                    newData.imageurl = logoUrl;
                }
                // Solo actualizar el campo 'grade' si se ha cambiado
                if (area) {
                    newData.area = area;
                }
                // Solo actualizar el campo 'sponsor_code' si se ha cambiado
                if (sponsor_code) {
                    newData.sponsor_code = sponsor_code;
                }

                const newUpData2 = {
                    action: "Actualiza Maestro",
                    date: new Date(),
                    uid: user.uid,
                };

                // Actualizar el documento existente
                const docRef = doc(teachersNLPReference, idDocumentos);
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
            area: "",
            imageurl: "",
            date: null,
            description: "",
            project: "",
            sponsor_code: "",
            status: ""
        });
        setSelectKey(prevKey => prevKey + 1);
        setSelectKey2(prevKey => prevKey + 1);
        setArchivo(null);
        setDate(null);
        setPreview(null);
        setArea("");

        // Resetear el input de archivo
        if (document.getElementById("logo")) {
            document.getElementById("logo").value = "";
        }
    };

    return (
        <>
            <div className="espacioU">
                <Head>
                    <title>MAESTROS REGISTRADOS EN PROYECTO NUEVA VIDA</title>
                    <meta name="description" content="ACTUALIZACIONES DE ACTIVIDADES" />
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                    <link rel="icon" href="/img/logo_paginas.png" />
                </Head>
                <div className="container mx-auto p-1 ">
                    <h2 className="text-lg font-semibold mb-4 text-center">
                        MAESTROS REGISTRADOS EN PROYECTO NUEVA VIDA
                    </h2>
                    <div className="">
                        <div className="">
                            <div className="space-y-2 ">

                                <Button
                                    className="bg-gradient-to-tr from-pink-500 to-yellow-500 text-white mx-2 "
                                    onPress={onAddOpen}>
                                    Registrar Nuevo Maestro
                                </Button>


                                <Button
                                    className="bg-gradient-to-tr from-pink-500 to-yellow-500 text-white mx-2 "
                                    onPress={onModOpen}>
                                    Actualizar Info Maestro
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
                                size="3xl"
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
                                            <ModalHeader className="text-center flex flex-col gap-1">Registrar Nuevo Maestro</ModalHeader>
                                            <ModalBody>
                                                <div className="flex grid gap-1 grid-cols-1">
                                                    {errorMessage && (
                                                        <div className="text-red-500 text-center mb-4">
                                                            {errorMessage}
                                                        </div>
                                                    )}
                                                    <label
                                                        className=" block text-sm font-medium leading-6 text-gray-900"
                                                    >
                                                        <p className="font text-md p-4">Informacion Personal del Maestro </p>
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

                                                    <div className="col-span-1 ">
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
                                                        </div  >
                                                        {preview && (
                                                            <div className="mt-4">
                                                                <img src={preview} alt="Vista previa" className="w-32 h-32 object-cover rounded-md cursor-pointer" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <label
                                                        className=" block text-sm font-medium leading-6 text-gray-900"
                                                    >
                                                        <p className="font text-md p-4">Informacion Académica del Maestro </p>
                                                    </label>
                                                    <Select
                                                        className="max-w-xs w-64"
                                                        isRequired
                                                        id="area"
                                                        key={selectKey}
                                                        label="Select an Area"
                                                        value={area}
                                                        onChange={(e) => setArea(e.target.value)}
                                                        classNames={{
                                                            listbox: "max-h-64 overflow-y-auto",
                                                        }}
                                                    >
                                                        {areas.map((area) => (
                                                            <SelectItem key={area.key} value={area.label}>
                                                                {area.label}
                                                            </SelectItem>
                                                        ))}
                                                    </Select>
                                                    <DatePicker
                                                        showMonthAndYearPickers
                                                        className="w-64"
                                                        id="date"
                                                        label="Fecha de Ingreso:"
                                                        variant="bordered"
                                                        value={date}
                                                        onChange={setDate}
                                                        dateFormat="dd/MM/yyyy"
                                                    />

                                                    <Textarea
                                                        className="w-80"
                                                        isRequired
                                                        label="Describe Teacher Skills"
                                                        id="description"
                                                        value={description}
                                                        onChange={(e) => setDescription(e.target.value)} />

                                                    <Textarea
                                                        className="w-80"
                                                        isRequired
                                                        label="Describe Teacher Project"
                                                        id="project"
                                                        value={project}
                                                        onChange={(e) => setProject(e.target.value)} />
                                                    <label
                                                        className=" block text-sm font-medium leading-6 text-gray-900"
                                                    >
                                                        <p className="font text-md p-4">Informacion  de Estatus </p>
                                                    </label>
                                                    <Select
                                                        key={selectKey2} // Clave para forzar re-renderizado
                                                        id="sponsor_code"
                                                        items={sponsors}
                                                        label="Asignar Sponsor:"
                                                        placeholder="Selecciona un Patrocinador"
                                                        className="max-w-xs"
                                                        value={sponsor_code}
                                                        onChange={(e) => setSponsor_code(e.target.value)}
                                                        classNames={{
                                                            listbox: "max-h-64 overflow-y-auto",
                                                        }}
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
                                                    <RadioGroup
                                                        id="status"
                                                        value={status}
                                                        isRequired
                                                        label="Status del Maestro"
                                                        className="text-sm"
                                                        onChange={(e) => setStatus(e.target.value)}
                                                    >
                                                        <Radio value="Activo">Activo</Radio>
                                                        <Radio value="Inactivo">Inactivo</Radio>
                                                        <Radio value="Egresó">Egresó</Radio>

                                                    </RadioGroup>

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
                                size="3xl"
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
                                            <ModalHeader className="text-center flex flex-col gap-1">Informacion de Maestro</ModalHeader>
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
                                                            <p className="font-bold text-lg ">Actualizar Info Maestros</p>
                                                            <p className="font-light text-tiny ">Selecciona para Actualizar ó Deseleccionar para Agregar:</p>
                                                        </label>

                                                        <div className="mt-2 pr-4">
                                                            <Select
                                                                key={selectKey} // Clave para forzar re-renderizado
                                                                items={teacherss}
                                                                label="Actualizar a:"
                                                                placeholder="Selecciona un Maestro"
                                                                className="max-w-xs"
                                                                value={selectedTeachers}
                                                                classNames={{
                                                                    listbox: "max-h-64 overflow-y-auto",
                                                                }}
                                                                onChange={handleTeacherChange}
                                                            >
                                                                {teacherss.map((supplier) => (
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
                                                        <p className="font text-md p-4">Informacion Personal del Maestro </p>
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

                                                    <div className="sm:col-span-1 py-4">
                                                        <label

                                                            className="block text-sm leading-6 text-gray-900"
                                                        >
                                                            <a className="text-sm font-medium">Nueva Fotografia?</a>
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
                                                    <label
                                                        className=" block text-sm font-medium leading-6 text-gray-900"
                                                    >
                                                        <p className="font text-md p-4">Informacion Académica del Maestro </p>
                                                    </label>
                                                    <Chip size="sm">Area actual de Maestro: {formData.area}</Chip>
                                                    <Select
                                                        className="max-w-xs w-64"
                                                        isRequired
                                                        id="area"
                                                        key={selectKey}
                                                        label="Select an Area"
                                                        value={area}
                                                        onChange={(e) => setArea(e.target.value)}
                                                        classNames={{
                                                            listbox: "max-h-64 overflow-y-auto",
                                                        }}
                                                    >
                                                        {areas.map((area) => (
                                                            <SelectItem key={area.key} value={area.label}>
                                                                {area.label}
                                                            </SelectItem>
                                                        ))}
                                                    </Select>
                                                    <Chip size="sm">Fecha de Ingreso: {formData.date ? formatDate(formData.date) : ""}</Chip>

                                                    <Textarea
                                                        className="w-80"
                                                        isRequired
                                                        label="Describe Teacher Skills"
                                                        id="description"
                                                        value={formData.description}
                                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                    />

                                                    <Textarea
                                                        className="w-80"
                                                        isRequired
                                                        label="Describe Teacher Project"
                                                        id="project"
                                                        value={formData.project}
                                                        onChange={(e) => setFormData({ ...formData, project: e.target.value })}

                                                    />
                                                    <label
                                                        className=" block text-sm font-medium leading-6 text-gray-900"
                                                    >
                                                        <p className="font text-md p-4">Informacion  de Estados </p>
                                                    </label>
                                                    <Chip size="md">Patrocinador Actual: {formData.sponsor_code}</Chip>
                                                    <Select
                                                        key={selectKey2} // Clave para forzar re-renderizado
                                                        id="sponsor_code"
                                                        items={sponsors}
                                                        label="Asignar Sponsor:"
                                                        placeholder="Selecciona un Patrocinador"
                                                        className="max-w-xs"
                                                        value={sponsor_code}
                                                        onChange={(e) => setSponsor_code(e.target.value)}
                                                        classNames={{
                                                            listbox: "max-h-64 overflow-y-auto",
                                                        }}
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
                                                    <RadioGroup
                                                        id="status"
                                                        value={formData.status}
                                                        isRequired
                                                        label="Status del Maestro"
                                                        className="text-sm"
                                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}

                                                    >
                                                        <Radio value="Activo">Activo</Radio>
                                                        <Radio value="Inactivo">Inactivo</Radio>
                                                        <Radio value="Egresó">Egresó</Radio>

                                                    </RadioGroup>
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
                                            <p className="text-black"> Area or Field:  {alumno.area} </p>


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

            {selectedTeacher && (
                <Modal
                    size="xl"
                    isOpen={isOpen}
                    onClose={onClose}
                    scrollBehavior="inside"
                >
                    <ModalContent>
                        {() => (
                            <>
                                <ModalHeader className="text-center flex flex-col gap-1">{selectedTeacher.firstname} {selectedTeacher.lastname}</ModalHeader>
                                <ModalBody>
                                    <div className="flex justify-center items-center">
                                        <Image
                                            removeWrapper
                                            alt="Child Cards"
                                            className="w-[250px] h-[300px] object-cover rounded-md"
                                            src={selectedTeacher.imageurl}
                                        />
                                    </div>
                                    <div className="grid gap-1 grid-cols-1 text-center justify-items-center">

                                        <p className="text-base font-bold">Personal Information</p>
                                        <Chip size="md">Full Name: {selectedTeacher.firstname} {selectedTeacher.lastname}</Chip>
                                        <Chip className="capitalize" color={statusColorMap[selectedTeacher.status]} size="md" variant="flat">{selectedTeacher.status}</Chip>
                                        <p className="text-sm ">Sponsor Code: N°{selectedTeacher.sponsor_code}</p>
                                        <p className="text-sm ">Age: {selectedTeacher.age} years old</p>
                                        <p className="text-sm">Area: {selectedTeacher.area}</p>

                                        <Chip size="md">Fecha de Ingreso: {selectedTeacher.date}</Chip>
                                    </div>
                                    <div className="grid gap-1 grid-cols-1 text-center justify-items-center">
                                        <p className="text-base font-bold">About</p>
                                        <p className="text-sm">{selectedTeacher.description}</p>
                                        <Divider className="my-1" />
                                        <p className="text-sm">Tiene como objetivo: {selectedTeacher.project}</p>
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

export default TeachersNLPComponent;