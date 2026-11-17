import sys

try:
    import pypdf
    reader = pypdf.PdfReader('scratch/ot_1842.pdf')
    print('PAGES:', len(reader.pages))
    for i, p in enumerate(reader.pages):
        print(f"--- PAGE {i+1} ---")
        print(p.extract_text())
except Exception as e:
    print("pypdf error:", e)
    try:
        import fitz # PyMuPDF
        doc = fitz.open('scratch/ot_1842.pdf')
        for i, page in enumerate(doc):
            print(f"--- PAGE {i+1} ---")
            print(page.get_text())
    except Exception as e2:
        print("fitz error:", e2)
