import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Search, UserCheck, UserX, Users, Trash2, Download } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface Attendee {
  id: string;
  name: string;
  email: string | null;
  organization: string | null;
  checked_in: boolean;
  checked_in_at: string | null;
  checked_in_by: string | null;
}

export default function CheckIn() {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'checked' | 'missing'>('all');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchAttendees = async () => {
    const { data, error } = await supabase
      .from('attendees')
      .select('*')
      .order('name');
    if (error) {
      toast.error('Failed to load attendees');
    } else {
      setAttendees(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAttendees();

    const channel = supabase
      .channel('attendees-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendees' }, () => {
        fetchAttendees();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet);

      if (rows.length === 0) {
        toast.error('No data found in file');
        setUploading(false);
        return;
      }

      // Try to find name/email/org columns (case-insensitive)
      const keys = Object.keys(rows[0]);
      const findCol = (hints: string[]) =>
        keys.find(k => hints.some(h => k.toLowerCase().includes(h))) || null;

      const nameCol = findCol(['name', 'full name', 'attendee', 'participant']);
      const emailCol = findCol(['email', 'e-mail']);
      const orgCol = findCol(['org', 'company', 'school', 'university', 'chapter']);

      if (!nameCol) {
        toast.error('Could not find a "Name" column in the spreadsheet. Make sure one column header contains "name".');
        setUploading(false);
        return;
      }

      const records = rows
        .filter(r => r[nameCol]?.toString().trim())
        .map(r => ({
          name: r[nameCol].toString().trim(),
          email: emailCol ? r[emailCol]?.toString().trim() || null : null,
          organization: orgCol ? r[orgCol]?.toString().trim() || null : null,
        }));

      // Clear existing and insert new
      await supabase.from('attendees').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      const { error } = await supabase.from('attendees').insert(records);

      if (error) {
        toast.error('Failed to import attendees');
      } else {
        toast.success(`Imported ${records.length} attendees`);
        fetchAttendees();
      }
    } catch {
      toast.error('Failed to read file');
    }
    setUploading(false);
    e.target.value = '';
  };

  const toggleCheckIn = async (attendee: Attendee) => {
    const newCheckedIn = !attendee.checked_in;
    const { error } = await supabase
      .from('attendees')
      .update({
        checked_in: newCheckedIn,
        checked_in_at: newCheckedIn ? new Date().toISOString() : null,
        checked_in_by: newCheckedIn ? 'volunteer' : null,
      })
      .eq('id', attendee.id);

    if (error) {
      toast.error('Failed to update');
    }
    fetchAttendees();
  };

  const clearAll = async () => {
    if (!confirm('Delete all attendees? This cannot be undone.')) return;
    await supabase.from('attendees').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    fetchAttendees();
    toast.success('Cleared all attendees');
  };

  const filtered = useMemo(() => {
    let list = attendees;
    if (filter === 'checked') list = list.filter(a => a.checked_in);
    if (filter === 'missing') list = list.filter(a => !a.checked_in);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.email?.toLowerCase().includes(q) ||
        a.organization?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [attendees, filter, search]);

  const checkedCount = attendees.filter(a => a.checked_in).length;
  const missingCount = attendees.filter(a => !a.checked_in).length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="cursor-pointer" onClick={() => setFilter('all')}>
          <CardContent className="p-3 text-center">
            <Users className="mx-auto h-5 w-5 text-muted-foreground mb-1" />
            <div className="text-2xl font-bold text-foreground">{attendees.length}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer" onClick={() => setFilter('checked')}>
          <CardContent className="p-3 text-center">
            <UserCheck className="mx-auto h-5 w-5 text-green-600 mb-1" />
            <div className="text-2xl font-bold text-green-600">{checkedCount}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Checked In</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer" onClick={() => setFilter('missing')}>
          <CardContent className="p-3 text-center">
            <UserX className="mx-auto h-5 w-5 text-destructive mb-1" />
            <div className="text-2xl font-bold text-destructive">{missingCount}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Missing</div>
          </CardContent>
        </Card>
      </div>

      {/* Upload & Actions */}
      <div className="flex gap-2">
        <label className="flex-1">
          <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileUpload} />
          <Button variant="outline" className="w-full gap-2" asChild disabled={uploading}>
            <span>
              <Upload className="h-4 w-4" />
              {uploading ? 'Importing…' : 'Upload List'}
            </span>
          </Button>
        </label>
        {attendees.length > 0 && (
          <>
            <Button variant="ghost" size="icon" onClick={() => {
              const missing = attendees.filter(a => !a.checked_in);
              const csv = ['Name,Organization,Email']
                .concat(missing.map(a => `"${a.name}","${a.organization || ''}","${a.email || ''}"`))
                .join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = 'missing-attendees.csv';
              link.click();
              URL.revokeObjectURL(url);
              toast.success(`Exported ${missing.length} missing attendees`);
            }} className="text-muted-foreground" title="Export missing attendees">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={clearAll} className="text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Search & Filter */}
      {attendees.length > 0 && (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or org…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            {(['all', 'checked', 'missing'] as const).map(f => (
              <Badge
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                className="cursor-pointer capitalize"
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? `All (${attendees.length})` : f === 'checked' ? `Checked In (${checkedCount})` : `Missing (${missingCount})`}
              </Badge>
            ))}
          </div>
        </>
      )}

      {/* List */}
      {loading ? (
        <p className="text-center text-sm text-muted-foreground py-8">Loading…</p>
      ) : attendees.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Upload className="mx-auto h-10 w-10 mb-3 opacity-40" />
          <p className="text-sm font-medium">No attendees yet</p>
          <p className="text-xs mt-1">Upload an Excel or CSV file to get started</p>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-[50vh] overflow-y-auto">
          {filtered.map(a => (
            <div
              key={a.id}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors cursor-pointer ${
                a.checked_in ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900' : 'bg-card border-border hover:bg-muted/50'
              }`}
              onClick={() => toggleCheckIn(a)}
            >
              <Checkbox checked={a.checked_in} className="pointer-events-none" />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${a.checked_in ? 'text-green-700 dark:text-green-400' : 'text-foreground'}`}>
                  {a.name}
                </p>
                {(a.email || a.organization) && (
                  <p className="text-[11px] text-muted-foreground truncate">
                    {[a.organization, a.email].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
              {a.checked_in && (
                <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 shrink-0">
                  ✓ In
                </Badge>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-6">No matches found</p>
          )}
        </div>
      )}
    </div>
  );
}
