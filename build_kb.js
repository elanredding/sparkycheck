#!/usr/bin/env node
// Build expanded search knowledge base from all source JSONs

const fs = require('fs');
const path = require('path');

// ====== Helper: slug for dedup ======
function slug(s) {
  return s.replace(/[\s—–\-]+/g, '_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
}

// ====== Load sources ======
const json3000 = JSON.parse(fs.readFileSync('kb_clauses_3000.json', 'utf8'));
const json3008 = JSON.parse(fs.readFileSync('kb_clauses_3008.json', 'utf8'));
const jsonAux = JSON.parse(fs.readFileSync('kb_clauses_aux.json', 'utf8'));
const jsonCombined = JSON.parse(fs.readFileSync('kb_combined.json', 'utf8'));

const entries = [];
const seen = new Set(); // track by slug(t) to dedup

function addEntry(t, c, s, k, r, d) {
  const key = slug(t);
  if (seen.has(key)) return;
  seen.add(key);
  entries.push({
    t: t.replace(/"/g, '\u201d'),
    c: c.replace(/"/g, '\u201d'),
    s: s ? s.replace(/"/g, '\u201d') : '',
    k: k ? k.map(x => x.replace(/"/g, '\u201d')) : [],
    r: r || '',
    d: d ? d.replace(/"/g, '\u201d') : ''
  });
}

// ====== 1. kb_clauses_3000.json — 75 clauses ======
if (json3000.clauses) {
  for (const cl of json3000.clauses) {
    const reqs = (cl.requirements || []).join('\n');
    const ref = `AS/NZS 3000:2018 Cl ${cl.clause}`;
    addEntry(
      cl.title || `Clause ${cl.clause}`,
      cl.category || 'AS/NZS 3000',
      cl.summary || '',
      cl.tags || [],
      ref,
      reqs
    );
  }
}

// ====== 2. kb_clauses_aux.json — auxiliary standards ======
if (jsonAux.standards) {
  for (const [stdKey, std] of Object.entries(jsonAux.standards)) {
    const stdName = std.title || stdKey.replace(/_/g, ' ');
    if (std.key_clauses) {
      for (const [secKey, section] of Object.entries(std.key_clauses)) {
        const secName = section.title || secKey.replace(/_/g, ' ');
        for (const [clKey, clause] of Object.entries(section)) {
          if (clause && typeof clause === 'object' && clause.title) {
            addEntry(
              `${stdName} — ${clause.title}`,
              stdName,
              clause.description || '',
              [clause.title, stdName, secName].filter(Boolean),
              `${stdName} ${clKey.replace(/_/g, '.')}`,
              clause.requirement || clause.description || ''
            );
          }
        }
      }
    }
    // Also add any top-level clauses
    for (const [key, val] of Object.entries(std)) {
      if (key !== 'title' && key !== 'scope' && key !== 'key_clauses' && val && typeof val === 'object' && val.title) {
        addEntry(
          `${stdName} — ${val.title}`,
          stdName,
          val.description || val.scope || '',
          [val.title, stdName].filter(Boolean),
          `${stdName} ${key}`,
          val.requirement || val.description || ''
        );
      }
    }
  }
}

// ====== 3. kb_clauses_3008.json — cable sizing ======
if (json3008.installation_methods) {
  // Installation method entries
  for (const [methodKey, method] of Object.entries(json3008.installation_methods)) {
    const methodName = method.description || methodKey.replace(/_/g, ' ');
    const detail = [];
    if (method.description) detail.push(method.description);
    if (method.methods) {
      for (const m of method.methods) {
        const mDetail = [];
        if (m.description) mDetail.push(m.description);
        
        // Add table/column references as searchable keywords
        const tableRefs = [];
        if (m.tables_and_columns) {
          for (const [tcKey, tcVal] of Object.entries(m.tables_and_columns)) {
            mDetail.push(`${tcKey}: ${tcVal}`);
            tableRefs.push(tcKey);
            // Extract table numbers for search
            const tbls = tcVal.match(/Tables?\s+[\d][\d-]*/g);
            if (tbls) tableRefs.push(...tbls);
          }
        }
        if (m.derating_tables) {
          mDetail.push(`Derating tables: ${m.derating_tables.join(', ')}`);
          m.derating_tables.forEach(dt => tableRefs.push(dt));
        }
        
        addEntry(
          `Installation: ${m.id.replace(/_/g, ' ')} — ${methodName.substring(0, 60)}`,
          'AS/NZS 3008.1.1 Cable Sizing',
          m.description || methodName,
          [m.id, methodKey, 'installation', 'cable', 'current-carrying', ...tableRefs].filter(Boolean),
          `AS/NZS 3008.1.1:2017 ${methodKey}`,
          mDetail.join('\n')
        );

        // Also add granular entries for each table/column combo (e.g. "Table 10 Column 2")
        if (m.tables_and_columns) {
          for (const [tcKey, tcVal] of Object.entries(m.tables_and_columns)) {
            addEntry(
              `${tcKey} — ${m.id.replace(/_/g, ' ')}`,
              'AS/NZS 3008.1.1 Cable Sizing',
              `${tcVal} — ${m.description || ''}`,
              [tcKey, m.id, 'table', 'column', 'current-carrying', 'cable', 'PVC', 'XLPE'].filter(Boolean),
              `AS/NZS 3008.1.1:2017 ${methodKey}`,
              `${tcVal} — applies to ${m.description || ''}`
            );
          }
        }
      }
    }
  }

  // Derating tables
  if (json3008.derating_tables) {
    for (const [dtKey, dt] of Object.entries(json3008.derating_tables)) {
      const dtName = dt.description || dtKey.replace(/_/g, ' ');
      const detail = [];
      if (dt.description) detail.push(dt.description);
      if (dt.factors && Array.isArray(dt.factors)) {
        for (const f of dt.factors) {
          if (typeof f === 'object') {
            detail.push(JSON.stringify(f));
          } else {
            detail.push(String(f));
          }
        }
      }
      addEntry(
        `Derating: ${dtName}`,
        'AS/NZS 3008.1.1 Cable Sizing',
        dt.description || `Derating factor — ${dtKey}`,
        [dtKey, 'derating', 'cable', 'current-carrying', 'grouping', 'temperature', 'depth'].filter(Boolean),
        `AS/NZS 3008.1.1:2017 ${dtKey}`,
        detail.join('\n')
      );
    }
  }

  // Ambient temperature correction
  if (json3008.ambient_temperature) {
    const at = json3008.ambient_temperature;
    let detail = '';
    if (at.description) detail = at.description;
    if (at.tables) detail += '\n' + JSON.stringify(at.tables);
    addEntry(
      'Ambient temperature correction factors',
      'AS/NZS 3008.1.1 Cable Sizing',
      at.description || 'Correction factors for ambient temperature',
      ['ambient', 'temperature', 'correction', 'derating', 'cable', 'Table 27'],
      'AS/NZS 3008.1.1:2017 Table 27',
      detail
    );
  }

  // General info from standard
  if (json3008.standard) {
    addEntry(
      'AS/NZS 3008.1.1:2017 — Cable Selection Standard',
      'AS/NZS 3008.1.1 Cable Sizing',
      json3008.standard.description || '',
      ['cable', 'selection', 'current-carrying', 'voltage drop', 'short-circuit', 'sizing', '3008'],
      'AS/NZS 3008.1.1:2017',
      `Reference ambient air: ${json3008.standard.reference_ambient_air}°C\nReference ambient ground: ${json3008.standard.reference_ambient_ground}°C\nConductor temperature PVC: ${json3008.standard.conductor_temperature_pvc}°C\nConductor temperature XLPE: ${json3008.standard.conductor_temperature_xlpe}°C`
    );
  }
}

// ====== 4. kb_combined.json — existing curated entries (fallback for anything missed) ======
if (jsonCombined.entries && Array.isArray(jsonCombined.entries)) {
  for (const e of jsonCombined.entries) {
    // Only add if we haven't already got it from a richer source
    addEntry(e.t, e.c, e.s, e.k || [], e.r, e.d || '');
  }
}

// ====== Output ======
const output = JSON.stringify(entries);
fs.writeFileSync('kb_expanded.json', output, 'utf8');
console.log(`Generated ${entries.length} entries (${Buffer.byteLength(output, 'utf8')} bytes)`);
console.log(`Previously: ${jsonCombined.entries ? jsonCombined.entries.length : '?'} entries`);

// Now splice into index.html
let html = fs.readFileSync('index.html', 'utf8');

// Replace the KB_DATA constant
const kbStart = html.indexOf('const KB_DATA = [');
const kbEnd = html.indexOf('];', kbStart) + 2;

if (kbStart === -1) {
  console.error('ERROR: Could not find const KB_DATA = [ in index.html');
  process.exit(1);
}

const newKbData = `const KB_DATA = ${output};`;
html = html.slice(0, kbStart) + newKbData + html.slice(kbEnd);

fs.writeFileSync('index.html', html, 'utf8');
console.log('index.html updated with expanded KB_DATA');
