import '@/styles/globals.css'
import {AuthContextProvider} from '../lib/context/AuthContext'
import Layout from '../Components/Layout/Layout'
import Router from 'next/router'
import { useState } from 'react'
import nProgress from 'nprogress'
import Loader from '../Components/Loader'
import { NextUIProvider } from "@nextui-org/react";

export default function App({ Component, pageProps }) {
    //create a state for user
    const [loading, setLoading] = useState()
    //show loading page
    Router.events.on('routeChangeStart',(url)=>{
      setLoading(true)
      nProgress.start()
    })
    Router.events.on('routeChangeComplete',(url)=>{
      setLoading(false)
      nProgress.done()
    })
    return (
      
      <AuthContextProvider>
        <NextUIProvider>
          {loading ? (
            <Loader />
          ) : (
            <Layout>
              <Component {...pageProps} />
            </Layout>
          )}
        </NextUIProvider>
      </AuthContextProvider>
    );
  }
