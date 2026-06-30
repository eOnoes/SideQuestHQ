import sqlite3
from datetime import datetime

db_path = '/opt/data/SideQuestHQ/data/sqhq.db'
conn = sqlite3.connect(db_path)
c = conn.cursor()

# Check existing table structure
c.execute("PRAGMA table_info(documents)")
cols = [row[1] for row in c.fetchall()]
print(f"Columns ({len(cols)}): {cols}")

if not cols:
    c.execute("""CREATE TABLE documents (
      document_id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'uncategorized',
      source TEXT NOT NULL DEFAULT '',
      document_type TEXT NOT NULL DEFAULT 'receipt',
      file_url TEXT NOT NULL DEFAULT '',
      file_name TEXT NOT NULL DEFAULT '',
      file_size INTEGER DEFAULT 0,
      amount REAL DEFAULT 0,
      date TEXT NOT NULL DEFAULT '',
      expiry_date TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '[]',
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT ''
    )""")
    cols = ['document_id','title','category','source','document_type','file_url','file_name','file_size','amount','date','expiry_date','tags','notes','created_at']
    print(f"Created table with {len(cols)} columns")

now = datetime.now().isoformat()

data = [
  ('doc-ins-cfmoto-001', 'CFMOTO 70XCL Insurance', 'insurance', 'State Farm', 'insurance', '', 'InsuranceCard.pdf', 623326, 0, '2026-01-05', '2026-07-05', '["cfmoto","bike"]', 'Policy: 5489269-A05-42. Agent: Katie Lamb (901) 567-800X.', now),
  ('doc-ins-wlee-001', 'W. Lee Ave Rental Dwelling Insurance', 'insurance', 'State Farm Fire & Casualty', 'insurance', '', 'W_Lee_Ave_Insurance.pdf', 623326, 2101.0, '2026-05-19', '2027-05-19', '["w-lee","osceola","rental"]', 'Policy: 94-TB-278-9. Dwelling $248K. Premium $2,101/yr.', now),
  ('doc-ins-manila-001', '601 Davidson St Manila AR Rental Insurance', 'insurance', 'State Farm Fire & Casualty', 'insurance', '', 'Davidson_St_Insurance.pdf', 623818, 1646.0, '2025-07-28', '2026-07-28', '["manila","davidson","rental"]', 'Policy: 94-CM-Y971-7. Dwelling $160K. Premium $1,646/yr. URGENT: Expires Jul 28.', now),
]

col_str = ','.join(cols)
placeholders = ','.join(['?']*len(cols))
for d in data:
    c.execute(f"INSERT OR REPLACE INTO documents ({col_str}) VALUES ({placeholders})", d)

conn.commit()

c.execute("SELECT document_id, title, amount, expiry_date FROM documents")
for row in c.fetchall():
    print(f"  {row[0]}: {row[1]} | ${row[2]} | Expires: {row[3]}")

conn.close()
print("Done - 3 insurance documents saved to database")
