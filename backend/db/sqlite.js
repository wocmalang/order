import Database from "better-sqlite3"

const db = new Database("local.db")

export function query(sql, params = []) {
  const stmt = db.prepare(sql)
  return stmt.all(params)
}