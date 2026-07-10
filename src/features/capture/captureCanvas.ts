import type { WatermarkSettings } from "./model/types";

export const addWatermarkToImage = (
  base64: string,
  watermark: WatermarkSettings,
): Promise<string> => {
  const rows = Math.max(1, Number(watermark.rows) || 1);
  const cols = Math.max(1, Number(watermark.cols) || 1);
  const angle = (Number(watermark.angle) * Math.PI) / 180;

  return new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.width = image.width;
      canvas.height = image.height;

      if (!context) {
        reject(new Error("无法创建画布上下文"));
        return;
      }

      context.drawImage(image, 0, 0);
      context.font = `${watermark.fontSize}px sans-serif`;
      context.fillStyle = watermark.color;
      context.textAlign = "center";
      context.textBaseline = "middle";

      const rowStep = canvas.height / rows;
      const colStep = canvas.width / cols;
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          context.save();
          context.translate((col + 0.5) * colStep, (row + 0.5) * rowStep);
          context.rotate(angle);
          context.fillText(watermark.text, 0, 0);
          context.restore();
        }
      }

      resolve(canvas.toDataURL("image/png"));
    };
    image.onerror = () => reject(new Error("快照加载失败"));
    image.src = base64;
  });
};
