import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import IncomingRequestModal from '../components/IncomingRequestModal';
import ToastContainer from '../components/ToastContainer';

const Layout = () => {
    return (
        <>
            <Header />
            <main>
                <Outlet />
            </main>
            <IncomingRequestModal />
            <ToastContainer />
        </>
    );
};

export default Layout;
