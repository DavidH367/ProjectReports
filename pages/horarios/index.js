import Head from "next/head";
import React, { useState, useEffect, useMemo } from "react";
import "firebase/firestore";
import { db } from "../../lib/firebase";
import {
    addDoc,
    collection,
    query,
    getDocs,
    doc,
    onSnapshot,
    where, setDoc
} from "firebase/firestore";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useAuth } from "../../lib/context/AuthContext";
import { useRouter } from "next/router";
import ReusableTable from "../../Components/Form/ReusableTable";
import { columns } from "../../Data/control/datas";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure, Avatar, Chip, RadioGroup, Radio, Checkbox, Dropdown, Progress } from "@nextui-org/react";
import "react-datepicker/dist/react-datepicker.css";
import { Input, Select, SelectItem, Textarea, DatePicker, Divider } from "@nextui-org/react";
import { Timestamp } from "firebase/firestore";
import imageCompression from 'browser-image-compression';


const upReference = collection(db, "updates");
const alumnosReference = collection(db, "nlp");
const reportsReference = collection(db, "reportsnlp");
const storage = getStorage();

const HorariosComponent = () => {
    //Valida acceso a la pagina
    const { user, errors, setErrors } = useAuth();
    const [localUser, setLocalUser] = useState({});
    const [loadedUser, setLoadedUser] = useState(false);
    const router = useRouter();
    useEffect(() => {
        //entrar a la pagina
        if (!user) {
            setErrors("");
            router.push("/auth/Login");
        } else if (user.first_login) {
            router.push("/auth/ResetPassword");
        }
        //get rest of user information
        if (!user) return;
        const userRef = doc(db, "users", user.uid);
        const unsubscribe = onSnapshot(userRef, (doc) => {
            if (doc.exists()) {
                const updatedUser = doc.data();
                const newUser = {
                    displayname: `${updatedUser.firstName} ${updatedUser.lastName}`,
                    firstLogin: updatedUser.first_login,
                };
                localStorage.setItem("user", JSON.stringify(newUser));
                //saving user data in local storage
                setLocalUser(newUser);
                setLoadedUser(true);
            }
        });
        return () => unsubscribe();
    }, [loadedUser, router, setErrors, user]);
    const [selectedLevel, setSelectedLevel] = useState("");
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({});

    const [progressTotal, setProgressTotal] = useState(0); // Progreso total
    const [archivo1, setArchivo1] = useState(null);
    const [archivo2, setArchivo2] = useState(null);
    const [preview1, setPreview1] = useState(null);
    const [preview2, setPreview2] = useState(null);

    const [formValid, setFormValid] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const { isOpen: isModOpen, onOpen: onModOpen, onClose: onModClose } = useDisclosure();
    const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();

    const [isHistoryOpen, setIsHistoryOpen] = useState(false); // Estado para controlar la apertura del modal de historial
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [selectedDateRange, setSelectedDateRange] = useState({ start: '', end: '' });
    const [filteredAttendance, setFilteredAttendance] = useState([]);

    const [filterValue, setFilterValue] = useState("");
    const [alumnosRep, setAlumnosRep] = useState([]);
    const [filteredAlumnosRep, setFilteredAlumnosRep] = useState([]);

    const [alumnosReports, setAlumnosReports] = useState([]);
    const [selectedAlumnoRep, setSelectedalumnoRep] = useState(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [behdescription, setBehdescription] = useState("");

    const [selectKey, setSelectKey] = useState(0);
    const [guardando, setGuardando] = useState(false); // Estado para controlar el botón

    // Estados nuevos
    const [selectedWeek, setSelectedWeek] = useState(getLastFourWeeks()[0]);
    const [attendanceByDay, setAttendanceByDay] = useState({}); // { studentId: { fechaISO: true/false } }

    const [loadingAttendance, setLoadingAttendance] = useState(false);

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

    const levels = {
        1: ["1st grade", "2nd grade"],
        2: ["3rd grade", "4th grade"],
        3: ["5th grade", "6th grade"],
        4: ["7th grade", "8th grade", "9th grade"],
    };


    const fetchAttendanceHistory = async () => {
        try {
            let attendanceQuery;

            if (selectedStudent && selectedDateRange.start && selectedDateRange.end) {
                // Filtrar por alumno y rango de fechas
                const startDate = new Date(selectedDateRange.start);
                const endDate = new Date(selectedDateRange.end);
                attendanceQuery = query(
                    collection(db, "attendance"),
                    where("studentId", "==", selectedStudent),
                    where("date", ">=", startDate),
                    where("date", "<=", endDate)
                );
            } else if (selectedStudent) {
                // Filtrar solo por alumno
                attendanceQuery = query(
                    collection(db, "attendance"),
                    where("studentId", "==", selectedStudent)
                );
            } else if (selectedDateRange.start && selectedDateRange.end) {

                // Filtrar solo por rango de fechas
                const startDate = new Date(selectedDateRange.start);
                const endDate = new Date(selectedDateRange.end);
                attendanceQuery = query(
                    collection(db, "attendance"),
                    where("date", ">=", startDate),
                    where("date", "<=", endDate)
                );
            } else {
                // Si no hay selección, no hacer nada
                setFilteredAttendance([]);
                return;
            }

            const snapshot = await getDocs(attendanceQuery);
            const historyList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setFilteredAttendance(historyList);
        } catch (error) {
            setErrorMessage("Error fetching attendance history.");
            console.error("Error fetching attendance history: ", error);
        }
    };

    useEffect(() => {
        if (selectedStudent || selectedDateRange.start || selectedDateRange.end) {
            fetchAttendanceHistory();
        }
    }, [selectedStudent, selectedDateRange]);

    useEffect(() => {
        if (selectedLevel) {
            const fetchStudents = async () => {
                try {

                    const studentQuery = query(
                        collection(db, "nlp"),
                        where("grade", "in", levels[selectedLevel]),
                        where("status", "==", "Activo")
                    );
                    const snapshot = await getDocs(studentQuery);
                    const studentsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                    setStudents(studentsList);
                } catch (error) {
                    console.error("Error fetching students: ", error);
                }
            };
            fetchStudents();
        }
    }, [selectedLevel]);

    useEffect(() => {
        const fetchAlumnosRep = async () => {
            try {
                const querySnapshot = await getDocs(alumnosReference);

                const alumnoRepData = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    alumnoRepData.push({
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

                setAlumnosReports(alumnoRepData);
            } catch (error) {
                console.error("Error fetching suppliers from Firestore:", error);
            }
        };
        fetchAlumnosRep();
    }, [alumnosReference]);

    useEffect(() => {
        const q = query(collection(db, "reportsnlp"));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const alumnosRepData = [];
            let indexs = 1;
            querySnapshot.forEach((doc) => {
                alumnosRepData.push({ ...doc.data(), indexs: indexs++ });
            });
            setAlumnosRep(alumnosRepData);
            setFilteredAlumnosRep(alumnosRepData);
        });

        // Cleanup the listener on unmount
        return () => unsubscribe();
    }, []);

    const getFullName = async () => {
        try {
            let idTeacher = user.uid;

            // Filtrar la colección "users" donde el campo uid sea igual a idTeacher
            const q = query(collection(db, "users"), where("uid", "==", idTeacher));
            const teachersSnapshot = await getDocs(q);
            let displayN = "";

            // Debería haber solo un documento en el snapshot
            teachersSnapshot.forEach((doc) => {
                const data = doc.data();
                displayN = data.displayName || ""; // Asigna el displayName o una cadena vacía si no existe
            });

            return displayN;
        } catch (error) {
            console.error("Error al obtener el nombre completo:", error);
            return ""; // Retorna una cadena vacía en caso de error
        }
    };


    const handleHistoryOpen = () => {
        setIsHistoryOpen(true);
    };

    const handleHistoryClose = () => {
        // Restablece todos los valores cuando el modal se cierra
        setSelectedStudent(null); // Restablece el estudiante seleccionado
        setSelectedDateRange({ start: '', end: '' }); // Restablece el rango de fechas
        setFilteredAttendance([]);
        setIsHistoryOpen(false);
    };

    const handleModalClose2 = () => {
        resetForm();
        setErrorMessage("");
        // Cerrar el modal

        onModClose();
    };

    // Limpiar alumnos y asistencias al cerrar modal
    const handleModalClose = () => {
        setSelectedalumnoRep(null);
        setSelectKey(prevKey => prevKey + 1);
        setErrorMessage("");
        setStudents([]);
        setSelectedLevel(null);
        setAttendanceByDay({});
        onAddClose();
    };

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
        setTitle("");
        setDescription("");
        setBehdescription("");
        setSelectedalumnoRep(null);
        setArchivo1(null);
        setArchivo2(null);
        document.getElementById("url1").value = "";
        document.getElementById("url2").value = "";
        setPreview1(null);
        setPreview2(null);
        setProgressTotal(0);
    };

    const groupAttendanceByMonth = (attendanceList) => {
        return attendanceList.reduce((acc, record) => {
            const date = new Date(record.date.seconds * 1000); // Convertir a Date
            const monthYear = `${date.getMonth() + 1}-${date.getFullYear()}`; // Formato: MM-YYYY
            if (!acc[monthYear]) {
                acc[monthYear] = [];
            }
            acc[monthYear].push(record);
            return acc;
        }, {});
    };
    const groupedAttendance = useMemo(() => groupAttendanceByMonth(filteredAttendance), [filteredAttendance]);


    // Utilidad para obtener la fecha en formato YYYY-MM-DD
    function getDateKey(date) {
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    }

    // Guardar asistencias para la semana seleccionada
    const handleSaveAttendance = async () => {
        try {
            const classDays = getClassDaysOfWeek(selectedWeek);
            for (let student of students) {
                for (let day of classDays) {
                    const attended = attendanceByDay[student.id]?.[getDateKey(day.date)] || false;
                    // Usa un ID único por alumno y día
                    const docId = `${student.id}_${getDateKey(day.date)}`;
                    await setDoc(doc(db, "attendance", docId), {
                        studentId: student.id,
                        studentName: `${student.firstname} ${student.lastname}`,
                        attended,
                        date: day.date,
                    });
                }
            }
            setStudents([]);
            setSelectedLevel(null);
            setAttendanceByDay({});
            handleModalClose();
        } catch (error) {
            setErrorMessage("Error guardando asistencia.");
            console.error("Error guardando asistencia: ", error);
        }
    };


    // Función para cargar asistencias previas de los alumnos para la semana seleccionada
    const fetchAttendanceForWeek = async (level, week) => {
        if (!level || !week) {
            setAttendanceByDay({});
            return;
        }
        setLoadingAttendance(true);
        try {
            // Obtener los alumnos del nivel seleccionado
            const studentQuery = query(
                collection(db, "nlp"),
                where("grade", "in", levels[level]),
                where("status", "==", "Activo")
            );
            const studentSnapshot = await getDocs(studentQuery);
            const studentsList = studentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Obtener los días de clase de la semana
            const classDays = getClassDaysOfWeek(week);
            const start = classDays[0].date;
            const end = classDays[1].date;

            // Consultar asistencias de la semana para esos alumnos
            const attendanceQuery = query(
                collection(db, "attendance"),
                where("studentId", "in", studentsList.map(s => s.id)),
                where("date", ">=", start),
                where("date", "<=", end)
            );
            const attendanceSnapshot = await getDocs(attendanceQuery);

            // Mapear asistencias por alumno y día
            const attendanceMap = {};
            studentsList.forEach(student => {
                attendanceMap[student.id] = {};
                classDays.forEach(day => {
                    attendanceMap[student.id][getDateKey(day.date)] = false; // Siempre la clave YYYY-MM-DD
                });
            });

            console.log('Claves de días:', classDays.map(day => getDateKey(day.date)));
            attendanceSnapshot.forEach(doc => {
                const data = doc.data();
                const dateKey = getDateKey(data.date.seconds ? data.date.seconds * 1000 : data.date);
                console.log('Firestore:', data.studentId, dateKey, data.attended);
                if (attendanceMap[data.studentId]) {
                    attendanceMap[data.studentId][dateKey] = !!data.attended;
                }
            });

            setStudents(studentsList);
            setAttendanceByDay(attendanceMap);
            setAttendanceByDay(attendanceMap);
        } catch (error) {
            setErrorMessage("Error cargando asistencias previas.");
            console.error("Error cargando asistencias previas: ", error);
        } finally {
            setLoadingAttendance(false);
        }
    };

    // Utilidad para obtener solo martes y miércoles de una semana
    function getClassDaysOfWeek(week) {
        const days = [];
        // Martes
        const tuesday = new Date(week.start);
        tuesday.setDate(week.start.getDate() + 1);
        // Miércoles
        const wednesday = new Date(week.start);
        wednesday.setDate(week.start.getDate() + 2);
        days.push({ label: tuesday.toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: '2-digit' }), date: tuesday });
        days.push({ label: wednesday.toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: '2-digit' }), date: wednesday });
        return days;
    }

    // Utilidad para obtener las últimas 4 semanas (lunes a domingo)
    function getLastFourWeeks() {
        const weeks = [];
        const today = new Date();
        // Empezar desde el lunes de la semana actual
        const currentMonday = new Date(today.setDate(today.getDate() - today.getDay() + 1));
        for (let i = 0; i < 6; i++) {
            const start = new Date(currentMonday);
            start.setDate(currentMonday.getDate() - i * 7);
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            weeks.push({
                label: `${start.toLocaleDateString('es-ES')} - ${end.toLocaleDateString('es-ES')}`,
                start: new Date(start),
                end: new Date(end),
            });
        }
        return weeks;
    }

    // Cambiar asistencia por alumno y día
    const handleAttendanceChangeByDay = (studentId, dateKey) => {
        setAttendanceByDay(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [dateKey]: !prev[studentId]?.[dateKey]
            }
        }));
    };

    // Función para actualizar datos
    const handleModAlumno = async () => {
        if (!guardando) {
            setGuardando(true);
            let progress1 = 0, progress2 = 0;
            const idDocumentos = selectedAlumnoRep;
            const updateTotalProgress = () => {
                const totalProgress = (progress1 + progress2) / 2;
                setProgressTotal(totalProgress);
            };
            // Verificar si los campos obligatorios están llenos
            if (
                !title ||
                !description ||
                !behdescription ||
                !selectedAlumnoRep
            ) {
                setErrorMessage("Por favor, complete todos los campos obligatorios.");
                setFormValid(false);
                setGuardando(false);
                return; // No enviar el formulario si falta algún campo obligatorio
            }

            try {

                let url1 = "", url2 = "";

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

                const fullN = await getFullName();
                const newfullN = fullN;

                const newData = {
                    idAlumno: idDocumentos,
                    nombreAlumno: `${formData.firstname} ${formData.lastname}`,
                    title: title,
                    description: description,
                    behdescription: behdescription,
                    idIncharge: user.uid,
                    teacher: newfullN,
                    date: new Date(),
                    images: {
                        url1: url1,
                        url2: url2,
                    },
                };

                const newUpData2 = {
                    action: "Registra un Reporte de Alumno NLP",
                    date: new Date(),
                    uid: user.uid,
                };

                // Actualizar el documento existente
                await addDoc(reportsReference, newData);
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

    function handleAlumnoRepChange(event) {
        const selectedAlumnoRepValue = event.target.value;
        // Actualiza el estado con el nuevo valor seleccionado
        setSelectedalumnoRep(selectedAlumnoRepValue);

        if (!selectedAlumnoRepValue) {
            // Limpiar formulario después de la actualización
            resetForm();
        } else {
            const selectedAlumnoRepData = alumnosReports.find(alumnoRep => alumnoRep.id === selectedAlumnoRepValue);

            const dateOfBirth = selectedAlumnoRepData.date instanceof Timestamp
                ? selectedAlumnoRepData.date.toDate() // Convertir Timestamp a Date
                : selectedAlumnoRepData.date;

            setFormData({
                firstname: selectedAlumnoRepData.firstname,
                lastname: selectedAlumnoRepData.lastname,
                age: selectedAlumnoRepData.age,
                grade: selectedAlumnoRepData.grade,
                imageurl: selectedAlumnoRepData.imageurl,
                date: dateOfBirth,
                indate: selectedAlumnoRepData.indate,
                sponsor_code: selectedAlumnoRepData.sponsor_code,
                father: selectedAlumnoRepData.father,
                mother: selectedAlumnoRepData.mother,
                household: selectedAlumnoRepData.household,
                siblings: selectedAlumnoRepData.siblings,
                co_siblings: selectedAlumnoRepData.co_siblings,
                status: selectedAlumnoRepData.status,
            });
            // Convierte la marca de tiempo Firestore a objeto Date y establece el estado
        }
    }



    const handleSearchChange = (e) => {
        const value = e.target.value.toLowerCase();
        setFilterValue(value);
        setFilteredAlumnosRep(alumnosRep.filter(alumnoR =>
            alumnoR.nombreAlumno.toLowerCase().includes(value)
        ));
    };
    const levelKeys = Object.keys(levels);

    return (
        <>
            <div className="espacioU">
                <Head>
                    <title>HORARIOS</title>
                    <meta name="description" content="PROYECTOS ACTUALUES" />
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                    <link rel="icon" href="/img/logo_paginas.png" />
                </Head>
                <div className="container mx-auto p-10 justify-center items-center h-full">
                    <h2 className="text-lg font-semibold mb-2 ">
                        <p className="text-center">CONTROL DE ASISTENCIAS Y REPORTES DE ALUMNOS</p>

                    </h2>
                    <div className="flex flex-wrap gap-3">
                        <Button
                            className="bg-gradient-to-tr from-pink-500 to-yellow-500 text-white mx-2 "
                            onPress={onModOpen}>
                            Generar Reporte de Alumno
                        </Button>
                        <Button
                            className="bg-gradient-to-tr from-pink-500 to-yellow-500 text-white mx-2 "
                            onPress={onAddOpen}>
                            Control de Asistencias
                        </Button>

                        <Button
                            className="bg-gradient-to-tr from-pink-500 to-yellow-500 text-white mx-2"
                            onPress={handleHistoryOpen} // Abrir modal de historial
                        >
                            Consultar Historial de Asistencias
                        </Button>

                        <Input
                            className="w-64"
                            placeholder="Buscar por nombre..."
                            value={filterValue}
                            onChange={handleSearchChange}
                            mb={4}
                        />
                    </div>
                    <Modal
                        backdrop="blur"
                        size="4xl"
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
                                    <ModalHeader className="text-center flex flex-col gap-1">Nuevo Reporte de Alumno</ModalHeader>
                                    <ModalBody>
                                        <div className="grid gap-1 grid-cols-1">
                                            {errorMessage && (
                                                <div className="text-red-500 text-center mb-4">
                                                    {errorMessage}
                                                </div>
                                            )}
                                            <div className="col-span-1">

                                                <label
                                                    className=" block text-sm font-medium leading-6 text-gray-900"
                                                >
                                                    <p className="font-bold text-lg ">Actualizaciones o Llamados de Atención</p>
                                                </label>

                                                <div className="mt-2 pr-4">

                                                    <Select
                                                        key={selectKey} // Clave para forzar re-renderizado
                                                        items={alumnosReports}
                                                        label="Redactar para:"
                                                        placeholder="Selecciona un Alumno"
                                                        className="max-w-xs"
                                                        value={selectedAlumnoRep}
                                                        isRequired

                                                        onChange={handleAlumnoRepChange}
                                                    >
                                                        {alumnosReports.map((supplier) => (
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
                                                className="flex justify-center block text-sm font-medium leading-6 text-gray-900"
                                            >
                                                <p className="font text-lg p-4">Informacion de Reporte </p>
                                            </label>

                                            <div className="flex justify-center justify-items-center">
                                                <Input
                                                    className="w-96"
                                                    isRequired
                                                    label="Title Report:"
                                                    id="title"
                                                    value={title}
                                                    onChange={(e) => setTitle(e.target.value)}
                                                />
                                            </div>
                                            <div className="flex flex-wrap gap-3 grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 justify-center justify-items-center">
                                                <Textarea
                                                    className="w-80"
                                                    isRequired
                                                    label="Academic Description"
                                                    id="description"
                                                    value={description}
                                                    onChange={(e) => setDescription(e.target.value)}
                                                />
                                                <Textarea
                                                    className="w-80"
                                                    isRequired
                                                    label="Child Behavior Description:"
                                                    id="description"
                                                    value={behdescription}
                                                    onChange={(e) => setBehdescription(e.target.value)}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-y-4 sm:grid-cols-1 md:grid-cols-2">

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

                                            </div>
                                            <Progress className="m-4" value={progressTotal} max={100} />
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
                                    <ModalHeader className="text-center flex flex-col gap-1">Control de Asistencias</ModalHeader>
                                    <ModalBody>
                                        <div className="grid gap-1 grid-cols-1">
                                            {errorMessage && (
                                                <div className="text-red-500 text-center mb-4">
                                                    {errorMessage}
                                                </div>
                                            )}
                                            <label className="block text-sm font-medium leading-6 text-gray-900">
                                                <Chip size="lg" color="primary" radius="sm" variant="flat">
                                                    Semana de: {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                                </Chip>
                                            </label>
                                            <Select
                                                isRequired
                                                label="Selecciona la Semana"
                                                placeholder="Selecciona una semana"
                                                selectedKeys={selectedWeek ? [selectedWeek.label] : []}
                                                onSelectionChange={async keys => {
                                                    const arrKeys = Array.from(keys);
                                                    if (arrKeys.length === 0) return;
                                                    const week = getLastFourWeeks().find(w => w.label === arrKeys[0]);
                                                    setSelectedWeek(week);
                                                    // Cargar asistencias previas si hay nivel seleccionado
                                                    if (selectedLevel) {
                                                        await fetchAttendanceForWeek(selectedLevel, week);
                                                    } else {
                                                        setAttendanceByDay({});
                                                    }
                                                }}
                                            >
                                                {getLastFourWeeks().map((week) => (
                                                    <SelectItem key={week.label} value={week.label}>
                                                        {week.label}
                                                    </SelectItem>
                                                ))}
                                            </Select>

                                            <Select
                                                isRequired
                                                key={selectKey}
                                                label="Selecciona el Nivel"
                                                placeholder="Selecciona un Nivel"
                                                selectedKeys={selectedLevel ? [selectedLevel] : []}
                                                onSelectionChange={async (nivel) => {
                                                    const arrKeys = Array.from(nivel);
                                                    if (arrKeys.length === 0) {
                                                        setStudents([]);
                                                        setSelectedLevel(null);
                                                        setAttendanceByDay({});
                                                    } else {
                                                        setSelectedLevel(arrKeys[0]);
                                                        await fetchAttendanceForWeek(arrKeys[0], selectedWeek);
                                                    }
                                                }}
                                            >
                                                {levelKeys.map((key) => (
                                                    <SelectItem key={key} value={key}>
                                                        {`Nivel ${key}: ${levels[key].join(', ')}`}
                                                    </SelectItem>
                                                ))}
                                            </Select>

                                            {students.length > 0 && (
                                                <div className="mt-4">
                                                    <div className="font-bold mb-2">Asistencia por día:</div>
                                                    {students.map((student) => (
                                                        <div key={student.id} className="mb-2">
                                                            <span className="font-semibold">{`${student.firstname} ${student.lastname}`}</span>
                                                            <div className="flex gap-4 ml-4">
                                                                {getClassDaysOfWeek(selectedWeek).map(day => {
                                                                    const checked = attendanceByDay[student.id]?.[getDateKey(day.date)] === true;
                                                                    console.log(student.id, getDateKey(day.date), checked);
                                                                    return (
                                                                        <Checkbox
                                                                            key={day.date.toISOString()}
                                                                            isSelected={attendanceByDay[student.id]?.[getDateKey(day.date)] === true}
                                                                            onValueChange={() => handleAttendanceChangeByDay(student.id, getDateKey(day.date))}
                                                                        >
                                                                            {day.label}
                                                                        </Checkbox>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </ModalBody>
                                    <ModalFooter>
                                        <Button color="danger" variant="light" onPress={handleModalClose}>
                                            Cancelar
                                        </Button>
                                        <Button color="primary" onPress={handleSaveAttendance}>
                                            Guardar
                                        </Button>
                                    </ModalFooter>
                                </>
                            )}
                        </ModalContent>
                    </Modal>

                    <Modal
                        size="3xl"
                        isOpen={isHistoryOpen}
                        onClose={handleHistoryClose}
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
                                    <ModalHeader className="text-center flex flex-col gap-1">Historial de Asistencias</ModalHeader>
                                    <ModalBody>
                                        <div className="grid gap-1 grid-cols-1">
                                            {errorMessage && (
                                                <div className="text-red-500 text-center mb-4">
                                                    {errorMessage}
                                                </div>
                                            )}

                                            {loadingAttendance ? (
                                                <div>Cargando asistencias...</div>
                                            ) : students.length > 0 && (
                                                <div className="mt-4">
                                                    {/* ...tu render de checkboxes... */}
                                                </div>
                                            )}
                                            <div className="flex flex-col mb-4">
                                                <label className="block text-sm font-medium leading-6 text-gray-900">
                                                    Selecciona un Alumno:
                                                </label>
                                                <Select
                                                    key={selectKey} // Clave para forzar re-renderizado
                                                    items={alumnosReports}
                                                    label="Alumno"
                                                    placeholder="Selecciona un Alumno"
                                                    id="selectStudent"
                                                    value={selectedStudent}
                                                    onChange={(student) => setSelectedStudent(student.target.value)}
                                                >
                                                    {alumnosReports.map((student) => (
                                                        <SelectItem key={student.id} value={student.id}>
                                                            {`${student.firstname} ${student.lastname}`}
                                                        </SelectItem>
                                                    ))}
                                                </Select>
                                            </div>
                                            <div className="flex gap-4 mb-4">
                                                <div className="flex flex-col">
                                                    <label className="block text-sm font-medium leading-6 text-gray-900">
                                                        Fecha de Inicio:
                                                    </label>
                                                    <Input
                                                        type="date"
                                                        value={selectedDateRange.start}
                                                        onChange={(e) => setSelectedDateRange(prev => ({ ...prev, start: e.target.value }))}
                                                    />
                                                </div>
                                                <div className="flex flex-col">
                                                    <label className="block text-sm font-medium leading-6 text-gray-900">
                                                        Fecha de Fin:
                                                    </label>
                                                    <Input
                                                        type="date"
                                                        value={selectedDateRange.end}
                                                        onChange={(e) => setSelectedDateRange(prev => ({ ...prev, end: e.target.value }))}
                                                    />
                                                </div>
                                            </div>
                                            <Button onPress={fetchAttendanceHistory} color="primary">
                                                Filtrar
                                            </Button>
                                            {filteredAttendance.length > 0 && (
                                                <div className="mt-4">
                                                    <ul>
                                                        {Object.keys(groupedAttendance).map((monthYear) => {
                                                            const [month, year] = monthYear.split('-');
                                                            const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' }).toUpperCase();
                                                            const yearNumber = parseInt(year, 10);

                                                            if (groupedAttendance[monthYear].length === 0) return null;

                                                            return (
                                                                <li key={monthYear}>
                                                                    <h3 className="font-bold text-lg mt-4">{`${monthName} ${yearNumber}`}</h3>
                                                                    <ul>
                                                                        {groupedAttendance[monthYear].map(record => (
                                                                            <li key={record.id}>
                                                                                {record.studentName} - {new Date(record.date.seconds * 1000).toLocaleDateString()}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </ModalBody>
                                    <ModalFooter>
                                        <Button color="danger" variant="light" onPress={handleHistoryClose}>
                                            Cerrar
                                        </Button>
                                    </ModalFooter>
                                </>
                            )}
                        </ModalContent>
                    </Modal>

                    <Divider className="my-4" />
                    <h2 className="text-lg font-semibold mb-2 ">
                        <p className="text-center">HISTORIAL DE REPORTES DE ALUMNOS</p>
                    </h2>
                    <Divider className="my-4" />
                    <ReusableTable data={filteredAlumnosRep} columns={columns} />
                </div>
            </div>
        </>
    );
};

export default HorariosComponent;
