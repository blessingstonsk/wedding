import { Check, Download, Link2, Loader2, MessageCircle, Printer, Share2 } from 'lucide-react';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { weddingConfig } from '../../config/weddingConfig';
import { useI18n } from '../../lib/i18n';
import { renderInviteCard } from '../../lib/inviteCard';
import { downloadBlob, invitationUrl, shareText, whatsappShareUrl } from '../../lib/links';
import { playSound } from '../../lib/sound';
import { Reveal, Section, SectionHeading } from '../ui/Section';

export function Share() {
  const { t, lang } = useI18n();
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState(false);
  const [rendering, setRendering] = useState(false);
  const url = invitationUrl();
  const canShare = typeof navigator !== 'undefined' && 'share' in navigator;

  useEffect(() => {
    QRCode.toDataURL(url, {
      width: 360,
      margin: 1,
      color: { dark: weddingConfig.theme['wine-950'], light: weddingConfig.theme.cream },
    })
      .then(setQr)
      .catch(() => setQr(''));
  }, [url]);

  const share = async () => {
    try {
      await navigator.share({ title: weddingConfig.seo.title, text: shareText(), url });
    } catch {
      /* user cancelled */
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    playSound('tap');
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const download = async () => {
    setRendering(true);
    try {
      const blob = await renderInviteCard(lang);
      downloadBlob(blob, 'wedding-invitation.png');
    } finally {
      setRendering(false);
    }
  };

  return (
    <Section id="share" label={t('shareTitle')}>
      <SectionHeading title={t('shareTitle')} sub={t('shareSub')} />
      <Reveal className="card mx-auto grid max-w-4xl items-center gap-10 p-6 sm:p-10 md:grid-cols-[auto_1fr]">
        <figure className="mx-auto text-center">
          <div className="frame mx-auto w-48 bg-cream">
            {qr ? <img src={qr} alt={t('scanToOpen')} className="w-full rounded-lg" width={180} height={180} /> : <div className="aspect-square" />}
          </div>
          <figcaption className="mt-3 text-xs text-cream/60">{t('scanToOpen')}</figcaption>
        </figure>
        <div className="grid gap-3 sm:grid-cols-2">
          {canShare && (
            <button type="button" className="btn-gold" onClick={share}>
              <Share2 size={15} aria-hidden="true" /> {t('shareInvite')}
            </button>
          )}
          <a href={whatsappShareUrl()} target="_blank" rel="noopener noreferrer" className="btn-gold">
            <MessageCircle size={15} aria-hidden="true" /> {t('whatsapp')}
          </a>
          <button type="button" className="btn-outline" onClick={copy} aria-live="polite">
            {copied ? <Check size={15} aria-hidden="true" /> : <Link2 size={15} aria-hidden="true" />}
            {copied ? t('copied') : t('copyLink')}
          </button>
          <button type="button" className="btn-outline" onClick={download} disabled={rendering}>
            {rendering ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Download size={15} aria-hidden="true" />}
            {t('downloadCard')}
          </button>
          <button type="button" className="btn-outline sm:col-span-2" onClick={() => window.print()}>
            <Printer size={15} aria-hidden="true" /> {t('printInvite')}
          </button>
        </div>
      </Reveal>
    </Section>
  );
}
