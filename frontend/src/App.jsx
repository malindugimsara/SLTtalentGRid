import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import InternshipManagement from './page/GetNewInterns'
import { Toaster } from 'react-hot-toast'
import LoginPage from './page/LoginPage'
import HomePage from './page/HomePage'
import ProtectedRoute from './component/ProtectedRoute'

function App() {
 

  return (
    <>
     <BrowserRouter>
        <Toaster position="top-center" />

        <Routes path='/*'>
          <Route path='/' element={<LoginPage />}/>
          <Route path='/*' element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }/>
        </Routes>

      </BrowserRouter>
    </>
  )
}

export default App
