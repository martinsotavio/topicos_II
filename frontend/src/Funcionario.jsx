import { Button, Col, Container, Form, Image, InputGroup, Modal, Row } from "react-bootstrap"
import NavBar from "./components/navbar/Nav"
import { useEffect, useState } from "react"


function Funcionario() {

    const [colaborador, setColaborador] = useState("")
    const [tempo, setTempo] = useState(0)
    const [bonus, setBonus] = useState(0)
    const [resultado, setResultado] = useState(0)
    const [data, setData] = useState("")
    const [showResultado, setShowResultado] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [updateImage, setUpdateImage] = useState(false)

    useEffect(() => {
        fetch("https://dog.ceo/api/breeds/image/random")
            .then((resp) => resp.json())
            .then((apiData) => {
                setData(apiData.message);
            })

        setShowModal(true)
    }, [updateImage]);


    function escolheColaborador(nome) {
        setColaborador(nome)
    }

    function calcularBonus() {
        setResultado(tempo * bonus)
        setShowResultado(true)
        setShowModal(false)

    }

    function show() {
        setShowModal(true)
    }

    function hide() {
        setShowModal(false)
    }

    function novoVivente() {
        setBonus(0)
        setColaborador("")
        setData("")
        setTempo(0)
        setResultado(0)
        setShowResultado(false)

        setUpdateImage(!updateImage)
        show()

    }

    return (
        <>
            <NavBar></NavBar>
            <button onClick={novoVivente}>
                Novo funcionário do mês
            </button>
            {
                showResultado &&
                <>
                    <Container>
                        <Row>
                            <Col xs={6} md={4}></Col>
                            <Col xs={6} md={4}>
                                <h1>Funcionário do Mês</h1>
                                <p>O Colaborador de destaque desse mês é <b>{colaborador}</b></p>
                                <p>{colaborador} foi reconhecido por seus colegas como indispensável para a equipe.
                                    A MegaPonto agradece sua dedicação.</p>
                                <p>Como bônus por seus {tempo} anos de empresa.
                                    O colaborador {colaborador} receberá, {resultado} reais de gratificação.
                                </p>
                                <Image src={data} rounded />
                            </Col>
                            <Col xs={6} md={4}></Col>
                        </Row>
                    </Container>
                </>
            }
            <Modal show={showModal} onHide={hide} bg="dark" data-bs-theme="dark">
                <Modal.Dialog>
                    <Modal.Header closeButton>
                        <Modal.Title>Funcionário do Mês</Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        <InputGroup className="mb-3">
                            <InputGroup.Text id="inputGroup-sizing-default"
                            >
                                Colaborador
                            </InputGroup.Text>
                            <Form.Control
                                onChange={(e) => setColaborador(e.target.value)}
                                value={colaborador}
                                aria-label="Default"
                                aria-describedby="inputGroup-sizing-default"
                            />
                        </InputGroup>
                        <InputGroup className="mb-3">
                            <InputGroup.Text id="inputGroup-sizing-default"
                            >
                                Tempo
                            </InputGroup.Text>
                            <Form.Control
                                onChange={(e) => setTempo(e.target.value)}
                                value={tempo}
                                aria-label="Default"
                                aria-describedby="inputGroup-sizing-default"
                            />
                        </InputGroup>
                        <InputGroup className="mb-3">
                            <InputGroup.Text id="inputGroup-sizing-default"
                            >
                                Bonus
                            </InputGroup.Text>
                            <Form.Control
                                onChange={(e) => setBonus(e.target.value)}
                                value={bonus}
                                aria-label="Default"
                                aria-describedby="inputGroup-sizing-default"
                            />
                        </InputGroup>
                    </Modal.Body>

                    <Modal.Footer>
                        <Button onClick={hide} variant="secondary">Cancelar</Button>
                        <Button onClick={calcularBonus} variant="primary">Salvar</Button>
                    </Modal.Footer>
                </Modal.Dialog>
            </Modal>
        </>
    )
}

export default Funcionario
