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
import { useRouter } from "next/router";
import { useAuth } from "../../lib/context/AuthContext";
import { useState } from "react";
import React from "react";

export default function App() {
  const { logout, user } = useAuth();
  const localUser = JSON.parse(localStorage.getItem("user"));
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

  const menuItems = [
    "Profile",
    "Dashboard",
    "Activity",
    "Analytics",
    "System",
    "Deployments",
    "My Settings",
    "Team Settings",
    "Help & Feedback",
    "Log Out",
  ];

  return (
    <Navbar disableAnimation isBordered>
      <NavbarContent className="sm:hidden" justify="start">
        <NavbarMenuToggle />
      </NavbarContent>

      <NavbarContent className="sm:hidden pr-3" justify="center">
        <NavbarBrand>
          <p className="font-bold text-inherit">ACME</p>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        <NavbarBrand>
          <p className="font-bold text-inherit">ACME</p>
        </NavbarBrand>
        <NavbarItem>
          <Link color="foreground" href="#">
            Features
          </Link>
        </NavbarItem>
        <NavbarItem isActive>
          <Link href="#" aria-current="page" color="warning">
            Customers
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link href="#" aria-current="page" color="warning">
              Urbaby
          </Link>
        </NavbarItem>
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
              name={`${user.displayName}`}
            />
          </DropdownTrigger>
          <DropdownMenu aria-label="Profile Actions" variant="flat" css={{ alignTtems: "center"}}>
            <DropdownItem
              key="team_settings"
              className="h-14 gap-2"
              css={{ height: "fit-content", alignTtems: "center" }}
              color="primary">
              {localUser && (
                <>
                  <p className="font-semibold">Conectado como: {localUser.role}</p>
                  <p className="font-semibold">{`${user.displayName}` ?? "Usuario"}</p>
                  <p className="font-semibold">{localUser.email}</p>
                </>
              )}

            </DropdownItem>
            <DropdownItem
                withDivider
                color="danger"
                key="logout">
                  <div style={{display: 'flex', justifyContent: 'center'}}>
                    <Button
                      onPress={handleLogout}
                      color="danger">
                        Cerrar Sesión
                    </Button>
                  </div>
              </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </NavbarContent>
      <NavbarMenu>
        {menuItems.map((item, index) => {
          <NavbarMenuItem key={`${item}-${index}`}>
            <Link
              className="w-full"
              color={
                index === 2 ? "warning" : index === menuItems.length - 1 ? "danger" : "foreground"
              }
              href="#"
              size="lg"
            >
              {item}
            </Link>
          </NavbarMenuItem>
        })}
      </NavbarMenu>
    </Navbar>
  );
}
