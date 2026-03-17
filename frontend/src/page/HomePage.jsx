import { Route, Routes } from "react-router-dom";
import Navbar from "../component/NavBar";
import Home from "./Home";
import Test from "./test";
import Footer from "../component/Footer";

export default function HomePage(){
    return(
        <div className='w-full h-screen max-h-screen'>
            <Navbar />
            <Routes path = '/*'>
                <Route path = '/' element={<Home />} />

            </Routes>
            <Footer />
        </div>
    );

} 