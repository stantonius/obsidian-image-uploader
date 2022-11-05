

export function htmlFormatting(src: string, height: number, width: number, altcaption: string): string {
    return `<figure><p align="center"><img src="${src}" height="${height}" width="${width}" alt="${altcaption}"/>\
    <figcaption align="center"><em>${altcaption}</em></figcaption></p></figure>`;
}