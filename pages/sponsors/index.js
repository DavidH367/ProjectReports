import React, { useState, useEffect } from "react";
import Head from "next/head";
import "firebase/firestore";
import { db } from "../../lib/firebase";
import {
    addDoc,
    collection,
    query,
    getDocs,
    doc,
    updateDoc,
    onSnapshot
} from "firebase/firestore";
import { useAuth } from "../../lib/context/AuthContext";
import { useRouter } from "next/router";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import "react-datepicker/dist/react-datepicker.css";
import { Button, Select, SelectItem, Chip, Avatar, Skeleton, Divider, Textarea } from "@nextui-org/react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Input, Link, Switch, RadioGroup, Radio } from "@nextui-org/react";
import ReusableTable from "../../Components/Form/ReusableTableS";
import { columns } from "../../Data/sponsors/datas";

const upReference = collection(db, "updates");
const sponsorsInfoRef = collection(db, "sponsors");
const storage = getStorage();

const SponsorsNLPComponent = () => {
    //Valida acceso a la pagina
    const router = useRouter();
    const { user, errors, setErrors } = useAuth();
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]); // Agrega el estado para los datos filtrados
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
    const [sponsors, setSponsors] = useState([]);
    const [filteredSponsors, setFilteredSponsors] = useState([]);
    const [filterValue, setFilterValue] = useState("");

    const [selectedSponsor, setSelectedSponsor] = useState(null);
    const [formData, setFormData] = useState({
        fullname: "",
        email: "",
        church: "",
        payment_type: "",
        address: "",
        code: null,
        status: ""
    });

    const [fullname, setFullname] = useState("");
    const [email, setEmail] = useState("");
    const [church, setChurch] = useState("");
    const [payment_type, setPayment_type] = useState("");
    const [address, setAddress] = useState("");
    const [code, setCode] = useState(null);
    const [status, setStatus] = useState("");
    const [selectKey, setSelectKey] = useState(0);

    useEffect(() => {
        const fetchSponsors = async () => {
            try {
                const querySnapshot = await getDocs(sponsorsInfoRef);

                const sponsorData = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    sponsorData.push({
                        id: doc.id,
                        fullname: data.fullname,
                        email: data.email,
                        church: data.church,
                        payment_type: data.payment_type,
                        address: data.address,
                        code: data.code,
                        status: data.status
                    });
                });

                setSponsors(sponsorData);
            } catch (error) {
                console.error("Error fetching sponsors from Firestore:", error);
            }
        };
        fetchSponsors();
    }, [sponsorsInfoRef]);

    //traer datos de FireStore
    useEffect(() => {
        const q = query(collection(db, "sponsors"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const sponsorsData = [];
            let indexs = 1;
            querySnapshot.forEach((doc) => {
                sponsorsData.push({ ...doc.data(), indexs: indexs++ });
            });
            setData(sponsorsData);
            setFilteredData(sponsorsData);
        });
        // Cleanup the listener on unmount
        return () => unsubscribe();
    }, []);

    function handleSponsorChange(event) {
        const selectedSponsorValue = event.target.value;
        // Actualiza el estado con el nuevo valor seleccionado
        setSelectedSponsor(selectedSponsorValue);

        if (!selectedSponsorValue) {
            // Limpiar formulario después de la actualización
            resetForm();
        } else {
            const selectedSponsorData = sponsors.find(supplier => supplier.id === selectedSponsorValue);
            setFormData({
                fullname: selectedSponsorData.fullname,
                email: selectedSponsorData.email,
                church: selectedSponsorData.church,
                payment_type: selectedSponsorData.payment_type,
                address: selectedSponsorData.address,
                code: selectedSponsorData.code,
                status: selectedSponsorData.status,
            });
            // Convierte la marca de tiempo Firestore a objeto Date y establece el estado
        }
    }

    useEffect(() => {
        const q = query(collection(db, "sponsors"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const sponsorsData = [];
            querySnapshot.forEach((doc) => {
                sponsorsData.push({ id: doc.id, ...doc.data() });
            });
            setSponsors(sponsorsData);
            setFilteredSponsors(sponsorsData);
        });
        return () => unsubscribe();
    }, []);

    const handleSearchChange = (e) => {
        const value = e.target.value.toLowerCase();
        setFilterValue(value);
        setFilteredSponsors(sponsors.filter(sponsor =>
            sponsor.fullname.toLowerCase().includes(value) ||
            sponsor.email.toLowerCase().includes(value)
        ));
    };

    const handleModalClose = () => {
        // Restablecer los valores del formulario
        setFullname("");
        setEmail("");
        setChurch("");
        setPayment_type("");
        setAddress("");
        setCode(null);
        setStatus("");

        onAddClose();
    };

    const handleModalClose2 = () => {
        resetForm();
        setErrorMessage("");
        // Cerrar el modal
        onModClose();
    };
    const getLastCode = async () => {
        const sponsorsSnapshot = await getDocs(collection(db, "sponsors"));
        let maxCode = 0;

        sponsorsSnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.code > maxCode) {
                maxCode = data.code;
            }
        });

        return maxCode;
    };

    // Función para Agregar datos
    const handleAddAlumno = async () => {
        if (!guardando) {
            setGuardando(true);

            // Verificar si los campos obligatorios están llenos
            if (
                !fullname ||
                !email ||
                !payment_type ||
                !status
            ) {
                setErrorMessage("Por favor, complete todos los campos obligatorios.");
                setFormValid(false);
                setGuardando(false);
                return; // No enviar el formulario si falta algún campo obligatorio
            }

            try {
                // Obtener el último valor de 'code' y sumarle 1
                const lastCode = await getLastCode();
                const newCode = lastCode + 1;

                const newData = {
                    fullname: fullname,
                    email: email,
                    church: church,
                    payment_type: payment_type,
                    address: address,
                    code: newCode,
                    status: status,
                };

                const newUpData = {
                    action: "Registra Nuevo Sponsor NLP",
                    date: new Date(),
                    uid: user.uid,
                };

                // Crear un nuevo documento
                await addDoc(sponsorsInfoRef, newData);
                await addDoc(upReference, newUpData);

                // Restablecer los valores del formulario
                setFullname("");
                setEmail("");
                setChurch("");
                setPayment_type("");
                setAddress("");
                setCode(null);
                setStatus("");

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

            const idDocumentos = selectedSponsor;

            // Verificar si los campos obligatorios están llenos
            if (
                !formData.fullname ||
                !formData.email ||
                !formData.payment_type ||
                !formData.code
            ) {
                setErrorMessage("Por favor, complete todos los campos obligatorios.");
                setFormValid(false);
                setGuardando(false);
                return; // No enviar el formulario si falta algún campo obligatorio
            }

            try {

                const newData = {
                    fullname: formData.fullname,
                    email: formData.email,
                    church: formData.church,
                    payment_type: formData.payment_type,
                    address: formData.address,
                    code: formData.code,
                    status: formData.status,
                };

                const newUpData2 = {
                    action: "Actualiza Sponsor NLP",
                    date: new Date(),
                    uid: user.uid,
                };

                // Actualizar el documento existente
                const docRef = doc(sponsorsInfoRef, idDocumentos);
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
            fullname: "",
            email: "",
            church: "",
            payment_type: "",
            address: "",
            code: null
        });

    };

    return (
        <>
            <div className="espacioU">
                <Head>
                    <title>PATROCINADORES REGISTRADOS EN PROYECTO NUEVA VIDA</title>
                    <meta name="description" content="ACTUALIZACIONES DE ACTIVIDADES" />
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                    <link rel="icon" href="/img/logo_paginas.png" />
                </Head>
                <div className="container mx-auto p-1 ">
                    <h2 className="text-lg font-semibold mb-4 text-center">
                        PATROCINADORES REGISTRADOS EN PROYECTO NUEVA VIDA
                    </h2>
                    <div className="">
                        <div className="">
                            <div className="space-y-2 ">

                                <Button
                                    className="bg-gradient-to-tr from-pink-500 to-yellow-500 text-white mx-2 "
                                    onPress={onAddOpen}>
                                    Registrar Nuevo Patrocinador
                                </Button>


                                <Button
                                    className="bg-gradient-to-tr from-pink-500 to-yellow-500 text-white mx-2 "
                                    onPress={onModOpen}>
                                    Actualizar Info Patrocinador
                                </Button>

                                <Input
                                    className="w-64"
                                    placeholder="Buscar por nombre o email..."
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
                                            <ModalHeader className="text-center flex flex-col gap-1">Registrar Nuevo Patrocinador</ModalHeader>
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
                                                        <p className="font text-md p-4">Informacion Personal del Patrocinador </p>
                                                    </label>
                                                    <Input
                                                        className="w-64"
                                                        isRequired
                                                        label="Full Name"
                                                        id="fullname"
                                                        value={fullname}
                                                        onChange={(e) => setFullname(e.target.value)}
                                                    />
                                                    <Input
                                                        className="w-64"
                                                        isRequired
                                                        type="email"
                                                        label="Email @"
                                                        id="email"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                    />
                                                    <Input
                                                        className="w-64"
                                                        isRequired
                                                        label="Church"
                                                        id="church"
                                                        value={church}
                                                        onChange={(e) => setChurch(e.target.value)}
                                                    />

                                                    <Input
                                                        className="w-64"
                                                        isRequired
                                                        label="Payment Type"
                                                        id="payment_type"
                                                        value={payment_type}
                                                        onChange={(e) => setPayment_type(e.target.value)}
                                                    />

                                                    <Textarea
                                                        className="w-64"
                                                        isRequired
                                                        label="Address"
                                                        id="address"
                                                        value={address}
                                                        onChange={(e) => setAddress(e.target.value)}
                                                    />

                                                    <RadioGroup
                                                        id="status"
                                                        className="text-sm"
                                                        isRequired
                                                        value={status}
                                                        label="Sponsor Status"
                                                        onChange={(e) => setStatus(e.target.value)}
                                                    >
                                                        <Radio value="active">Active</Radio>
                                                        <Radio value="paused">Paused</Radio>
                                                        <Radio value="removed">Removed</Radio>
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
                                            <ModalHeader className="text-center flex flex-col gap-1">Informacion de Patrocinador</ModalHeader>
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
                                                            <p className="font-bold text-lg ">Actualizar Info Patrocinadores</p>
                                                            <p className="font-light text-tiny ">Selecciona para Actualizar ó Deseleccionar para Agregar:</p>
                                                        </label>

                                                        <div className="mt-2 pr-4">
                                                            <Select
                                                                key={selectKey} // Clave para forzar re-renderizado
                                                                items={sponsors}
                                                                label="Actualizar a:"
                                                                placeholder="Selecciona un Sponsor"
                                                                className="max-w-xs"
                                                                value={selectedSponsor}

                                                                onChange={handleSponsorChange}
                                                            >
                                                                {sponsors.map((sponsor) => (
                                                                    <SelectItem key={sponsor.id} textValue={`${sponsor.fullname}`} >
                                                                        <div className="flex gap-2 items-center">
                                                                            <Avatar className="flex-shrink-0" size="sm" src="../img/user.png" />
                                                                            <div className="flex flex-col">
                                                                                <span className="text-small">{sponsor.fullname} </span>
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
                                                        <p className="font text-md p-4">Informacion Personal del Sponsor </p>
                                                    </label>
                                                    <Input
                                                        className="w-64"
                                                        isRequired
                                                        label="Full Name"
                                                        id="fullname"
                                                        value={formData.fullname}
                                                        onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                                                    />
                                                    <Input
                                                        className="w-64"
                                                        isRequired
                                                        type="email"
                                                        label="Email"
                                                        id="email"
                                                        value={formData.email}
                                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    />
                                                    <Input
                                                        className="w-64"
                                                        isRequired
                                                        label="Church"
                                                        id="church"
                                                        value={formData.church}
                                                        onChange={(e) => setFormData({ ...formData, church: e.target.value })}
                                                    />

                                                    <Input
                                                        className="w-64"
                                                        isRequired
                                                        label="Payment Type"
                                                        id="payment_type"
                                                        value={formData.payment_type}
                                                        onChange={(e) => setFormData({ ...formData, payment_type: e.target.value })}
                                                    />

                                                    <Textarea
                                                        className="w-64"
                                                        isRequired
                                                        label="Address"
                                                        id="address"
                                                        value={formData.address}
                                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                    />
                                                    <Chip size="md">N° Patrocinador: SP - {formData.code}</Chip>
                                                    <RadioGroup
                                                        id="status"
                                                        className="text-sm"
                                                        isRequired
                                                        value={formData.status}
                                                        label="Sponsor Status"
                                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                                    >
                                                        <Radio value="active">Active</Radio>
                                                        <Radio value="paused">Paused</Radio>
                                                        <Radio value="removed">Removed</Radio>
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

                    <Divider className="my-4" />
                    <h2 className="text-lg font-semibold mb-2 ">
                        <p className="text-center">PROYECTOS ACTUALUES</p>
                    </h2>
                    <Divider className="my-4" />
                    <ReusableTable data={filteredSponsors} columns={columns} />
                </div>
            </div>
        </>
    );
};

export default SponsorsNLPComponent;