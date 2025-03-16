export const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString)
    const showYear = date.getFullYear() !== new Date().getFullYear()

    return date.toLocaleDateString("en-US", {
        year: showYear ? "numeric" : undefined,
        month: "short",
        day: "numeric",
    })
}

export const titleCase = (str: string) => {
    return str
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}