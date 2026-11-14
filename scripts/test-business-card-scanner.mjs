import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import {
  validateBusinessCardFile,
  extractEmails,
  extractWebsites,
  extractPhones,
  extractSocials,
  extractTaxIds,
  parseBusinessCardText,
  generateExcelWorkbook,
  generateCsvData,
  generateVCard,
  SAMPLE_BUSINESS_CARDS,
} from '../app/utils/business-card-scanner.js';

test('validateBusinessCardFile validates file types and constraints', () => {
  assert.equal(validateBusinessCardFile(null), 'Please choose an image file.');
  
  // Empty file
  assert.equal(
    validateBusinessCardFile({ name: 'card.png', type: 'image/png', size: 0 }),
    'The chosen image file is empty.'
  );

  // Unsupported file
  assert.equal(
    validateBusinessCardFile({ name: 'card.pdf', type: 'application/pdf', size: 1000 }),
    'Please select a valid image file (JPG, PNG, WebP, or BMP).'
  );

  // Oversized file
  assert.equal(
    validateBusinessCardFile({ name: 'huge.jpg', type: 'image/jpeg', size: 35 * 1024 * 1024 }),
    'Image file exceeds the 30 MB limit.'
  );

  // Valid files
  assert.equal(validateBusinessCardFile({ name: 'card_front.jpg', type: 'image/jpeg', size: 500000 }), null);
  assert.equal(validateBusinessCardFile({ name: 'card_back.png', type: 'image/png', size: 300000 }), null);
});

test('extractEmails detects single, multiple and cleans OCR typos', () => {
  const text = `Contact: john.doe@acme.com or sales @ acme,co,in for queries.`;
  const emails = extractEmails(text);
  assert.ok(emails.includes('john.doe@acme.com'));
  assert.ok(emails.includes('sales@acme.co.in'));
  assert.deepEqual(extractEmails('No email here'), []);
});

test('extractWebsites detects URLs, domains and cleans OCR typos', () => {
  const text = `Visit https://acmecorp.com or www,acme,co,in or partner.io`;
  const sites = extractWebsites(text, ['info@acmecorp.com']);
  assert.ok(sites.some(s => s.includes('acmecorp.com')));
  assert.ok(sites.some(s => s.includes('acme.co.in')));
  assert.ok(sites.some(s => s.includes('partner.io')));
});

test('extractPhones extracts full numbers from compound slash-separated lines without truncation', () => {
  const text = `Mob: +91 98250 12345 / 98250 67890 | Tel: (079) 22871234`;
  const phones = extractPhones(text);
  assert.equal(phones.length, 3);
  assert.ok(phones.includes('+91 98250 12345'));
  assert.ok(phones.includes('98250 67890'));
  assert.ok(phones.some(p => p.includes('22871234')));
});

test('extractPhones reconstructs shared suffixes and cleans OCR digit typos', () => {
  // Suffix sharing e.g. 98200-11223 / 44556
  const text1 = `Call: 98200-11223 / 44556`;
  const phones1 = extractPhones(text1);
  assert.equal(phones1.length, 2);
  assert.ok(phones1.includes('98200-11223'));
  assert.ok(phones1.some(p => p.includes('44556') && p.includes('98200')));

  // OCR letter typo: 'O' instead of 0, 'I' instead of 1
  const text2 = `Mob: +91 9825O I2345`;
  const phones2 = extractPhones(text2);
  assert.ok(phones2.includes('+91 98250 12345'));
});

test('extractSocials and extractTaxIds extract profiles and GSTIN', () => {
  const text = `
    Connect on linkedin.com/in/sarah-connor or twitter.com/sarah_c
    GSTIN: 24AAACG1234A1Z5
    PAN: AAACG1234A
  `;
  const socials = extractSocials(text);
  assert.ok(socials.some(s => s.includes('linkedin.com/in/sarah-connor')));
  assert.ok(socials.some(s => s.includes('twitter.com/sarah_c')));

  const tax = extractTaxIds(text);
  assert.equal(tax.gstin, '24AAACG1234A1Z5');
  assert.equal(tax.pan, 'AAACG1234A');
});

test('parseBusinessCardText extracts structured fields from realistic Indian card with multiple phones', () => {
  const raw = `
SHREE GANESH ENTERPRISES
Plot No. 12, GIDC Industrial Estate, Odhav, Ahmedabad - 382415
Mob: +91 98250 12345 / 98250 67890 | Tel: (079) 22871234
Email: contact@shreeganesh.co.in
Website: www.shreeganesh.co.in
GSTIN: 24AAACG1234A1Z5
Proprietor: Ramesh Patel
  `;

  const parsed = parseBusinessCardText(raw);
  assert.equal(parsed.name, 'Ramesh Patel');
  assert.ok(parsed.title.includes('Proprietor'));
  assert.ok(parsed.company.includes('SHREE GANESH ENTERPRISES'));
  assert.equal(parsed.phone, '+91 98250 12345');
  assert.equal(parsed.phone2, '98250 67890');
  assert.ok(parsed.phone3.includes('22871234'));
  assert.equal(parsed.email, 'contact@shreeganesh.co.in');
  assert.ok(parsed.website.includes('shreeganesh.co.in'));
  assert.equal(parsed.postalCode, '382415');
  assert.equal(parsed.city, 'Ahmedabad');
  assert.equal(parsed.state, 'Gujarat');
  assert.equal(parsed.country, 'India');
  assert.equal(parsed.gstin, '24AAACG1234A1Z5');
});

test('parseBusinessCardText extracts structured fields from tech executive card', () => {
  const raw = `
Sarah Connor
Vice President of Product Engineering
Cyberdyne Systems Technologies LLC
100 Innovation Way, Suite 400
San Francisco, CA 94107
Tel: (415) 555-0192
Mobile: +1-555-0199
Email: sconnor@cyberdyne.io
LinkedIn: linkedin.com/in/sarah-connor-tech
www.cyberdyne.io
  `;

  const parsed = parseBusinessCardText(raw);
  assert.equal(parsed.name, 'Sarah Connor');
  assert.ok(parsed.title.includes('Vice President'));
  assert.ok(parsed.company.includes('Cyberdyne Systems'));
  assert.ok(parsed.phone.includes('555'));
  assert.equal(parsed.email, 'sconnor@cyberdyne.io');
  assert.ok(parsed.website.includes('cyberdyne.io'));
  assert.ok(parsed.social.includes('linkedin.com/in/sarah-connor-tech'));
});

test('generateExcelWorkbook produces valid OpenXML XLSX archive with all columns', async () => {
  const result = await generateExcelWorkbook(SAMPLE_BUSINESS_CARDS, { filename: 'test-cards.xlsx' });
  assert.ok(result);
  assert.equal(result.filename, 'test-cards.xlsx');
  assert.ok(result.blob);

  // Unpack zip to verify OpenXML structure
  const zip = await JSZip.loadAsync(await result.blob.arrayBuffer());
  assert.ok(zip.file('[Content_Types].xml'));
  assert.ok(zip.file('xl/workbook.xml'));
  assert.ok(zip.file('xl/worksheets/sheet1.xml'));
  assert.ok(zip.file('xl/styles.xml'));

  const sheetContent = await zip.file('xl/worksheets/sheet1.xml').async('string');
  assert.ok(sheetContent.includes('Full Name'));
  assert.ok(sheetContent.includes('Primary Mobile'));
  assert.ok(sheetContent.includes('GSTIN'));
  assert.ok(sheetContent.includes('Rajesh Sharma'));
  assert.ok(sheetContent.includes('Ramesh Patel'));
});

test('generateCsvData produces valid RFC 4180 CSV with UTF-8 BOM and GSTIN', () => {
  const result = generateCsvData(SAMPLE_BUSINESS_CARDS, { filename: 'test-cards.csv' });
  assert.ok(result);
  assert.equal(result.filename, 'test-cards.csv');
  assert.ok(result.csvText.startsWith('\uFEFF')); // Contains UTF-8 BOM
  assert.ok(result.csvText.includes('Full Name,Job Title,Company Name,Primary Mobile'));
  assert.ok(result.csvText.includes('Ramesh Patel'));
  assert.ok(result.csvText.includes('24AAACG1234A1Z5'));
});

test('generateVCard produces compliant vCard 3.0 entries with multi-phone support', async () => {
  const result = generateVCard(SAMPLE_BUSINESS_CARDS, { filename: 'test-contacts.vcf' });
  assert.ok(result);
  assert.equal(result.filename, 'test-contacts.vcf');
  const text = await result.blob.text();
  assert.ok(text.includes('BEGIN:VCARD'));
  assert.ok(text.includes('VERSION:3.0'));
  assert.ok(text.includes('FN:Dr. Rajesh Sharma'));
  assert.ok(text.includes('TEL;TYPE=CELL,VOICE:+91 98101 23456'));
  assert.ok(text.includes('TEL;TYPE=WORK,VOICE:0124-4567890'));
  assert.ok(text.includes('EMAIL;TYPE=WORK,INTERNET:dr.rajesh@apexheart.in'));
  assert.ok(text.includes('END:VCARD'));
});
