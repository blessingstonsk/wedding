import QRCode from 'qrcode';
import { weddingConfig } from '../config/weddingConfig';
import { localize, type Lang } from './i18n';
import { invitationUrl } from './links';
import { dateParts } from './time';

/**
 * Draws the 1080×1350 invitation card (Instagram / WhatsApp-status friendly)
 * on a canvas — no server or image service required. The same card is used
 * for the download and for printing (`showTime: false` leaves out the time).
 */
export async function drawInviteCard(lang: Lang, { showTime = true } = {}): Promise<HTMLCanvasElement> {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const { couple, content, wedding, venues, theme } = weddingConfig;
  await document.fonts?.ready;

  // Background
  const bg = ctx.createRadialGradient(W / 2, H * 0.3, 50, W / 2, H / 2, H * 0.8);
  bg.addColorStop(0, theme['wine-700']);
  bg.addColorStop(1, theme['wine-950']);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Double gold frame
  const gold = ctx.createLinearGradient(0, 0, W, H);
  gold.addColorStop(0, '#F3DCA4');
  gold.addColorStop(0.5, theme.gold);
  gold.addColorStop(1, theme['gold-deep']);
  ctx.strokeStyle = gold;
  ctx.lineWidth = 3;
  ctx.strokeRect(50, 50, W - 100, H - 100);
  ctx.lineWidth = 1;
  ctx.strokeRect(68, 68, W - 136, H - 136);

  // Corner rosettes
  const rosette = (x: number, y: number) => {
    for (let i = 0; i < 8; i++) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((i * Math.PI) / 4);
      ctx.fillStyle = i % 2 ? theme.blush : theme.rose;
      ctx.beginPath();
      ctx.ellipse(18, 0, 18, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = theme.gold;
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fill();
  };
  rosette(68, 68);
  rosette(W - 68, 68);
  rosette(68, H - 68);
  rosette(W - 68, H - 68);

  const center = (text: string, y: number, font: string, color: string | CanvasGradient, spacing = 0) => {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if ('letterSpacing' in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${spacing}px`;
    ctx.fillText(text, W / 2, y, W - 200);
  };

  const L = (v: Parameters<typeof localize>[0]) => localize(v, lang);
  const d = dateParts(wedding.date, lang);

  center(L(content.eyebrow).toUpperCase(), 210, '500 26px Poppins, sans-serif', theme.gold, 6);
  center(L(couple.groom.name).toUpperCase(), 360, '500 96px "Cormorant Garamond", serif', gold, 8);
  center(lang === 'ta' ? 'மற்றும்' : 'and', 470, '72px "Great Vibes", cursive', theme.gold);
  center(L(couple.bride.name).toUpperCase(), 580, '500 96px "Cormorant Garamond", serif', gold, 8);

  // Divider
  ctx.strokeStyle = theme.gold;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 200, 680);
  ctx.lineTo(W / 2 - 20, 680);
  ctx.moveTo(W / 2 + 20, 680);
  ctx.lineTo(W / 2 + 200, 680);
  ctx.stroke();
  ctx.fillStyle = theme.gold;
  ctx.beginPath();
  ctx.moveTo(W / 2, 668);
  ctx.lineTo(W / 2 + 10, 680);
  ctx.lineTo(W / 2, 692);
  ctx.lineTo(W / 2 - 10, 680);
  ctx.fill();

  center(`${d.month.toUpperCase()}   |   ${d.day}   |   ${d.year}`, 770, '500 54px "Cormorant Garamond", serif', theme['gold-soft'], 4);
  center(showTime ? `${d.weekday.toUpperCase()}  ·  ${d.time}` : d.weekday.toUpperCase(), 840, '400 26px Poppins, sans-serif', theme.cream, 4);

  const venue = venues[0];
  if (venue) {
    center(L(venue.name), 925, 'italic 40px "Cormorant Garamond", serif', theme.cream);
    center(L(venue.address), 975, '300 24px Poppins, sans-serif', theme.cream);
  }

  // QR code
  const qr = document.createElement('canvas');
  await QRCode.toCanvas(qr, invitationUrl(), {
    width: 170,
    margin: 1,
    color: { dark: theme['wine-950'], light: theme.cream },
  });
  ctx.drawImage(qr, W / 2 - 85, 1040);
  center(couple.hashtag, 1255, '44px "Great Vibes", cursive', theme.gold);

  return canvas;
}

/** The card as a PNG file, for the "Download Card" button. */
export async function renderInviteCard(lang: Lang): Promise<Blob> {
  const canvas = await drawInviteCard(lang);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'));
}
