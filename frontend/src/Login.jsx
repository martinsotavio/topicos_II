import { useState } from "react"
import { Alert, Button, Form } from "react-bootstrap"
import { useNavigate } from "react-router-dom"
import { login } from "./services/auth"


function Login() {

    const [email, setEmail] = useState("")
    const [senha, setSenha] = useState("")
    const [erro, setErro] = useState("")
    const navigate = useNavigate()

    async function handleLogin(event) {
        event.preventDefault()
        setErro("")

        try {
            const data = await login({email, senha})
            localStorage.setItem("token", data.token)
            navigate("/usuarios")
        } catch (error) {
            setErro(error.response?.data?.error?.message || "Não foi possível fazer login.")
        }
    }

    return(
        <>
            <Form onSubmit={handleLogin}>
                <Form.Group className="mb-3">
                    <Form.Label>Email address</Form.Label>
                    <Form.Control 
                        type="email"
                        placeholder="name@example.com" 
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </Form.Group>
                <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
                    <Form.Label>Password</Form.Label>
                    <Form.Control 
                        type="password"
                        placeholder="Digite sua Senha"
                        onChange={(e) => setSenha(e.target.value)}
                    />
                </Form.Group>
                {erro && <Alert variant="danger">{erro}</Alert>}
                <Button type="submit" variant="primary" size="sm">
                    Login
                </Button>
            </Form>
        </>
    )
}

export default Login
