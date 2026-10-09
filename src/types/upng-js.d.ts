declare module 'upng-js' {
  const UPNG: {
    decode(buffer: ArrayBuffer): { width: number; height: number; [key: string]: any };
    toRGBA8(img: any): ArrayBuffer[];
  };
  export default UPNG;
}