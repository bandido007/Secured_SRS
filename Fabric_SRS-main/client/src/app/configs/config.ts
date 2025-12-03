export const baseUrl = "http://127.0.0.1:5000/"


export const calAge = (date: string) => {
    return new Date().getFullYear() - parseInt(date.split('-')[0])
}