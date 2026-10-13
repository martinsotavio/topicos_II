import NavBar from "./components/navbar/Nav";
import Login from "./Login";
import Home from "./Home";
import { Route, Routes } from "react-router-dom";
import Configs from "./Configs";
import Cadastro from "./Cadastro";
import Usuarios from "./Usuarios";
import Folha from "./Folha";
import Relatorios from "./Relatorios";
import Funcionario from "./Funcionario";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />}></Route>
      <Route path="/login" element={<Login />}></Route>
      <Route path="/configs" element={<Configs />}></Route>
      <Route path="/cadastro" element={<Cadastro />}></Route>
      <Route path="/usuarios" element={<Usuarios />}></Route>
      <Route path="/folha" element={<Folha />}></Route>
      <Route path="/relatorios" element={<Relatorios />}></Route>
      <Route path="/funcionario" element={<Funcionario />}></Route>
    </Routes>    
  )
}

export default App
