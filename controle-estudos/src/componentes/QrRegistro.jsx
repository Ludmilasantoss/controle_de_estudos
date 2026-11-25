import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

/** QR code que abre o Registro rápido daquele dia. */
export function urlDoRegistro(criancaId, data) {
  return `${window.location.origin}/registro/${criancaId}/${data}`;
}

export default function QrRegistro({ criancaId, data, tamanho = 96 }) {
  const [src, setSrc] = useState('');
  const url = urlDoRegistro(criancaId, data);

  useEffect(() => {
    QRCode.toDataURL(url, { margin: 0, width: tamanho * 2, errorCorrectionLevel: 'M' }).then(setSrc);
  }, [url, tamanho]);

  return (
    <figure className="qr">
      {src && <img src={src} width={tamanho} height={tamanho} alt={`QR code do registro: ${url}`} />}
      <figcaption>registro</figcaption>
    </figure>
  );
}
