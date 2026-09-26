"""
Gera os mapas de profundidade (3D) das fotos usadas no passeio do site.

Usa o modelo de IA Depth Anything V2 (versão pequena, em ONNX), que estima
a distância de cada ponto de uma foto comum. O resultado vai para
assets/img/depth/<nome>.webp e é lido pelo assets/js/walk.js.

Como usar (uma vez, no computador):
    pip install onnxruntime numpy pillow
    python ferramentas/gerar-profundidade.py            # todas as fotos do passeio
    python ferramentas/gerar-profundidade.py salao jogos  # só algumas

Na primeira vez o modelo (~100 MB) é baixado para ferramentas/modelos/.
"""
import sys, urllib.request
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image, ImageFilter

RAIZ = Path(__file__).resolve().parent.parent
FOTOS = RAIZ / "assets" / "img"
SAIDA = FOTOS / "depth"
MODELO = Path(__file__).resolve().parent / "modelos" / "depth_anything_v2_vits.onnx"
URL = "https://github.com/fabio-sim/Depth-Anything-ONNX/releases/download/v2.0.0/depth_anything_v2_vits.onnx"
PADRAO = ["recepcao", "salao", "decoracao", "jogos", "sala-estar", "festa", "banheiro"]

MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)


def main(nomes):
    if not MODELO.exists():
        MODELO.parent.mkdir(parents=True, exist_ok=True)
        print("Baixando o modelo de IA (uma vez só)...")
        urllib.request.urlretrieve(URL, MODELO)
    sessao = ort.InferenceSession(str(MODELO), providers=["CPUExecutionProvider"])
    entrada = sessao.get_inputs()[0].name
    SAIDA.mkdir(exist_ok=True)

    for nome in nomes:
        foto = Image.open(FOTOS / f"{nome}.webp").convert("RGB")
        w, h = foto.size
        x = np.asarray(foto.resize((518, 518), Image.BICUBIC), dtype=np.float32) / 255.0
        x = ((x - MEAN) / STD).transpose(2, 0, 1)[None]
        d = sessao.run(None, {entrada: x})[0][0]
        lo, hi = np.percentile(d, 1), np.percentile(d, 99)
        d = np.clip((d - lo) / (hi - lo), 0, 1)  # branco = perto, preto = longe
        mapa = Image.fromarray((d * 255).astype(np.uint8)).resize((384, round(384 * h / w)), Image.BICUBIC)
        mapa.filter(ImageFilter.GaussianBlur(2.2)).save(SAIDA / f"{nome}.webp", quality=82)
        print(f"ok: {nome}")


if __name__ == "__main__":
    main(sys.argv[1:] or PADRAO)
