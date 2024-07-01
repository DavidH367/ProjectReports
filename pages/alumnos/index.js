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

import { Card, CardHeader, CardBody, CardFooter, Image, Button } from "@nextui-org/react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@nextui-org/react";

const formatDate = (timestamp) => {
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
};

const Alumnos = () => {
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
    const [size, setSize] = React.useState('sm');
    const [scrollBehavior, setScrollBehavior] = React.useState("inside");


    useEffect(() => {
        if (!user) {
            setErrors("");
            router.push("/auth/Login");
        }
    }, [user]);

    const [alumnos, setAlumnos] = useState([]);
    const [selectedAlumno, setSelectedAlumno] = useState(null);

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
                    <div className="p-1 grid grid-cols-4 gap-1">
                        {alumnos.map((alumno, index) => (
                            <div key={index}>
                                <Card isFooterBlurred className="w-full h-full col-span-12 sm:col-span-5">
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
                                    <CardFooter className="absolute bg-white/30 bottom-0 border-t-1 border-zinc-100/50 z-10 justify-between">
                                        <div>
                                            <p className="text-black text-tiny">{alumno.grade}</p>
                                            <p className="text-black text-tiny font-bold">Born {formatDate(alumno.date)}</p>
                                        </div>
                                        <Button onPress={() => handleOpen(alumno)}>More Info</Button>
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
                                <ModalHeader className="flex flex-col gap-1">{selectedAlumno.firstname} {selectedAlumno.lastname}</ModalHeader>
                                <ModalBody>
                                    <Image
                                        removeWrapper
                                        alt="Child Cards"
                                        className="z-0 w-[250px] h-[300px] scale-90 -translate-y-6 translate-x-20 object-cover"
                                        src={selectedAlumno.imageurl}
                                    />
                                    <div className="grid gap-1 grid-cols-1">
                                        <p className="font-sans text-base font-bold">Personal Information</p>
                                        <p className="text-sm">Age: {selectedAlumno.age} years old</p>
                                        <p className="text-sm">Grade: {selectedAlumno.grade}</p>
                                        <p className="text-sm">Born: {formatDate(selectedAlumno.date)}</p>
                                        <p className="text-sm">Date: {selectedAlumno.indate}</p>
                                    </div>
                                    <div className="grid gap-1 grid-cols-1">
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

export default Alumnos;