import { useEffect, useState } from "react"
import { Alert, Badge, Button, Col, Container, Form, Modal, Row, Spinner, Table } from "react-bootstrap"
import NavBar from "./components/navbar/Nav"
import { atualizarUsuario, cadastrarUsuario, listarUsuarios, removerUsuario } from "./services/usuariosService"

const FORMULARIO_VAZIO = {
    nome: "",
    email: "",
    senha: "",
    cpf: "",
    role: "EMPLOYEE",
    cargo: "",
    departamento: "",
    dataAdmissao: "",
    valorHora: "",
    cargaHorariaDiaria: "8",
    cargaHorariaSemanal: "44",
}

const PERFIS = {
    ADMIN: "Administrador",
    EMPLOYEE: "Colaborador",
}

// Erros da API que pertencem a um campo específico do formulário.
const CAMPO_POR_CODIGO_DE_ERRO = {
    EMAIL_IN_USE: "email",
    CPF_IN_USE: "cpf",
}

// "José" -> "jose": filtra sem diferenciar acentos e maiúsculas.
function normalizar(texto) {
    return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()
}

function somenteDigitos(texto) {
    return texto.replace(/\D/g, "")
}

// Data local no formato AAAA-MM-DD, o mesmo do <input type="date">.
function hojeISO() {
    return new Date().toLocaleDateString("sv-SE")
}

// Mesmas regras do backend (authController.js), para dar retorno antes de chamar a API.
function validar(valores, editando) {
    const erros = {}

    if (!valores.nome.trim()) erros.nome = "Informe o nome."
    if (!valores.email.trim()) erros.email = "Informe o e-mail."
    if (!editando && !valores.senha) erros.senha = "Informe uma senha."
    if (somenteDigitos(valores.cpf).length !== 11) erros.cpf = "O CPF deve ter 11 dígitos."
    if (!valores.cargo.trim()) erros.cargo = "Informe o cargo."
    if (!valores.departamento.trim()) erros.departamento = "Informe o departamento."

    if (!valores.dataAdmissao) {
        erros.dataAdmissao = "Informe a data de admissão."
    } else if (valores.dataAdmissao > hojeISO()) {
        erros.dataAdmissao = "A data de admissão não pode ser futura."
    }

    for (const campo of ["valorHora", "cargaHorariaDiaria", "cargaHorariaSemanal"]) {
        if (!(Number(valores[campo]) > 0)) erros[campo] = "Informe um número maior que zero."
    }

    return erros
}

// O formulário trabalha com texto; a API espera números e CPF só com dígitos.
function montarPayload(valores) {
    const payload = {
        nome: valores.nome.trim(),
        email: valores.email.trim(),
        cpf: somenteDigitos(valores.cpf),
        role: valores.role,
        cargo: valores.cargo.trim(),
        departamento: valores.departamento.trim(),
        dataAdmissao: valores.dataAdmissao,
        valorHora: Number(valores.valorHora),
        cargaHorariaDiaria: Number(valores.cargaHorariaDiaria),
        cargaHorariaSemanal: Number(valores.cargaHorariaSemanal),
    }

    // Na edição, senha em branco significa "manter a senha atual".
    if (valores.senha) payload.senha = valores.senha

    return payload
}

// Dados da API -> valores do formulário (tudo como texto, senha vazia).
function valoresDoUsuario(usuario) {
    const valores = { ...FORMULARIO_VAZIO }
    for (const campo of Object.keys(valores)) {
        if (campo !== "senha" && usuario[campo] != null) valores[campo] = String(usuario[campo])
    }
    return valores
}

function CampoFormulario({ nome, label, valores, erros, onChange, ajuda, ...props }) {
    return (
        <Form.Group className="mb-3" controlId={`usuario-${nome}`}>
            <Form.Label>{label}</Form.Label>
            <Form.Control
                name={nome}
                value={valores[nome]}
                onChange={onChange}
                isInvalid={Boolean(erros[nome])}
                {...props}
            />
            {ajuda && !erros[nome] && <Form.Text muted>{ajuda}</Form.Text>}
            <Form.Control.Feedback type="invalid">{erros[nome]}</Form.Control.Feedback>
        </Form.Group>
    )
}

function Usuarios() {
    // Listagem
    const [usuarios, setUsuarios] = useState([])
    const [carregando, setCarregando] = useState(true)
    const [erroLista, setErroLista] = useState("")
    const [busca, setBusca] = useState("")
    const [mensagem, setMensagem] = useState("")

    // Formulário (cadastro e edição)
    const [mostrarFormulario, setMostrarFormulario] = useState(false)
    const [usuarioEmEdicao, setUsuarioEmEdicao] = useState(null)
    const [valores, setValores] = useState(FORMULARIO_VAZIO)
    const [erros, setErros] = useState({})
    const [erroFormulario, setErroFormulario] = useState("")
    const [salvando, setSalvando] = useState(false)

    // Remoção
    const [usuarioParaRemover, setUsuarioParaRemover] = useState(null)
    const [erroRemocao, setErroRemocao] = useState("")
    const [removendo, setRemovendo] = useState(false)

    useEffect(() => {
        listarUsuarios()
            .then(setUsuarios)
            .catch((error) => setErroLista(error.message))
            .finally(() => setCarregando(false))
    }, [])

    // Calculado a cada renderização: não precisa de estado próprio.
    const termo = normalizar(busca.trim())
    const usuariosFiltrados = usuarios
        .filter((usuario) => normalizar(usuario.nome).includes(termo))
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))

    const editando = usuarioEmEdicao !== null

    function abrirCadastro() {
        setUsuarioEmEdicao(null)
        setValores(FORMULARIO_VAZIO)
        setErros({})
        setErroFormulario("")
        setMostrarFormulario(true)
    }

    function abrirEdicao(usuario) {
        setUsuarioEmEdicao(usuario)
        setValores(valoresDoUsuario(usuario))
        setErros({})
        setErroFormulario("")
        setMostrarFormulario(true)
    }

    function fecharFormulario() {
        if (!salvando) setMostrarFormulario(false)
    }

    function handleChange(event) {
        const { name, value } = event.target
        setValores((atuais) => ({ ...atuais, [name]: value }))
        setErros((atuais) => ({ ...atuais, [name]: undefined }))
    }

    async function handleSubmit(event) {
        event.preventDefault()
        setErroFormulario("")

        const errosEncontrados = validar(valores, editando)
        setErros(errosEncontrados)
        if (Object.keys(errosEncontrados).length > 0) return

        setSalvando(true)
        try {
            const payload = montarPayload(valores)

            if (editando) {
                const atualizado = await atualizarUsuario(usuarioEmEdicao.id, payload)
                setUsuarios((atuais) => atuais.map((u) => (u.id === atualizado.id ? atualizado : u)))
                setMensagem(`${atualizado.nome} foi atualizado(a).`)
            } else {
                const criado = await cadastrarUsuario(payload)
                setUsuarios((atuais) => [...atuais, criado])
                setMensagem(`${criado.nome} foi cadastrado(a).`)
            }

            setMostrarFormulario(false)
        } catch (error) {
            const campo = CAMPO_POR_CODIGO_DE_ERRO[error.code]
            if (campo) {
                setErros((atuais) => ({ ...atuais, [campo]: error.message }))
            } else {
                setErroFormulario(error.message)
            }
        } finally {
            setSalvando(false)
        }
    }

    function pedirRemocao(usuario) {
        setErroRemocao("")
        setUsuarioParaRemover(usuario)
    }

    function cancelarRemocao() {
        if (!removendo) setUsuarioParaRemover(null)
    }

    async function confirmarRemocao() {
        setRemovendo(true)
        setErroRemocao("")
        try {
            await removerUsuario(usuarioParaRemover.id)
            setUsuarios((atuais) => atuais.filter((u) => u.id !== usuarioParaRemover.id))
            setMensagem(`${usuarioParaRemover.nome} foi removido(a).`)
            setUsuarioParaRemover(null)
        } catch (error) {
            setErroRemocao(error.message)
        } finally {
            setRemovendo(false)
        }
    }

    // Props repetidas em todos os campos do formulário.
    const ligarCampo = { valores, erros, onChange: handleChange }

    return (
        <>
            <NavBar></NavBar>
            <Container className="py-4">
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
                    <h1 className="h3 mb-0">Usuários</h1>
                    <Button onClick={abrirCadastro}>+ Novo usuário</Button>
                </div>

                {mensagem && (
                    <Alert variant="success" dismissible onClose={() => setMensagem("")}>
                        {mensagem}
                    </Alert>
                )}

                <Form.Group className="mb-3" controlId="filtro-nome" style={{ maxWidth: 400 }}>
                    <Form.Label>Filtrar por nome</Form.Label>
                    <Form.Control
                        type="search"
                        placeholder="Digite um nome"
                        autoComplete="off"
                        value={busca}
                        onChange={(event) => setBusca(event.target.value)}
                    />
                </Form.Group>

                {carregando && (
                    <div className="d-flex align-items-center gap-2 text-muted">
                        <Spinner animation="border" size="sm" aria-hidden="true" />
                        Carregando usuários...
                    </div>
                )}

                {erroLista && <Alert variant="danger">{erroLista}</Alert>}

                {!carregando && !erroLista && (
                    <>
                        <p className="small text-muted" aria-live="polite">
                            {usuariosFiltrados.length} de {usuarios.length} usuários
                        </p>

                        <Table striped hover responsive className="align-middle">
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>E-mail</th>
                                    <th>Cargo</th>
                                    <th>Departamento</th>
                                    <th>Perfil</th>
                                    <th className="text-end">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usuariosFiltrados.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center text-muted py-4">
                                            {usuarios.length === 0
                                                ? "Nenhum usuário cadastrado."
                                                : `Nenhum usuário encontrado para "${busca}".`}
                                        </td>
                                    </tr>
                                ) : (
                                    usuariosFiltrados.map((usuario) => (
                                        <tr key={usuario.id}>
                                            <td>{usuario.nome}</td>
                                            <td>{usuario.email}</td>
                                            <td>{usuario.cargo}</td>
                                            <td>{usuario.departamento}</td>
                                            <td>
                                                <Badge bg={usuario.role === "ADMIN" ? "primary" : "secondary"}>
                                                    {PERFIS[usuario.role] ?? usuario.role}
                                                </Badge>
                                            </td>
                                            <td className="text-end text-nowrap">
                                                <Button
                                                    size="sm"
                                                    variant="outline-primary"
                                                    className="me-2"
                                                    onClick={() => abrirEdicao(usuario)}
                                                    aria-label={`Editar ${usuario.nome}`}
                                                >
                                                    Editar
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline-danger"
                                                    onClick={() => pedirRemocao(usuario)}
                                                    aria-label={`Remover ${usuario.nome}`}
                                                >
                                                    Remover
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    </>
                )}
            </Container>

            {/* Cadastro e edição usam o mesmo formulário */}
            <Modal show={mostrarFormulario} onHide={fecharFormulario} size="lg" backdrop="static">
                <Form noValidate onSubmit={handleSubmit}>
                    <Modal.Header closeButton={!salvando}>
                        <Modal.Title>{editando ? `Editar ${usuarioEmEdicao.nome}` : "Novo usuário"}</Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        <CampoFormulario nome="nome" label="Nome completo" autoFocus {...ligarCampo} />
                        <Row>
                            <Col md={6}>
                                <CampoFormulario nome="email" label="E-mail" type="email" autoComplete="off" {...ligarCampo} />
                            </Col>
                            <Col md={6}>
                                <CampoFormulario nome="cpf" label="CPF" inputMode="numeric" placeholder="Somente números" {...ligarCampo} />
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <CampoFormulario
                                    nome="senha"
                                    label={editando ? "Nova senha" : "Senha"}
                                    type="password"
                                    autoComplete="new-password"
                                    ajuda={editando ? "Deixe em branco para manter a senha atual." : undefined}
                                    {...ligarCampo}
                                />
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3" controlId="usuario-role">
                                    <Form.Label>Perfil</Form.Label>
                                    <Form.Select name="role" value={valores.role} onChange={handleChange}>
                                        {Object.entries(PERFIS).map(([valor, rotulo]) => (
                                            <option key={valor} value={valor}>{rotulo}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={4}>
                                <CampoFormulario nome="cargo" label="Cargo" {...ligarCampo} />
                            </Col>
                            <Col md={4}>
                                <CampoFormulario nome="departamento" label="Departamento" {...ligarCampo} />
                            </Col>
                            <Col md={4}>
                                <CampoFormulario nome="dataAdmissao" label="Data de admissão" type="date" max={hojeISO()} {...ligarCampo} />
                            </Col>
                        </Row>
                        <Row>
                            <Col md={4}>
                                <CampoFormulario nome="valorHora" label="Valor da hora (R$)" type="number" min="0" step="0.01" {...ligarCampo} />
                            </Col>
                            <Col md={4}>
                                <CampoFormulario nome="cargaHorariaDiaria" label="Carga diária (h)" type="number" min="0" step="0.5" {...ligarCampo} />
                            </Col>
                            <Col md={4}>
                                <CampoFormulario nome="cargaHorariaSemanal" label="Carga semanal (h)" type="number" min="0" step="0.5" {...ligarCampo} />
                            </Col>
                        </Row>

                        {erroFormulario && <Alert variant="danger" className="mb-0">{erroFormulario}</Alert>}
                    </Modal.Body>

                    <Modal.Footer>
                        <Button variant="secondary" onClick={fecharFormulario} disabled={salvando}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={salvando}>
                            {salvando && <Spinner as="span" animation="border" size="sm" className="me-2" aria-hidden="true" />}
                            {editando ? "Salvar alterações" : "Cadastrar"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Confirmação de remoção */}
            <Modal show={usuarioParaRemover !== null} onHide={cancelarRemocao} centered>
                <Modal.Header closeButton={!removendo}>
                    <Modal.Title>Remover usuário</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="mb-0">
                        Tem certeza de que deseja remover <b>{usuarioParaRemover?.nome}</b>? Os registros de ponto,
                        folhas e bônus desse usuário também serão apagados. Esta ação não pode ser desfeita.
                    </p>
                    {erroRemocao && <Alert variant="danger" className="mt-3 mb-0">{erroRemocao}</Alert>}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={cancelarRemocao} disabled={removendo}>
                        Cancelar
                    </Button>
                    <Button variant="danger" onClick={confirmarRemocao} disabled={removendo}>
                        {removendo && <Spinner as="span" animation="border" size="sm" className="me-2" aria-hidden="true" />}
                        Remover
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    )
}

export default Usuarios
