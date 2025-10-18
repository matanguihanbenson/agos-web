declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: {
      head?: any[][];
      body?: any[][];
      startY?: number;
      margin?: { left?: number; right?: number; top?: number; bottom?: number };
      styles?: {
        fontSize?: number;
        cellPadding?: number;
        lineColor?: number[];
        lineWidth?: number;
      };
      headStyles?: {
        fillColor?: number[];
        textColor?: number | string;
        fontSize?: number;
        fontStyle?: string;
        halign?: 'left' | 'center' | 'right';
      };
      bodyStyles?: {
        fillColor?: number[];
        textColor?: number | string;
      };
      alternateRowStyles?: {
        fillColor?: number[];
      };
      columnStyles?: {
        [key: string]: {
          cellWidth?: number | 'auto' | 'wrap';
          halign?: 'left' | 'center' | 'right';
          fillColor?: number[];
        };
      };
      didDrawPage?: (data: any) => void;
      willDrawPage?: (data: any) => void;
    }) => jsPDF;
    
    lastAutoTable?: {
      finalY: number;
    };
  }
}
