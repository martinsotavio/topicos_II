import api from "./api";

export async function getUsers() {
    const response = await api.get('/usuarios', {})
    return response.data;
}

