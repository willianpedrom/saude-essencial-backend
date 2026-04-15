import os
import PyPDF2

tmp_dir = 'tmp_pdfs'
output_file = 'extracted_text.txt'

with open(output_file, 'w', encoding='utf-8') as out:
    files = [f for f in os.listdir(tmp_dir) if f.lower().endswith('.pdf')]
    for filename in files:
        path = os.path.join(tmp_dir, filename)
        print(f"Processing {filename}...")
        try:
            with open(path, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                out.write(f"\n\n=== FILE: {filename} ===\n\n")
                for page in reader.pages:
                    text = page.extract_text()
                    if text:
                        out.write(text + "\n")
        except Exception as e:
            print(f"Error processing {filename}: {e}")

print(f"Extraction complete. Saved to {output_file}")
