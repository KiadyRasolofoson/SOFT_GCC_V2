export function urlApi(url) {
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5189/api";
    return `${baseUrl}${url}`;
}