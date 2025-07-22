import QRCode from 'qrcode';

export const generateQRCode = async (data) => {
  try {
    return await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
  } catch (err) {
    throw new Error('Failed to generate QR code');
  }
};