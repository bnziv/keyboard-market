import { toast } from "sonner"

export const toastSuccess = (message: string) => {
    toast.success(message,
      { style: { background: "green", color: "white", border: "1px solid green", fontSize: "16px" } }
    )
}

export const toastError = (message: string) => {
    toast.error(message,
      { style: { background: "red", color: "white", border: "1px solid red", fontSize: "16px" } }
    )
}