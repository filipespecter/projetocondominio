export function fileToDataUrl(file, maxBytes = 8 * 1024 * 1024) {
  if (!file) return Promise.resolve(null);
  if (file.size > maxBytes) {
    return Promise.reject(new Error(`O arquivo deve ter no máximo ${Math.floor(maxBytes / 1024 / 1024)} MB.`));
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo selecionado."));
    reader.readAsDataURL(file);
  });
}

export function downloadDataUrl(dataUrl, fileName = "arquivo") {
  if (!dataUrl) throw new Error("Arquivo indisponível.");
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}
