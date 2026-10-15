const QRCode = require('qrcode');

/**
 * QR Code Generation Service
 */
class QrService {
  /**
   * Generate base64 Data URL QR Code
   * @param {string|object} data
   * @param {object} options
   * @returns {Promise<string>} Base64 data URL
   */
  static async generateQrCode(data, options = {}) {
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    const defaultOptions = {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      width: 256,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      ...options
    };

    return await QRCode.toDataURL(payload, defaultOptions);
  }

  /**
   * Generate standard ticket QR code payload and image
   * @param {string} ticketCode
   * @param {object} extraData
   * @returns {Promise<{ qrPayload: string, qrDataUrl: string }>}
   */
  static async generateTicketQr(ticketCode, extraData = {}) {
    const qrPayload = JSON.stringify({
      ticketCode,
      ...extraData,
      timestamp: Date.now()
    });

    const qrDataUrl = await this.generateQrCode(qrPayload);
    return {
      qrPayload,
      qrDataUrl
    };
  }
}

module.exports = QrService;
