export async function imageFileToDataUrl(file, { maxWidth = 1280, quality = 0.72 } = {}) {
  if (!file) return null;
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("Use uma imagem JPG, PNG ou WEBP.");
  const source = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload=()=>resolve(reader.result); reader.onerror=()=>reject(new Error("Não foi possível ler a imagem.")); reader.readAsDataURL(file); });
  const image = await new Promise((resolve,reject)=>{ const img=new Image(); img.onload=()=>resolve(img); img.onerror=()=>reject(new Error("Imagem inválida.")); img.src=source; });
  const scale = Math.min(1, maxWidth / image.width);
  const canvas=document.createElement("canvas"); canvas.width=Math.max(1,Math.round(image.width*scale)); canvas.height=Math.max(1,Math.round(image.height*scale));
  canvas.getContext("2d").drawImage(image,0,0,canvas.width,canvas.height);
  const dataUrl=canvas.toDataURL("image/jpeg",quality);
  if (dataUrl.length > 1100000) throw new Error("A foto ficou grande demais. Escolha uma imagem menor.");
  return dataUrl;
}
