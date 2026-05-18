import "@testing-library/jest-dom/vitest"
import { vi } from "vitest"

// jsdom has no canvas. LcPad calls getContext + putImageData on render;
// without this stub, mount crashes.
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  createImageData: vi.fn((w: number, h: number) => ({
    data: new Uint8ClampedArray(w * h * 4),
    width: w,
    height: h,
    colorSpace: "srgb" as const,
  })),
  putImageData: vi.fn(),
})) as unknown as HTMLCanvasElement["getContext"]
