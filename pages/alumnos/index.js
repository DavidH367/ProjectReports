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
import ReusableTable from "../../Components/Form/ReusableTable";
import { columns } from "../../Data/supliers/datas";
import FilterSection from "../../Components/Form/FilterSectionGastos";
import { startOfDay, endOfDay } from "date-fns";
import { parse, isAfter, isBefore } from "date-fns";


import { Card, CardHeader, CardBody, CardFooter, Image, Button } from "@nextui-org/react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@nextui-org/react";


const InformeGastos = () => {
    //inicio para el filtro de datos
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]); // Agrega el estado para los datos filtrados
    const [combinedData, setCombinedData] = useState([]);

    const { isOpen, onOpen, onClose } = useDisclosure();
    const [size, setSize] = React.useState('sm');
    const [scrollBehavior, setScrollBehavior] = React.useState("inside");


    const handleOpen = (size) => {
        setSize(size)
        onOpen();
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



    //traer datos de FireStore
    useEffect(() => {
        const fetchExpenses = async () => {
            // Consulta a la colección "updates"
            const updatesQuery = query(collection(db, "updates"), orderBy("date", "desc"));
            const updatesSnapshot = await getDocs(updatesQuery);

            const updatesData = [];
            const userIds = new Set(); // Usaremos un Set para almacenar los UID únicos

            updatesSnapshot.forEach((doc) => {
                const data = doc.data();
                updatesData.push({ ...data, id: doc.id });
                userIds.add(data.uid); // Asumiendo que los documentos en "updates" tienen un campo "uid"
            });

            // Crear un array de promesas para obtener los documentos de la colección "users"
            const userPromises = Array.from(userIds).map(uid =>
                getDoc(doc(db, "users", uid))
            );

            // Esperar a que todas las promesas se resuelvan
            const userDocs = await Promise.all(userPromises);

            // Crear un mapa para acceder a los datos de los usuarios por su UID
            const usersArray = userDocs.map(userDoc => {
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    return {
                        uid: userDoc.id,
                        displayName: userData.displayName,
                        role: userData.role,
                    };
                }
                return null;
            }).filter(user => user !== null);

            const combinedData = updatesData.map(update => {
                const user = usersArray.find(user => user.uid === update.uid);
                return {
                    ...update,
                    displayName: user ? user.displayName : "Unknown",
                    role: user ? user.role : "Unknown",
                };
            });

            setData(combinedData);
            setCombinedData(combinedData);
            console.log(combinedData); // Inicializa los datos filtrados con los datos originales
        };

        fetchExpenses();
    }, []);


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
                    <h2 className="text-lg font-semibold mb-2 ">
                        <p className="text-center">ALUMNOS REGISTRADOS EN PROYECTO NUEVA VIDA</p>
                    </h2>
                    <div class="p-1 grid grid-cols-4 gap-1">
                        <div >
                            <Card isFooterBlurred className="w-full h-full col-span-12 sm:col-span-5">
                                <CardHeader className="absolute z-10 top-1 flex-col items-start">
                                    <p className="text-tiny text-white/70 uppercase ">10 years old</p>
                                    <h4 className="text-white text-tiny font-bold uppercase text-sm">Belkis Yojana Vasquez Rodriguez</h4>
                                </CardHeader>
                                <Image
                                    removeWrapper
                                    alt="Card example background"
                                    className="z-0 w-full h-full scale-125 -translate-y-6 object-cover"
                                    src=""
                                />
                                <CardFooter className="absolute bg-white/30 bottom-0 border-t-1 border-zinc-100/50 z-10 justify-between">
                                    <div>
                                        <p className="text-black text-tiny ">First Grade.</p>
                                        <p className="text-black text-tiny font-bold">Born December 18th.</p>
                                    </div>
                                    <Button key={size} onPress={() => handleOpen(size)}>More Info</Button>
                                    <Modal
                                        size={size}
                                        isOpen={isOpen}
                                        onClose={onClose}
                                        scrollBehavior={scrollBehavior}
                                    >
                                        <ModalContent>
                                            {(onClose) => (
                                                <>
                                                    <ModalHeader className="flex flex-col gap-1">Belkis Yojana Vasquez Rodriguez</ModalHeader>
                                                    <ModalBody>
                                                        <Image
                                                            removeWrapper
                                                            alt="Child Cards"
                                                            className="z-0 w-[250px] h-[300px] scale-90 -translate-y-6 translate-x-10 object-cover"
                                                            src=""
                                                        />
                                                        <div class="grid gap-1 grid-cols-1">
                                                            <p class="font-sans text-base font-bold ">Personal Information</p>
                                                            <p class=" text-sm ">Age: {10} years old</p>
                                                            <p class="text-sm ">Grade: {"1st First"} </p>
                                                            <p class="text-sm ordinal">Born: {"December 28th"}</p>

                                                        </div>
                                                        <div class="grid gap-1 grid-cols-1">
                                                            <p class="text-base font-bold ">Condition of Living</p>
                                                            <p class="text-sm ">Mother's Name: { }</p>
                                                            <p class="text-sm ">Father's Name: { }</p>
                                                            <p class="text-sm ">People living in the household: { }</p>
                                                            <p class="text-sm ">Sibligns: { }</p>
                                                            <p class="text-sm ">Siblings in the New Life Project: { }</p>
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
                                </CardFooter>
                            </Card>
                        </div>
                        <div class="gap-4 p-4">
                            <Card isFooterBlurred className="w-[250px] h-[300px] col-span-12 sm:col-span-5">
                                <CardHeader className="absolute z-10 top-1 flex-col items-start">
                                    <p className="text-tiny text-white/70 uppercase ">10 years old</p>
                                    <h4 className="text-white text-tiny font-bold uppercase text-sm">Belkis Yojana Vasquez Rodriguez</h4>
                                </CardHeader>
                                <Image
                                    removeWrapper
                                    alt="Card example background"
                                    className="z-0 w-full h-full scale-125 -translate-y-6 object-cover"
                                    src=""
                                />
                                <CardFooter className="absolute bg-white/30 bottom-0 border-t-1 border-zinc-100/50 z-10 justify-between">
                                    <div>
                                        <p className="text-black text-tiny ">First Grade.</p>
                                        <p className="text-black text-tiny font-bold">Born December 18th.</p>
                                    </div>
                                    <Button key={size} onPress={() => handleOpen(size)}>More Info</Button>
                                    <Modal
                                        size={size}
                                        isOpen={isOpen}
                                        onClose={onClose}
                                        scrollBehavior={scrollBehavior}
                                    >
                                        <ModalContent>
                                            {(onClose) => (
                                                <>
                                                    <ModalHeader className="flex flex-col gap-1">Belkis Yojana Vasquez Rodriguez</ModalHeader>
                                                    <ModalBody>
                                                        <Image
                                                            removeWrapper
                                                            alt="Child Cards"
                                                            className="z-0 w-[250px] h-[300px] scale-90 -translate-y-6 translate-x-10 object-cover"
                                                            src=""
                                                        />
                                                        <div class="grid gap-1 grid-cols-1">
                                                            <p class="font-sans text-base font-bold ">Personal Information</p>
                                                            <p class=" text-sm ">Age: {10} years old</p>
                                                            <p class="text-sm ">Grade: {"1st First"} </p>
                                                            <p class="text-sm ordinal">Born: {"December 28th"}</p>

                                                        </div>
                                                        <div class="grid gap-1 grid-cols-1">
                                                            <p class="text-base font-bold ">Condition of Living</p>
                                                            <p class="text-sm ">Mother's Name: { }</p>
                                                            <p class="text-sm ">Father's Name: { }</p>
                                                            <p class="text-sm ">People living in the household: { }</p>
                                                            <p class="text-sm ">Sibligns: { }</p>
                                                            <p class="text-sm ">Siblings in the New Life Project: { }</p>
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
                                </CardFooter>
                            </Card>
                        </div>
                        <div class="gap-4 p-4">
                            <Card isFooterBlurred className="w-[250px] h-[300px] col-span-12 sm:col-span-5">
                                <CardHeader className="absolute z-10 top-1 flex-col items-start">
                                    <p className="text-tiny text-white/70 uppercase ">10 years old</p>
                                    <h4 className="text-white text-tiny font-bold uppercase text-sm">Belkis Yojana Vasquez Rodriguez</h4>
                                </CardHeader>
                                <Image
                                    removeWrapper
                                    alt="Card example background"
                                    className="z-0 w-full h-full scale-125 -translate-y-6 object-cover"
                                    src=""
                                />
                                <CardFooter className="absolute bg-white/30 bottom-0 border-t-1 border-zinc-100/50 z-10 justify-between">
                                    <div>
                                        <p className="text-black text-tiny ">First Grade.</p>
                                        <p className="text-black text-tiny font-bold">Born December 18th.</p>
                                    </div>
                                    <Button key={size} onPress={() => handleOpen(size)}>More Info</Button>
                                    <Modal
                                        size={size}
                                        isOpen={isOpen}
                                        onClose={onClose}
                                        scrollBehavior={scrollBehavior}
                                    >
                                        <ModalContent>
                                            {(onClose) => (
                                                <>
                                                    <ModalHeader className="flex flex-col gap-1">Belkis Yojana Vasquez Rodriguez</ModalHeader>
                                                    <ModalBody>
                                                        <Image
                                                            removeWrapper
                                                            alt="Child Cards"
                                                            className="z-0 w-[250px] h-[300px] scale-90 -translate-y-6 translate-x-10 object-cover"
                                                            src=""
                                                        />
                                                        <div class="grid gap-1 grid-cols-1">
                                                            <p class="font-sans text-base font-bold ">Personal Information</p>
                                                            <p class=" text-sm ">Age: {10} years old</p>
                                                            <p class="text-sm ">Grade: {"1st First"} </p>
                                                            <p class="text-sm ordinal">Born: {"December 28th"}</p>

                                                        </div>
                                                        <div class="grid gap-1 grid-cols-1">
                                                            <p class="text-base font-bold ">Condition of Living</p>
                                                            <p class="text-sm ">Mother's Name: { }</p>
                                                            <p class="text-sm ">Father's Name: { }</p>
                                                            <p class="text-sm ">People living in the household: { }</p>
                                                            <p class="text-sm ">Sibligns: { }</p>
                                                            <p class="text-sm ">Siblings in the New Life Project: { }</p>
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
                                </CardFooter>
                            </Card>
                        </div>
                        <div class="gap-4 p-4">
                            <Card isFooterBlurred className="w-[250px] h-[300px] col-span-12 sm:col-span-5">
                                <CardHeader className="absolute z-10 top-1 flex-col items-start">
                                    <p className="text-tiny text-white/70 uppercase ">10 years old</p>
                                    <h4 className="text-white text-tiny font-bold uppercase text-sm">Belkis Yojana Vasquez Rodriguez</h4>
                                </CardHeader>
                                <Image
                                    removeWrapper
                                    alt="Card example background"
                                    className="z-0 w-full h-full scale-125 -translate-y-6 object-cover"
                                    src=""
                                />
                                <CardFooter className="absolute bg-white/30 bottom-0 border-t-1 border-zinc-100/50 z-10 justify-between">
                                    <div>
                                        <p className="text-black text-tiny ">First Grade.</p>
                                        <p className="text-black text-tiny font-bold">Born December 18th.</p>
                                    </div>
                                    <Button key={size} onPress={() => handleOpen(size)}>More Info</Button>
                                    <Modal
                                        size={size}
                                        isOpen={isOpen}
                                        onClose={onClose}
                                        scrollBehavior={scrollBehavior}
                                    >
                                        <ModalContent>
                                            {(onClose) => (
                                                <>
                                                    <ModalHeader className="flex flex-col gap-1">Belkis Yojana Vasquez Rodriguez</ModalHeader>
                                                    <ModalBody>
                                                        <Image
                                                            removeWrapper
                                                            alt="Child Cards"
                                                            className="z-0 w-[250px] h-[300px] scale-90 -translate-y-6 translate-x-10 object-cover"
                                                            src=""
                                                        />
                                                        <div class="grid gap-1 grid-cols-1">
                                                            <p class="font-sans text-base font-bold ">Personal Information</p>
                                                            <p class=" text-sm ">Age: {10} years old</p>
                                                            <p class="text-sm ">Grade: {"1st First"} </p>
                                                            <p class="text-sm ordinal">Born: {"December 28th"}</p>

                                                        </div>
                                                        <div class="grid gap-1 grid-cols-1">
                                                            <p class="text-base font-bold ">Condition of Living</p>
                                                            <p class="text-sm ">Mother's Name: { }</p>
                                                            <p class="text-sm ">Father's Name: { }</p>
                                                            <p class="text-sm ">People living in the household: { }</p>
                                                            <p class="text-sm ">Sibligns: { }</p>
                                                            <p class="text-sm ">Siblings in the New Life Project: { }</p>
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
                                </CardFooter>
                            </Card>
                        </div>
                        <div class="gap-4 p-4">
                            <Card isFooterBlurred className="w-[250px] h-[300px] col-span-12 sm:col-span-5">
                                <CardHeader className="absolute z-10 top-1 flex-col items-start">
                                    <p className="text-tiny text-white/70 uppercase ">10 years old</p>
                                    <h4 className="text-white text-tiny font-bold uppercase text-sm">Belkis Yojana Vasquez Rodriguez</h4>
                                </CardHeader>
                                <Image
                                    removeWrapper
                                    alt="Card example background"
                                    className="z-0 w-full h-full scale-125 -translate-y-6 object-cover"
                                    src=""
                                />
                                <CardFooter className="absolute bg-white/30 bottom-0 border-t-1 border-zinc-100/50 z-10 justify-between">
                                    <div>
                                        <p className="text-black text-tiny ">First Grade.</p>
                                        <p className="text-black text-tiny font-bold">Born December 18th.</p>
                                    </div>
                                    <Button key={size} onPress={() => handleOpen(size)}>More Info</Button>
                                    <Modal
                                        size={size}
                                        isOpen={isOpen}
                                        onClose={onClose}
                                        scrollBehavior={scrollBehavior}
                                    >
                                        <ModalContent>
                                            {(onClose) => (
                                                <>
                                                    <ModalHeader className="flex flex-col gap-1">Belkis Yojana Vasquez Rodriguez</ModalHeader>
                                                    <ModalBody>
                                                        <Image
                                                            removeWrapper
                                                            alt="Child Cards"
                                                            className="z-0 w-[250px] h-[300px] scale-90 -translate-y-6 translate-x-10 object-cover"
                                                            src=""
                                                        />
                                                        <div class="grid gap-1 grid-cols-1">
                                                            <p class="font-sans text-base font-bold ">Personal Information</p>
                                                            <p class=" text-sm ">Age: {10} years old</p>
                                                            <p class="text-sm ">Grade: {"1st First"} </p>
                                                            <p class="text-sm ordinal">Born: {"December 28th"}</p>

                                                        </div>
                                                        <div class="grid gap-1 grid-cols-1">
                                                            <p class="text-base font-bold ">Condition of Living</p>
                                                            <p class="text-sm ">Mother's Name: { }</p>
                                                            <p class="text-sm ">Father's Name: { }</p>
                                                            <p class="text-sm ">People living in the household: { }</p>
                                                            <p class="text-sm ">Sibligns: { }</p>
                                                            <p class="text-sm ">Siblings in the New Life Project: { }</p>
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
                                </CardFooter>
                            </Card>
                        </div>
                        <div class="gap-4 p-4">
                            <Card isFooterBlurred className="w-[250px] h-[300px] col-span-12 sm:col-span-5">
                                <CardHeader className="absolute z-10 top-1 flex-col items-start">
                                    <p className="text-tiny text-white/70 uppercase ">10 years old</p>
                                    <h4 className="text-white text-tiny font-bold uppercase text-sm">Belkis Yojana Vasquez Rodriguez</h4>
                                </CardHeader>
                                <Image
                                    removeWrapper
                                    alt="Card example background"
                                    className="z-0 w-full h-full scale-125 -translate-y-6 object-cover"
                                    src=""
                                />
                                <CardFooter className="absolute bg-white/30 bottom-0 border-t-1 border-zinc-100/50 z-10 justify-between">
                                    <div>
                                        <p className="text-black text-tiny ">First Grade.</p>
                                        <p className="text-black text-tiny font-bold">Born December 18th.</p>
                                    </div>
                                    <Button key={size} onPress={() => handleOpen(size)}>More Info</Button>
                                    <Modal
                                        size={size}
                                        isOpen={isOpen}
                                        onClose={onClose}
                                        scrollBehavior={scrollBehavior}
                                    >
                                        <ModalContent>
                                            {(onClose) => (
                                                <>
                                                    <ModalHeader className="flex flex-col gap-1">Belkis Yojana Vasquez Rodriguez</ModalHeader>
                                                    <ModalBody>
                                                        <Image
                                                            removeWrapper
                                                            alt="Child Cards"
                                                            className="z-0 w-[250px] h-[300px] scale-90 -translate-y-6 translate-x-10 object-cover"
                                                            src=""
                                                        />
                                                        <div class="grid gap-1 grid-cols-1">
                                                            <p class="font-sans text-base font-bold ">Personal Information</p>
                                                            <p class=" text-sm ">Age: {10} years old</p>
                                                            <p class="text-sm ">Grade: {"1st First"} </p>
                                                            <p class="text-sm ordinal">Born: {"December 28th"}</p>

                                                        </div>
                                                        <div class="grid gap-1 grid-cols-1">
                                                            <p class="text-base font-bold ">Condition of Living</p>
                                                            <p class="text-sm ">Mother's Name: { }</p>
                                                            <p class="text-sm ">Father's Name: { }</p>
                                                            <p class="text-sm ">People living in the household: { }</p>
                                                            <p class="text-sm ">Sibligns: { }</p>
                                                            <p class="text-sm ">Siblings in the New Life Project: { }</p>
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
                                </CardFooter>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default InformeGastos;