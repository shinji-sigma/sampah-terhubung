// Leave room for multipart headers below the host's 4.5 MB function limit.
export const PHOTO_REQUEST_BYTES = 3.5 * 1024 * 1024;

export async function preparePhoto(file: File): Promise<File> {
  if (file.size <= PHOTO_REQUEST_BYTES) return file;
  if (typeof createImageBitmap !== "function")
    throw new Error("Perangkat ini belum mendukung persiapan foto besar. Pilih foto lebih kecil.");
  const image = await createImageBitmap(file).catch(() => {
    throw new Error("Isi foto tidak dapat dibaca. Pilih foto lain.");
  });
  try {
    if (!image.width || !image.height || image.width * image.height > 25000000)
      throw new Error("Dimensi foto terlalu besar. Pilih foto lain.");
    const scale = Math.min(1, 1920 / image.width, 1920 / image.height);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Foto tidak dapat disiapkan pada perangkat ini.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.85, 0.65, 0.45]) {
      const bytes = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", quality),
      );
      if (bytes && bytes.size > 0 && bytes.size <= PHOTO_REQUEST_BYTES)
        return new File([bytes], "foto.jpg", { type: "image/jpeg" });
    }
    throw new Error("Foto masih terlalu besar. Pilih foto berukuran lebih kecil.");
  } finally {
    image.close();
  }
}

export async function uploadPhotoFiles(
  files: File[],
  uploadedIds: string[],
  upload: (body: FormData) => Promise<{ ids: string[] }>,
) {
  // Save each successful ID immediately so a partial retry does not upload it again.
  for (let i = uploadedIds.length; i < files.length; i++) {
    const file = await preparePhoto(files[i]);
    const body = new FormData();
    body.append("photos", file);
    const result = await upload(body);
    if (result.ids.length !== 1)
      throw new Error("Respons unggahan tidak lengkap. Coba lagi.");
    uploadedIds.push(result.ids[0]);
  }
}
