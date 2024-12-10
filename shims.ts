import { Buffer } from "buffer"
import process from "process/browser"

if (typeof window !== "undefined") {
    window.Buffer = Buffer
    window.global = window
    window.process = process
}

export {} // This makes the file a module
