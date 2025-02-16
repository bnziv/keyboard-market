export const isAuthenticated = async () => {
    const token = localStorage.getItem("token");

    if (!token) return false;

    try {
        const response = await fetch("http://localhost:8080/api/auth/me", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (response.ok) return true;

        return false;
    } catch (error) {
        return false;
    }
}