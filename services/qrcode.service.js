import QRCode from "qrcode";

export async function generateQRCode(url) {

    return await QRCode.toDataURL(url, {
        width: 220,
        margin: 1,
        color: {
            dark: "#102A43",
            light: "#FFFFFF"
        }
    });

}