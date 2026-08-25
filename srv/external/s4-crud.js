function valFromWhere(where, keyField) {
  if (!Array.isArray(where)) return null
  for (let i = 0; i < where.length - 2; i++) {
    if (where[i]?.ref?.[where[i].ref.length - 1] === keyField && where[i + 1] === '=' && 'val' in (where[i + 2] || {})) {
      return where[i + 2].val
    }
  }
  return null
}

function keyFromReq(req, keyField) {
  const p = req.params?.[0]
  if (p && typeof p === 'object' && p[keyField] != null) return p[keyField]
  if (typeof p === 'string') return p
  if (req.data?.[keyField] != null) return req.data[keyField]
  const where = req.query?.SELECT?.where || req.query?.UPDATE?.where
  return valFromWhere(where, keyField)
}

function readRows(rows, req, keyField) {
  const key = keyFromReq(req, keyField)
  const matched = key == null ? rows : rows.filter((r) => r[keyField] === key)
  if (req.query?.SELECT?.one) return matched[0] || null
  return matched
}

function updateRow(rows, req, keyField) {
  const key = keyFromReq(req, keyField)
  const row = rows.find((r) => r[keyField] === key)
  if (!row) return req.reject(404, `${keyField} '${key}' not found`)
  Object.assign(row, req.data || {})
  return row
}

function attachCrud(srv, entityName, rows, keyField) {
  srv.on('READ', entityName, (req) => readRows(rows, req, keyField))
  srv.on(['UPDATE', 'PATCH'], entityName, (req) => updateRow(rows, req, keyField))
}

module.exports = { attachCrud, readRows, updateRow, keyFromReq }
