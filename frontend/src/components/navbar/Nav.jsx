import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';

import './Nav.css';
import { Link } from 'react-router-dom';

function NavBar() {
  return (
    <Navbar expand="lg" bg="dark" data-bs-theme="dark" className="bg-body-tertiary">
      <Container>
        <Navbar.Brand className="corDiferente" href="#home">MegaPonto</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Home</Nav.Link>
            <Nav.Link as={Link} to="/cadastro">Cadastro</Nav.Link>
            <Nav.Link as={Link} to="/usuarios">Usuários</Nav.Link>
            <Nav.Link as={Link} to="/folha">Folha</Nav.Link>
            <Nav.Link as={Link} to="/relatorios">Relatório</Nav.Link>
          </Nav>
          <NavDropdown className="corDiferente" title="Opções" id="basic-nav-dropdown">
            <NavDropdown.Item as={Link} to="/configs">Configurações</NavDropdown.Item>
            <NavDropdown.Item as={Link} to="/funcionario">Colaborador do Mês</NavDropdown.Item>
            <NavDropdown.Divider />
            <NavDropdown.Item as={Link} to="/login">
              Logout
            </NavDropdown.Item>
          </NavDropdown>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavBar;