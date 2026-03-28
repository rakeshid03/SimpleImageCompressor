let selectedFile = null;
let compressionLevel = 50;

const $ = id => document.getElementById(id);

// Events
$('fileInput').onchange = e => handleFile(e.target.files[0]);

['dragover', 'dragleave', 'drop'].forEach(event => {
  $('uploadZone').addEventListener(event, e => {
    e.preventDefault();
    if (event === 'dragover') {
      uploadZone.style.borderColor = '#3B82F6';
      uploadZone.style.background = '#F0F7FF';
    } else {
      uploadZone.style.borderColor = '#D1D5DB';
      uploadZone.style.background = '#FAFBFC';
    }
    if (event === 'drop') handleFile(e.dataTransfer.files[0]);
  });
});

$('compressionSlider').oninput = e => {
  compressionLevel = +e.target.value;
  $('compressionValue').textContent = compressionLevel + '%';
  $('compressionLabel').textContent =
    compressionLevel < 30 ? 'Low Compression (High Quality)' :
    compressionLevel < 70 ? 'Balanced (Good for Web)' :
    'High Compression (Smallest Size)';
};

// Handle file
function handleFile(file) {
  if (!file) return;
  selectedFile = file;
  
  $('uploadZone').classList.add('hidden');
  $('fileSection').classList.remove('hidden');
  $('resultsSection').classList.add('hidden');
  
  $('fileName').textContent = file.name;
  $('fileSize').textContent =
    `${formatSize(file.size)} • ${file.type.split('/')[1]?.toUpperCase()}`;
  
  $('fileIcon').textContent = file.type.startsWith('image/') ? '🖼️' : '📄';
}

// Compress
async function compressFile() {
  if (!selectedFile) return;
  
  const btn = $('compressBtn');
  btn.disabled = true;
  btn.innerHTML = 'Compressing...';
  
  try {
    const { blob, url } = await compressImage(selectedFile, compressionLevel / 100);
    showResult(selectedFile.size, blob.size, url);
  } catch {
    alert('Compression failed');
  }
  
  btn.disabled = false;
  btn.innerHTML = 'Compress File';
}

// Image compression
function compressImage(file, quality) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      let [w, h] = [img.width, img.height];
      const max = 2400;
      
      if (w > max || h > max) {
        const ratio = w > h ? max / w : max / h;
        w *= ratio;
        h *= ratio;
      }
      
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);
      
      canvas.toBlob(blob => {
        if (!blob) return rej();
        res({ blob, url: URL.createObjectURL(blob) });
      }, file.type === 'image/png' ? 'image/jpeg' : file.type, Math.max(0.1, 1 - quality));
    };
    
    img.onerror = rej;
  });
}

// Results + Caption
function showResult(orig, comp, url) {
  $('resultsSection').classList.remove('hidden');
  
  const saved = Math.round((1 - comp / orig) * 100);
  
  $('originalSize').textContent = formatSize(orig);
  $('newSize').textContent = formatSize(comp);
  $('savedPercent').textContent = `-${saved}%`;
  $('downloadSize').textContent = `(${formatSize(comp)})`;
  
  const download = $('downloadBtn');
  download.href = url;
  download.download = 'compressed-' + selectedFile.name;
  
  // Preview
  $('previewCard').innerHTML = selectedFile.type.startsWith('image/') ?
    `
      <img src="${url}" class="preview-img">
    ` :
    `<p>Preview not available</p>`;
}

// Clear Current file
function clearFile() {
  selectedFile = null;
  $('fileInput').value = '';
  
  ['uploadZone'].forEach(id => $(id).classList.remove('hidden'));
  ['fileSection', 'resultsSection'].forEach(id => $(id).classList.add('hidden'));
  
  $('previewCard').innerHTML = '';
}

// Size formatter
function formatSize(b) {
  if (!b) return '0 Bytes';
  const i = Math.floor(Math.log(b) / Math.log(1024));
  return (b / 1024 ** i).toFixed(2) + [' Bytes', ' KB', ' MB', ' GB'][i];
}
