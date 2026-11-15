import { useEffect, useRef, useState } from "react";
import AccountModal from "./AccountModal";
import { clampPosition, cropGeometry } from "../features/authentication/crop";

export default function AvatarCropper({ file, onDismiss, onSave }) {
  const [image, setImage] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const drag = useRef(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const loadedImage = new Image();
    loadedImage.onload = () => {
      if (loadedImage.naturalWidth * loadedImage.naturalHeight > 40_000_000) {
        setError("Choose a photo smaller than 40 megapixels.");
      } else { setImage(loadedImage); }
    };
    loadedImage.onerror = () => setError("This photo could not be read. Choose another image.");
    loadedImage.src = url;
    return () => { loadedImage.onload = null; loadedImage.onerror = null; URL.revokeObjectURL(url); };
  }, [file]);

  const width = image ? Math.max(1, image.naturalWidth / image.naturalHeight) * zoom : 1;
  const height = image ? Math.max(1, image.naturalHeight / image.naturalWidth) * zoom : 1;

  async function saveAvatar() {
    if (!image || busy) return;
    setBusy(true);
    setError("");
    try {
      const crop = cropGeometry(image.naturalWidth, image.naturalHeight, zoom, position.x, position.y);
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 256;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Your browser could not crop this image.");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, 256, 256);
      context.drawImage(image, crop.x, crop.y, crop.size, crop.size, 0, 0, 256, 256);
      await onSave(canvas.toDataURL("image/jpeg", 0.85));
    } catch (error) {
      setError(error.message || "Unable to save this photo. Please try again.");
    } finally { setBusy(false); }
  }

  return (
    <AccountModal title="Crop your profile photo" onDismiss={onDismiss} busy={busy}>
      <p className="mb-5 text-sm leading-6 text-[#526159]">Drag the image and zoom to choose the frame for your avatar.</p>
      <div role="img" aria-label="Avatar crop preview. Use the sliders below to adjust the image." className="relative mx-auto aspect-square w-full max-w-[280px] touch-none overflow-hidden rounded-xl bg-[#edf3ef] select-none"
        onPointerDown={(event) => {
          if (!image || busy) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, position, size: event.currentTarget.getBoundingClientRect().width };
        }}
        onPointerMove={(event) => {
          const start = drag.current;
          if (!start || busy || start.pointerId !== event.pointerId) return;
          setPosition({ x: width > 1 ? clampPosition(start.position.x - (event.clientX - start.x) / (start.size * (width - 1) / 2) * 100) : 0, y: height > 1 ? clampPosition(start.position.y - (event.clientY - start.y) / (start.size * (height - 1) / 2) * 100) : 0 });
        }}
        onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}>
        {image ? <img src={image.src} alt="" draggable={false} style={{ width: `${width * 100}%`, height: `${height * 100}%`, left: `${50 - (width - 1) * position.x / 2}%`, top: `${50 - (height - 1) * position.y / 2}%` }} className="pointer-events-none absolute max-w-none -translate-x-1/2 -translate-y-1/2 cursor-grab" /> : <p role="status" className="p-6 text-center text-sm text-[#526159]">{error ? "Preview unavailable" : "Loading image..."}</p>}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full border-2 border-white shadow-[0_0_0_100px_#10201999]" />
      </div>
      <div className="mt-6 space-y-4">
        <label className="block text-sm font-medium">Zoom<input type="range" min="1" max="3" step="0.01" value={zoom} disabled={!image || busy} onChange={(event) => setZoom(Number(event.target.value))} className="mt-2 block w-full accent-[#294137]" /></label>
        <label className="block text-sm font-medium">Horizontal position<input type="range" min="-100" max="100" step="1" value={position.x} disabled={!image || width <= 1 || busy} onChange={(event) => setPosition((current) => ({ ...current, x: Number(event.target.value) }))} className="mt-2 block w-full accent-[#294137]" /></label>
        <label className="block text-sm font-medium">Vertical position<input type="range" min="-100" max="100" step="1" value={position.y} disabled={!image || height <= 1 || busy} onChange={(event) => setPosition((current) => ({ ...current, y: Number(event.target.value) }))} className="mt-2 block w-full accent-[#294137]" /></label>
      </div>
      {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
      <div className="mt-6 flex justify-end gap-3"><button type="button" disabled={busy} onClick={onDismiss} className="min-h-11 cursor-pointer rounded-lg border border-[#CFDDD5] px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-[#294137] disabled:opacity-50">Cancel</button><button type="button" disabled={!image || busy} onClick={saveAvatar} className="min-h-11 cursor-pointer rounded-lg bg-[#294137] px-4 text-sm font-semibold text-white hover:bg-[#20332b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137] disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Saving..." : "Save photo"}</button></div>
    </AccountModal>
  );
}
