import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import InternshipManagement from './page/InternshipManagement'
import { Toaster } from 'react-hot-toast'
import LoginPage from './page/loginPage'
import HomePage from './page/HomePage'

function App() {
 

  return (
    <>
     <BrowserRouter>
        <Toaster position="top-center" />

        <Routes path='/*'>
          <Route path='/intern' element={<InternshipManagement />}/>
          <Route path='/' element={<LoginPage />}/>
          <Route path='/home/*' element={<HomePage />}/>
        </Routes>

      </BrowserRouter>
    </>
  )
}

export default App
