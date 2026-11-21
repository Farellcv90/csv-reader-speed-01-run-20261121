// Fast csv-reader: single-pass, slice-based fields, no per-field objects.
// Behavior is byte-for-byte the reference readCsv (csv-reader 1.0.0) for every input.
export function run(input) {
  const text = String(input.text);
  const header = input.header === true;
  const len = text.length;
  const errors = [];
  const rows = [];
  let columns = null;
  let width = -1;
  let pos = 0;
  let line = 1;
  if (len > 0 && text.charCodeAt(0) === 0xfeff) pos = 1;

  // ended codes: 0 = comma, 1 = line break, 2 = end
  while (true) {
    // Skip blank lines (LF or CRLF only).
    while (pos < len) {
      const c = text.charCodeAt(pos);
      if (c === 10) {
        pos += 1;
        line += 1;
      } else if (c === 13 && pos + 1 < len && text.charCodeAt(pos + 1) === 10) {
        pos += 2;
        line += 1;
      } else {
        break;
      }
    }
    if (pos >= len) break;

    const recordLine = line;
    const recordRow = header && columns === null ? null : rows.length;
    const fields = [];
    let lastQuoted = false;
    let ended = 2;

    do {
      const quoted = pos < len && text.charCodeAt(pos) === 34;
      lastQuoted = quoted;
      let value;

      if (!quoted) {
        // ---- Unquoted field ----
        const start = pos;
        let i = pos;
        let parts = null;
        let segStart = start;
        ended = 2;
        while (i < len) {
          const c = text.charCodeAt(i);
          if (c === 44) {
            ended = 0;
            break;
          }
          if (c === 10) {
            ended = 1;
            break;
          }
          if (c === 13) {
            if (i + 1 < len && text.charCodeAt(i + 1) === 10) {
              ended = 1;
              break;
            }
            errors.push({ code: 'stray_cr', line: recordLine, row: recordRow });
            if (parts === null) parts = [text.slice(start, i)];
            else parts.push(text.slice(segStart, i));
            segStart = i + 1;
            i += 1;
            continue;
          }
          i += 1;
        }
        if (parts === null) value = text.slice(start, i);
        else value = parts.join('') + text.slice(segStart, i);
        if (ended === 0) {
          pos = i + 1;
        } else if (ended === 1) {
          // i points at LF or at CR of CRLF
          if (text.charCodeAt(i) === 10) pos = i + 1;
          else pos = i + 2;
          line += 1;
        } else {
          pos = len;
        }
      } else {
        // ---- Quoted field (opening quote at pos) ----
        const open = pos;
        let i = pos + 1;
        let segStart = i;
        let parts = null;
        let lineDelta = 0;
        let closed = false;
        let closePos = -1;
        while (i < len) {
          const c = text.charCodeAt(i);
          if (c === 34) {
            if (i + 1 < len && text.charCodeAt(i + 1) === 34) {
              if (parts === null) parts = [text.slice(segStart, i), '"'];
              else parts.push(text.slice(segStart, i), '"');
              segStart = i + 2;
              i += 2;
              continue;
            }
            closed = true;
            closePos = i;
            break;
          }
          if (c === 13) {
            const isCrlf = i + 1 < len && text.charCodeAt(i + 1) === 10;
            if (parts === null) parts = [text.slice(segStart, i), '\n'];
            else parts.push(text.slice(segStart, i), '\n');
            segStart = i + (isCrlf ? 2 : 1);
            i = segStart;
            lineDelta += 1;
            continue;
          }
          if (c === 10) lineDelta += 1;
          i += 1;
        }

        if (!closed) {
          // Unterminated: quote is literal, re-read rest as unquoted.
          errors.push({ code: 'unterminated_quote', line: recordLine, row: recordRow });
          const start = open + 1;
          let j = start;
          let uparts = null;
          let useg = start;
          ended = 2;
          while (j < len) {
            const c = text.charCodeAt(j);
            if (c === 44) {
              ended = 0;
              break;
            }
            if (c === 10) {
              ended = 1;
              break;
            }
            if (c === 13) {
              if (j + 1 < len && text.charCodeAt(j + 1) === 10) {
                ended = 1;
                break;
              }
              errors.push({ code: 'stray_cr', line: recordLine, row: recordRow });
              if (uparts === null) uparts = [text.slice(start, j)];
              else uparts.push(text.slice(useg, j));
              useg = j + 1;
              j += 1;
              continue;
            }
            j += 1;
          }
          if (uparts === null) value = '"' + text.slice(start, j);
          else value = '"' + uparts.join('') + text.slice(useg, j);
          if (ended === 0) {
            pos = j + 1;
          } else if (ended === 1) {
            if (text.charCodeAt(j) === 10) pos = j + 1;
            else pos = j + 2;
            line += 1;
          } else {
            pos = len;
          }
        } else {
          if (parts === null) value = text.slice(open + 1, closePos);
          else value = parts.join('') + text.slice(segStart, closePos);
          line += lineDelta;
          pos = closePos + 1;
          if (pos >= len) {
            ended = 2;
          } else {
            const c = text.charCodeAt(pos);
            if (c === 44) {
              pos += 1;
              ended = 0;
            } else if (c === 10) {
              pos += 1;
              line += 1;
              ended = 1;
            } else if (c === 13 && pos + 1 < len && text.charCodeAt(pos + 1) === 10) {
              pos += 2;
              line += 1;
              ended = 1;
            } else {
              // Junk after closing quote: append as unquoted continuation.
              const jstart = pos;
              let j = pos;
              let jparts = null;
              let jseg = jstart;
              let added = 0;
              ended = 2;
              while (j < len) {
                const cc = text.charCodeAt(j);
                if (cc === 44) {
                  ended = 0;
                  break;
                }
                if (cc === 10) {
                  ended = 1;
                  break;
                }
                if (cc === 13) {
                  if (j + 1 < len && text.charCodeAt(j + 1) === 10) {
                    ended = 1;
                    break;
                  }
                  errors.push({ code: 'stray_cr', line: recordLine, row: recordRow });
                  if (jparts === null) jparts = [text.slice(jstart, j)];
                  else jparts.push(text.slice(jseg, j));
                  jseg = j + 1;
                  j += 1;
                  continue;
                }
                j += 1;
              }
              if (jparts === null) {
                const junk = text.slice(jstart, j);
                added = junk.length;
                value += junk;
              } else {
                const tail = text.slice(jseg, j);
                jparts.push(tail);
                const junk = jparts.join('');
                added = junk.length;
                value += junk;
              }
              if (added > 0) errors.push({ code: 'quote_junk', line: recordLine, row: recordRow });
              if (ended === 0) {
                pos = j + 1;
              } else if (ended === 1) {
                if (text.charCodeAt(j) === 10) pos = j + 1;
                else pos = j + 2;
                line += 1;
              } else {
                pos = len;
              }
            }
          }
        }
      }

      fields.push(value);
    } while (ended === 0);

    if (fields.length === 1 && fields[0] === '' && !lastQuoted) continue;

    if (width < 0) width = fields.length;
    if (header && columns === null) {
      columns = fields;
      continue;
    }
    if (fields.length < width) {
      errors.push({ code: 'short_row', line: recordLine, row: recordRow, fields: fields.length });
      while (fields.length < width) fields.push('');
    } else if (fields.length > width) {
      errors.push({ code: 'long_row', line: recordLine, row: recordRow, extra: fields.splice(width) });
    }
    rows.push(fields);
  }

  return { columns: header ? (columns ?? []) : null, rows, errors };
}
