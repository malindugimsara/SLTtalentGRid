import { Route, Routes } from "react-router-dom";
import Navbar from "../component/NavBar";
import Home from "./Home";
import Test from "./test";
import Footer from "../component/Footer";
import GetNewInterns from "./GetNewInterns";
import HireNewInterns from "./HireNewInterns";
import ShortlistedInterns from "./ShortlistedIntern";
import HiredInterns from "./HiredIntern";
import RankedCV from "./EnhancedFiltering";

export default function HomePage(){
    return(
        <div className='w-full h-screen max-h-screen'>
            <Navbar />
            <Routes path = '/*'>
                <Route path = '/home' element={<Home />} />
                <Route path='/get-new-interns' element={<GetNewInterns />}/>
                <Route path='/hire-new-interns' element={<HireNewInterns />}/>
                <Route path='/shortlisted-interns' element={<ShortlistedInterns />}/>
                <Route path='/hired-interns' element={<HiredInterns />}/>
                <Route path='/rank_cvs' element={<RankedCV />}/>
            </Routes>
            <Footer />
        </div>
    );

} 