import { Injectable } from "@angular/core"
import { saveAs } from "file-saver"
import { Upload } from "upload-js"
const upload = Upload({ apiKey: "free" });

@Injectable ({
    providedIn: 'root'
})

export class FileSaveService {
    constructor() { }

    saveFile(Blob: Blob, filename: string = "SettingsForTest.json"): void {
        saveAs(Blob, filename);
    }

    // loadFile(Blob: Blob, filename: string) : void {
        
    // }
}

