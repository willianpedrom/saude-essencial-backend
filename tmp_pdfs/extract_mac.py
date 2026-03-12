import sys
import Quartz

def get_pdf_text(path):
    pdf = Quartz.PDFDocument.alloc().initWithURL_(Quartz.NSURL.fileURLWithPath_(path))
    if not pdf: return ""
    pages = pdf.pageCount()
    text = ""
    for i in range(pages):
        page = pdf.pageAtIndex_(i)
        text += page.string() + "\n"
    return text

if __name__ == "__main__":
    print(get_pdf_text(sys.argv[1]))
