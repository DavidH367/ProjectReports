import Image from 'next/image'
import { Inter } from 'next/font/google'

import dynamic from 'next/dynamic';

const NavBar = dynamic(
    // Utiliza una función anónima que retorna una promesa con el componente importado.
    () => import('../Components/Layout/NavBar'),
    // Establece la opción 'ssr' en 'false' para deshabilitar el pre-renderizado en el lado del servidor.
    { ssr: false }
  );

  const Home = () => (
    <div>
      <h1>Inicio</h1>
      {/* Esto no será pre-renderizado */}
      <NavBar />
    </div>
  );

  export default Home;
