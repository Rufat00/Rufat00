import type { APIRoute } from 'astro';
import { businessCard as card } from '../../config/business-card';

const escape = (value: string) => value.replace(/\\/g, '\\\\')
  .replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');

export const GET: APIRoute = () => {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${escape(card.name)}`,
    `N:;${escape(card.name)};;;`,
    `TITLE:${escape(card.title)}`,
    `ORG:${escape(card.organization)}`,
    ...card.contacts.flatMap((contact) => {
      if (contact.url.startsWith('tel:')) return [`TEL;TYPE=CELL:${escape(contact.url.slice(4))}`];
      if (contact.url.startsWith('mailto:')) return [`EMAIL;TYPE=INTERNET:${escape(contact.url.slice(7))}`];
      return [];
    }),
    ...(card.publicUrl ? [`URL:${escape(card.publicUrl)}`] : []),
    'END:VCARD',
  ];

  return new Response(`${lines.join('\r\n')}\r\n`, {
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': 'inline; filename="contact.vcf"',
    },
  });
};
