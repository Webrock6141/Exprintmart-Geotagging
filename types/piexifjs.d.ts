declare module "piexifjs" {
  type IfdDict = Record<number, unknown>

  interface ExifObject {
    "0th": IfdDict
    Exif: IfdDict
    GPS: IfdDict
    Interop: IfdDict
    "1st": IfdDict
    thumbnail: string | null
  }

  interface ImageIFD {
    DocumentName: number
    ImageDescription: number
    Artist: number
    Copyright: number
    XPTitle: number
    XPComment: number
    XPAuthor: number
    XPKeywords: number
    XPSubject: number
    Software: number
    [key: string]: number
  }

  interface ExifIFD {
    UserComment: number
    [key: string]: number
  }

  interface GPSIFD {
    GPSVersionID: number
    GPSLatitudeRef: number
    GPSLatitude: number
    GPSLongitudeRef: number
    GPSLongitude: number
    [key: string]: number
  }

  interface GPSHelper {
    degToDmsRational(degFloat: number): [number, number][]
    dmsRationalToDeg(dmsArray: [number, number][], ref: string): number
  }

  const piexif: {
    ImageIFD: ImageIFD
    ExifIFD: ExifIFD
    GPSIFD: GPSIFD
    GPSHelper: GPSHelper
    load(jpegData: string): ExifObject
    dump(exifObj: ExifObject): string
    insert(exifBytes: string, jpegData: string): string
    remove(jpegData: string): string
  }

  export default piexif
}
