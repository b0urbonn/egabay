// Editable vector deliverables. All values and identities below are design examples.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const folder = join(root, 'docs/design/super-admin');
mkdirSync(folder, { recursive: true });
const c = { ink: '#18231e', muted: '#637168', line: '#dce2dc', canvas: '#f4f6f3', white: '#fff', accent: '#176b4b', soft: '#e7f2eb', orange: '#fff0df' };
const esc = (s) => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const box = (x, y, w, h, fill = c.white, r = 12, stroke = c.line) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}"/>`;
const text = (x, y, value, size = 16, color = c.ink, weight = 400) => `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" font-weight="${weight}">${esc(value)}</text>`;
const rule = (x, y, w) => `<path d="M${x} ${y}h${w}" stroke="${c.line}"/>`;
const button = (x, y, w, value, primary = false) => box(x, y, w, 44, primary ? c.accent : c.white, 10) + text(x + 16, y + 28, value, 14, primary ? c.white : c.accent, 600);
const pill = (x, y, value, active = true) => box(x, y, 88, 28, active ? c.soft : c.canvas, 14) + text(x + 13, y + 19, value, 12, active ? c.accent : c.muted, 600);
const field = (x, y, label, value, w = 440) => text(x, y, label, 13, c.muted, 600) + box(x, y + 12, w, 48) + text(x + 14, y + 42, value, 15);
const nav = ['Overview', 'Transport groups', 'Terminals', 'Vehicles', 'Users & roles', 'Reports', 'Audit log'];

function shell(title, active, description, body) {
  let out = box(0, 0, 1440, 900, c.canvas, 0) + box(0, 0, 232, 900, c.white, 0);
  out += box(24, 24, 36, 36, c.accent, 11) + text(34, 50, 'e', 28, '#c6f06a', 800) + text(72, 49, 'eGABAY', 20, c.ink, 800);
  out += text(28, 112, 'ADMINISTRATION', 11, c.muted, 700);
  nav.forEach((label, i) => {
    const y = 136 + i * 54;
    out += box(16, y, 200, 46, i === active ? c.soft : c.white, 10, i === active ? c.soft : c.white) + box(31, y + 14, 17, 17, i === active ? c.accent : c.line, 4, 'none') + text(61, y + 29, label, 14, i === active ? c.accent : c.muted, i === active ? 700 : 500);
  });
  out += rule(24, 774, 184) + text(28, 809, 'Alex Rivera', 14, c.ink, 700) + text(28, 830, 'Super administrator', 12, c.muted) + text(28, 872, 'Exit design preview', 13, c.muted);
  out += box(232, 0, 1208, 72, c.white, 0) + text(272, 44, `eGABAY / ${nav[active]}`, 14, c.muted);
  out += box(1080, 16, 280, 42, c.canvas, 10) + text(1095, 42, 'Search current section', 13, c.muted) + box(1375, 20, 32, 32, c.soft, 16) + text(1382, 41, 'AR', 11, c.accent, 700);
  out += box(232, 72, 1208, 40, c.orange, 0, c.orange) + text(272, 98, 'DESIGN PREVIEW · FICTIONAL RECORDS · NO LIVE ACCOUNT CHANGES', 12, '#8a430b', 600);
  out += text(272, 155, 'MARINDUQUE TRANSPORT REGISTRY', 11, c.accent, 700) + text(272, 193, title, 30, c.ink, 750) + text(272, 222, description, 15, c.muted);
  return out + body;
}

const names = ['Sample Boac Jeepney Cooperative', 'Sample Santa Cruz TODA', 'Sample Gasan Transport Group', 'Sample Mogpog TODA'];
const towns = ['Boac', 'Santa Cruz', 'Gasan', 'Mogpog'];
function groupRows() {
  let out = box(272, 272, 1128, 462) + text(296, 306, 'Group registry', 18, c.ink, 700);
  ['All', 'Active', 'Inactive'].forEach((label, i) => { out += button(1025 + i * 112, 286, 100, label, i === 0); });
  out += box(296, 350, 1080, 44, c.canvas, 0) + text(312, 378, 'Group / municipality', 13, c.muted, 600) + text(760, 378, 'Chairperson', 13, c.muted, 600) + text(1150, 378, 'Status', 13, c.muted, 600);
  names.forEach((name, i) => {
    const y = 420 + i * 76;
    out += text(312, y, name, 15, c.ink, 600) + text(312, y + 23, `${i % 2 ? 'TODA' : 'Jeepney'} · ${towns[i]}`, 13, c.muted) + text(760, y + 10, ['Jamie Santos', 'Morgan Cruz', 'Not assigned', 'Not assigned'][i], 14) + pill(1140, y - 8, i === 3 ? 'Inactive' : 'Active', i !== 3) + text(1304, y + 11, 'View →', 14, c.accent, 600) + rule(296, y + 43, 1080);
  });
  return out;
}

function drawer(title, subtitle, body, primary = 'Save preview group') {
  return `<rect width="1440" height="900" fill="#0c2117" opacity="0.34"/>` + box(886, 16, 538, 868, c.white, 16) + text(914, 59, title, 24, c.ink, 750) + text(914, 86, subtitle, 13, c.muted) + text(1375, 56, '×', 27) + rule(886, 109, 538) + body + rule(886, 804, 538) + button(1054, 827, 120, 'Cancel') + button(1186, 827, 210, primary, true);
}

const screens = [];
let body = box(272, 252, 1128, 140, '#155d42') + text(300, 287, 'NETWORK OVERVIEW', 12, '#d7e8de', 700) + text(300, 324, 'Marinduque transport, at a glance', 25, c.white, 700) + text(300, 358, 'Review operator groups, terminals, vehicles, and user access.', 15, '#d7e8de');
['Transport groups', 'Terminals', 'Registered vehicles', 'Drivers'].forEach((label, i) => {
  const x = 272 + i * 286;
  body += box(x, 416, 270, 148) + box(x + 20, 436, 30, 30, c.soft, 10) + text(x + 20, 510, '4', 32, c.ink, 700) + text(x + 20, 540, label, 14, c.muted);
});
body += box(272, 588, 620, 274) + text(296, 624, 'Network coverage', 18, c.ink, 700) + text(296, 650, 'Groups by municipality · sample records', 13, c.muted);
['Boac', 'Mogpog', 'Gasan', 'Buenavista', 'Torrijos', 'Santa Cruz'].forEach((name, i) => { const y = 680 + i * 28; body += text(296, y, name, 13) + box(440, y - 10, 390, 6, c.soft, 3) + box(440, y - 10, [180, 180, 180, 0, 0, 180][i], 6, c.accent, 3); });
body += box(916, 588, 484, 274) + text(940, 624, 'Quick access', 18, c.ink, 700) + text(940, 678, 'Manage transport groups →', 15, c.accent, 600) + rule(940, 699, 436) + text(940, 733, 'Review user access →', 15, c.accent, 600) + rule(940, 754, 436) + text(940, 788, 'Review recent activity →', 15, c.accent, 600);
screens.push({ id: '01-overview', title: '01 · Network overview', note: 'Summary cards, locality coverage, and direct task entry.', svg: shell('Network overview', 0, 'A system wide view of the transport registry.', body) });

screens.push({ id: '02-groups', title: '02 · Group registry', note: 'Search, status filters, stable columns, and record inspection.', svg: shell('Transport groups', 1, 'Review TODA and jeepney groups and their chairperson assignment.', groupRows() + button(1200, 178, 200, 'Create group', true)) });

body = field(914, 145, 'Group name', 'Sample transport association') + text(914, 237, 'Transport type', 13, c.muted, 600) + button(914, 253, 204, 'TODA / Tricycle', true) + button(1130, 253, 224, 'Jeepney') + field(914, 333, 'Municipality', 'Boac                            ▾') + text(914, 428, 'Chairperson', 13, c.muted, 600) + box(914, 444, 440, 66, c.soft) + text(930, 471, 'Assign later', 15, c.accent, 600) + text(930, 493, 'No group manager assigned yet', 13, c.muted) + box(914, 522, 440, 66) + text(930, 550, 'Taylor Reyes', 15, c.ink, 600) + text(930, 573, 'taylor@example.test · available', 13, c.muted) + text(914, 636, 'Group status', 13, c.muted, 600) + button(914, 652, 160, 'Active', true) + button(1086, 652, 160, 'Inactive') + text(914, 743, 'Name and municipality are required.', 13, c.muted);
screens.push({ id: '03-create-group', title: '03 · Create group form', note: 'Required fields, eligible chairpersons, status, sticky actions.', svg: shell('Transport groups', 1, 'Preview group registration.', groupRows()) + drawer('Create transport group', 'Sample changes stay in this preview.', body) });

body = text(914, 152, 'Group status', 13, c.muted) + pill(914, 168, 'Active') + field(914, 241, 'Assigned chairperson', 'Jamie Santos') + text(914, 337, 'Replace chairperson', 18, c.ink, 700) + text(914, 365, 'Show eligible, unassigned chairperson accounts only.', 13, c.muted) + box(914, 391, 440, 76, c.soft) + text(932, 420, 'Taylor Reyes', 15, c.accent, 700) + text(932, 445, 'taylor@example.test', 13, c.muted) + box(914, 492, 440, 132, c.orange) + text(932, 522, 'Review the assignment', 15, '#8a430b', 700) + text(932, 550, 'Jamie will lose access to this group.', 14, '#8a430b') + text(932, 579, 'Taylor will manage its terminals and vehicles.', 14, '#8a430b') + text(914, 683, 'One chairperson per group.', 14, c.muted);
screens.push({ id: '04-chairperson-assignment', title: '04 · Chairperson assignment', note: 'Selection and impact review before changing responsibility.', svg: shell('Transport groups', 1, 'Group responsibility and access.', groupRows()) + drawer('Chairperson assignment', 'Sample Boac Jeepney Cooperative', body, 'Confirm assignment') });

body = box(272, 272, 1128, 440) + text(296, 310, 'Terminal directory', 18, c.ink, 700) + button(1068, 287, 140, 'All localities') + button(1220, 287, 156, 'Active');
['Boac Central Terminal', 'Santa Cruz Terminal', 'Gasan Terminal', 'Mogpog Terminal'].forEach((name, i) => { const y = 378 + i * 76; body += text(302, y, `Sample ${name}`, 16, c.ink, 600) + text(302, y + 25, `${towns[i]} · Sample town center`, 13, c.muted) + text(760, y + 12, names[i], 14) + pill(1140, y - 7, i === 3 ? 'Inactive' : 'Active', i !== 3) + text(1304, y + 12, 'View →', 14, c.accent, 600) + rule(296, y + 44, 1080); });
screens.push({ id: '05-terminals', title: '05 · Global terminal directory', note: 'Group ownership, locality, status, and a separate detail panel.', svg: shell('Terminals', 2, 'Review registered terminals and their responsible groups.', body) });

body = box(272, 272, 1128, 430) + text(296, 310, 'Vehicle registry', 18, c.ink, 700);
['DEMO-J01', 'DEMO-J02', 'DEMO-T01', 'DEMO-J03'].forEach((name, i) => { const y = 378 + i * 76; body += text(302, y, name, 16, c.ink, 700) + text(302, y + 24, `${i === 2 ? 'Tricycle' : 'Jeepney'} · SAMPLE 00${i + 1}`, 13, c.muted) + text(650, y + 12, `Sample ${towns[i]} Terminal`, 14) + pill(1140, y - 7, i === 3 ? 'Service' : 'On route', i !== 3) + text(1304, y + 12, 'View →', 14, c.accent, 600) + rule(296, y + 44, 1080); });
screens.push({ id: '06-vehicles', title: '06 · Global vehicle registry', note: 'Body and plate identifiers, assignment, status, and detail access.', svg: shell('Vehicles', 3, 'Review assignments and service status across the island.', body) });

body = box(272, 272, 1128, 438) + text(296, 310, 'User access', 18, c.ink, 700) + text(296, 337, 'Filter by role. Select a new role, then review its permissions.', 14, c.muted);
['Alex Rivera', 'Jamie Santos', 'Jordan Aquino'].forEach((name, i) => { const y = 405 + i * 98; body += text(302, y, name, 16, c.ink, 600) + text(302, y + 25, `${name.split(' ')[0].toLowerCase()}@example.test`, 13, c.muted) + button(700, y - 24, 130, ['Super admin', 'Chairperson', 'Driver'][i]) + text(855, y + 4, 'Review change →', 14, c.accent, 600) + rule(296, y + 53, 1080); });
body += drawer('Review role change', 'jordan@example.test', box(914, 146, 440, 176, c.soft) + text(938, 185, 'Commuter', 18, c.ink, 600) + text(938, 224, 'changes to', 14, c.muted) + text(938, 270, 'Driver', 27, c.accent, 700) + text(914, 378, 'An approved group membership is still required.', 14, c.muted) + box(914, 418, 440, 88, c.orange) + text(932, 451, 'Preview changes do not grant account access.', 14, '#8a430b'), 'Apply preview role');
screens.push({ id: '07-user-role-review', title: '07 · User roles and confirmation', note: 'Account identity, previous role, new permissions, explicit confirmation.', svg: shell('Users & roles', 4, 'Manage access through a deliberate review step.', body) });

body = box(272, 272, 540, 530) + text(296, 310, 'Group coverage', 18, c.ink, 700) + text(296, 338, 'Registered groups by municipality', 14, c.muted);
['Boac', 'Mogpog', 'Gasan', 'Buenavista', 'Torrijos', 'Santa Cruz'].forEach((name, i) => { const y = 390 + i * 60; body += text(296, y, name, 14) + box(440, y - 12, 326, 10, c.soft, 5) + box(440, y - 12, [180, 180, 180, 0, 0, 180][i], 10, c.accent, 5); });
body += box(836, 272, 564, 250) + text(860, 310, 'Transport mix', 18, c.ink, 700) + text(860, 365, 'Jeepney groups', 15) + text(1290, 365, '2', 22, c.accent, 700) + text(860, 424, 'TODA groups', 15) + text(1290, 424, '2', 22, c.accent, 700) + box(836, 546, 564, 256) + text(860, 584, 'Registry summary', 18, c.ink, 700) + text(860, 640, 'Terminals', 15) + text(1290, 640, '4', 20) + text(860, 690, 'Vehicles', 15) + text(1290, 690, '4', 20) + text(860, 740, 'Pending driver applications', 15) + text(1290, 740, '1', 20);
screens.push({ id: '08-reports', title: '08 · System reports', note: 'Registry totals and descriptive charts; no invented trends.', svg: shell('Reports', 5, 'Compare registered coverage across localities and transport types.', body) });

body = box(272, 272, 1128, 410) + text(296, 310, 'Privileged activity', 18, c.ink, 700) + pill(1260, 289, 'Read only');
['UPDATE · groups', 'INSERT · vehicles', 'INSERT · groups'].forEach((name, i) => { const y = 385 + i * 96; body += box(296, y - 23, 34, 34, c.soft, 10) + text(350, y, name, 16, c.ink, 600) + text(350, y + 27, `${i === 1 ? 'Morgan Cruz' : 'Alex Rivera'} · Oct 26, 2026, 2:${String(30 - i * 15).padStart(2, '0')} PM`, 13, c.muted) + text(1300, y + 10, 'View →', 14, c.accent, 600) + rule(296, y + 54, 1080); });
screens.push({ id: '09-audit-log', title: '09 · Audit log and event details', note: 'Actor, operation, record, timestamp, and a read-only change panel.', svg: shell('Audit log', 6, 'Inspect who changed a record and when it was changed.', body) });

function mobile(x, title, content) {
  return box(x, 40, 390, 804, c.canvas, 24) + box(x, 40, 390, 102, c.white, 24) + text(x + 20, 78, 'eGABAY Admin', 18, c.ink, 700) + text(x + 20, 112, 'Overview    Groups    Terminals    Vehicles →', 13, c.accent) + text(x + 20, 187, title, 25, c.ink, 700) + content;
}
body = mobile(32, 'Network overview', box(52, 216, 350, 130, '#155d42') + text(72, 254, 'Transport registry', 22, c.white, 700) + text(72, 287, 'Sample preview', 14, '#d7e8de') + box(52, 366, 165, 130) + text(72, 415, '4', 30, c.ink, 700) + text(72, 453, 'Groups', 14, c.muted) + box(237, 366, 165, 130) + text(257, 415, '4', 30, c.ink, 700) + text(257, 453, 'Terminals', 14, c.muted) + box(52, 516, 350, 280) + text(72, 552, 'Quick access', 18, c.ink, 700) + text(72, 607, 'Manage groups →', 15, c.accent) + text(72, 667, 'Review user access →', 15, c.accent) + text(72, 727, 'Recent activity →', 15, c.accent));
body += mobile(525, 'Transport groups', button(545, 218, 350, 'Create group', true) + field(545, 303, 'Search groups', 'Search by group or municipality', 350) + box(545, 394, 350, 190) + text(565, 430, 'Sample Boac Jeepney', 17, c.ink, 700) + text(565, 457, 'Cooperative', 17, c.ink, 700) + text(565, 487, 'Jeepney · Boac', 14, c.muted) + text(565, 520, 'Chairperson: Jamie Santos', 14) + button(565, 534, 310, 'View details →') + box(545, 606, 350, 168) + text(565, 645, 'Sample Santa Cruz TODA', 16, c.ink, 700) + text(565, 681, 'TODA · Santa Cruz', 14, c.muted) + button(565, 706, 310, 'View details →'));
body += mobile(1018, 'Create transport group', field(1038, 230, 'Group name', 'Enter registered name', 350) + text(1038, 330, 'Transport type', 14, c.muted, 600) + button(1038, 349, 168, 'TODA', true) + button(1218, 349, 170, 'Jeepney') + field(1038, 430, 'Municipality', 'Boac                         ▾', 350) + field(1038, 533, 'Chairperson', 'Assign later                 ▾', 350) + text(1038, 642, 'Changes stay in the preview.', 14, c.muted) + button(1038, 744, 120, 'Cancel') + button(1170, 744, 218, 'Save preview group', true));
screens.push({ id: '10-responsive', title: '10 · Compact layouts · 390px', note: 'Two metric columns, stacked records, full-height forms, 44px controls.', svg: box(0, 0, 1440, 900, '#e7ece7', 0) + body });

body = box(272, 272, 1128, 200) + text(296, 310, 'Loading registry', 18, c.ink, 700) + box(296, 342, 200, 24, c.line) + box(296, 385, 780, 16, c.line) + box(296, 421, 550, 16, c.line);
body += box(272, 496, 548, 290) + text(296, 538, 'No matching groups', 22, c.ink, 700) + text(296, 572, 'Try another search or clear the filters.', 15, c.muted) + button(296, 607, 180, 'Clear filters');
body += box(844, 496, 556, 290) + text(868, 538, 'Registry data is unavailable', 22, c.ink, 700) + text(868, 572, 'Check your connection and try again.', 15, c.muted) + button(868, 607, 180, 'Try again', true) + text(868, 705, 'Show an error instead of misleading zero totals.', 13, c.muted);
screens.push({ id: '11-data-states', title: '11 · Loading, empty, and failure states', note: 'Clear next actions and no false zero-count reports after failure.', svg: shell('Registry states', 1, 'Interface behavior while records are loading or unavailable.', body) });

const doc = (title, svg, w = 1440, h = 900) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title><desc>Editable eGABAY Super Admin wireframe. Fictional design examples, not verified registry data.</desc><g font-family="Inter,Arial,sans-serif">${svg}</g></svg>\n`;
screens.forEach((screen) => writeFileSync(join(folder, `${screen.id}.svg`), doc(screen.title, screen.svg)));
const scale = 0.4, gap = 28, frameW = 576, rowH = 450, boardW = 1840, boardH = 1940;
let board = box(0, 0, boardW, boardH, '#e7ece7', 0) + text(28, 48, 'eGABAY · Super Admin web wireframes', 30, c.ink, 800) + text(28, 79, '1440 × 900 desktop reference · 390px compact reference · fictional sample records · editable vector artwork', 15, c.muted);
screens.forEach((screen, i) => {
  const x = gap + (i % 3) * (frameW + gap), y = 110 + Math.floor(i / 3) * rowH;
  board += text(x, y + 20, screen.title, 17, c.ink, 700) + `<g transform="translate(${x},${y + 34}) scale(${scale})">${screen.svg}</g>` + text(x, y + 414, screen.note, 11, c.muted);
});
writeFileSync(join(root, 'docs/design/super-admin-web-wireframes.svg'), doc('Super Admin wireframe board', board, boardW, boardH));
console.log(`Built ${screens.length} editable screens and the Super Admin wireframe board.`);
