
/* ========================================
   NAVBAR
======================================== */

const menuButton = document.getElementById("menu-button");
const dropdown = document.getElementById("dropdown");
const menuArrow = document.querySelector(".menu-arrow");

// abrir e fechar o menu

if (menuButton && dropdown && menuArrow) {

    menuButton.addEventListener("click", (event) => {

        event.stopPropagation();

        dropdown.classList.toggle("open");

        menuArrow.style.transform =
            dropdown.classList.contains("open")
                ? "rotate(180deg)"
                : "rotate(0deg)";

    });

    // fecha se clicar fora

    document.addEventListener("click", () => {

        dropdown.classList.remove("open");

        menuArrow.style.transform = "rotate(0deg)";

    });

}

/* ========================================
   PÁGINA ATUAL / MENU ATIVO
======================================== */

const currentPage = window.location.pathname.split("/").pop();

const params = new URLSearchParams(window.location.search);

const developmentPage = params.get("pagina");

const pageToHighlight =
    currentPage === "desenvolvimento.html"
        ? developmentPage
        : currentPage;

const menuItems = document.querySelectorAll(".dropdown-item");

menuItems.forEach((item) => {

    const itemPage = item.getAttribute("href").split("/").pop();

    if (itemPage === pageToHighlight) {
        item.classList.add("active");
    }

});

/* ========================================
   SELEÇÃO DE PDF
======================================== */

const selectButton = document.querySelector(".select-button");
const pdfInput = document.getElementById("pdf-input");
const uploadBox = document.querySelector(".upload-box");
const compressButton = document.getElementById("compress-button");
const changeFile = document.getElementById("change-file");
const result = document.getElementById("result");
const resultSize = document.getElementById("result-size");
const resultOriginalSize = document.getElementById("result-original-size");
const resultReduction = document.getElementById("result-reduction");
const downloadButton = document.getElementById("download-button");
const compressAnother = document.getElementById("compress-another");
const uploadTitle = document.getElementById("upload-title");
const uploadInfo = document.getElementById("upload-info");
const uploadSize = document.getElementById("upload-size");
const fileIconText = document.getElementById("file-icon-text");
const fileIcon = document.getElementById("file-icon");
const pdfThumbnail = document.getElementById("pdf-thumbnail");
const processing = document.getElementById("processing");
const processingProgress = document.querySelector(".processing-progress");
const compressionOptions = document.getElementById("compression-options");

let selectedFile = null;
let originalFileName = "";

/* ========================================
   ARRASTAR E SOLTAR PDF
======================================== */

if (uploadBox && pdfInput) {

    uploadBox.addEventListener("dragover", (event) => {

        event.preventDefault();

        uploadBox.classList.add("drag-over");

    });

    uploadBox.addEventListener("dragleave", () => {

        uploadBox.classList.remove("drag-over");

    });

    uploadBox.addEventListener("drop", (event) => {

        event.preventDefault();

        uploadBox.classList.remove("drag-over");

        const file = event.dataTransfer.files[0];

        if (!file) {
            return;
        }

        if (file.type !== "application/pdf") {

            alert("Selecione um arquivo PDF.");

            return;
        }

        const dataTransfer = new DataTransfer();

        dataTransfer.items.add(file);

        pdfInput.files = dataTransfer.files;

        pdfInput.dispatchEvent(
            new Event("change", { bubbles: true })
        );
    });
}

/* ========================================
   SELECIONAR PDF
======================================== */

if (selectButton && pdfInput) {

    selectButton.addEventListener(
        "click",
        () => {

            pdfInput.click();

        }
    );
}

/* ========================================
   TROCAR ARQUIVO
======================================== */

if (changeFile && pdfInput) {

    changeFile.addEventListener(
        "click",
        () => {

            pdfInput.click();

        }
    );
}

/* ========================================
   THUMBNAIL DO PDF
======================================== */

if (typeof pdfjsLib !== "undefined") {

    pdfjsLib.GlobalWorkerOptions.workerSrc =
        "./lib/pdfjs/pdf.worker.min.js";

}

async function showPdfThumbnail(file) {

    if (!file || !pdfThumbnail) {
        return;
    }

    const arrayBuffer = await file.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer
    }).promise;

    const page = await pdf.getPage(1);

    const viewport = page.getViewport({
        scale: 1
    });

    const scale = Math.min(
        76 / viewport.width,
        96 / viewport.height
    );

    const scaledViewport = page.getViewport({
        scale
    });

    pdfThumbnail.width = scaledViewport.width;
    pdfThumbnail.height = scaledViewport.height;

    const context = pdfThumbnail.getContext("2d");

    await page.render({
        canvasContext: context,
        viewport: scaledViewport
    }).promise;

    pdfThumbnail.style.display = "block";

    if (fileIconText) {

        fileIconText.style.display = "none";

    }
}

/* ========================================
   ARQUIVO SELECIONADO
======================================== */

if (
    pdfInput &&
    uploadTitle &&
    uploadInfo &&
    uploadSize &&
    compressButton &&
    changeFile &&
    result &&
    resultSize &&
    downloadButton
) {

    pdfInput.addEventListener(
        "change",
        () => {

            const file = pdfInput.files[0];

            if (!file) {
                return;
            }

            selectedFile = file;
            originalFileName = file.name;

            showPdfThumbnail(file);

            selectButton.style.display = "none";
            compressButton.style.display = "block";
            changeFile.style.display = "block";

            if (compressionOptions) {

                compressionOptions.style.display = "block";

            }

            uploadTitle.textContent = file.name;
            uploadInfo.textContent = "PDF SELECIONADO";

            const sizeKB = file.size / 1024;

            if (sizeKB < 1024) {

                uploadSize.textContent = `${sizeKB.toFixed(2)} KB`;

            } else {

                const sizeMB = sizeKB / 1024;

                uploadSize.textContent = `${sizeMB.toFixed(2)} MB`;

            }
        }
    );
}

/* ========================================
   INICIAR COMPRESSÃO
======================================== */

if (compressButton && processing) {

    compressButton.addEventListener(
        "click",
        async () => {

            if (!selectedFile) {
                return;
            }

            compressButton.style.display = "none";
            changeFile.style.display = "none";
            processing.style.display = "block";

            processingProgress.style.width = "0%";

            try {

                const compressionMode =
                    document.querySelector(
                        'input[name="compression-mode"]:checked'
                    )?.value;

                let compressedBytes;

                if (compressionMode === "extreme") {

                    compressedBytes = await compressPdfExtreme(
                        selectedFile,
                        (currentPage, totalPages) => {

                            const progress =
                                (currentPage / totalPages) * 85;

                            processingProgress.style.width =
                                `${progress}%`;
                        }
                    );

                    const extremeSize = compressedBytes.length;
                    const originalSize = selectedFile.size;

                    if (extremeSize >= originalSize) {

                        compressedBytes = await compressPdfMedium(
                            selectedFile,
                            (currentImage, totalImages) => {

                                if (totalImages === 0) {
                                    return;
                                }

                                const progress =
                                    85 +
                                    (currentImage / totalImages) * 10;

                                processingProgress.style.width =
                                    `${progress}%`;
                            }
                        );
                    }

                } else {

                    compressedBytes = await compressPdfMedium(
                        selectedFile,
                        (currentImage, totalImages) => {

                            if (totalImages === 0) {
                                return;
                            }

                            const progress =
                                (currentImage / totalImages) * 85;

                            processingProgress.style.width =
                                `${progress}%`;
                        }
                    );
                }

                const originalSize = selectedFile.size;
                const compressedSize = compressedBytes.length;

                const finalBytes =
                    compressedSize < originalSize
                        ? compressedBytes
                        : new Uint8Array(
                            await selectedFile.arrayBuffer()
                        );

                const finalSize = finalBytes.length;

                const reduction =
                    (
                        (originalSize - finalSize) /
                        originalSize
                    ) * 100;

                resultReduction.textContent =
                    `${reduction.toFixed(2)}%`;

                processingProgress.style.width = "100%";

                await new Promise(
                    resolve => {
                        setTimeout(resolve, 300);
                    }
                );

                processing.style.display = "none";
                uploadTitle.style.display = "none";
                uploadInfo.style.display = "none";
                uploadSize.style.display = "none";
                compressionOptions.style.display = "none";
                compressButton.style.display = "none";
                changeFile.style.display = "none";

                result.style.display = "flex";
                compressAnother.style.display = "block";

                resultOriginalSize.textContent =
                    originalSize >= 1024 * 1024
                        ? `${(
                            originalSize /
                            1024 /
                            1024
                        ).toFixed(2)} MB`
                        : `${(
                            originalSize /
                            1024
                        ).toFixed(2)} KB`;

                resultSize.textContent =
                    `${(
                        finalSize /
                        1024
                    ).toFixed(2)} KB`;

                console.log(
                    "Tamanho original:",
                    originalSize,
                    "bytes"
                );

                console.log(
                    "Tamanho final:",
                    finalSize,
                    "bytes"
                );

                console.log(
                    "Redução:",
                    `${reduction.toFixed(2)}%`
                );

                window.compressedPdf = finalBytes;

            } catch (error) {

                console.error(
                    "Erro na compressão:",
                    error
                );

                processing.style.display = "none";
                compressButton.style.display = "block";
                changeFile.style.display = "block";

                alert(
                    "Não foi possível comprimir o PDF."
                );
            }
        }
    );
}

/* ========================================
   COMPRESSÃO RECOMENDADA - THE GOAT
======================================== */

async function compressPdfMedium(file, onProgress) {
    const pdfBytes = new Uint8Array(await file.arrayBuffer());
    const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
    const context = pdfDoc.context;

    function ascii85Decode(input) {
        const text = new TextDecoder().decode(input);
        const output = [];
        let group = [];

        for (let i = 0; i < text.length; i++) {
            const char = text[i];

            if (char === " " || char === "\n" || char === "\r" || char === "\t") continue;
            if (char === "~" && text[i + 1] === ">") break;

            if (char === "z" && group.length === 0) {
                output.push(0, 0, 0, 0);
                continue;
            }

            group.push(char.charCodeAt(0) - 33);

            if (group.length === 5) {
                let value = 0;

                for (let j = 0; j < 5; j++) {
                    value = value * 85 + group[j];
                }

                output.push(
                    (value >>> 24) & 255,
                    (value >>> 16) & 255,
                    (value >>> 8) & 255,
                    value & 255
                );

                group = [];
            }
        }

        if (group.length > 0) {
            const originalLength = group.length;

            while (group.length < 5) group.push(84);

            let value = 0;

            for (let j = 0; j < 5; j++) {
                value = value * 85 + group[j];
            }

            const bytes = [
                (value >>> 24) & 255,
                (value >>> 16) & 255,
                (value >>> 8) & 255,
                value & 255
            ];

            for (let j = 0; j < originalLength - 1; j++) {
                output.push(bytes[j]);
            }
        }

        return new Uint8Array(output);
    }

    function ascii85Encode(bytes) {
        let output = "";

        for (let i = 0; i < bytes.length;) {
            const count = Math.min(4, bytes.length - i);
            let value = 0;

            for (let j = 0; j < 4; j++) {
                value *= 256;
                if (j < count) value += bytes[i + j];
            }

            if (count === 4 && value === 0) {
                output += "z";
                i += 4;
                continue;
            }

            const chars = new Array(5);

            for (let j = 4; j >= 0; j--) {
                chars[j] = String.fromCharCode((value % 85) + 33);
                value = Math.floor(value / 85);
            }

            output += chars.slice(0, count + 1).join("");
            i += count;
        }
        return new TextEncoder().encode(output + "~>");
    }

    async function flateDecode(bytes) {
        const stream = new Blob([bytes]).stream();
        const decompressed = stream.pipeThrough(new DecompressionStream("deflate"));
        const buffer = await new Response(decompressed).arrayBuffer();

        return new Uint8Array(buffer);
    }

    async function decodeFlateImage(bytes, filters) {
        let decoded = bytes;

        if (filters.includes("ASCII85Decode")) {
            decoded = ascii85Decode(decoded);
        }

        if (filters.includes("FlateDecode")) {
            decoded = await flateDecode(decoded);
        }
        return decoded;
    }

    function getFilterNames(filter) {
        if (!filter) return [];

        if (filter instanceof PDFLib.PDFName) {
            return [filter.decodeText()];
        }

        if (filter instanceof PDFLib.PDFArray) {
            return filter.asArray().map(item => {
                if (item instanceof PDFLib.PDFName) return item.decodeText();
                return item.toString();
            });
        }
        return [filter.toString()];
    }
    let processedImages = 0;
    let totalImages = 0;

    const transparencyMasks = new Set();

    for (const [, object] of context.enumerateIndirectObjects()) {
        if (!(object instanceof PDFLib.PDFRawStream)) continue;

        const subtype = object.dict.get(PDFLib.PDFName.of("Subtype"));
        if (!subtype || subtype.decodeText() !== "Image") continue;

        const smask = object.dict.get(PDFLib.PDFName.of("SMask"));
        const mask = object.dict.get(PDFLib.PDFName.of("Mask"));

        if (smask instanceof PDFLib.PDFRef) transparencyMasks.add(smask.toString());
        if (mask instanceof PDFLib.PDFRef) transparencyMasks.add(mask.toString());
    }

    for (const [, object] of context.enumerateIndirectObjects()) {
        if (!(object instanceof PDFLib.PDFRawStream)) continue;

        const subtype = object.dict.get(PDFLib.PDFName.of("Subtype"));

        if (subtype && subtype.decodeText() === "Image") {
            totalImages++;
        }
    }
    for (const [ref, object] of context.enumerateIndirectObjects()) {
        if (!(object instanceof PDFLib.PDFRawStream)) continue;

        const dict = object.dict;
        if (transparencyMasks.has(ref.toString())) continue;

        const subtype = dict.get(PDFLib.PDFName.of("Subtype"));
        if (!subtype || subtype.decodeText() !== "Image") continue;

        processedImages++;
        if (onProgress) onProgress(processedImages, totalImages);

        const filter = dict.get(PDFLib.PDFName.of("Filter"));
        const filters = getFilterNames(filter);

        const isJpeg = filters.includes("ASCII85Decode") && filters.includes("DCTDecode");
        const isFlate = filters.includes("FlateDecode");

        if (!isJpeg && !isFlate) continue;

        try {
            /*
             * JPEG
             */
            if (isJpeg) {
                const jpegBytes = ascii85Decode(object.contents);
                const decoded = window["jpeg-js"].decode(jpegBytes, { useTArray: true });

                const encoded = new JPEGEncoder(15).encode({
                    data: decoded.data,
                    width: decoded.width,
                    height: decoded.height
                }, 15);

                const newJpeg = new Uint8Array(encoded);
                if (newJpeg.length >= jpegBytes.length) continue;

                const newDict = PDFLib.PDFDict.withContext(context);

                for (const [key, value] of dict.entries()) {
                    newDict.set(key, value);
                }

                newDict.set(PDFLib.PDFName.of("Width"), context.obj(decoded.width));
                newDict.set(PDFLib.PDFName.of("Height"), context.obj(decoded.height));
                newDict.set(PDFLib.PDFName.of("ColorSpace"), PDFLib.PDFName.of("DeviceRGB"));
                newDict.set(PDFLib.PDFName.of("BitsPerComponent"), context.obj(8));
                newDict.set(PDFLib.PDFName.of("Filter"), PDFLib.PDFName.of("DCTDecode"));
                newDict.delete(PDFLib.PDFName.of("DecodeParms"));
                newDict.delete(PDFLib.PDFName.of("SMask"));
                newDict.delete(PDFLib.PDFName.of("Mask"));
                newDict.set(PDFLib.PDFName.of("Length"), context.obj(newJpeg.length));

                const newStream = PDFLib.PDFRawStream.of(newDict, newJpeg);
                context.assign(ref, newStream);

                continue;
            }

            /*
             * FLATE
             */
            if (isFlate) {
                const width = dict.get(PDFLib.PDFName.of("Width")).numberValue;
                const height = dict.get(PDFLib.PDFName.of("Height")).numberValue;

                const colorSpace = dict.get(PDFLib.PDFName.of("ColorSpace"));
                let resolvedColorSpace = colorSpace;

                if (colorSpace instanceof PDFLib.PDFRef) {
                    resolvedColorSpace = context.lookup(colorSpace);
                }

                /*
                 * Detecta ICCBased GRAY
                 */

                let iccGrayLUT = null;

                if (resolvedColorSpace instanceof PDFLib.PDFArray) {
                    const colorSpaceArray = resolvedColorSpace.asArray();
                    const colorSpaceName = colorSpaceArray[0] instanceof PDFLib.PDFName
                        ? colorSpaceArray[0].decodeText()
                        : null;

                    if (colorSpaceName === "ICCBased") {
                        const iccProfile = context.lookup(colorSpaceArray[1]);

                        if (iccProfile && iccProfile.contents) {
                            const iccProfileBytes = await flateDecode(iccProfile.contents);
                            const iccColorSpace = String.fromCharCode(...iccProfileBytes.slice(16, 20));

                            if (iccColorSpace === "GRAY") {
                                const iccText = String.fromCharCode(...iccProfileBytes);
                                const trcPosition = iccText.indexOf("kTRC");

                                if (trcPosition !== -1) {
                                    const trcOffset = (
                                        (iccProfileBytes[trcPosition + 4] << 24) |
                                        (iccProfileBytes[trcPosition + 5] << 16) |
                                        (iccProfileBytes[trcPosition + 6] << 8) |
                                        iccProfileBytes[trcPosition + 7]
                                    ) >>> 0;

                                    const trcEntryCount =
                                        (iccProfileBytes[trcOffset + 10] << 8) |
                                        iccProfileBytes[trcOffset + 11];

                                    if (trcEntryCount === 256) {
                                        iccGrayLUT = new Uint8Array(256);

                                        for (let i = 0; i < 256; i++) {
                                            const offset = trcOffset + 12 + i * 2;
                                            const value =
                                                (iccProfileBytes[offset] << 8) |
                                                iccProfileBytes[offset + 1];

                                            iccGrayLUT[i] = Math.round((value / 65535) * 255);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                /*
                 * Detecta ColorSpace Indexed
                 */
                let indexedColorSpace = null;

                if (resolvedColorSpace instanceof PDFLib.PDFArray) {
                    const colorSpaceArray = resolvedColorSpace.asArray();

                    if (
                        colorSpaceArray.length === 4 &&
                        colorSpaceArray[0] instanceof PDFLib.PDFName &&
                        colorSpaceArray[0].decodeText() === "Indexed"
                    ) {
                        indexedColorSpace = colorSpaceArray;
                    }
                }

                /*
                 * Processa Indexed
                 */

                if (indexedColorSpace) {
                    const maxIndex = indexedColorSpace[2].numberValue;
                    const lookup = indexedColorSpace[3];

                    let resolvedLookup = lookup;

                    if (lookup instanceof PDFLib.PDFRef) {
                        resolvedLookup = context.lookup(lookup);
                    }

                    if (!resolvedLookup || !resolvedLookup.contents) continue;

                    const paletteSize = (maxIndex + 1) * 3;
                    const decompressedLookup = await flateDecode(resolvedLookup.contents);

                    if (decompressedLookup.length < paletteSize) continue;

                    const decompressed = await decodeFlateImage(object.contents, filters);
                    const expectedPixels = width * height;

                    if (decompressed.length < expectedPixels) continue;

                    const rgbData = new Uint8Array(expectedPixels * 3);

                    for (let i = 0; i < expectedPixels; i++) {
                        const paletteIndex = decompressed[i];
                        if (paletteIndex > maxIndex) continue;

                        const paletteOffset = paletteIndex * 3;
                        const pixelOffset = i * 3;

                        rgbData[pixelOffset] = decompressedLookup[paletteOffset];
                        rgbData[pixelOffset + 1] = decompressedLookup[paletteOffset + 1];
                        rgbData[pixelOffset + 2] = decompressedLookup[paletteOffset + 2];
                    }

                    const encodedIndexed = new JPEGEncoder(15).encode({
                        data: rgbData,
                        width,
                        height
                    }, 15);

                    const indexedJpeg = new Uint8Array(encodedIndexed.data);
                    if (indexedJpeg.length >= object.contents.length) continue;

                    const newDict = dict;

                    newDict.set(PDFLib.PDFName.of("Filter"), PDFLib.PDFName.of("DCTDecode"));
                    newDict.delete(PDFLib.PDFName.of("DecodeParms"));
                    newDict.set(PDFLib.PDFName.of("ColorSpace"), PDFLib.PDFName.of("DeviceRGB"));
                    newDict.set(PDFLib.PDFName.of("BitsPerComponent"), context.obj(8));
                    newDict.set(PDFLib.PDFName.of("Length"), context.obj(indexedJpeg.length));

                    const newStream = PDFLib.PDFRawStream.of(newDict, indexedJpeg);
                    context.assign(ref, newStream);

                    continue;
                }

                /*
                 * Processa ICCBased GRAY
                 */
                if (iccGrayLUT) {
                    const decompressed = await decodeFlateImage(object.contents, filters);
                    const expectedPixels = width * height;

                    if (decompressed.length < expectedPixels) continue;

                    const grayData = new Uint8Array(expectedPixels * 4);

                    for (let i = 0; i < expectedPixels; i++) {
                        const gray = iccGrayLUT[decompressed[i]];
                        const offset = i * 4;

                        grayData[offset] = gray;
                        grayData[offset + 1] = gray;
                        grayData[offset + 2] = gray;
                        grayData[offset + 3] = 255;
                    }

                    const encodedICC = new JPEGEncoder(15).encode({
                        data: grayData,
                        width,
                        height
                    }, 15);

                    const iccJpeg = new Uint8Array(encodedICC);
                    if (iccJpeg.length >= decompressed.length) continue;

                    const newDict = PDFLib.PDFDict.withContext(context);

                    for (const [key, value] of dict.entries()) {
                        newDict.set(key, value);
                    }

                    newDict.set(PDFLib.PDFName.of("Width"), context.obj(width));
                    newDict.set(PDFLib.PDFName.of("Height"), context.obj(height));
                    newDict.set(PDFLib.PDFName.of("ColorSpace"), PDFLib.PDFName.of("DeviceRGB"));
                    newDict.set(PDFLib.PDFName.of("BitsPerComponent"), context.obj(8));
                    newDict.set(PDFLib.PDFName.of("Filter"), PDFLib.PDFName.of("DCTDecode"));
                    newDict.delete(PDFLib.PDFName.of("DecodeParms"));
                    newDict.delete(PDFLib.PDFName.of("SMask"));
                    newDict.delete(PDFLib.PDFName.of("Mask"));
                    newDict.set(PDFLib.PDFName.of("Length"), context.obj(iccJpeg.length));

                    const newStream = PDFLib.PDFRawStream.of(newDict, iccJpeg);
                    context.assign(ref, newStream);

                    continue;
                }
                if (
                    resolvedColorSpace instanceof PDFLib.PDFName &&
                    resolvedColorSpace.decodeText() === "DeviceCMYK"
                ) {
                    const decompressed = await decodeFlateImage(object.contents, filters);
                    const expectedBytes = width * height * 4;

                    if (decompressed.length < expectedBytes) continue;

                    const rgbData = new Uint8Array(width * height * 4);

                    for (let i = 0; i < width * height; i++) {
                        const sourceOffset = i * 4;
                        const targetOffset = i * 4;

                        const c = decompressed[sourceOffset] / 255;
                        const m = decompressed[sourceOffset + 1] / 255;
                        const y = decompressed[sourceOffset + 2] / 255;
                        const k = decompressed[sourceOffset + 3] / 255;

                        rgbData[targetOffset] = Math.round(255 * (1 - c) * (1 - k));
                        rgbData[targetOffset + 1] = Math.round(255 * (1 - m) * (1 - k));
                        rgbData[targetOffset + 2] = Math.round(255 * (1 - y) * (1 - k));
                        rgbData[targetOffset + 3] = 255;
                    }

                    const encodedCMYK = new JPEGEncoder(40).encode({
                        data: rgbData,
                        width,
                        height
                    }, 40);

                    const cmykJpeg = new Uint8Array(encodedCMYK);
                    if (cmykJpeg.length >= decompressed.length) continue;

                    const newDict = PDFLib.PDFDict.withContext(context);

                    for (const [key, value] of dict.entries()) {
                        newDict.set(key, value);
                    }

                    newDict.set(PDFLib.PDFName.of("Width"), context.obj(width));
                    newDict.set(PDFLib.PDFName.of("Height"), context.obj(height));
                    newDict.set(PDFLib.PDFName.of("ColorSpace"), PDFLib.PDFName.of("DeviceRGB"));
                    newDict.set(PDFLib.PDFName.of("BitsPerComponent"), context.obj(8));
                    newDict.set(PDFLib.PDFName.of("Filter"), PDFLib.PDFName.of("DCTDecode"));
                    newDict.delete(PDFLib.PDFName.of("DecodeParms"));
                    newDict.delete(PDFLib.PDFName.of("SMask"));
                    newDict.delete(PDFLib.PDFName.of("Mask"));
                    newDict.set(PDFLib.PDFName.of("Length"), context.obj(cmykJpeg.length));

                    const newStream = PDFLib.PDFRawStream.of(newDict, cmykJpeg);
                    context.assign(ref, newStream);

                    continue;
                }
                if (
                    resolvedColorSpace instanceof PDFLib.PDFName &&
                    resolvedColorSpace.decodeText() === "DeviceRGB"
                ) {
                    const decompressed = await decodeFlateImage(object.contents, filters);
                    const expectedBytes = width * height * 3;

                    if (decompressed.length < expectedBytes) continue;

                    const rgbData = new Uint8Array(width * height * 4);

                    for (let i = 0; i < width * height; i++) {
                        const sourceOffset = i * 3;
                        const targetOffset = i * 4;

                        rgbData[targetOffset] = decompressed[sourceOffset];
                        rgbData[targetOffset + 1] = decompressed[sourceOffset + 1];
                        rgbData[targetOffset + 2] = decompressed[sourceOffset + 2];
                        rgbData[targetOffset + 3] = 255;
                    }

                    const encodedRGB = new JPEGEncoder(40).encode({
                        data: rgbData,
                        width,
                        height
                    }, 40);

                    const rgbJpeg = new Uint8Array(encodedRGB);
                    if (rgbJpeg.length >= decompressed.length) continue;

                    const newDict = PDFLib.PDFDict.withContext(context);

                    for (const [key, value] of dict.entries()) {
                        newDict.set(key, value);
                    }

                    newDict.set(PDFLib.PDFName.of("Width"), context.obj(width));
                    newDict.set(PDFLib.PDFName.of("Height"), context.obj(height));
                    newDict.set(PDFLib.PDFName.of("ColorSpace"), PDFLib.PDFName.of("DeviceRGB"));
                    newDict.set(PDFLib.PDFName.of("BitsPerComponent"), context.obj(8));
                    newDict.set(PDFLib.PDFName.of("Filter"), PDFLib.PDFName.of("DCTDecode"));
                    newDict.delete(PDFLib.PDFName.of("DecodeParms"));
                    newDict.set(PDFLib.PDFName.of("Length"), context.obj(rgbJpeg.length));

                    const newStream = PDFLib.PDFRawStream.of(newDict, rgbJpeg);
                    context.assign(ref, newStream);

                    continue;
                }
                if (
                    resolvedColorSpace instanceof PDFLib.PDFName &&
                    resolvedColorSpace.decodeText() === "DeviceGray"
                ) {
                    const decompressed = await decodeFlateImage(object.contents, filters);
                    const expectedBytes = width * height;

                    if (decompressed.length < expectedBytes) continue;

                    const grayData = new Uint8Array(width * height * 4);

                    for (let i = 0; i < width * height; i++) {
                        const gray = decompressed[i];
                        const offset = i * 4;

                        grayData[offset] = gray;
                        grayData[offset + 1] = gray;
                        grayData[offset + 2] = gray;
                        grayData[offset + 3] = 255;
                    }

                    const encodedGray = new JPEGEncoder(40).encode({
                        data: grayData,
                        width,
                        height
                    }, 40);

                    const grayJpeg = new Uint8Array(encodedGray);
                    if (grayJpeg.length >= decompressed.length) continue;

                    const newDict = PDFLib.PDFDict.withContext(context);

                    for (const [key, value] of dict.entries()) {
                        newDict.set(key, value);
                    }

                    newDict.set(PDFLib.PDFName.of("Width"), context.obj(width));
                    newDict.set(PDFLib.PDFName.of("Height"), context.obj(height));
                    newDict.set(PDFLib.PDFName.of("ColorSpace"), PDFLib.PDFName.of("DeviceRGB"));
                    newDict.set(PDFLib.PDFName.of("BitsPerComponent"), context.obj(8));
                    newDict.set(PDFLib.PDFName.of("Filter"), PDFLib.PDFName.of("DCTDecode"));
                    newDict.delete(PDFLib.PDFName.of("DecodeParms"));
                    newDict.delete(PDFLib.PDFName.of("SMask"));
                    newDict.delete(PDFLib.PDFName.of("Mask"));
                    newDict.set(PDFLib.PDFName.of("Length"), context.obj(grayJpeg.length));

                    const newStream = PDFLib.PDFRawStream.of(newDict, grayJpeg);
                    context.assign(ref, newStream);

                    continue;
                }
                /*
                 * Outras imagens Flate permanecem intactas.
                 */
                continue;
            }
        } catch {
            continue;
        }
    }
    return await pdfDoc.save();
}

/* ========================================
   COMPRESSÃO EXTREMA
======================================== */

async function compressPdfExtreme(file, onProgress) {
    const pdfBytes = new Uint8Array(await file.arrayBuffer());
    const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
    const context = pdfDoc.context;

    /*
     * ASCII85
     */

    function ascii85Decode(input) {
        const text = new TextDecoder().decode(input);
        const output = [];
        let group = [];

        for (let i = 0; i < text.length; i++) {
            const char = text[i];

            if (
                char === " " ||
                char === "\n" ||
                char === "\r" ||
                char === "\t"
            ) {
                continue;
            }

            if (char === "~" && text[i + 1] === ">") {
                break;
            }

            if (char === "z" && group.length === 0) {
                output.push(0, 0, 0, 0);
                continue;
            }

            group.push(char.charCodeAt(0) - 33);

            if (group.length === 5) {
                let value = 0;

                for (let j = 0; j < 5; j++) {
                    value = value * 85 + group[j];
                }

                output.push(
                    (value >>> 24) & 255,
                    (value >>> 16) & 255,
                    (value >>> 8) & 255,
                    value & 255
                );

                group = [];
            }
        }

        if (group.length > 0) {
            const originalLength = group.length;

            while (group.length < 5) {
                group.push(84);
            }

            let value = 0;

            for (let j = 0; j < 5; j++) {
                value = value * 85 + group[j];
            }

            const bytes = [
                (value >>> 24) & 255,
                (value >>> 16) & 255,
                (value >>> 8) & 255,
                value & 255
            ];

            for (let j = 0; j < originalLength - 1; j++) {
                output.push(bytes[j]);
            }
        }

        return new Uint8Array(output);
    }

    /*
     * FLATE
     */

    async function flateDecode(bytes) {
        const stream = new Blob([bytes]).stream();

        const decompressed = stream.pipeThrough(
            new DecompressionStream("deflate")
        );

        const buffer = await new Response(decompressed).arrayBuffer();

        return new Uint8Array(buffer);
    }

    async function decodeFlateImage(bytes, filters) {
        let decoded = bytes;

        // Aplica os filtros na ordem declarada no PDF.
        for (const filter of filters) {
            if (filter === "ASCII85Decode") {
                decoded = ascii85Decode(decoded);
            } else if (filter === "FlateDecode") {
                decoded = await flateDecode(decoded);
            } else {
                throw new Error(`Filtro não suportado: ${filter}`);
            }
        }

        return decoded;
    }

    /*
     * Filtros PDF
     */

    function getFilterNames(filter) {
        if (!filter) {
            return [];
        }

        if (filter instanceof PDFLib.PDFName) {
            return [filter.decodeText()];
        }

        if (filter instanceof PDFLib.PDFArray) {
            return filter.asArray().map(item => {
                if (item instanceof PDFLib.PDFName) {
                    return item.decodeText();
                }

                return item.toString();
            });
        }

        return [filter.toString()];
    }

    /*
     * Resolução de objetos indiretos
     */

    function resolvePdfObject(value) {
        if (value instanceof PDFLib.PDFRef) {
            return context.lookup(value);
        }

        return value;
    }

    /*
     * Identificação de espaços de cor CMYK
     */

    function isCmykColorSpace(colorSpace) {
        const resolved = resolvePdfObject(colorSpace);

        if (
            resolved instanceof PDFLib.PDFName &&
            resolved.decodeText() === "DeviceCMYK"
        ) {
            return true;
        }

        // Também identifica ICCBased com quatro componentes.
        if (resolved instanceof PDFLib.PDFArray) {
            const parts = resolved.asArray();

            if (
                parts[0] instanceof PDFLib.PDFName &&
                parts[0].decodeText() === "ICCBased"
            ) {
                const profile = resolvePdfObject(parts[1]);

                if (profile && profile.dict) {
                    const components = profile.dict.get(
                        PDFLib.PDFName.of("N")
                    );

                    return (
                        components &&
                        components.numberValue === 4
                    );
                }
            }
        }

        return false;
    }

    /*
     * Verificação de parâmetros de decodificação
     */

    function hasDecodeSettings(dict) {
        return (
            dict.get(PDFLib.PDFName.of("Decode")) !== undefined ||
            dict.get(PDFLib.PDFName.of("DecodeParms")) !== undefined
        );
    }

    /*
     * Compatibilidade com retornos do JPEGEncoder
     */

    function encoderToBytes(encoded) {
        if (encoded instanceof Uint8Array) {
            return encoded;
        }

        if (encoded && encoded.data) {
            return new Uint8Array(encoded.data);
        }

        return new Uint8Array(encoded);
    }

    /*
     * Contagem e identificação de máscaras
     */

    let processedImages = 0;
    let totalImages = 0;

    const transparencyMasks = new Set();

    for (const [, object] of context.enumerateIndirectObjects()) {
        if (!(object instanceof PDFLib.PDFRawStream)) {
            continue;
        }

        const subtype = object.dict.get(
            PDFLib.PDFName.of("Subtype")
        );

        if (!subtype || subtype.decodeText() !== "Image") {
            continue;
        }

        const smask = object.dict.get(
            PDFLib.PDFName.of("SMask")
        );

        const mask = object.dict.get(
            PDFLib.PDFName.of("Mask")
        );

        if (smask instanceof PDFLib.PDFRef) {
            transparencyMasks.add(smask.toString());
        }

        if (mask instanceof PDFLib.PDFRef) {
            transparencyMasks.add(mask.toString());
        }
    }

    for (const [, object] of context.enumerateIndirectObjects()) {
        if (!(object instanceof PDFLib.PDFRawStream)) {
            continue;
        }

        const subtype = object.dict.get(
            PDFLib.PDFName.of("Subtype")
        );

        if (subtype && subtype.decodeText() === "Image") {
            totalImages++;
        }
    }

    /*
     * Processamento das imagens
     */

    for (const [ref, object] of context.enumerateIndirectObjects()) {
        if (!(object instanceof PDFLib.PDFRawStream)) {
            continue;
        }

        const dict = object.dict;

        // Não processa objetos usados como máscaras.
        if (transparencyMasks.has(ref.toString())) {
            continue;
        }

        const subtype = dict.get(
            PDFLib.PDFName.of("Subtype")
        );

        if (!subtype || subtype.decodeText() !== "Image") {
            continue;
        }

        processedImages++;

        if (onProgress) {
            onProgress(processedImages, totalImages);
        }

        // Dá oportunidade para o navegador atualizar a interface.
        await new Promise(resolve => setTimeout(resolve, 0));

        const filter = dict.get(
            PDFLib.PDFName.of("Filter")
        );

        const filters = getFilterNames(filter);

        const isJpeg =
            filters.includes("DCTDecode") &&
            filters.every(filter =>
                filter === "ASCII85Decode" ||
                filter === "DCTDecode"
            );

        const isFlate =
            filters.includes("FlateDecode") &&
            filters.every(filter =>
                filter === "ASCII85Decode" ||
                filter === "FlateDecode"
            );

        if (!isJpeg && !isFlate) {
            continue;
        }

        try {
            /*
             * JPEG
             */

            if (isJpeg) {

                // Não altera imagens que dependem de decodificação especial.
                if (hasDecodeSettings(dict)) {
                    continue;
                }

                // Máscara de cor pode depender dos valores do espaço original.
                const mask = dict.get(
                    PDFLib.PDFName.of("Mask")
                );

                if (mask instanceof PDFLib.PDFArray) {
                    continue;
                }

                let jpegBytes = object.contents;

                if (filters.includes("ASCII85Decode")) {
                    jpegBytes = ascii85Decode(jpegBytes);
                }

                const decoded = window["jpeg-js"].decode(
                    jpegBytes,
                    { useTArray: true }
                );

                const encoded = new JPEGEncoder(10).encode({
                    data: decoded.data,
                    width: decoded.width,
                    height: decoded.height
                }, 10);

                const newJpeg = encoderToBytes(encoded);

                if (newJpeg.length >= jpegBytes.length) {
                    continue;
                }

                const newDict = PDFLib.PDFDict.withContext(context);

                for (const [key, value] of dict.entries()) {
                    newDict.set(key, value);
                }

                newDict.set(
                    PDFLib.PDFName.of("Width"),
                    context.obj(decoded.width)
                );

                newDict.set(
                    PDFLib.PDFName.of("Height"),
                    context.obj(decoded.height)
                );

                newDict.set(
                    PDFLib.PDFName.of("ColorSpace"),
                    PDFLib.PDFName.of("DeviceRGB")
                );

                newDict.set(
                    PDFLib.PDFName.of("BitsPerComponent"),
                    context.obj(8)
                );

                newDict.set(
                    PDFLib.PDFName.of("Filter"),
                    PDFLib.PDFName.of("DCTDecode")
                );

                newDict.delete(
                    PDFLib.PDFName.of("DecodeParms")
                );

                // Mantém SMask e Mask referenciadas no dicionário.
                newDict.set(
                    PDFLib.PDFName.of("Length"),
                    context.obj(newJpeg.length)
                );

                const newStream = PDFLib.PDFRawStream.of(
                    newDict,
                    newJpeg
                );

                context.assign(ref, newStream);

                continue;
            }

            /*
             * FLATE
             */

            if (isFlate) {
                const width = dict.get(
                    PDFLib.PDFName.of("Width")
                )?.numberValue;

                const height = dict.get(
                    PDFLib.PDFName.of("Height")
                )?.numberValue;

                const bitsPerComponent = dict.get(
                    PDFLib.PDFName.of("BitsPerComponent")
                );

                if (
                    !width ||
                    !height ||
                    !bitsPerComponent ||
                    bitsPerComponent.numberValue !== 8
                ) {
                    continue;
                }

                // Evita interpretar incorretamente imagens com Decode/Predictor.
                if (hasDecodeSettings(dict)) {
                    continue;
                }

                const colorSpace = dict.get(
                    PDFLib.PDFName.of("ColorSpace")
                );

                const resolvedColorSpace = resolvePdfObject(colorSpace);

                /*
                 * Detecta ICCBased GRAY
                 */

                let iccGrayLUT = null;

                if (resolvedColorSpace instanceof PDFLib.PDFArray) {
                    const colorSpaceArray = resolvedColorSpace.asArray();

                    const colorSpaceName =
                        colorSpaceArray[0] instanceof PDFLib.PDFName
                            ? colorSpaceArray[0].decodeText()
                            : null;

                    if (colorSpaceName === "ICCBased") {
                        const iccProfile = resolvePdfObject(
                            colorSpaceArray[1]
                        );

                        if (iccProfile && iccProfile.contents) {
                            const iccProfileBytes = await flateDecode(
                                iccProfile.contents
                            );

                            const iccColorSpace = String.fromCharCode(
                                ...iccProfileBytes.slice(16, 20)
                            );

                            if (iccColorSpace === "GRAY") {
                                const iccText = String.fromCharCode(
                                    ...iccProfileBytes
                                );

                                const trcPosition = iccText.indexOf("kTRC");

                                if (trcPosition !== -1) {
                                    const trcOffset = (
                                        (iccProfileBytes[trcPosition + 4] << 24) |
                                        (iccProfileBytes[trcPosition + 5] << 16) |
                                        (iccProfileBytes[trcPosition + 6] << 8) |
                                        iccProfileBytes[trcPosition + 7]
                                    ) >>> 0;

                                    const trcEntryCount =
                                        (iccProfileBytes[trcOffset + 10] << 8) |
                                        iccProfileBytes[trcOffset + 11];

                                    if (trcEntryCount === 256) {
                                        iccGrayLUT = new Uint8Array(256);

                                        for (let i = 0; i < 256; i++) {
                                            const offset =
                                                trcOffset + 12 + i * 2;

                                            const value =
                                                (iccProfileBytes[offset] << 8) |
                                                iccProfileBytes[offset + 1];

                                            iccGrayLUT[i] = Math.round(
                                                (value / 65535) * 255
                                            );
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                /*
                 * Detecta ColorSpace Indexed
                 */

                let indexedColorSpace = null;

                if (resolvedColorSpace instanceof PDFLib.PDFArray) {
                    const colorSpaceArray = resolvedColorSpace.asArray();

                    if (
                        colorSpaceArray.length === 4 &&
                        colorSpaceArray[0] instanceof PDFLib.PDFName &&
                        colorSpaceArray[0].decodeText() === "Indexed"
                    ) {
                        indexedColorSpace = colorSpaceArray;
                    }
                }

                /*
                 * Processa Indexed
                 */

                if (indexedColorSpace) {
                    const maxIndex = indexedColorSpace[2].numberValue;
                    const lookup = indexedColorSpace[3];

                    const resolvedLookup = resolvePdfObject(lookup);

                    if (!resolvedLookup || !resolvedLookup.contents) {
                        continue;
                    }

                    const paletteSize = (maxIndex + 1) * 3;

                    const decompressedLookup = await flateDecode(
                        resolvedLookup.contents
                    );

                    if (decompressedLookup.length < paletteSize) {
                        continue;
                    }

                    const decompressed = await decodeFlateImage(
                        object.contents,
                        filters
                    );

                    const expectedPixels = width * height;

                    if (decompressed.length < expectedPixels) {
                        continue;
                    }

                    const rgbData = new Uint8Array(expectedPixels * 4);

                    for (let i = 0; i < expectedPixels; i++) {
                        const paletteIndex = decompressed[i];

                        if (paletteIndex > maxIndex) {
                            continue;
                        }

                        const paletteOffset = paletteIndex * 3;
                        const pixelOffset = i * 4;

                        rgbData[pixelOffset] =
                            decompressedLookup[paletteOffset];

                        rgbData[pixelOffset + 1] =
                            decompressedLookup[paletteOffset + 1];

                        rgbData[pixelOffset + 2] =
                            decompressedLookup[paletteOffset + 2];

                        rgbData[pixelOffset + 3] = 255;
                    }

                    const encodedIndexed = new JPEGEncoder(15).encode({
                        data: rgbData,
                        width,
                        height
                    }, 15);

                    const indexedJpeg = encoderToBytes(encodedIndexed);

                    if (indexedJpeg.length >= object.contents.length) {
                        continue;
                    }

                    const newDict = PDFLib.PDFDict.withContext(context);

                    for (const [key, value] of dict.entries()) {
                        newDict.set(key, value);
                    }

                    newDict.set(
                        PDFLib.PDFName.of("Filter"),
                        PDFLib.PDFName.of("DCTDecode")
                    );

                    newDict.delete(
                        PDFLib.PDFName.of("DecodeParms")
                    );

                    newDict.set(
                        PDFLib.PDFName.of("ColorSpace"),
                        PDFLib.PDFName.of("DeviceRGB")
                    );

                    newDict.set(
                        PDFLib.PDFName.of("BitsPerComponent"),
                        context.obj(8)
                    );

                    newDict.set(
                        PDFLib.PDFName.of("Length"),
                        context.obj(indexedJpeg.length)
                    );

                    const newStream = PDFLib.PDFRawStream.of(
                        newDict,
                        indexedJpeg
                    );

                    context.assign(ref, newStream);

                    continue;
                }

                /*
                 * Processa ICCBased GRAY
                 */

                if (iccGrayLUT) {
                    const decompressed = await decodeFlateImage(
                        object.contents,
                        filters
                    );

                    const expectedPixels = width * height;

                    if (decompressed.length < expectedPixels) {
                        continue;
                    }

                    const grayData = new Uint8Array(expectedPixels * 4);

                    for (let i = 0; i < expectedPixels; i++) {
                        const gray = iccGrayLUT[decompressed[i]];
                        const offset = i * 4;

                        grayData[offset] = gray;
                        grayData[offset + 1] = gray;
                        grayData[offset + 2] = gray;
                        grayData[offset + 3] = 255;
                    }

                    const encodedICC = new JPEGEncoder(15).encode({
                        data: grayData,
                        width,
                        height
                    }, 15);

                    const iccJpeg = encoderToBytes(encodedICC);

                    if (iccJpeg.length >= object.contents.length) {
                        continue;
                    }

                    const newDict = PDFLib.PDFDict.withContext(context);

                    for (const [key, value] of dict.entries()) {
                        newDict.set(key, value);
                    }

                    newDict.set(
                        PDFLib.PDFName.of("Width"),
                        context.obj(width)
                    );

                    newDict.set(
                        PDFLib.PDFName.of("Height"),
                        context.obj(height)
                    );

                    newDict.set(
                        PDFLib.PDFName.of("ColorSpace"),
                        PDFLib.PDFName.of("DeviceRGB")
                    );

                    newDict.set(
                        PDFLib.PDFName.of("BitsPerComponent"),
                        context.obj(8)
                    );

                    newDict.set(
                        PDFLib.PDFName.of("Filter"),
                        PDFLib.PDFName.of("DCTDecode")
                    );

                    newDict.delete(
                        PDFLib.PDFName.of("DecodeParms")
                    );

                    newDict.set(
                        PDFLib.PDFName.of("Length"),
                        context.obj(iccJpeg.length)
                    );

                    const newStream = PDFLib.PDFRawStream.of(
                        newDict,
                        iccJpeg
                    );

                    context.assign(ref, newStream);

                    continue;
                }

                /*
                 * DeviceCMYK
                 *
                 * Preserva o objeto original para não introduzir
                 * conversão CMYK -> RGB com cores incorretas.
                 */

                if (
                    resolvedColorSpace instanceof PDFLib.PDFName &&
                    resolvedColorSpace.decodeText() === "DeviceCMYK"
                ) {
                    const decompressed = await decodeFlateImage(
                        object.contents,
                        filters
                    );

                    const expectedBytes = width * height * 4;

                    if (decompressed.length < expectedBytes) {
                        continue;
                    }

                    const rgbData = new Uint8Array(width * height * 4);

                    for (let i = 0; i < width * height; i++) {
                        const sourceOffset = i * 4;
                        const targetOffset = i * 4;

                        const c = decompressed[sourceOffset] / 255;
                        const m = decompressed[sourceOffset + 1] / 255;
                        const y = decompressed[sourceOffset + 2] / 255;
                        const k = decompressed[sourceOffset + 3] / 255;

                        rgbData[targetOffset] =
                            Math.round(255 * (1 - c) * (1 - k));

                        rgbData[targetOffset + 1] =
                            Math.round(255 * (1 - m) * (1 - k));

                        rgbData[targetOffset + 2] =
                            Math.round(255 * (1 - y) * (1 - k));

                        rgbData[targetOffset + 3] = 255;
                    }

                    const encodedCMYK = new JPEGEncoder(15).encode({
                        data: rgbData,
                        width,
                        height
                    }, 15);

                    const cmykJpeg = encoderToBytes(encodedCMYK);

                    if (cmykJpeg.length >= object.contents.length) {
                        continue;
                    }

                    const newDict = PDFLib.PDFDict.withContext(context);

                    for (const [key, value] of dict.entries()) {
                        newDict.set(key, value);
                    }

                    newDict.set(
                        PDFLib.PDFName.of("Width"),
                        context.obj(width)
                    );

                    newDict.set(
                        PDFLib.PDFName.of("Height"),
                        context.obj(height)
                    );

                    newDict.set(
                        PDFLib.PDFName.of("ColorSpace"),
                        PDFLib.PDFName.of("DeviceRGB")
                    );

                    newDict.set(
                        PDFLib.PDFName.of("BitsPerComponent"),
                        context.obj(8)
                    );

                    newDict.set(
                        PDFLib.PDFName.of("Filter"),
                        PDFLib.PDFName.of("DCTDecode")
                    );

                    newDict.delete(
                        PDFLib.PDFName.of("DecodeParms")
                    );

                    newDict.set(
                        PDFLib.PDFName.of("Length"),
                        context.obj(cmykJpeg.length)
                    );

                    const newStream = PDFLib.PDFRawStream.of(
                        newDict,
                        cmykJpeg
                    );

                    context.assign(ref, newStream);

                    continue;
                }

                /*
                 * DeviceRGB
                 */

                if (
                    resolvedColorSpace instanceof PDFLib.PDFName &&
                    resolvedColorSpace.decodeText() === "DeviceRGB"
                ) {
                    const decompressed = await decodeFlateImage(
                        object.contents,
                        filters
                    );

                    const expectedBytes = width * height * 3;

                    if (decompressed.length < expectedBytes) {
                        continue;
                    }

                    const rgbData = new Uint8Array(width * height * 4);

                    for (let i = 0; i < width * height; i++) {
                        const sourceOffset = i * 3;
                        const targetOffset = i * 4;

                        rgbData[targetOffset] =
                            decompressed[sourceOffset];

                        rgbData[targetOffset + 1] =
                            decompressed[sourceOffset + 1];

                        rgbData[targetOffset + 2] =
                            decompressed[sourceOffset + 2];

                        rgbData[targetOffset + 3] = 255;
                    }

                    const encodedRGB = new JPEGEncoder(15).encode({
                        data: rgbData,
                        width,
                        height
                    }, 15);

                    const rgbJpeg = encoderToBytes(encodedRGB);

                    if (rgbJpeg.length >= object.contents.length) {
                        continue;
                    }

                    const newDict = PDFLib.PDFDict.withContext(context);

                    for (const [key, value] of dict.entries()) {
                        newDict.set(key, value);
                    }

                    newDict.set(
                        PDFLib.PDFName.of("Width"),
                        context.obj(width)
                    );

                    newDict.set(
                        PDFLib.PDFName.of("Height"),
                        context.obj(height)
                    );

                    newDict.set(
                        PDFLib.PDFName.of("ColorSpace"),
                        PDFLib.PDFName.of("DeviceRGB")
                    );

                    newDict.set(
                        PDFLib.PDFName.of("BitsPerComponent"),
                        context.obj(8)
                    );

                    newDict.set(
                        PDFLib.PDFName.of("Filter"),
                        PDFLib.PDFName.of("DCTDecode")
                    );

                    newDict.delete(
                        PDFLib.PDFName.of("DecodeParms")
                    );

                    newDict.set(
                        PDFLib.PDFName.of("Length"),
                        context.obj(rgbJpeg.length)
                    );

                    const newStream = PDFLib.PDFRawStream.of(
                        newDict,
                        rgbJpeg
                    );

                    context.assign(ref, newStream);

                    continue;
                }

                /*
                 * DeviceGray
                 */

                if (
                    resolvedColorSpace instanceof PDFLib.PDFName &&
                    resolvedColorSpace.decodeText() === "DeviceGray"
                ) {
                    const decompressed = await decodeFlateImage(
                        object.contents,
                        filters
                    );

                    const expectedBytes = width * height;

                    if (decompressed.length < expectedBytes) {
                        continue;
                    }

                    const grayData = new Uint8Array(width * height * 4);

                    for (let i = 0; i < width * height; i++) {
                        const gray = decompressed[i];
                        const offset = i * 4;

                        grayData[offset] = gray;
                        grayData[offset + 1] = gray;
                        grayData[offset + 2] = gray;
                        grayData[offset + 3] = 255;
                    }

                    const encodedGray = new JPEGEncoder(15).encode({
                        data: grayData,
                        width,
                        height
                    }, 15);

                    const grayJpeg = encoderToBytes(encodedGray);

                    if (grayJpeg.length >= object.contents.length) {
                        continue;
                    }

                    const newDict = PDFLib.PDFDict.withContext(context);

                    for (const [key, value] of dict.entries()) {
                        newDict.set(key, value);
                    }

                    newDict.set(
                        PDFLib.PDFName.of("Width"),
                        context.obj(width)
                    );

                    newDict.set(
                        PDFLib.PDFName.of("Height"),
                        context.obj(height)
                    );

                    newDict.set(
                        PDFLib.PDFName.of("ColorSpace"),
                        PDFLib.PDFName.of("DeviceRGB")
                    );

                    newDict.set(
                        PDFLib.PDFName.of("BitsPerComponent"),
                        context.obj(8)
                    );

                    newDict.set(
                        PDFLib.PDFName.of("Filter"),
                        PDFLib.PDFName.of("DCTDecode")
                    );

                    newDict.delete(
                        PDFLib.PDFName.of("DecodeParms")
                    );

                    newDict.set(
                        PDFLib.PDFName.of("Length"),
                        context.obj(grayJpeg.length)
                    );

                    const newStream = PDFLib.PDFRawStream.of(
                        newDict,
                        grayJpeg
                    );

                    context.assign(ref, newStream);

                    continue;
                }

                /*
                 * Outras imagens Flate permanecem intactas.
                 */
                continue;
            }
        } catch (error) {
            console.warn(
                "Extreme: imagem não processada:",
                ref.toString(),
                error
            );

            continue;
        }
    }

    return await pdfDoc.save();
}

/* ========================================
   DOWNLOAD DO PDF
======================================== */

if (downloadButton) {
    downloadButton.addEventListener("click", () => {
        if (!window.compressedPdf) {
            return;
        }

        const blob = new Blob(
            [window.compressedPdf],
            { type: "application/pdf" }
        );

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;

        link.download = originalFileName.replace(
            /\.pdf$/i,
            "-comprimido.pdf"
        );

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
    });
}


/* ========================================
   COMPRIMIR OUTRO PDF
======================================== */

if (compressAnother) {
    compressAnother.addEventListener("click", () => {
        window.location.reload();
    });
}


/* ========================================
   ÍCONE DO PDF
======================================== */

if (fileIcon && pdfInput) {
    fileIcon.addEventListener("click", () => {
        if (
            result.style.display === "flex" &&
            window.compressedPdf
        ) {
            downloadButton.click();
            return;
        }

        pdfInput.click();
    });
}