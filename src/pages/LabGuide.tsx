import { Button } from '@/components/ui/button';
import { Download, ExternalLink } from 'lucide-react';

const PDF_URL = '/lab-guide.pdf';

export default function LabGuide() {
  return (
    <div className="min-h-svh flex flex-col bg-background">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <h1 className="text-lg font-semibold text-foreground">Lab Guide</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <a href={PDF_URL} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" /> Open in new tab
            </a>
          </Button>
          <Button asChild size="sm">
            <a href={PDF_URL} download="lab-guide.pdf">
              <Download className="mr-2 h-4 w-4" /> Download
            </a>
          </Button>
        </div>
      </div>
      <object data={PDF_URL} type="application/pdf" className="flex-1 w-full min-h-[80svh]">
        <div className="p-8 text-center text-sm text-muted-foreground">
          Your browser can't show the PDF here. Use "Open in new tab" or "Download" above.
        </div>
      </object>
    </div>
  );
}
