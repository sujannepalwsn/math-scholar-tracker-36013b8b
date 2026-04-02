export type ElementType = "text" | "image";

export interface ElementStyles {
  fontSize?: string;
  color?: string;
  fontWeight?: string;
  textAlign?: "left" | "center" | "right";
  fontFamily?: string;
}

export interface HeaderElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number | string;
  height: number | string;
  content: string;
  styles: ElementStyles;
}

export interface HeaderConfig {
  width: string;
  height: string;
  designWidth?: number;
  gridSize: number;
  elements: HeaderElement[];
  backgroundColor?: string;
  backgroundUrl?: string;
  overlayColor?: string;
  overlayOpacity?: number;
}
