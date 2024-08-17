import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Link,
  Dropdown,
  DropdownItem,
  NavbarMenuToggle,
  DropdownMenu,
  DropdownTrigger,
  Avatar,
  NavbarMenu,
  NavbarMenuItem,
  Button,
} from "@nextui-org/react";
import { db } from "../../lib/firebase";
import { doc, onSnapshot } from "@firebase/firestore";
import { useRouter } from "next/router";
import { useAuth } from "../../lib/context/AuthContext";
import { useState, useEffect } from "react";
import React from "react";
import Logo from "../../Components/Home/logo";

export default function App() {
  const { logout, user } = useAuth();
  const [localUser, setLocalUser] = useState({});
  const [loadedUser, setLoadedUser] = useState(false);
  const router = useRouter();
  const { pathname } = router;
  const routeSplit = pathname.split("/")[1];
  
  const handleLogout = async () => {
    localStorage.removeItem("user");
    const logoutUser = await logout();
    if (logoutUser) {
      router.push("/auth/Login");
      return;
    }
  };
  useEffect(() => {
    //get rest of user information
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const UserLogin = doc.data();
        const newUser = {
          displayname: `${UserLogin.firstName} ${UserLogin.lastName}`,
          email: UserLogin.email,
          role: UserLogin.role
        };
        localStorage.setItem("user", JSON.stringify(newUser));
        //saving user data in local storage
        setLocalUser(newUser);
        setLoadedUser(true);
      }
    });
    return () => unsubscribe();
  }, [loadedUser, user]);

  // Definimos los items del menú, separando los items restringidos
  const restrictedItems = [
    { text: "MINISTERIOS", url: "/ministry" },
    { text: "ACTUALIZACION DE MINISTERIOS", url: "/news" },
  ];
  
  const commonItems = [
    { text: "HOME", url: "../" },
    { text: "ESCUELA NLP", url: "/nlpSchool" },
    { text: "REGISTRO DE EVENTOS", url: "/eventos" },
    { text: "USUARIOS", url: "/users" },
  ];

  // Filtramos los items según el rol del usuario
  const menuItems = localUser.role === "ADMINISTRADOR" || localUser.role === "SUPERVISOR"
    ? [...restrictedItems, ...commonItems]
    : commonItems;

  return (
    <Navbar isBordered>
      <NavbarContent className="movil" justify="start">
        <NavbarMenuToggle />
      </NavbarContent>

      <NavbarContent className="movil pr-3" justify="center">
        <NavbarBrand>
          <Link color="foreground" href="../">
            <Logo />
          </Link>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden flexin g" justify="center">
        <NavbarBrand>
          <Link color="foreground" href="../" isBlock>
            <Logo />
          </Link>
        </NavbarBrand>
        
        {/* Renderizamos los items según el rol */}
        {menuItems.map((item, index) => (
          <NavbarItem key={index}>
            <Link href={item.url} color="foreground" aria-current="page" isBlock>
              <p className="text-large">{item.text}</p>
            </Link>
          </NavbarItem>
        ))}
      </NavbarContent>

      <NavbarContent as="div" justify="end">
        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <Avatar
              isBordered
              as="button"
              className="transition-transform"
              color={"secondary"}
              size="md"
              name={`${localUser.displayname}`}
            />
          </DropdownTrigger>
          <DropdownMenu aria-label="Profile Actions" variant="flat" css={{ alignTtems: "center" }}>
            <DropdownItem
              key="team_settings"
              className="h-14 gap-2"
              css={{ height: "fit-content", alignTtems: "center" }}
              color="secondary"
            >
              {localUser && (
                <>
                  <p className="font-bold">{`${localUser.displayname}` ?? "Usuario"}</p>
                  <p className="font-semibold">{localUser.role}</p>
                  <p className="font-semibold">{localUser.email}</p>
                </>
              )}
            </DropdownItem>
            <DropdownItem withDivider color="danger" key="logout">
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Button onPress={handleLogout} color="danger">
                  Cerrar Sesión
                </Button>
              </div>
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </NavbarContent>

      <NavbarMenu>
        {menuItems.map((item, index) => (
          <NavbarMenuItem key={`${item.text}-${index}`}>
            <Link
              color={
                index === 0 ? "primary" : index === menuItems.length - 0 ? "normal" : "foreground"
              }
              className="w-full"
              href={item.url}
              size="lg"
            >
              {item.text}
            </Link>
          </NavbarMenuItem>
        ))}
      </NavbarMenu>
    </Navbar>
  );
}
