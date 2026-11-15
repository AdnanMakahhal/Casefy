import sharp from "sharp";

export async function normalizeAvatar(value) {
  if (value === null) return null;
  if (typeof value !== "string" || value.length > 350_000)
    throw new Error("Choose an image smaller than 250 KB after cropping");
  const match =
    /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) throw new Error("Choose a JPEG, PNG, or WebP image");
  try {
    const image = sharp(Buffer.from(match[2], "base64"), {
      limitInputPixels: 16_000_000,
    });
    const metadata = await image.metadata();
    if (!["jpeg", "png", "webp"].includes(metadata.format))
      throw new Error("Unsupported image");
    const output = await image
      .rotate()
      .resize(256, 256, { fit: "cover" })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 85 })
      .toBuffer();
    return `data:image/jpeg;base64,${output.toString("base64")}`;
  } catch {
    throw new Error(
      "This image could not be read. Choose another JPEG, PNG, or WebP image",
    );
  }
}
